require "db"
require "pg"
require "./models/*"

CurrentReadingsQuery = "
  select distinct on (s.id)
    s.id, s.name, s.description,
    r.temperature,
    abs(round(extract(epoch from ((current_timestamp at time zone 'utc') - reading_date)) / 60))::bigint as minutes_ago,
    round(extract(epoch from r.reading_date))::bigint as reading_date
  from sensors s
  join readings r
    on r.sensor_id = s.id
  where r.reading_date > (current_timestamp + interval '-1 day')
  order by s.id, r.reading_date desc
"

GraphReadingsQuery = "
  select
    s.id,
    s.name,
    s.description,
    floor(i.reading_date)::bigint as reading_date,
    avg(i.temperature) as temperature
  from (
    select
    r.temperature as temperature,
    r.sensor_id,
    (
      floor(
        extract(epoch from r.reading_date) /
        extract(epoch from make_interval(0, 0, 0, 0, 0, $3::int, 0.0))
      ) *
      extract(epoch from make_interval(0, 0, 0, 0, 0, $3::int, 0.0))
    ) as reading_date
    from readings r
    where r.reading_date > (
      current_timestamp at time zone 'utc' +
      make_interval(0, 0, 0, $1::int, $2::int, 0, 0.0)
    )
  ) i
  join sensors s on s.id = i.sensor_id
  group by s.id, s.description, i.reading_date
  order by s.id, i.reading_date
"

def parts_for_interval(interval : String) : Array(Int32)
  #[days ago, hours ago, minute resolution]
  case interval
  when "hour" then
    return [0, -1, 1]
  when "day" then
    return [-1, 0, 10]
  when "week" then
    return [-7, 0, 60]
  when "month" then
    return [-30, 0, 180]
  else
    return [0, -1, 1]
  end
end

class Database
  property db : DB::Connection
  def initialize(url : String)
    @db = DB.connect(url)
  end

  def current_readings() : Array(CurrentReading)
    readings = [] of CurrentReading
    @db.query_each(CurrentReadingsQuery) do |r|
      readings.push(r.read(CurrentReading))
    end
    readings
  end

  def graph_data(interval : String) : Array(SensorLine)
    readings = [] of GraphReadingRow
    parts = parts_for_interval(interval)
    @db.query_each(GraphReadingsQuery, parts[0], parts[1], parts[2]) do |r|
      readings.push(r.read(GraphReadingRow))
    end

    partial = readings.group_by { |r| Tuple.new(r.id, r.name, r.description) }
    lines = [] of SensorLine
    partial.each do |k, v|
      lines.push(SensorLine.new(k.[0], k[1], k[2], v.map { |p| GraphPoint.new(p.temperature, p.reading_date) }))
    end

    lines
  end

  def create_reading(sensor_name : String, temperature : Float64) : Int64
    sensor_id = @db.query_one("select id from sensors where name = $1", sensor_name) do |r|
      r.read(Int64)
    end

    reading_id = @db.query_one("insert into readings (temperature, sensor_id) values ($1, $2) returning id", temperature, sensor_id) do |r|
      r.read(Int64)
    end

    reading_id
  end
end

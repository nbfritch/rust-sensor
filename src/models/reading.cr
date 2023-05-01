require "db"
require "json"

class Reading
  include JSON::Serializable

  DB.mapping({
    id: Int64,
    temperature: Float64,
    reading_date: Int64,
    sensor_id: Int64,
    inserted_at: Int64,
    updated_at: Int64,
  })
end

class CurrentReading
  include JSON::Serializable

  DB.mapping({
    id: Int64,
    name: String,
    description: String,
    temperature: Float64,
    minutes_ago: Int64,
    reading_date: Int64,
  })
end

class GraphPoint
  include JSON::Serializable

  property temperature
  property reading_date

  def initialize(@temperature : Float64, @reading_date : Int64)
  end
end

class SensorLine
  include JSON::Serializable

  property id
  property name
  property description
  property points

  def initialize(@id : Int64, @name : String, @description : String, @points : Array(GraphPoint))
  end
end

class GraphReadingRow
  include JSON::Serializable

  DB.mapping({
    id: Int64,
    name: String,
    description: String,
    temperature: Float64,
    reading_date: Int64,
  })
end

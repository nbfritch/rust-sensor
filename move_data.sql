-- Moves date from old to new tables
insert into monitor.stations (station_name, station_display_name, station_description, created_at, updated_at)
select s.name, s.description, s.description, s.inserted_at, current_timestamp from sensors s;

insert into monitor.readings (station_id, sensor_id, measured_value, measured_at, created_at, updated_at)
select
    (select m.id from monitor.stations m where m.station_name = s.name limit 1), 4,
    r.temperature, r.reading_date, r.inserted_at, current_timestamp
from readings r
join sensors s on s.id = r.sensor_id
order by r.reading_date asc;

create table monitor.readings (
    id serial primary key,
    station_id bigint not null,
    sensor_id bigint not null,
    measured_value double precision not null,
    measured_at timestamp without time zone not null,
    created_at timestamp without time zone not null,
    updated_at timestamp without time zone not null,
    foreign key (station_id) references monitor.stations(id),
    foreign key (sensor_id) references monitor.sensors(id)
);

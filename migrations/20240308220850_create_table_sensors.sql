create table monitor.measurement_type (
    id serial primary key,
    name varchar(40) not null unique
);

insert into monitor.measurement_type (name)
values
    ('ambient_temperature'),
    ('ambient_relative_humidity');

create table monitor.sensors (
    id serial primary key,
    sensor_name varchar(80) not null unique,
    measurement_type_id bigint not null,
    created_at timestamp without time zone not null,
    updated_at timestamp without time zone,
    foreign key (measurement_type_id) references monitor.measurement_type(id)
);

insert into monitor.sensors (sensor_name, measurement_type_id, created_at)
values
    ('AM2320 (Temperature)', 1, current_timestamp),
    ('AM2320 (Humidity)', 2, current_timestamp),
    ('DS18B20', 1, current_timestamp),
    ('USB Temp Probe', 1, current_timestamp);


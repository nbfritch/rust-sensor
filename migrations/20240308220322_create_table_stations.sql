create table monitor.stations (
    id serial primary key,
    station_name varchar(40) not null unique,
    station_display_name varchar(80) not null,
    station_description varchar(200),
    created_at timestamp without time zone not null,
    updated_at timestamp without time zone
);

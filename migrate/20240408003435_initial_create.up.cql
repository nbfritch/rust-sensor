CREATE TABLE sensors (
	id uuid primary key,
	legacy_sensor_id int,
	lookup_name text,
	display_name text,
	hardware_desc text,
	location_desc text,
	created_at timestamp
);

CREATE TABLE readings (
	id uuid primary key,
	sensor_id uuid,
	reading_value decimal,
	reading_type int,
	reading_date timestamp,
	created_date timestamp
);

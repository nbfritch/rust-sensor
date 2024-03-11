alter table readings rename column temperature to reading_value;

alter table readings add column reading_type integer;

update readings set reading_type = 1;

alter table readings alter column reading_type set not null;
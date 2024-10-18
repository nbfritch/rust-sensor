-- Add migration script here
alter table sensors add column font_hex_code varchar(7);

update sensors set font_hex_code = '#0f0f0f';

alter table sensors alter column font_hex_code set not null;

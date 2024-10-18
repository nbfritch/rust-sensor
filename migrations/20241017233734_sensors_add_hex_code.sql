alter table sensors add column color_hex_code varchar(7);

update sensors set color_hex_code = '#0f0f0f';

alter table sensors alter column color_hex_code set not null;

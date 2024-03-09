# Migration Plan

## Goals
- Need to have db schema managed via sqlx-migrate

## Steps
- Stop temperature service
- Take prod data backup of db `tempdash` with `pgdump --data-only`
- Take prod schema backup of db `tempdash` with `pgdump --schema-only`
- Point local dev setup at prod with database `temperature_dashboard`
- Apply first migration `existing_schema` onto db `temperature_dashboard` with sqlx-cli
- Restore db `temperature_dashboard` using data only backup of `tempdash`
- Apply all migrations using sqlx-cli
- Deploy new binary
- Change systemd definition to use new database
- Start temperature service

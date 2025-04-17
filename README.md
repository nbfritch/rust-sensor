# rust-sensor

Sensor collector and aggregator. Combination API + web app for collecting and viewing sensor readouts.

## Components
Backend
- rust + cargo (Server side language)
- actix + actix_cors + actix_static_files + static files (Web framework)
- tokio (async runtime)
- sqlx + postgres + chrony (postgres data access + datetime types)
- dotenvy (.env parsing in dev only)
- serde + serde_json (Json (de)serialization)
- validator (struct validation)

## Build & Run
`cargo run`

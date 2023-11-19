# rust-sensor

## Components
Backend
- rust + cargo (Server side language)
- actix + actix_cors + actix_static_files + static files (Web framework)
- tokio (async runtime)
- tera (Jinja style templates)
- sqlx + postgres + chrony (postgres data access + datetime types)
- dotenvy (.env parsing)
- serde + serde_json (Json (de)serialization)

Frontend
- typescript (Frontend language)
- vite (bundling)
- Bun (typescript runtime)

## Build & Run
`cargo run`

## Develop Ui
`cd ui && bun run dev`

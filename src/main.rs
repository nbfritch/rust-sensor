mod errors;
mod routes;
mod types;

use crate::routes::index::index;
use actix_web::{
    middleware::Logger,
    web::{self, Data},
    App, HttpServer,
};
use routes::{
    current::get_current_readings, graph::graph_data_v2, readings::create_reading, sensor::{create_sensor, get_all_sensors, update_sensor}
};
use sqlx::postgres::PgPoolOptions;

#[tokio::main]
async fn main() {
    if cfg!(debug_assertions) {
        dotenvy::dotenv().expect("Failed to load dotenv");
    }

    let db_url = std::env::var("DATABASE_URL").expect("Could not find DATABASE_URL in env");
    let web_port: u16 = std::env::var("WEB_PORT")
        .expect("Could not find WEB_PORT in env")
        .parse()
        .expect("Could not parse WEB_PORT, invalid integer");

    let web_address_var: String =
        std::env::var("WEB_ADDRESS").expect("Could not find WEB_ADDRESS in env");
    let web_address: &str = &web_address_var;

    let pool = PgPoolOptions::new()
        .max_connections(10)
        .connect(&db_url)
        .await
        .expect("Could not connect to database");

    env_logger::init_from_env(env_logger::Env::new().default_filter_or("info"));

    HttpServer::new(move || {
        let cors = actix_cors::Cors::permissive();

        App::new()
            .wrap(cors)
            .wrap(Logger::default())
            .service(web::resource("/").to(index))
            .service(create_reading)
            .route("/api/v2/current", web::get().to(get_current_readings))
            .route("/api/v2/sensors", web::get().to(get_all_sensors))
            .route("/api/v2/sensors", web::put().to(create_sensor))
            .route("/api/v2/sensors", web::post().to(update_sensor))
            .route("/api/v2/graph", web::get().to(graph_data_v2))
            .app_data(Data::new(pool.clone()))
    })
    .workers(2)
    .bind((web_address, web_port))
    .expect("Could not bind address")
    .run()
    .await
    .expect("Could not start web server");
}

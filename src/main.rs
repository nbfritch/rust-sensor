mod errors;
mod models;
mod routes;
mod state;
mod types;
use crate::routes::index::index;
use crate::state::AppStateStruct;
use actix_web::middleware::Logger;
use actix_web::web::{self, Data};
use actix_web::{App, HttpServer};
use actix_web_static_files::ResourceFiles;
use routes::graph::{graph_data, graph_page};
use routes::readings::create_reading;
use sqlx::postgres::PgPoolOptions;
use std::path::Path;

// Include static assets from /public
include!(concat!(env!("OUT_DIR"), "/generated.rs"));

#[tokio::main]
async fn main() {
    // Only use dotenvy for dev builds
    if cfg!(debug_assertions) {
        dotenvy::dotenv().expect("Failed to load dotenv");
    }

    let db_url = std::env::var("DATABASE_URL").expect("Could not find DATABASE_URL in env");
    let web_port: u16 = std::env::var("WEB_PORT")
        .expect("Could not find WEB_PORT in env")
        .parse()
        .expect("Could not parse WEB_PORT, invalid integer");

    let web_address_var: String = std::env::var("WEB_ADDRESS")
        .expect("Could not find WEB_ADDRESS in env");
    let web_address: &str = &web_address_var;

    let pool = PgPoolOptions::new()
        .max_connections(10)
        .connect(&db_url)
        .await
        .expect("Could not connect to database");

    let template_folder = Path::new("./templates");

    env_logger::init_from_env(env_logger::Env::new().default_filter_or("info"));

    HttpServer::new(move || {
        let generated = generate();
        let state = std::sync::Arc::new(AppStateStruct::new({
            let mut tera = tera::Tera::new(
                &(template_folder
                    .to_str()
                    .expect("cannot get templates folder")
                    .to_string()
                    + "/**/*"),
            )
            .expect("Parsing error while loading template folder");
            tera.autoescape_on(vec!["j2"]);
            tera
        }));

        App::new()
            .wrap(Logger::default())
            .service(ResourceFiles::new("/static", generated))
            .service(web::resource("/").to(index))
            .route("/graph", web::get().to(graph_page))
            .route("/api/graph", web::get().to(graph_data))
            .route("/api/readings", web::put().to(create_reading))
            .app_data(Data::new(state))
            .app_data(Data::new(pool.clone()))
    })
    .bind((web_address, web_port))
    .expect("Could not bind address")
    .run()
    .await
    .expect("Could not start web server");
}

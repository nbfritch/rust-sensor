mod errors;
mod models;
mod routes;
mod state;
mod types;
mod url;
use crate::{routes::index::index, state::AppStateStruct};
use actix_web::{
    middleware::Logger,
    web::{self, Data},
    App, HttpServer,
};
use actix_web_static_files::ResourceFiles;
use routes::{
    graph::{graph_data, graph_page},
    history::historical_graph,
    readings::create_reading,
    station::{create_station, get_all_stations, get_station_by_id, update_station},
};
use sqlx::postgres::PgPoolOptions;
use std::path::Path;
use url::build_href_for;

include!(concat!(env!("OUT_DIR"), "/generated.rs"));

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

    let template_folder = Path::new("./templates");

    env_logger::init_from_env(env_logger::Env::new().default_filter_or("info"));

    HttpServer::new(move || {
        let cors = actix_cors::Cors::permissive();
        let generated = generate();
        let available_files = generated
            .keys()
            .map(|k| String::from(*k))
            .collect::<Vec<_>>();
        let state = std::sync::Arc::new(AppStateStruct::new({
            let mut tera = tera::Tera::new(
                &(template_folder
                    .to_str()
                    .expect("cannot get templates folder")
                    .to_string()
                    + "/**/*"),
            )
            .expect("Parsing error while loading template folder");
            tera.register_function("href_for", build_href_for(available_files));
            tera.autoescape_on(vec!["j2"]);
            tera
        }));

        App::new()
            .wrap(cors)
            .wrap(Logger::default())
            .service(ResourceFiles::new("/static", generated))
            .service(web::resource("/").to(index))
            .service(create_reading)
            .service(get_all_stations)
            .service(get_station_by_id)
            .service(create_station)
            .service(update_station)
            .route("/graph", web::get().to(graph_page))
            .route("/api/graph", web::get().to(graph_data))
            .route("/api/history", web::get().to(historical_graph))
            .app_data(Data::new(state))
            .app_data(Data::new(pool.clone()))
    })
    .bind((web_address, web_port))
    .expect("Could not bind address")
    .run()
    .await
    .expect("Could not start web server");
}

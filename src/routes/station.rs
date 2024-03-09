use actix_web::{patch, post};
use actix_web::{
    get,
    web::{self, Json},
    HttpResponse,
};
use serde_json::json;
use sqlx::{pool::PoolConnection, Postgres};

use crate::models::{CreateStationRequest, CreateStationResult, Station};

#[get("/api/stations")]
pub async fn list_stations(pool: web::Data<sqlx::PgPool>) -> super::EventResponse {
    let mut conn = pool.acquire().await?;
    let stations = sqlx::query!(
        "
        select
            id, station_name, station_display_name,
            station_description, created_at, updated_at
        from monitor.stations
        order by id asc
    "
    )
    .map(|s| Station {
        id: s.id,
        station_name: s.station_name,
        station_display_name: s.station_display_name,
        station_description: s.station_description,
        created_at: s.created_at,
        updated_at: s.updated_at,
    })
    .fetch_all(conn.as_mut())
    .await?;

    Ok(HttpResponse::Ok().json(stations))
}

async fn find_station_by_name(
    db: &mut PoolConnection<Postgres>,
    name: &String,
) -> Result<Option<Station>, sqlx::Error> {
    sqlx::query!(
        "
        select id, station_name, station_display_name, station_description, created_at, updated_at
        from monitor.stations
        where station_name = $1
        limit 1
    ",
        name
    )
    .map(|s| Station {
        id: s.id,
        station_name: s.station_name,
        station_display_name: s.station_display_name,
        station_description: s.station_description,
        created_at: s.created_at,
        updated_at: s.updated_at,
    })
    .fetch_optional(db.as_mut())
    .await
}

#[post("/api/stations")]
pub async fn create_station(
    pool: web::Data<sqlx::PgPool>,
    Json(create_station_req): web::Json<CreateStationRequest>,
) -> super::EventResponse {
    if create_station_req.station_name.len() <= 2 || create_station_req.station_display_name.len() <= 2 {
        return Ok(HttpResponse::BadRequest().json(json!({
            "status": "error",
            "message": "Names must be longer than 2 characters"
        })));
    }
    
    let mut conn = pool.acquire().await?;
    let existing_station = find_station_by_name(&mut conn, &create_station_req.station_name).await?;
    match existing_station {
        Some(existing) => {
            Ok(HttpResponse::BadRequest().json(json!({
                "status": "error",
                "message": format!("Name {} already taken by station with id {}", existing.station_name, existing.id),
            })))
        }
        None => {    
            let inserted_station_id = sqlx::query!("
                insert into monitor.stations (station_name, station_display_name, station_description, created_at)
                values ($1, $2, $3, current_timestamp) returning id
                ", create_station_req.station_name, create_station_req.station_display_name, create_station_req.station_description)
            .map(|c| CreateStationResult { id: c.id })
            .fetch_one(conn.as_mut())
            .await?;
            Ok(HttpResponse::Created().json(json!({"id": inserted_station_id})))
        }
    }
}


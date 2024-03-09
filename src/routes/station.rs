use actix_web::{post, put};
use actix_web::{
    get,
    web::{self, Json},
    HttpResponse,
};
use serde_json::json;
use sqlx::{pool::PoolConnection, Postgres};

use crate::models::{CreateStationRequest, CreateStationResult, Station, UpdateStationRequest};

#[get("/api/stations")]
pub async fn get_all_stations(pool: web::Data<sqlx::PgPool>) -> super::EventResponse {
    let mut conn = pool.acquire().await?;
    let stations = sqlx::query!("
        select
            id,
            station_name,
            station_display_name,
            station_description,
            created_at,
            updated_at
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

async fn find_station_by_id(conn: &mut PoolConnection<Postgres>,
    station_id: i32) -> Result<Option<Station>, sqlx::Error> {
    sqlx::query!("
        select
            id,
            station_name,
            station_display_name,
            station_description,
            created_at,
            updated_at
        from monitor.stations
        where id = $1
    ", station_id)
    .map(|s| Station {
        id: s.id,
        station_name: s.station_name,
        station_display_name: s.station_display_name,
        station_description: s.station_description,
        created_at: s.created_at,
        updated_at: s.updated_at
    })
    .fetch_optional(conn.as_mut())
    .await
}

#[get("/api/stations/{station_id}")]
pub async fn get_station_by_id(
    pool: web::Data<sqlx::PgPool>,
    path: web::Path<i32>) -> super::EventResponse {
    let station_id = path.into_inner();
    let mut conn = pool.acquire().await?;
    let found_station = find_station_by_id(&mut conn, station_id).await?;

    Ok(match found_station {
        Some(station) => {
            HttpResponse::Ok().json(station)
        },
        None => {
            HttpResponse::NotFound().json(json!({
                "status": "error",
                "message": format!("Station with id {} not found", station_id),
            }))
        }
    })
}

async fn find_station_by_name(
    db: &mut PoolConnection<Postgres>,
    name: &String,
) -> Result<Option<Station>, sqlx::Error> {
    sqlx::query!("
        select
            id,
            station_name,
            station_display_name,
            station_description,
            created_at,
            updated_at
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

#[put("/api/stations")]
pub async fn update_station(
    pool: web::Data<sqlx::PgPool>,
    Json(update_station_req): web::Json<UpdateStationRequest>,
) -> super::EventResponse {
    if update_station_req.station_name.len() < 2 || update_station_req.station_display_name.len() < 2 {
        return Ok(HttpResponse::BadRequest().json(json!({
            "status": "error",
            "message": "Station names must be longer than 2 characters",
        })));
    }
    let mut conn = pool.acquire().await?;
    let found_station = find_station_by_id(&mut conn, update_station_req.id).await?;

    if found_station.is_none() {
        return Ok(HttpResponse::NotFound().json(json!({
            "status": "error",
            "message": format!("Station with id {} not found", update_station_req.id),
        })));
    }

    let old_station = found_station.unwrap();
    if old_station.station_name != update_station_req.station_name {
        let named_station = find_station_by_name(&mut conn, &update_station_req.station_name).await?;
        if let Some(found_named_station) = named_station {
            return Ok(HttpResponse::BadRequest().json(json!({
                "status": "error",
                "message": format!("Name {} conflicts with station of id {} also named {}", found_named_station.station_name, found_named_station.id, found_named_station.station_name),
            })));
        }
    }

    sqlx::query!("
        update monitor.stations
        set
            station_name = $2,
            station_display_name = $3,
            station_description = $4,
            updated_at = current_timestamp
        where
            id = $1
    ", update_station_req.id, update_station_req.station_name, update_station_req.station_display_name, update_station_req.station_description)
    .execute(conn.as_mut()).await?;

    let updated_station = find_station_by_id(&mut conn, update_station_req.id).await?;

    Ok(match updated_station {
        Some(station) => HttpResponse::Ok().json(station),
        None => HttpResponse::NotFound().json(json!({
            "status": "error",
            "message": "Not found",
        }))
    })
}

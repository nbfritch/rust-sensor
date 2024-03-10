use actix_web::{post, put};
use actix_web::{
    get,
    web::{self, Json},
    HttpResponse,
};
use serde_json::json;
use sqlx::{pool::PoolConnection, Postgres};

use crate::models::{CreateSensorRequest, CreateSensorResult, Sensor, UpdateSensorRequest};

#[get("/api/sensors")]
pub async fn get_all_sensors(pool: web::Data<sqlx::PgPool>) -> super::EventResponse {
    let mut conn = pool.acquire().await?;
    let sensors = sqlx::query!("
        select
            id,
            sensor_name,
            measurement_type_id,
            created_at,
            updated_at
        from monitor.sensors
        order by id asc
    "
    )
    .map(|s| Sensor {
        id: s.id,
        sensor_name: s.sensor_name,
        measurement_type_id: s.measurement_type_id as i32,
        created_at: s.created_at,
        updated_at: s.updated_at,
    })
    .fetch_all(conn.as_mut())
    .await?;

    Ok(HttpResponse::Ok().json(sensors))
}

async fn find_sensor_by_id(conn: &mut PoolConnection<Postgres>,
    sensor_id: i32) -> Result<Option<Sensor>, sqlx::Error> {
    sqlx::query!("
        select
            id,
            sensor_name,
            measurement_type_id,
            created_at,
            updated_at
        from monitor.sensors
        where id = $1
    ", sensor_id)
    .map(|s| Sensor {
        id: s.id,
        sensor_name: s.sensor_name,
        measurement_type_id: s.measurement_type_id as i32,
        created_at: s.created_at,
        updated_at: s.updated_at,
    })
    .fetch_optional(conn.as_mut())
    .await
}

#[get("/api/sensors/{sensor_id}")]
pub async fn get_sensor_by_id(
    pool: web::Data<sqlx::PgPool>,
    path: web::Path<i32>) -> super::EventResponse {
    let sensor_id = path.into_inner();
    let mut conn = pool.acquire().await?;
    let found_sensor = find_sensor_by_id(&mut conn, sensor_id).await?;

    Ok(match found_sensor {
        Some(sensor) => {
            HttpResponse::Ok().json(sensor)
        },
        None => {
            HttpResponse::NotFound().json(json!({
                "status": "error",
                "message": format!("Sensor with id {} not found", sensor_id),
            }))
        }
    })
}

async fn find_sensor_by_name(
    db: &mut PoolConnection<Postgres>,
    name: &String,
) -> Result<Option<Sensor>, sqlx::Error> {
    sqlx::query!("
        select
            id,
            sensor_name,
            measurement_type_id,
            created_at,
            updated_at
        from monitor.sensors
        where sensor_name = $1
        limit 1
    ",
        name
    )
    .map(|s| Sensor {
        id: s.id,
        sensor_name: s.sensor_name,
        measurement_type_id: s.measurement_type_id as i32,
        created_at: s.created_at,
        updated_at: s.updated_at,
    })
    .fetch_optional(db.as_mut())
    .await
}

#[post("/api/sensors")]
pub async fn create_sensor(
    pool: web::Data<sqlx::PgPool>,
    Json(create_sensor_req): web::Json<CreateSensorRequest>,
) -> super::EventResponse {
    if create_sensor_req.sensor_name.len() <= 2 {
        return Ok(HttpResponse::BadRequest().json(json!({
            "status": "error",
            "message": "Names must be longer than 2 characters"
        })));
    }

    let mut conn = pool.acquire().await?;
    let existing_sensor = find_sensor_by_name(&mut conn, &create_sensor_req.sensor_name).await?;
    match existing_sensor {
        Some(existing) => {
            Ok(HttpResponse::BadRequest().json(json!({
                "status": "error",
                "message": format!("Name {} already taken by sensor with id {}", existing.sensor_name, existing.id),
            })))
        }
        None => {
            let inserted_sensor_id = sqlx::query!("
                insert into monitor.sensors (sensor_name, measurement_type_id, created_at)
                values ($1, $2, current_timestamp) returning id
                ", create_sensor_req.sensor_name, create_sensor_req.measurement_type_id as i32)
            .map(|c| CreateSensorResult { id: c.id })
            .fetch_one(conn.as_mut())
            .await?;
            Ok(HttpResponse::Created().json(inserted_sensor_id)))
        }
    }
}

#[put("/api/sensors")]
pub async fn update_sensor(
    pool: web::Data<sqlx::PgPool>,
    Json(update_sensor_req): web::Json<UpdateSensorRequest>,
) -> super::EventResponse {
    if update_sensor_req.sensor_name.len() < 2 {
        return Ok(HttpResponse::BadRequest().json(json!({
            "status": "error",
            "message": "Sensor names must be longer than 2 characters",
        })));
    }
    let mut conn = pool.acquire().await?;
    let found_sensor = find_sensor_by_id(&mut conn, update_sensor_req.id).await?;

    if found_sensor.is_none() {
        return Ok(HttpResponse::NotFound().json(json!({
            "status": "error",
            "message": format!("Sensor with id {} not found", update_sensor_req.id),
        })));
    }

    let old_sensor = found_sensor.unwrap();
    if old_sensor.sensor_name != update_sensor_req.sensor_name {
        let named_sensor = find_sensor_by_name(&mut conn, &update_sensor_req.sensor_name).await?;
        if let Some(found_named_sensor) = named_sensor {
            return Ok(HttpResponse::BadRequest().json(json!({
                "status": "error",
                "message": format!("Name {} conflicts with sensor of id {} also named {}", found_named_sensor.sensor_name, found_named_sensor.id, found_named_sensor.sensor_name),
            })));
        }
    }

    sqlx::query!("
        update monitor.sensors
        set
            sensor_name = $2,
            measurement_type_id = $3,
            updated_at = current_timestamp
        where
            id = $1
    ", update_sensor_req.id, update_sensor_req.sensor_name, update_sensor_req.measurement_type_id as i32)
    .execute(conn.as_mut()).await?;

    let updated_sensor = find_sensor_by_id(&mut conn, update_sensor_req.id).await?;

    Ok(match updated_sensor {
        Some(sensor) => HttpResponse::Ok().json(sensor),
        None => HttpResponse::NotFound().json(json!({
            "status": "error",
            "message": "Not found",
        }))
    })
}

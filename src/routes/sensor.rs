use crate::types::sensor::{CreateSensorReq, Sensor, UpdateSensorReq};
use actix_web::{
    web::{self, Json},
    HttpResponse,
};
use serde_json::json;
use sqlx::{pool::PoolConnection, Postgres};
use validator::Validate;

pub async fn get_all_sensors(pool: web::Data<sqlx::PgPool>) -> super::EventResponse {
    let mut conn = pool.acquire().await?;
    let sensors = sqlx::query_as!(
        Sensor,
        "select
         s.id,
         s.name,
         s.description,
         s.color_hex_code,
         s.font_hex_code,
         cast(extract(epoch from s.inserted_at) as bigint) * 1000 as inserted_at,
         cast(extract(epoch from s.updated_at) as bigint) * 1000 as updated_at
        from sensors s
        order by s.id"
    )
    .fetch_all(conn.as_mut())
    .await?;

    Ok(HttpResponse::Ok().json(sensors))
}

async fn fetch_sensor_by_id(mut conn: PoolConnection<Postgres>, id: i64) -> Result<Sensor, sqlx::Error> {
    return sqlx::query_as!(
        Sensor,
        "
        select
         s.id,
         s.name,
         s.description,
         s.color_hex_code,
         s.font_hex_code,
         cast(extract(epoch from s.inserted_at) as bigint) * 1000 as inserted_at,
         cast(extract(epoch from s.updated_at) as bigint) * 1000 as updated_at
        from sensors s
        where s.id = $1
    ",
        id
    )
    .fetch_one(conn.as_mut())
    .await;
}

pub async fn create_sensor(
    pool: web::Data<sqlx::PgPool>,
    Json(create_sensor): web::Json<CreateSensorReq>,
) -> super::EventResponse {
    let validation_result = create_sensor.validate();
    if let Err(v) = validation_result {
        let err_string = v.to_string();
        return Ok(HttpResponse::BadRequest().json(json!({
            "error": "Bad Request",
            "details": err_string,
        })));
    }
    let mut conn = pool.acquire().await?;
    let created_sensor_id = sqlx::query!("
        insert into sensors (name, description, color_hex_code, font_hex_code, inserted_at, updated_at)
        values ($1, $2, $3, $4, current_timestamp, current_timestamp)
        returning id
    ",
        create_sensor.name,
        create_sensor.description,
        create_sensor.color_hex_code,
        create_sensor.font_hex_code
    ).map(|row| row.id).fetch_one(conn.as_mut()).await?;

    let created_sensor = fetch_sensor_by_id(conn, created_sensor_id).await?;

    Ok(HttpResponse::Created().json(created_sensor))
}


pub async fn update_sensor(
    pool: web::Data<sqlx::PgPool>,
    Json(update_sensor): web::Json<UpdateSensorReq>,
) -> super::EventResponse {
    let validation_result = update_sensor.validate();
    if let Err(v) = validation_result {
        let err_string = v.to_string();
        return Ok(HttpResponse::BadRequest().json(json!({
            "error": "Bad Request",
            "details": err_string,
        })));
    }
    let mut conn = pool.acquire().await?;
    sqlx::query!("
        update sensors
        set name = $2,
            description = $3,
            color_hex_code = $4,
            font_hex_code = $5,
            updated_at = current_timestamp
        where id = $1
    ",
        update_sensor.id,
        update_sensor.name,
        update_sensor.description,
        update_sensor.color_hex_code,
        update_sensor.font_hex_code
    ).fetch_all(conn.as_mut()).await?;

    let updated_sensor = fetch_sensor_by_id(conn, update_sensor.id).await?;

    Ok(HttpResponse::Ok().json(updated_sensor))
}
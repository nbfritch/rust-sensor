use actix_web::put;
use actix_web::web;
use actix_web::HttpResponse;
use actix_web::web::Json;
use serde_json::json;

use crate::types::CreateReadingRequest;

#[put("/api/readings{tail}*")]
pub async fn create_reading(
    pool: web::Data<sqlx::PgPool>,
    Json(create_reading_request): web::Json<CreateReadingRequest>,
) -> super::EventResponse {
    if create_reading_request.temperature <= 0.0f64 || create_reading_request.temperature >= 120.0f64 {
        return Ok(HttpResponse::BadRequest()
            .json(json!({"status": "error","message": "Temperature out of range"})));
    }

    if create_reading_request.sensor_name.len() <= 2 {
        return Ok(HttpResponse::BadRequest()
        .json(json!({"status": "error","message": "Sensor name too short"})));
    }

    let mut conn = pool.acquire().await?;
    let sensor_id = sqlx::query!(
        "select id from sensors where name = $1",
        create_reading_request.sensor_name
    ).map(|x| x.id).fetch_one(conn.as_mut())
    .await;

    if sensor_id.is_err() {
        return Ok(HttpResponse::InternalServerError()
            .json(json!({"status": "error","message": "Error retrieving sensor info"})));
    }

    let insert_result = sqlx::query!("
        insert into readings (temperature, sensor_id) values ($1, $2) returning id
    ", create_reading_request.temperature, sensor_id.unwrap())
        .map(|x| x.id)
        .fetch_one(conn.as_mut()).await;

    if insert_result.is_err() {
        return Ok(HttpResponse::InternalServerError()
            .json(json!({"status": "error","message": "Error created reading"})));
    }

    Ok(HttpResponse::Created()
    .json(json!({"status": "created", "reading_id": insert_result.unwrap()})))
}

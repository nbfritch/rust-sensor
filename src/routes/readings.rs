use actix_web::{put, web::{self, Json}, HttpResponse};
use serde_json::json;

use crate::types::CreateReadingRequest;
use crate::models::ReadingType;

#[put("/api/readings{tail}*")]
pub async fn create_reading(
    pool: web::Data<sqlx::PgPool>,
    Json(create_reading_request): web::Json<CreateReadingRequest>,
) -> super::EventResponse {
    if create_reading_request.reading_value <= 0.0f64 || create_reading_request.reading_value >= 120.0f64 {
        return Ok(HttpResponse::BadRequest()
            .json(json!({"status": "error","message": "Value out of range"})));
    }

    let reading_type = ReadingType::from_int(create_reading_request.reading_type);
    if reading_type.is_none() {
        return Ok(HttpResponse::BadRequest().json(json!({"status": "error", "message": format!("Invalid reading type {}", create_reading_request.reading_type)})));
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
        insert into readings (reading_value, sensor_id, reading_type) values ($1, $2, $3) returning id
    ", create_reading_request.reading_value, sensor_id.unwrap(), create_reading_request.reading_type)
        .map(|x| x.id)
        .fetch_one(conn.as_mut()).await;

    if insert_result.is_err() {
        return Ok(HttpResponse::InternalServerError()
            .json(json!({"status": "error","message": "Error created reading"})));
    }

    Ok(HttpResponse::Created()
    .json(json!({"status": "created", "reading_id": insert_result.unwrap()})))
}

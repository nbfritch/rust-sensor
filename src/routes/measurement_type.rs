use actix_web::{
    get,
    web::{self, Json},
    HttpResponse,
};
use actix_web::{post, put};
use serde_json::json;
use sqlx::{pool::PoolConnection, Postgres};

use crate::models::{CreateMeasurementTypeRequest, MeasurementType, UpdateMeasurementTypeRequest};

#[get("/api/measurement_type")]
pub async fn list_measurement_types(pool: web::Data<sqlx::PgPool>) -> super::EventResponse {
    let mut conn = pool.acquire().await?;
    let measurement_types = sqlx::query!(
        "
        select
            id, name
        from monitor.measurement_type
    "
    )
    .map(|m| MeasurementType {
        id: m.id,
        name: m.name,
    })
    .fetch_all(conn.as_mut())
    .await?;

    Ok(HttpResponse::Ok().json(measurement_types))
}

async fn get_measurement_type_by_id(
    conn: &mut PoolConnection<Postgres>,
    id: i32,
) -> Result<Option<MeasurementType>, sqlx::Error> {
    sqlx::query!(
        "
        select
            id,
            name
        from monitor.measurement_type
        where id = $1
    ",
        id
    )
    .map(|s| MeasurementType {
        id: s.id,
        name: s.name,
    })
    .fetch_optional(conn.as_mut())
    .await
}

async fn get_measurement_type_by_name(
    conn: &mut PoolConnection<Postgres>,
    name: &String,
) -> Result<Option<MeasurementType>, sqlx::Error> {
    sqlx::query!(
        "
        select
            id,
            name
        from monitor.measurement_type
        where name = $1
    ",
        name
    )
    .map(|s| MeasurementType {
        id: s.id,
        name: s.name,
    })
    .fetch_optional(conn.as_mut())
    .await
}

#[post("/api/measurement_type")]
pub async fn create_measurement_type(
    pool: web::Data<sqlx::PgPool>,
    Json(create_mt_req): web::Json<CreateMeasurementTypeRequest>,
) -> super::EventResponse {
    if create_mt_req.name.len() < 2 {
        return Ok(HttpResponse::BadRequest().json(json!({
            "status": "error",
            "message": "Measurement type must have a name longer than 2 characters",
        })));
    }
    let mut conn = pool.acquire().await?;
    let existing_mt = get_measurement_type_by_name(&mut conn, &create_mt_req.name).await?;

    match existing_mt {
        Some(mt) => Ok(HttpResponse::BadRequest().json(json!({
            "status": "error",
            "message": format!("Measurement type with name {} exists with id {}", mt.name, mt.id),
        }))),
        None => {
            let created_mt_id = sqlx::query!(
                "
                insert into monitor.measurement_type (name) values ($1) returning id
            ",
                create_mt_req.name
            )
            .map(|m| m.id)
            .fetch_one(conn.as_mut())
            .await?;

            let measurement_type = get_measurement_type_by_id(&mut conn, created_mt_id).await?;

            match measurement_type {
                Some(m) => Ok(HttpResponse::Created().json(m)),
                None => Ok(HttpResponse::NotFound().json(json!({
                    "status": "error",
                    "message": "Not found",
                }))),
            }
        }
    }
}


#[put("/api/measurement_type")]
pub async fn update_measurement_type(
    pool: web::Data<sqlx::PgPool>,
    Json(update_mt_req): web::Json<UpdateMeasurementTypeRequest>,
) -> super::EventResponse {
    if update_mt_req.name.len() < 2 {
        return Ok(HttpResponse::BadRequest().json(json!({
            "status": "error",
            "message": "Measurement type must have a name longer than 2 characters",
        })));
    }
    let mut conn = pool.acquire().await?;
    let existing_mt = get_measurement_type_by_id(&mut conn, update_mt_req.id).await?;

    if let None = existing_mt {
        return Ok(HttpResponse::NotFound().json(json!({
            "status": "error",
            "message": format!("No measurement type with id {} was found", update_mt_req.id),
        })));
    }
    let old_measurement_type = existing_mt.unwrap();

    let same_name_mt = get_measurement_type_by_name(&mut conn, &update_mt_req.name).await?;
    if let Some(mt) = same_name_mt {
        if mt.id != old_measurement_type.id {
            return Ok(HttpResponse::BadRequest().json(json!({
                "status": "error",
                "message": format!("Measurement type with name {} already exists with id {}", mt.name, mt.id),
            })));
        }
    }

    sqlx::query!("
        update monitor.measurement_type
        set name = $2
        where id = $1
    ", update_mt_req.id, update_mt_req.name)
    .execute(conn.as_mut())
    .await?;

    let updated_mt = get_measurement_type_by_id(&mut conn, update_mt_req.id).await?;

    match updated_mt {
        Some(m) => Ok(HttpResponse::Ok().json(m)),
        None => Ok(HttpResponse::NotFound().json(json!({
            "status": "error",
            "message": "Not found"
        })))
    }
}
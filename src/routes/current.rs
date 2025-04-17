use actix_web::{web, HttpResponse};
use crate::types::reading::Reading;

pub async fn get_current_readings(
    pool: web::Data<sqlx::PgPool>,
) -> super::EventResponse {
    let mut conn = pool.acquire().await?;
    let current_readings = sqlx::query_as!(Reading,
        "select distinct on (r.sensor_id, r.reading_type)
			r.id,
			r.reading_type,
			r.reading_value,
			cast(extract(epoch from r.reading_date) as bigint) * 1000 as reading_date,
			r.sensor_id,
			cast(extract(epoch from r.inserted_at) as bigint) * 1000 as inserted_at,
			cast(extract(epoch from r.updated_at) as bigint) * 1000 as updated_at
		from readings r
		where r.reading_date > (current_timestamp - interval '1 day')
		order by
			r.sensor_id,
			r.reading_type,
			r.reading_date desc"
    ).fetch_all(conn.as_mut())
    .await?;

    Ok(HttpResponse::Ok().json(current_readings))
}
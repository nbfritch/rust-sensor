use actix_web::{web, HttpResponse};
use serde_json::json;
use crate::models::CurrentReadingModel;

pub async fn index(
    pool: web::Data<sqlx::PgPool>,
    state: web::Data<crate::state::AppState>,
) -> super::EventResponse {
    let mut conn = pool.acquire().await?;
    let current_temps_result = sqlx::query!(
        "
    select distinct on (s.id)
        s.id,
        s.name,
        s.description,
        r.temperature,
        abs(round(
            extract(epoch from ((current_timestamp at time zone 'utc') - reading_date)) / 60))::bigint
            as minutes_ago,
        round(extract(epoch from r.reading_date))::bigint as reading_date
    from sensors s
    join readings r
        on r.sensor_id = s.id
    where
        r.reading_date > (current_timestamp + interval '-1 day')
    order by
        s.id,
        r.reading_date desc
"
    ).map(|x| CurrentReadingModel{
        id: x.id,
        name: x.name,
        description: x.description,
        temperature: x.temperature,
        minutes_ago: x.minutes_ago,
        reading_date: x.reading_date,
    }).fetch_all(conn.as_mut())
    .await;

    if current_temps_result.is_err() {
        return Ok(HttpResponse::InternalServerError()
            .json(json!({"status": "error","message": "Error retrieving current data"})));
    }

    let mut context = tera::Context::new();
    context.insert("current_readings", &current_temps_result.unwrap());
    state.render_template("current.j2", &mut context)
}

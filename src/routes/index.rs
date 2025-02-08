use crate::models::CurrentReadingModel;
use actix_web::web;

async fn fetch_current_readings(
    pool: &sqlx::PgPool,
) -> Result<Vec<CurrentReadingModel>, sqlx::Error> {
    let mut conn = pool.acquire().await?;
    sqlx::query_as!(CurrentReadingModel, "
        select distinct on (s.id, r.reading_type)
            s.id,
            s.name,
            s.description,
            r.reading_value,
            case
                when r.reading_type = 1 then '°F'
                when r.reading_type = 2 then '%rH'
                when r.reading_type = 3 then ' lux'
                else '??'
            end as reading_type_label,
            abs(round(
                extract(epoch from ((current_timestamp at time zone 'utc') - reading_date)) / 60))::bigint
                as minutes_ago,
            round(extract(epoch from r.reading_date))::bigint as reading_date
        from sensors s
        join readings r
            on r.sensor_id = s.id
        where
            r.reading_type is not null and
            r.reading_date > (current_timestamp + interval '-1 day')
        order by
            s.id,
            r.reading_type,
            r.reading_date desc
    ").fetch_all(conn.as_mut()).await
}

pub async fn index(
    pool: web::Data<sqlx::PgPool>,
    state: web::Data<crate::state::AppState>,
) -> super::EventResponse {
    let current_readings_result = fetch_current_readings(pool.as_ref()).await?;

    let mut context = tera::Context::new();
    context.insert("current_readings", &current_readings_result);
    state.render_template("current.j2", &mut context)
}

pub async fn current_readings_json(
    pool: web::Data<sqlx::PgPool>,
) -> super::EventResponse {
    let current_readings_result = fetch_current_readings(pool.as_ref()).await?;

    Ok(actix_web::HttpResponse::Ok().json(current_readings_result))
}

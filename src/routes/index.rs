use actix_web::{web, HttpResponse};
use crate::types::current::CurrentReadingModel;

fn reading_type_label(t: i32) -> String {
    String::from(match t {
        1 => "°F",
        2 => "%rH",
        3 => " lux",
        _ => "Error"
    })
}

pub async fn index(
    pool: web::Data<sqlx::PgPool>,
) -> super::EventResponse {
    let mut conn = pool.acquire().await?;
    let current_readings_result = sqlx::query!("
        select distinct on (s.id, r.reading_type)
            s.id,
            s.name,
            s.description,
            r.reading_value,
            r.reading_type,
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
            r.reading_type,
            r.reading_date desc
    ").map(|x| CurrentReadingModel{
        id: x.id,
        name: x.name,
        description: x.description,
        reading_value: x.reading_value,
        minutes_ago: x.minutes_ago,
        reading_date: x.reading_date,
        reading_type_label: reading_type_label(x.reading_type)

    }).fetch_all(conn.as_mut())
    .await?;

    Ok(HttpResponse::Ok().json(current_readings_result))
}

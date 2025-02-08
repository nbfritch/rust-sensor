use std::collections::HashMap;
use actix_web::{web, HttpResponse};
use serde::Deserialize;
use serde_json::json;
use crate::{models::GraphReadingRow, types::{GraphPoint, SensorLine}};

#[derive(Clone, Deserialize)]
pub struct HistoryQueryInfo {
    year: i32,
    month: i32,
    day: i32,
}

pub async fn historical_graph(
    pool: web::Data<sqlx::PgPool>,
    query_params: web::Query<HistoryQueryInfo>,
) -> super::EventResponse {
    let year = query_params.year;
    let month = query_params.month;
    let day = query_params.day;
    let mut conn = pool.acquire().await?;
    let graph_data = sqlx::query_as!(GraphReadingRow, "
        select
            s.id,
            s.name,
            s.description,
            floor(i.reading_date)::bigint as reading_date,
            avg(i.reading_value) as reading_value,
            s.color_hex_code,
            s.font_hex_code
        from (
            select
            r.reading_value as reading_value,
            r.sensor_id,
            (
            floor(
                extract(epoch from r.reading_date) /
                extract(epoch from make_interval(0, 0, 0, 0, 0, $1::int, 0.0))
            ) *
            extract(epoch from make_interval(0, 0, 0, 0, 0, $1::int, 0.0))
            ) as reading_date
            from readings r
            where r.reading_date > (
                make_timestamp($2::int, $3::int, $4::int, 0, 0, 0.0) at time zone 'utc'
            ) and r.reading_date < (
                make_timestamp($2::int, $3::int, $4::int + $1::int, 0, 0, 0.0) at time zone 'utc'
            )
        ) i
        join sensors s on s.id = i.sensor_id
        group by s.id, s.description, i.reading_date
        order by s.id, i.reading_date",
        1,
        year,
        month,
        day
    )
    .fetch_all(conn.as_mut())
    .await;

    if graph_data.is_err() {
        println!("{:?}", graph_data);
        return Ok(HttpResponse::InternalServerError()
            .json(json!({"status": "error","message": "Error retrieving current data"})));
    }

    let lines: HashMap<i64, SensorLine> = HashMap::new();
    let folded_data = graph_data.unwrap().iter().fold(lines, |mut acc, el| {
        let line = acc.entry(el.id).or_insert_with(|| SensorLine {
            id: el.id,
            name: el.name.clone().unwrap_or(String::from("MISSING")),
            description: el.description.clone().unwrap_or(String::from("MISSING")),
            points: Vec::new(),
            color_hex_code: el.color_hex_code.clone(),
            font_hex_code: el.font_hex_code.clone(),
        });

        if el.reading_value.is_some() && el.reading_date.is_some() {
            line.points.push(GraphPoint {
                reading_value: el.reading_value.unwrap(),
                reading_date: el.reading_date.unwrap(),
            });
        }

        acc
    });

    let final_lines = folded_data.values().collect::<Vec<_>>();

    Ok(HttpResponse::Ok().json(final_lines))
}

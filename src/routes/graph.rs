use std::collections::HashMap;
use actix_web::{web, HttpResponse};
use serde::Deserialize;
use serde_json::json;
use crate::{models::{GraphReadingRow, ReadingType}, types::{GraphPoint, SensorLine}};

struct Interval {
    days_ago: i32,
    hours_ago: i32,
    resolution: i32,
}

fn interval_for_query(name: String) -> Interval {
    if name == "hour" {
        Interval {
            days_ago: 0,
            hours_ago: -1,
            resolution: 1,
        }
    } else if name == "day" {
        Interval {
            days_ago: -1,
            hours_ago: 0,
            resolution: 10,
        }
    } else if name == "week" {
        Interval {
            days_ago: -7,
            hours_ago: 0,
            resolution: 60,
        }
    } else if name == "month" {
        Interval {
            days_ago: -30,
            hours_ago: 0,
            resolution: 180,
        }
    } else {
        Interval {
            days_ago: 0,
            hours_ago: -1,
            resolution: 1,
        }
    }
}

#[derive(Clone, Deserialize)]
pub struct QueryInfo {
    last: Option<String>,
    reading_type: i32,
}

pub async fn graph_page(state: web::Data<crate::state::AppState>) -> super::EventResponse {
    let mut ctx = tera::Context::new();
    state.render_template("graph.j2", &mut ctx)
}

pub async fn graph_data(
    pool: web::Data<sqlx::PgPool>,
    query_params: web::Query<QueryInfo>,
) -> super::EventResponse {
    let last_interval = query_params.last.clone().unwrap_or(String::from("hour"));
    let reading_type = ReadingType::from_int(query_params.reading_type);
    let reading_type_id = if reading_type.is_none() { 1 } else { query_params.reading_type };
    let mut conn = pool.acquire().await?;
    let interval = interval_for_query(last_interval);
    let graph_data = sqlx::query!("
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
                extract(epoch from make_interval(0, 0, 0, 0, 0, $3::int, 0.0))
            ) *
            extract(epoch from make_interval(0, 0, 0, 0, 0, $3::int, 0.0))
            ) as reading_date
            from readings r
            where r.reading_type = $4::int and r.reading_date > (
            current_timestamp at time zone 'utc' +
            make_interval(0, 0, 0, $1::int, $2::int, 0, 0.0)
            )
        ) i
        join sensors s on s.id = i.sensor_id
        group by s.id, s.description, i.reading_date
        order by s.id, i.reading_date",
        interval.days_ago,
        interval.hours_ago,
        interval.resolution,
        reading_type_id
    )
    .map(|x| GraphReadingRow {
        id: x.id,
        name: x.name,
        description: x.description,
        reading_value: x.reading_value,
        reading_date: x.reading_date,
        color_hex_code: x.color_hex_code,
        font_hex_code: x.font_hex_code,
    })
    .fetch_all(conn.as_mut())
    .await;

    if graph_data.is_err() {
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

use crate::types::
    graph::{GraphReading, GraphRes, GraphRow}
;
use actix_web::{web, HttpResponse};
use chrono::TimeDelta;
use log::error;
use serde::Deserialize;
use serde_json::json;
use std::collections::HashMap;

fn fold_line_data(points: Vec<GraphRow>) -> GraphRes {
    let mut d = HashMap::new();
    let mut min: Option<f64> = None;
    let mut max: Option<f64> = None;

    for point in points.iter() {
        let rv = point.reading_value.unwrap();
        match min {
            Some(v) => {
                if rv < v {
                    min = Some(rv)
                }
            }
            None => min = Some(rv),
        }

        match max {
            Some(v) => {
                if rv > v {
                    max = Some(rv)
                }
            }
            None => max = Some(rv),
        }

        let e = d.entry(point.sensor_id.unwrap()).or_insert(Vec::new());
        e.push(GraphReading {
            reading_date: point.reading_date.unwrap(),
            reading_value: point.reading_value.unwrap(),
        });
    }

    GraphRes {
        min: min.map(|m| m.floor()).unwrap_or(0.0),
        max: max.map(|m| m.ceil()).unwrap_or(0.0),
        data: d,
    }
}

#[derive(Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct QueryInfoV2 {
    pub reading_type: i32,
    pub start_date: String,
    pub end_date: String,
}

pub async fn graph_data_v2(
    pool: web::Data<sqlx::PgPool>,
    query_params: web::Query<QueryInfoV2>,
) -> super::EventResponse {
    let start_date_res =
        chrono::NaiveDateTime::parse_from_str(&query_params.start_date, "%Y-%m-%dT%H:%M:%S%Z");
    let end_date_res =
        chrono::NaiveDateTime::parse_from_str(&query_params.end_date, "%Y-%m-%dT%H:%M:%S%Z");

    if let Err(e) = start_date_res {
        error!("Error parsing startDate {}: {}", query_params.start_date, e);
    }

    if let Err(e) = end_date_res {
        error!("Error parsing endDate {}: {}", query_params.start_date, e);
    }

    let (Ok(start_date), Ok(end_date)) = (start_date_res, end_date_res) else {
        return Ok(HttpResponse::BadRequest().json(json!({
            "error": "Invalid date",
            "details": "Failed to parse dates"
        })));
    };
    let seconds_difference = (end_date - start_date).num_seconds().abs();
    let minute_resolution = if seconds_difference <= TimeDelta::hours(24).num_seconds() {
        1
    } else if seconds_difference <= TimeDelta::days(7).num_seconds() {
        60
    } else {
        180
    };

    let mut conn = pool.acquire().await?;
    let graph_points = sqlx::query_as!(
        GraphRow,
        "select
      i.sensor_id,
      floor(i.reading_date)::bigint as reading_date,
      avg(i.reading_value) as reading_value
    from (
      select
        r.sensor_id,
        r.reading_value,
        (
          floor(
            extract(epoch from r.reading_date) /
            extract(epoch from make_interval(0, 0, 0, 0, 0, $1, 0.0))
          ) * extract(epoch from  make_interval(0, 0, 0, 0, 0, $1, 0.0))
        ) as reading_date
      from readings r
      where
        r.reading_type = $4 and
        r.reading_date between $2 and $3
    ) i
    group by i.sensor_id, i.reading_date
    order by i.sensor_id, i.reading_date",
        minute_resolution,
        start_date,
        end_date,
        query_params.reading_type
    )
    .fetch_all(conn.as_mut())
    .await?;

    let split_points = fold_line_data(graph_points);

    Ok(HttpResponse::Ok().json(split_points))
}

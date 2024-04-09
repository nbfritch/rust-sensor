use crate::{
    models::{Reading, Sensor},
    types::{GraphPoint, SensorLine},
};
use ::chrono::Days;
use actix_web::{web, HttpResponse};
use chrono::{FixedOffset, TimeDelta, Utc};
use serde::Deserialize;
use serde_json::json;
use std::{collections::HashMap, hash::Hash};

#[derive(Clone, Deserialize)]
pub struct HistoryQueryInfo {
    year: i32,
    month: u32,
    day: u32,
}

pub async fn historical_graph(
    db: web::Data<scylla::Session>,
    query_params: web::Query<HistoryQueryInfo>,
) -> super::EventResponse {
    let year = query_params.year;
    let month = query_params.month;
    let day = query_params.day;
    let date = chrono::NaiveDate::from_ymd_opt(year, month, day).unwrap();
    let time = chrono::NaiveTime::from_hms_opt(0, 0, 0).unwrap();
    let ndatetime = chrono::NaiveDateTime::parse_from_str(
        &format!("{}-{}-{} {}:{}:{}", year, month, day, 0, 0, 0),
        "%Y-%m-%d %H:%M:%S",
    )
    .unwrap();
    let datetime = chrono::DateTime::<Utc>::from_naive_utc_and_offset(ndatetime, Utc)
        .checked_sub_signed(TimeDelta::try_hours(-6).unwrap())
        .unwrap();
    let edatetime = datetime.checked_add_days(Days::new(1)).unwrap();
    let sensors = db
        .query("select id from sensors", ())
        .await?
        .rows_typed::<Sensor>()?
        .map(|s| s.unwrap())
        .collect::<Vec<_>>();

    let timeboxed_readings = db
        .query(
            "
        select id, sensor_id, reading_value, reading_type, reading_date, created_at
        from readings
        where reading_date > ? AND reading_date < ?",
            (datetime, edatetime),
        )
        .await?
        .rows_typed::<Reading>()?
        .map(|s| s.unwrap())
        .collect::<Vec<_>>();
    /* let mut conn = pool.acquire().await?;
    let graph_data = sqlx::query!(
        "
        select
            s.id,
            s.name,
            s.description,
            floor(i.reading_date)::bigint as reading_date,
            avg(i.reading_value) as reading_value
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
    .map(|x| GraphReadingRow {
        id: x.id,
        name: x.name,
        description: x.description,
        reading_value: x.reading_value,
        reading_date: x.reading_date,
    })
    .fetch_all(conn.as_mut())
    .await; */

    let sensors_dict: HashMap<String, Sensor> = HashMap::new();
    let folded_sensors = sensors.iter().fold(sensors_dict, |mut acc, s| {
        acc.entry(s.id.clone()).or_insert_with(|| (*s).clone());
        acc
    });

    let lines: HashMap<String, SensorLine> = HashMap::new();
    let folded_data = timeboxed_readings.iter().fold(lines, |mut acc, el| {
        let line = acc.entry(el.id.clone()).or_insert_with(|| SensorLine {
            sensor_id: el.sensor_id.clone(),
            points: Vec::new(),
        });

        line.points.push(GraphPoint {
            reading_value: el.reading_value,
            reading_date: el.reading_date.timestamp(),
        });

        acc
    });

    let final_lines = folded_data.values().collect::<Vec<_>>();

    Ok(HttpResponse::Ok().json(json!({
        sensors: folded_sensors,
        readings: folded_data,
    })))
}

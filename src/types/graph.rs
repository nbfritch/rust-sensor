use std::collections::HashMap;

use serde::Serialize;
use sqlx::FromRow;

#[derive(FromRow)]
pub struct GraphRow {
    pub sensor_id: Option<i64>,
    pub reading_date: Option<i64>,
    pub reading_value: Option<f64>,
}


#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GraphReading {
    pub reading_date: i64,
    pub reading_value: f64,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GraphRes {
    pub min: f64,
    pub max: f64,
    pub data: HashMap<i64, Vec<GraphReading>>,
}
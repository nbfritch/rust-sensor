use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Deserialize)]
pub struct CreateReadingRequest {
    pub reading_value: f64,
    #[serde(rename = "sensorName")]
    pub sensor_name: String,
    pub reading_type: i32,
}

#[derive(FromRow, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Reading {
    pub id: i64,
    pub reading_type: Option<i32>,
    pub reading_value: Option<f64>,
    pub reading_date: Option<i64>,
    pub sensor_id: Option<i64>,
    pub inserted_at: Option<i64>,
    pub updated_at: Option<i64>,
}
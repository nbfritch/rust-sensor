use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Serialize, Deserialize)]
pub struct CurrentStationReading {
    pub id: i64,
    pub station_name: String,
    pub station_display_name: String,
    pub station_description: Option<String>,
    pub measurement_type_id: i64,
    pub measurement_type_name: String,
    pub measured_value: Option<f64>,
    pub measured_at: Option<i64>,
}

#[derive(Serialize, Deserialize)]
pub enum ReadingType {
    Temperature = 1,
    RelativeHumidity = 2,
    LightLevel = 3,
}

#[derive(Serialize, Deserialize)]
pub struct CurrentReadingModel {
    pub id: i64,
    pub name: Option<String>,
    pub description: Option<String>,
    pub reading_value: Option<f64>,
    pub minutes_ago: Option<i64>,
    pub reading_date: Option<i64>,
}

#[derive(Debug, FromRow, Deserialize, Serialize)]
pub struct GraphReadingRow {
    pub id: i64,
    pub name: Option<String>,
    pub description: Option<String>,
    pub reading_value: Option<f64>,
    pub reading_date: Option<i64>,
}

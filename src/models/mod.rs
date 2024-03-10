mod readings;
use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};

pub use readings::{CurrentReadingModel, GraphReadingRow};

#[derive(Serialize)]
pub struct Station {
    pub id: i32,
    pub station_name: String,
    pub station_display_name: String,
    pub station_description: Option<String>,
    pub created_at: NaiveDateTime,
    pub updated_at: Option<NaiveDateTime>,
}

#[derive(Deserialize)]
pub struct CreateStationRequest {
    pub station_name: String,
    pub station_display_name: String,
    pub station_description: Option<String>,
}

#[derive(Serialize)]
pub struct CreateStationResult {
    pub id: i32,
}

#[derive(Deserialize)]
pub struct UpdateStationRequest {
    pub id: i32,
    pub station_name: String,
    pub station_display_name: String,
    pub station_description: Option<String>,
}

#[derive(Serialize)]
pub struct MeasurementType {
    pub id: i32,
    pub name: String,
}

#[derive(Deserialize)]
pub struct CreateMeasurementTypeRequest {
    pub name: String,
}

#[derive(Deserialize)]
pub struct UpdateMeasurementTypeRequest {
    pub id: i32,
    pub name: String,
}

#[derive(Serialize)]
pub struct Sensor {
    pub id: i32,
    pub sensor_name: String,
    pub measurement_type_id: i32,
    pub created_at: NaiveDateTime,
    pub updated_at: Option<NaiveDateTime>,
}

#[derive(Deserialize)]
pub struct CreateSensorRequest {
    pub sensor_name: String,
    pub measurement_type_id: i32,
}

#[derive(Serialize)]
pub struct CreateSensorResult {
    pub id: i32,
}

#[derive(Deserialize)]
pub struct UpdateSensorRequest {
    pub id: i32,
    pub sensor_name: String,
    pub measurement_type_id: i32,
}

#[derive(Serialize)]
pub struct Reading {
    pub id: i32,
    pub station_id: i32,
    pub sensor_id: i32,
    pub measured_value: f64,
    pub measured_at: NaiveDateTime,
    pub created_at: NaiveDateTime,
    pub updated_at: Option<NaiveDateTime>,
}

#[derive(Deserialize)]
pub struct CreateReadingRequest {
    pub station_name: String,
    pub sensor_id: i32,
    pub measured_value: f64,
    pub measured_at: NaiveDateTime,
}

#[derive(Serialize)]
pub struct CreateReadingResponse {
    pub id: i32,
}

#[derive(Serialize, Deserialize)]
pub struct ReadingDataPoint {
    pub measured_value: f64,
    pub measured_at: NaiveDateTime,
}

#[derive(Deserialize)]
pub struct BulkCreateReadingRequest {
    pub station_name: String,
    pub sensor_id: i32,
    pub measurements: Vec<ReadingDataPoint>,
}

#[derive(Serialize)]
pub struct BulkCreateReadingResponse {
    pub reading_ids: Vec<i32>,
}

use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct GraphPoint {
    pub temperature: f64,
    pub reading_date: i64,
}

#[derive(Serialize, Deserialize)]
pub struct SensorLine {
    pub id: i64,
    pub name: String,
    pub description: String,
    pub points: Vec<GraphPoint>,
}

#[derive(Deserialize)]
pub struct CreateReadingRequest {
    pub temperature: f64,
    #[serde(rename = "sensorName")]
    pub sensor_name: String,
}

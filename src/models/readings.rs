use chrono::Utc;
use scylla::FromRow;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub enum ReadingType {
    Temperature = 1,
    RelativeHumidity = 2,
    LightLevel = 3,
}

impl Into<u32> for ReadingType {
    fn into(self) -> u32 {
        self as u32
    }
}

impl From<u32> for ReadingType {
    fn from(value: u32) -> Self {
        match value {
            1 => Self::Temperature,
            2 => Self::RelativeHumidity,
            3 => Self::LightLevel,
            _ => Self::Temperature
        }
    }
}

impl ReadingType {
    pub fn from_int(i: i32) -> Option<Self> {
        match i {
            1 => Some(Self::Temperature),
            2 => Some(Self::RelativeHumidity),
            3 => Some(Self::LightLevel),
            _ => None,
        }
    }
}

#[derive(Serialize, Deserialize)]
pub struct CurrentReadingModel {
    pub id: i64,
    pub name: Option<String>,
    pub description: Option<String>,
    pub reading_value: Option<f64>,
    pub minutes_ago: Option<i64>,
    pub reading_date: Option<i64>,
    pub reading_type_label: String,
}

#[derive(Debug, FromRow, Deserialize, Serialize)]
pub struct GraphReadingRow {
    pub id: i64,
    pub name: Option<String>,
    pub description: Option<String>,
    pub reading_value: Option<f64>,
    pub reading_date: Option<i64>,
}


#[derive(Debug, FromRow, Deserialize, Serialize)]
pub struct Reading {
    pub id: String,
    pub sensor_id: String,
    pub reading_value: f64,
    pub reading_type: i64,
    pub reading_date: chrono::DateTime<Utc>,
    pub created_at: chrono::DateTime<Utc>,
}

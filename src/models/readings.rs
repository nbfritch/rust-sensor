use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Serialize, Deserialize)]
pub enum ReadingType {
    Temperature = 1,
    RelativeHumidity = 2,
    LightLevel = 3,
}

impl ReadingType {
    pub fn from_int(i: i32) -> Option<Self> {
        match i {
            1 => Some(Self::Temperature),
            2 => Some(Self::RelativeHumidity),
            3 => Some(Self::LightLevel),
            _ => None
        }
    }
}

#[derive(FromRow, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CurrentReadingModel {
    pub id: i64,
    pub name: Option<String>,
    pub description: Option<String>,
    pub reading_value: Option<f64>,
    pub minutes_ago: Option<i64>,
    pub reading_date: Option<i64>,
    pub reading_type_label: Option<String>,
}

#[derive(Debug, FromRow, Deserialize, Serialize)]
pub struct GraphReadingRow {
    pub id: i64,
    pub name: Option<String>,
    pub description: Option<String>,
    pub reading_value: Option<f64>,
    pub reading_date: Option<i64>,
    pub color_hex_code: String,
    pub font_hex_code: String,
}

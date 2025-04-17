use serde::{Deserialize, Serialize};
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
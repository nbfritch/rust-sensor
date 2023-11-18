use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Serialize, Deserialize)]
pub struct CurrentReadingModel {
    pub id: i64,
    pub name: Option<String>,
    pub description: Option<String>,
    pub temperature: Option<f64>,
    pub minutes_ago: Option<i64>,
    pub reading_date: Option<i64>,
}


#[derive(Debug, FromRow, Deserialize, Serialize)]
pub struct GraphReadingRow {
    pub id: i64,
    pub name: Option<String>,
    pub description: Option<String>,
    pub temperature: Option<f64>,
    pub reading_date: Option<i64>,
}

use once_cell::sync::Lazy;
use regex::Regex;
use serde::{Deserialize, Serialize};
use sqlx::prelude::FromRow;
use validator::Validate;

#[derive(FromRow, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Sensor {
    pub id: i64,
    pub name: Option<String>,
    pub description: Option<String>,
    pub color_hex_code: Option<String>,
    pub font_hex_code: Option<String>,
    pub inserted_at: Option<i64>,
    pub updated_at: Option<i64>,
}

static RE_COLOR: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"#[0-9a-f]{6}").unwrap()
});

#[derive(Deserialize, Validate)]
#[serde(rename_all = "camelCase")]
pub struct CreateSensorReq {
    #[validate(length(min = 1))]
    pub name: String,
    pub description: String,
    #[validate(regex(path = *RE_COLOR))]
    pub color_hex_code: String,
    #[validate(regex(path = *RE_COLOR))]
    pub font_hex_code: String,
}

#[derive(Deserialize, Validate)]
#[serde(rename_all = "camelCase")]
pub struct UpdateSensorReq {
    pub id: i64,
    #[validate(length(min = 1))]
    pub name: String,
    pub description: String,
    #[validate(regex(path = *RE_COLOR))]
    pub color_hex_code: String,
    #[validate(regex(path = *RE_COLOR))]
    pub font_hex_code: String,
}
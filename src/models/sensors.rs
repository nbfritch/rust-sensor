use scylla::FromRow;
use serde::{Deserialize, Serialize};

#[derive(Debug, FromRow, Deserialize, Serialize, Clone)]
pub struct Sensor {
    pub id: String,
    pub legacy_sensor_id: i64,
    pub lookup_name: String,
    pub display_name: String,
    pub hardware_desc: String,
    pub location_desc: String,
}
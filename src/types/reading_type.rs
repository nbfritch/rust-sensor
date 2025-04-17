use serde::{Deserialize, Serialize};

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
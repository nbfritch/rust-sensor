pub mod graph;
pub mod history;
pub mod index;
pub mod measurement_type;
pub mod readings;
pub mod sensor;
pub mod station;

pub type EventResponse = Result<actix_web::HttpResponse, crate::errors::EventError>;

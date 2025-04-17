pub mod current;
pub mod graph;
pub mod index;
pub mod readings;
pub mod sensor;

pub type EventResponse = Result<actix_web::HttpResponse, crate::errors::EventError>;

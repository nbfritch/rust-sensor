pub mod index;
pub mod graph;
pub mod history;
pub mod readings;

pub type EventResponse = Result<actix_web::HttpResponse, crate::errors::EventError>;

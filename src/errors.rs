use actix_web::{http::StatusCode, HttpResponse};
use scylla::transport::{errors::QueryError, query_result::RowsExpectedError};

#[derive(Debug)]
pub enum EventError {
    RowsExpectedError(RowsExpectedError),
    DatabaseError(QueryError),
    TemplateError(tera::Error),
}

impl actix_web::error::ResponseError for EventError {
    fn status_code(&self) -> StatusCode {
        match *self {
            Self::DatabaseError(_) => StatusCode::SEE_OTHER,
            Self::RowsExpectedError(_) => StatusCode::INTERNAL_SERVER_ERROR,
            Self::TemplateError(_) => StatusCode::SERVICE_UNAVAILABLE,
        }
    }

    fn error_response(&self) -> HttpResponse<actix_web::body::BoxBody> {
        match self {
            EventError::DatabaseError(_) => {
                HttpResponse::build(StatusCode::SEE_OTHER)
                    .insert_header((
                        actix_web::http::header::LOCATION,
                        actix_web::http::header::HeaderValue::from_static("error"),
                    ))
                    .finish()
            }
            EventError::RowsExpectedError(_) => {
                HttpResponse::build(StatusCode::INTERNAL_SERVER_ERROR)
                .insert_header((
                    actix_web::http::header::LOCATION,
                    actix_web::http::header::HeaderValue::from_static("error"),
                ))
                .finish()
            }
            EventError::TemplateError(_) => {
                HttpResponse::build(StatusCode::SERVICE_UNAVAILABLE)
                    .body("<h1>Please, try again later</h1>")
            }
        }
    }
}

impl std::fmt::Display for EventError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self { 
            Self::RowsExpectedError(e) => write!(f, "rows expected error: {e}"),
            Self::DatabaseError(e) => write!(f, "database error: {e}"),
            Self::TemplateError(e) => write!(f, "cannot parse template: {e}"),
        }
    }
}

impl From<RowsExpectedError> for EventError {
    fn from(value: RowsExpectedError) -> Self {
        Self::RowsExpectedError(value)
    }
}

impl From<QueryError> for EventError {
    fn from(value: QueryError) -> Self {
        Self::DatabaseError(value)
    }
}

impl From<tera::Error> for EventError {
    fn from(value: tera::Error) -> Self {
        Self::TemplateError(value)
    }
}

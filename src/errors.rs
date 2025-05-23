#[derive(Debug)]
pub enum EventError {
    DatabaseError(sqlx::Error),
    ValidationError(validator::ValidationErrors),
}

impl actix_web::error::ResponseError for EventError {
    fn status_code(&self) -> actix_web::http::StatusCode {
        match *self {
            Self::DatabaseError(_) => actix_web::http::StatusCode::SEE_OTHER,
            Self::ValidationError(_) => actix_web::http::StatusCode::BAD_REQUEST,
        }
    }

    fn error_response(&self) -> actix_web::HttpResponse<actix_web::body::BoxBody> {
        match self {
            EventError::DatabaseError(_) => {
                actix_web::HttpResponse::build(actix_web::http::StatusCode::SEE_OTHER)
                    .insert_header((
                        actix_web::http::header::LOCATION,
                        actix_web::http::header::HeaderValue::from_static("error"),
                    ))
                    .finish()
            },
            EventError::ValidationError(v) => {
                let errstr = v.to_string();
                actix_web::HttpResponse::build(actix_web::http::StatusCode::BAD_REQUEST)
                    .body(errstr)
            }
        }
    }
}

impl std::fmt::Display for EventError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            EventError::DatabaseError(e) => write!(f, "database error: {e}"),
            EventError::ValidationError(v) => write!(f, "validation error: {v}"),
        }
    }
}

impl From<sqlx::Error> for EventError {
    fn from(value: sqlx::Error) -> Self {
        Self::DatabaseError(value)
    }
}

impl From<validator::ValidationErrors> for EventError {
    fn from(value: validator::ValidationErrors) -> Self {
        Self::ValidationError(value)
    }
}

use actix_web::{HttpResponse, ResponseError, http::StatusCode};
use thiserror::Error;

use crate::response::{ApiErrorItem, ApiResponse};

#[derive(Debug, Error)]
pub enum ApiError {
    #[error("Validation failed")]
    Validation(Vec<ApiErrorItem>),
    #[error("Unauthorized")]
    Unauthorized,
    #[error("Forbidden")]
    Forbidden,
    #[error("Resource not found")]
    NotFound,
    #[error("Conflict")]
    Conflict,
    #[error("Internal server error")]
    Internal,
}

impl ResponseError for ApiError {
    fn status_code(&self) -> StatusCode {
        match self {
            ApiError::Validation(_) => StatusCode::BAD_REQUEST,
            ApiError::Unauthorized => StatusCode::UNAUTHORIZED,
            ApiError::Forbidden => StatusCode::FORBIDDEN,
            ApiError::NotFound => StatusCode::NOT_FOUND,
            ApiError::Conflict => StatusCode::CONFLICT,
            ApiError::Internal => StatusCode::INTERNAL_SERVER_ERROR,
        }
    }

    fn error_response(&self) -> HttpResponse {
        let errors = match self {
            ApiError::Validation(items) => items.clone(),
            _ => vec![ApiErrorItem {
                field: None,
                message: self.to_string(),
            }],
        };

        HttpResponse::build(self.status_code())
            .json(ApiResponse::<()>::error(self.to_string(), errors))
    }
}

use serde::Serialize;

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PaginationMeta {
    pub page: u32,
    pub limit: u32,
    pub total: u64,
    pub total_pages: u64,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ApiErrorItem {
    pub field: Option<String>,
    pub message: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ApiResponse<T>
where
    T: Serialize,
{
    pub success: bool,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<T>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub meta: Option<PaginationMeta>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub errors: Option<Vec<ApiErrorItem>>,
}

impl<T> ApiResponse<T>
where
    T: Serialize,
{
    pub fn success(message: impl Into<String>, data: T) -> Self {
        Self {
            success: true,
            message: message.into(),
            data: Some(data),
            meta: None,
            errors: None,
        }
    }

    pub fn list(message: impl Into<String>, data: T, meta: PaginationMeta) -> Self {
        Self {
            success: true,
            message: message.into(),
            data: Some(data),
            meta: Some(meta),
            errors: None,
        }
    }

    pub fn error(message: impl Into<String>, errors: Vec<ApiErrorItem>) -> Self {
        Self {
            success: false,
            message: message.into(),
            data: None,
            meta: None,
            errors: Some(errors),
        }
    }
}

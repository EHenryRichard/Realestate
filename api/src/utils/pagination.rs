use serde::Deserialize;

use crate::response::PaginationMeta;

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PaginationQuery {
    pub page: Option<u32>,
    pub limit: Option<u32>,
    pub search: Option<String>,
    pub status: Option<String>,
    pub role: Option<String>,
    pub property_type: Option<String>,
    pub is_active: Option<bool>,
    pub is_visible: Option<bool>,
}

impl PaginationQuery {
    pub fn page(&self) -> u32 {
        self.page.unwrap_or(1).max(1)
    }

    pub fn limit(&self) -> u32 {
        self.limit.unwrap_or(20).clamp(1, 100)
    }

    pub fn offset(&self) -> i64 {
        ((self.page() - 1) * self.limit()) as i64
    }

    pub fn search_pattern(&self) -> Option<String> {
        self.search
            .as_deref()
            .map(str::trim)
            .filter(|value| !value.is_empty())
            .map(|value| format!("%{value}%"))
    }
}

pub fn make_pagination_meta(page: u32, limit: u32, total: u64) -> PaginationMeta {
    let safe_limit = limit.max(1) as u64;

    PaginationMeta {
        page,
        limit,
        total,
        total_pages: total.div_ceil(safe_limit),
    }
}

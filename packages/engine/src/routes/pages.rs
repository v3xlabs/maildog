use poem::web::Data;
use poem_openapi::{param::Path, payload::Json, Object, OpenApi};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

use crate::database::models::{NewPage, Page};
use crate::state::AppState;

#[derive(Debug, Serialize, Deserialize, Object)]
pub struct PagesApi;

/// API-friendly Page representation
#[derive(Debug, Serialize, Deserialize, Object)]
pub struct PageResponse {
    pub slug: String,
    pub user_id: String,
    pub name: String,
    pub category: Option<String>,
    pub page_type: String,
    pub config: String,
    pub position: i64,
    pub created_at: String,
    pub updated_at: String,
}

impl From<Page> for PageResponse {
    fn from(page: Page) -> Self {
        Self {
            slug: page.slug,
            user_id: page.user_id,
            name: page.name,
            category: page.category,
            page_type: page.page_type,
            config: page.config,
            position: page.position,
            created_at: page
                .created_at
                .format(&time::format_description::well_known::Rfc3339)
                .unwrap_or_else(|_| page.created_at.to_string()),
            updated_at: page
                .updated_at
                .format(&time::format_description::well_known::Rfc3339)
                .unwrap_or_else(|_| page.updated_at.to_string()),
        }
    }
}

/// Request to create a new page
#[derive(Debug, Serialize, Deserialize, Object)]
pub struct CreatePageRequest {
    pub user_id: String,
    pub name: String,
    pub slug: String,
    pub category: Option<String>,
    pub page_type: String,
    pub config: String,
    pub position: i64,
}

/// Request to update a page
#[derive(Debug, Serialize, Deserialize, Object)]
pub struct UpdatePageRequest {
    pub name: String,
    pub slug: String,
    pub category: Option<String>,
    pub page_type: String,
    pub config: String,
    pub position: i64,
}

/// Response containing a list of pages
#[derive(Debug, Serialize, Deserialize, Object)]
pub struct PageListResponse {
    pub pages: Vec<PageResponse>,
}

/// Response for successful page operations
#[derive(Debug, Serialize, Deserialize, Object)]
pub struct PageMessageResponse {
    pub message: String,
}

#[OpenApi]
impl PagesApi {
    /// Get all pages for a user
    #[oai(path = "/pages/:user_id", method = "get")]
    async fn get_pages(
        &self,
        Data(app_state): Data<&Arc<AppState>>,
        user_id: Path<String>,
    ) -> poem::Result<Json<PageListResponse>> {
        let pages = Page::get_all_for_user(&app_state.db_pool, &user_id)
            .await
            .map_err(|e| poem::Error::from_string(e.to_string(), poem::http::StatusCode::INTERNAL_SERVER_ERROR))?;

        Ok(Json(PageListResponse {
            pages: pages.into_iter().map(PageResponse::from).collect(),
        }))
    }

    /// Get a single page by slug
    #[oai(path = "/pages/detail/:slug", method = "get")]
    async fn get_page(
        &self,
        Data(app_state): Data<&Arc<AppState>>,
        slug: Path<String>,
    ) -> poem::Result<Json<PageResponse>> {
        let page = Page::get_by_slug_id(&app_state.db_pool, &slug)
            .await
            .map_err(|e| poem::Error::from_string(e.to_string(), poem::http::StatusCode::INTERNAL_SERVER_ERROR))?
            .ok_or_else(|| poem::Error::from_string("Page not found", poem::http::StatusCode::NOT_FOUND))?;

        Ok(Json(PageResponse::from(page)))
    }

    /// Get a single page by slug
    #[oai(path = "/pages/:user_id/:slug", method = "get")]
    async fn get_page_by_slug(
        &self,
        Data(app_state): Data<&Arc<AppState>>,
        user_id: Path<String>,
        slug: Path<String>,
    ) -> poem::Result<Json<PageResponse>> {
        let page = Page::get_by_slug(&app_state.db_pool, &user_id, &slug)
            .await
            .map_err(|e| poem::Error::from_string(e.to_string(), poem::http::StatusCode::INTERNAL_SERVER_ERROR))?
            .ok_or_else(|| poem::Error::from_string("Page not found", poem::http::StatusCode::NOT_FOUND))?;

        Ok(Json(PageResponse::from(page)))
    }

    /// Create a new page
    #[oai(path = "/pages", method = "post")]
    async fn create_page(
        &self,
        Data(app_state): Data<&Arc<AppState>>,
        Json(req): Json<CreatePageRequest>,
    ) -> poem::Result<Json<PageResponse>> {
        let new_page = NewPage {
            slug: req.slug,
            user_id: req.user_id,
            name: req.name,
            category: req.category,
            page_type: req.page_type,
            config: req.config,
            position: req.position,
        };

        let page = Page::insert(&app_state.db_pool, new_page)
            .await
            .map_err(|e| poem::Error::from_string(e.to_string(), poem::http::StatusCode::INTERNAL_SERVER_ERROR))?;

        Ok(Json(PageResponse::from(page)))
    }

    /// Update an existing page
    #[oai(path = "/pages/:slug", method = "put")]
    async fn update_page(
        &self,
        Data(app_state): Data<&Arc<AppState>>,
        slug: Path<String>,
        Json(req): Json<UpdatePageRequest>,
    ) -> poem::Result<Json<PageResponse>> {
        let page = Page::update(
            &app_state.db_pool,
            &slug,
            req.name,
            req.slug,
            req.category,
            req.page_type,
            req.config,
            req.position,
        )
        .await
        .map_err(|e| poem::Error::from_string(e.to_string(), poem::http::StatusCode::INTERNAL_SERVER_ERROR))?;

        Ok(Json(PageResponse::from(page)))
    }

    /// Delete a page
    #[oai(path = "/pages/:slug", method = "delete")]
    async fn delete_page(
        &self,
        Data(app_state): Data<&Arc<AppState>>,
        slug: Path<String>,
    ) -> poem::Result<Json<PageMessageResponse>> {
        Page::delete(&app_state.db_pool, &slug)
            .await
            .map_err(|e| poem::Error::from_string(e.to_string(), poem::http::StatusCode::INTERNAL_SERVER_ERROR))?;

        Ok(Json(PageMessageResponse {
            message: "Page deleted successfully".to_string(),
        }))
    }
}

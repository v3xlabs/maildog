use poem::web::Data;
use poem_openapi::{param::Path, payload::Json, Object, OpenApi};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

use crate::database::models::ImapConfig;
use crate::state::AppState;

#[derive(Debug, Serialize, Deserialize, Object)]
pub struct ImapConfigApi;

/// API-friendly IMAP config representation (without encrypted password)
#[derive(Debug, Serialize, Deserialize, Object)]
pub struct ImapConfigResponse {
    pub id: i64,
    pub name: String,
    pub mail_host: String,
    pub mail_port: i64,
    pub username: String,
    pub use_tls: bool,
    pub created_at: String,
    pub updated_at: String,
}

impl From<ImapConfig> for ImapConfigResponse {
    fn from(config: ImapConfig) -> Self {
        Self {
            id: config.id,
            name: config.name,
            mail_host: config.mail_host,
            mail_port: config.mail_port,
            username: config.username,
            use_tls: config.use_tls,
            created_at: config
                .created_at
                .format(&time::format_description::well_known::Rfc3339)
                .unwrap_or_else(|_| config.created_at.to_string()),
            updated_at: config
                .updated_at
                .format(&time::format_description::well_known::Rfc3339)
                .unwrap_or_else(|_| config.updated_at.to_string()),
        }
    }
}

/// Request to create a new IMAP configuration
#[derive(Debug, Serialize, Deserialize, Object)]
pub struct CreateImapConfigRequest {
    pub name: String,
    pub mail_host: String,
    pub mail_port: u16,
    pub username: String,
    pub password: String,
    #[oai(default = "default_use_tls")]
    pub use_tls: bool,
}

fn default_use_tls() -> bool {
    true
}

/// Request to update an existing IMAP configuration
#[derive(Debug, Serialize, Deserialize, Object)]
pub struct UpdateImapConfigRequest {
    #[oai(skip_serializing_if_is_none)]
    pub name: Option<String>,
    #[oai(skip_serializing_if_is_none)]
    pub mail_host: Option<String>,
    #[oai(skip_serializing_if_is_none)]
    pub mail_port: Option<u16>,
    #[oai(skip_serializing_if_is_none)]
    pub username: Option<String>,
    #[oai(skip_serializing_if_is_none)]
    pub password: Option<String>,
    #[oai(skip_serializing_if_is_none)]
    pub use_tls: Option<bool>,
}

/// Response containing a single IMAP config
#[derive(Debug, Serialize, Deserialize, Object)]
pub struct ImapConfigDetailResponse {
    pub config: ImapConfigResponse,
}

/// Response containing a list of IMAP configs
#[derive(Debug, Serialize, Deserialize, Object)]
pub struct ImapConfigListResponse {
    pub configs: Vec<ImapConfigResponse>,
}

/// Generic error response
#[derive(Debug, Serialize, Deserialize, Object)]
pub struct ErrorResponse {
    pub error: String,
}

/// Success message response
#[derive(Debug, Serialize, Deserialize, Object)]
pub struct SuccessResponse {
    pub message: String,
}

#[OpenApi]
impl ImapConfigApi {
    /// List all IMAP configurations
    #[oai(path = "/imap-configs", method = "get", tag = "super::ApiTags::Email")]
    async fn list_imap_configs(
        &self,
        state: Data<&Arc<AppState>>,
    ) -> poem::Result<Json<ImapConfigListResponse>> {
        let configs = ImapConfig::get_all(&state.db_pool).await.map_err(|e| {
            poem::Error::from_string(
                format!("Failed to fetch IMAP configs: {}", e),
                poem::http::StatusCode::INTERNAL_SERVER_ERROR,
            )
        })?;

        let response = ImapConfigListResponse {
            configs: configs.into_iter().map(ImapConfigResponse::from).collect(),
        };

        Ok(Json(response))
    }

    /// Create a new IMAP configuration
    #[oai(path = "/imap-configs", method = "post", tag = "super::ApiTags::Email")]
    async fn create_imap_config(
        &self,
        state: Data<&Arc<AppState>>,
        request: Json<CreateImapConfigRequest>,
    ) -> poem::Result<Json<ImapConfigDetailResponse>> {
        let passphrase = state.keyring.get_passphrase();

        let config_id = ImapConfig::save(
            &state.db_pool,
            request.name.clone(),
            request.mail_host.clone(),
            request.mail_port,
            request.username.clone(),
            request.password.clone(),
            request.use_tls,
            &passphrase,
        )
        .await
        .map_err(|e| {
            if let sqlx::Error::Database(db_err) = &e {
                if db_err.message().contains("UNIQUE constraint failed") {
                    return poem::Error::from_string(
                        format!("IMAP config with name '{}' already exists", request.name),
                        poem::http::StatusCode::CONFLICT,
                    );
                }
            }
            poem::Error::from_string(
                format!("Failed to create IMAP config: {}", e),
                poem::http::StatusCode::INTERNAL_SERVER_ERROR,
            )
        })?;

        // Fetch the created config
        let config = sqlx::query_as!(
            ImapConfig,
            r#"SELECT 
                id as "id!",
                name as "name!",
                mail_host as "mail_host!",
                mail_port as "mail_port!",
                username as "username!",
                password_encrypted as "password_encrypted!",
                use_tls as "use_tls!",
                created_at as "created_at!",
                updated_at as "updated_at!"
            FROM imap_config WHERE id = ?"#,
            config_id
        )
        .fetch_one(&state.db_pool)
        .await
        .map_err(|e| {
            poem::Error::from_string(
                format!("Failed to fetch created IMAP config: {}", e),
                poem::http::StatusCode::INTERNAL_SERVER_ERROR,
            )
        })?;

        let response = ImapConfigDetailResponse {
            config: ImapConfigResponse::from(config),
        };

        // Trigger immediate email ingestion for the new config
        if let Err(e) = state.ingestion_trigger.send(()) {
            tracing::warn!("Failed to trigger email ingestion: {}", e);
        } else {
            tracing::info!("Triggered immediate email ingestion for new config");
        }

        Ok(Json(response))
    }

    /// Update an existing IMAP configuration
    #[oai(
        path = "/imap-configs/:id",
        method = "put",
        tag = "super::ApiTags::Email"
    )]
    async fn update_imap_config(
        &self,
        state: Data<&Arc<AppState>>,
        id: Path<i64>,
        request: Json<UpdateImapConfigRequest>,
    ) -> poem::Result<Json<ImapConfigDetailResponse>> {
        // First, check if the config exists
        let existing_config = sqlx::query_as!(
            ImapConfig,
            r#"SELECT 
                id as "id!",
                name as "name!",
                mail_host as "mail_host!",
                mail_port as "mail_port!",
                username as "username!",
                password_encrypted as "password_encrypted!",
                use_tls as "use_tls!",
                created_at as "created_at!",
                updated_at as "updated_at!"
            FROM imap_config WHERE id = ?"#,
            id.0
        )
        .fetch_optional(&state.db_pool)
        .await
        .map_err(|e| {
            poem::Error::from_string(
                format!("Failed to fetch IMAP config: {}", e),
                poem::http::StatusCode::INTERNAL_SERVER_ERROR,
            )
        })?
        .ok_or_else(|| {
            poem::Error::from_string("IMAP config not found", poem::http::StatusCode::NOT_FOUND)
        })?;

        // Prepare the updated values
        let name = request.name.clone().unwrap_or(existing_config.name);
        let mail_host = request
            .mail_host
            .clone()
            .unwrap_or(existing_config.mail_host);
        let mail_port = request
            .mail_port
            .map(|p| p as i64)
            .unwrap_or(existing_config.mail_port);
        let username = request.username.clone().unwrap_or(existing_config.username);
        let use_tls = request.use_tls.unwrap_or(existing_config.use_tls);

        // Handle password encryption if provided
        let password_encrypted = if let Some(new_password) = &request.password {
            ImapConfig::encrypt_password(new_password, &state.keyring.get_passphrase())
        } else {
            existing_config.password_encrypted
        };

        // Update the config
        sqlx::query!(
            r#"
            UPDATE imap_config 
            SET name = ?,
                mail_host = ?,
                mail_port = ?,
                username = ?,
                password_encrypted = ?,
                use_tls = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            "#,
            name,
            mail_host,
            mail_port,
            username,
            password_encrypted,
            use_tls,
            id.0
        )
        .execute(&state.db_pool)
        .await
        .map_err(|e| {
            if let sqlx::Error::Database(db_err) = &e {
                if db_err.message().contains("UNIQUE constraint failed") {
                    return poem::Error::from_string(
                        format!("IMAP config with name '{}' already exists", name),
                        poem::http::StatusCode::CONFLICT,
                    );
                }
            }
            poem::Error::from_string(
                format!("Failed to update IMAP config: {}", e),
                poem::http::StatusCode::INTERNAL_SERVER_ERROR,
            )
        })?;

        // Fetch the updated config
        let config = sqlx::query_as!(
            ImapConfig,
            r#"SELECT 
                id as "id!",
                name as "name!",
                mail_host as "mail_host!",
                mail_port as "mail_port!",
                username as "username!",
                password_encrypted as "password_encrypted!",
                use_tls as "use_tls!",
                created_at as "created_at!",
                updated_at as "updated_at!"
            FROM imap_config WHERE id = ?"#,
            id.0
        )
        .fetch_one(&state.db_pool)
        .await
        .map_err(|e| {
            poem::Error::from_string(
                format!("Failed to fetch updated IMAP config: {}", e),
                poem::http::StatusCode::INTERNAL_SERVER_ERROR,
            )
        })?;

        let response = ImapConfigDetailResponse {
            config: ImapConfigResponse::from(config),
        };

        Ok(Json(response))
    }

    /// Delete an IMAP configuration
    #[oai(
        path = "/imap-configs/:id",
        method = "delete",
        tag = "super::ApiTags::Email"
    )]
    async fn delete_imap_config(
        &self,
        state: Data<&Arc<AppState>>,
        id: Path<i64>,
    ) -> poem::Result<Json<SuccessResponse>> {
        // Check if the config exists
        let exists = sqlx::query!("SELECT id FROM imap_config WHERE id = ?", id.0)
            .fetch_optional(&state.db_pool)
            .await
            .map_err(|e| {
                poem::Error::from_string(
                    format!("Failed to check IMAP config: {}", e),
                    poem::http::StatusCode::INTERNAL_SERVER_ERROR,
                )
            })?;

        if exists.is_none() {
            return Err(poem::Error::from_string(
                "IMAP config not found",
                poem::http::StatusCode::NOT_FOUND,
            ));
        }

        // Delete the config
        ImapConfig::delete(&state.db_pool, id.0)
            .await
            .map_err(|e| {
                poem::Error::from_string(
                    format!("Failed to delete IMAP config: {}", e),
                    poem::http::StatusCode::INTERNAL_SERVER_ERROR,
                )
            })?;

        Ok(Json(SuccessResponse {
            message: format!("IMAP config with ID {} deleted successfully", id.0),
        }))
    }
}

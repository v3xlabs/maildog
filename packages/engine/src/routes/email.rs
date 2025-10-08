use poem::web::Data;
use poem_openapi::{param::Path, param::Query, payload::Json, Object, OpenApi};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use std::sync::Arc;
use time::OffsetDateTime;

use crate::database::models::Email;
use crate::state::AppState;

#[derive(Debug, Serialize, Deserialize, Object)]
pub struct EmailApi;

/// Simplified email for list view
#[derive(Debug, Clone, FromRow, Serialize, Deserialize, Object)]
pub struct EmailListItem {
    pub imap_uid: i64,
    pub subject: Option<String>,
    pub from_address: Option<String>,
    pub to_address: Option<String>,
    pub created_at: String,
    pub imap_config_id: Option<i64>,
}

/// API-friendly email representation with RFC3339 datetime strings
#[derive(Debug, Serialize, Deserialize, Object)]
pub struct EmailResponse {
    pub imap_uid: i64,
    pub message_id: Option<String>,
    pub subject: Option<String>,
    pub from_address: Option<String>,
    pub to_address: Option<String>,
    pub cc_address: Option<String>,
    pub bcc_address: Option<String>,
    pub reply_to: Option<String>,
    pub date_sent: Option<String>,
    pub date_maildog_fetched: String,
    pub body_text: Option<String>,
    pub body_html: Option<String>,
    pub raw_message: Option<String>,
    pub flags: Option<String>,
    pub size_bytes: Option<i64>,
    pub has_attachments: Option<bool>,
    pub folder_name: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    pub imap_config_id: Option<i64>,
}

impl From<Email> for EmailResponse {
    fn from(email: Email) -> Self {
        Self {
            imap_uid: email.imap_uid,
            message_id: email.message_id,
            subject: email.subject,
            from_address: email.from_address,
            to_address: email.to_address,
            cc_address: email.cc_address,
            bcc_address: email.bcc_address,
            reply_to: email.reply_to,
            date_sent: email.date_sent.map(|d| d.format(&time::format_description::well_known::Rfc3339)
                .unwrap_or_else(|_| d.to_string())),
            date_maildog_fetched: email.date_maildog_fetched.format(&time::format_description::well_known::Rfc3339)
                .unwrap_or_else(|_| email.date_maildog_fetched.to_string()),
            body_text: email.body_text,
            body_html: email.body_html,
            raw_message: email.raw_message.and_then(|bytes| String::from_utf8(bytes).ok()),
            flags: email.flags,
            size_bytes: email.size_bytes,
            has_attachments: email.has_attachments,
            folder_name: email.folder_name,
            created_at: email.created_at.format(&time::format_description::well_known::Rfc3339)
                .unwrap_or_else(|_| email.created_at.to_string()),
            updated_at: email.updated_at.format(&time::format_description::well_known::Rfc3339)
                .unwrap_or_else(|_| email.updated_at.to_string()),
            imap_config_id: email.imap_config_id,
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Object)]
pub struct EmailsListResponse {
    pub emails: Vec<EmailListItem>,
    pub total: i64,
    pub page: i64,
    pub page_size: i64,
}

#[derive(Debug, Serialize, Deserialize, Object)]
pub struct EmailDetailResponse {
    pub email: EmailResponse,
}

#[OpenApi]
impl EmailApi {
    /// List all emails with pagination
    #[oai(path = "/emails", method = "get", tag = "super::ApiTags::Email")]
    async fn list_emails(
        &self,
        state: Data<&Arc<AppState>>,
        imap_config_id: Query<i64>,
        page: Query<Option<i64>>,
    ) -> poem::Result<Json<EmailsListResponse>> {
        let page = page.0.unwrap_or(1).max(1);
        let page_size = 50;
        let offset = (page - 1) * page_size;

        let total = sqlx::query_scalar!(
            "SELECT COUNT(*) as count FROM emails WHERE imap_config_id = ?",
            imap_config_id.0
        )
        .fetch_one(&state.db_pool)
        .await
        .map_err(|e| {
            tracing::error!("Failed to count emails: {:?}", e);
            poem::Error::from_string(
                "Failed to fetch emails count",
                poem::http::StatusCode::INTERNAL_SERVER_ERROR,
            )
        })?;

        // Query only the fields needed for the list view
        let emails = sqlx::query!(
            r#"
            SELECT 
                imap_uid, subject, from_address, to_address, 
                date_sent as "date_sent: OffsetDateTime", 
                imap_config_id
            FROM emails
            WHERE imap_config_id = ?
            ORDER BY COALESCE(date_sent, date_maildog_fetched) DESC
            LIMIT ? OFFSET ?
            "#,
            imap_config_id.0,
            page_size,
            offset
        )
        .fetch_all(&state.db_pool)
        .await
        .map_err(|e| {
            tracing::error!("Failed to fetch emails: {:?}", e);
            poem::Error::from_string(
                "Failed to fetch emails",
                poem::http::StatusCode::INTERNAL_SERVER_ERROR,
            )
        })?;

        let email_list: Vec<EmailListItem> = emails
            .into_iter()
            .map(|row| EmailListItem {
                imap_uid: row.imap_uid,
                subject: row.subject,
                from_address: row.from_address,
                to_address: row.to_address,
                created_at: row.date_sent
                    .map(|dt| dt.format(&time::format_description::well_known::Rfc3339)
                        .unwrap_or_else(|_| dt.to_string()))
                    .unwrap_or_default(),
                imap_config_id: row.imap_config_id,
            })
            .collect();

        Ok(Json(EmailsListResponse {
            emails: email_list,
            total,
            page,
            page_size,
        }))
    }

    /// Get a specific email by IMAP UID
    #[oai(
        path = "/emails/:imap_uid",
        method = "get",
        tag = "super::ApiTags::Email"
    )]
    async fn get_email(
        &self,
        state: Data<&Arc<AppState>>,
        /// IMAP UID of the email
        imap_uid: Path<i64>,
        /// IMAP config ID to filter emails
        imap_config_id: Query<i64>,
    ) -> poem::Result<Json<EmailDetailResponse>> {
        let email = sqlx::query_as::<_, Email>(
            r#"
            SELECT 
                id, imap_uid, message_id, subject, from_address, to_address, cc_address, bcc_address,
                reply_to, date_sent, date_maildog_fetched, body_text, body_html, raw_message,
                flags, size_bytes, has_attachments, folder_name, created_at, updated_at, imap_config_id
            FROM emails
            WHERE imap_uid = ? AND imap_config_id = ?
            "#
        )
        .bind(imap_uid.0)
        .bind(imap_config_id.0)
        .fetch_optional(&state.db_pool)
        .await
        .map_err(|e| {
            tracing::error!("Failed to fetch email: {:?}", e);
            poem::Error::from_string(
                "Failed to fetch email",
                poem::http::StatusCode::INTERNAL_SERVER_ERROR,
            )
        })?
        .ok_or_else(|| {
            poem::Error::from_string("Email not found", poem::http::StatusCode::NOT_FOUND)
        })?;

        Ok(Json(EmailDetailResponse {
            email: email.into(),
        }))
    }
}

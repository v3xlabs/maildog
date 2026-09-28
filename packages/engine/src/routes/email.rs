use poem::web::Data;
use poem_openapi::{param::Path, param::Query, payload::Json, Object, OpenApi};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

use crate::database::models::Email;
use crate::state::AppState;

#[derive(Debug, Serialize, Deserialize, Object)]
pub struct EmailApi;

/// Simplified email for list view
#[derive(Debug, Clone, Serialize, Deserialize, Object)]
pub struct EmailListItem {
    pub imap_uid: i64,
    pub subject: Option<String>,
    pub from_address: Option<String>,
    pub to_address: Option<String>,
    pub created_at: String,
    pub imap_config_id: i64,
    pub labels: Vec<String>,
    pub priority: Option<i64>,
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
    pub imap_config_id: i64,
    pub labels: Vec<String>,
    pub priority: Option<i64>,
}

impl From<Email> for EmailResponse {
    fn from(email: Email) -> Self {
        // Parse labels from JSON string to Vec<String>
        let labels = email
            .labels
            .as_ref()
            .and_then(|json_str| serde_json::from_str::<Vec<String>>(json_str).ok())
            .unwrap_or_default();

        Self {
            imap_uid: email.imap_uid,
            message_id: email.message_id,
            subject: email.subject,
            from_address: email.from_address,
            to_address: email.to_address,
            cc_address: email.cc_address,
            bcc_address: email.bcc_address,
            reply_to: email.reply_to,
            date_sent: email.date_sent.map(|d| {
                d.format(&time::format_description::well_known::Rfc3339)
                    .unwrap_or_else(|_| d.to_string())
            }),
            date_maildog_fetched: email
                .date_maildog_fetched
                .format(&time::format_description::well_known::Rfc3339)
                .unwrap_or_else(|_| email.date_maildog_fetched.to_string()),
            body_text: email.body_text,
            body_html: email.body_html,
            raw_message: email
                .raw_message
                .and_then(|bytes| String::from_utf8(bytes).ok()),
            flags: email.flags,
            size_bytes: email.size_bytes,
            has_attachments: email.has_attachments,
            folder_name: email.folder_name,
            created_at: email
                .created_at
                .format(&time::format_description::well_known::Rfc3339)
                .unwrap_or_else(|_| email.created_at.to_string()),
            updated_at: email
                .updated_at
                .format(&time::format_description::well_known::Rfc3339)
                .unwrap_or_else(|_| email.updated_at.to_string()),
            imap_config_id: email.imap_config_id,
            labels,
            priority: email.priority,
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

/// Response for email reindexing operation
#[derive(Debug, Serialize, Deserialize, Object)]
pub struct ReindexResponse {
    pub message: String,
    pub total_emails: i64,
    pub processed_emails: i64,
    pub failed_emails: i64,
    pub cleared_emails: i64,
}

#[OpenApi]
impl EmailApi {
    /// List all emails with pagination
    #[oai(path = "/emails", method = "get", tag = "super::ApiTags::Email")]
    async fn list_emails(
        &self,
        state: Data<&Arc<AppState>>,
        imap_config_id: Query<Option<i64>>,
        page: Query<Option<i64>>,
        labels: Query<Option<String>>,
    ) -> poem::Result<Json<EmailsListResponse>> {
        let page = page.0.unwrap_or(1).max(1);
        let page_size = 50;
        let offset = (page - 1) * page_size;

        // Parse labels from comma-separated string
        let filter_labels: Vec<String> = labels
            .0
            .as_ref()
            .map(|s| {
                s.split(',')
                    .map(|label| label.trim().to_string())
                    .filter(|label| !label.is_empty())
                    .collect()
            })
            .unwrap_or_default();

        // Build the WHERE clause based on imap_config_id and labels
        let has_config_filter = imap_config_id.0.is_some();
        let has_label_filter = !filter_labels.is_empty();

        let (count_query, select_query) = match (has_config_filter, has_label_filter) {
            (false, false) => {
                // No filters - get all emails
                (
                    "SELECT COUNT(*) as count FROM emails".to_string(),
                    r#"
                    SELECT 
                        imap_uid, subject, from_address, to_address, 
                        date_sent, 
                        imap_config_id,
                        labels, priority
                    FROM emails
                    ORDER BY COALESCE(date_sent, date_maildog_fetched) DESC
                    LIMIT ? OFFSET ?
                    "#.to_string(),
                )
            }
            (true, false) => {
                // Only imap_config_id filter
                (
                    "SELECT COUNT(*) as count FROM emails WHERE imap_config_id = ?".to_string(),
                    r#"
                    SELECT 
                        imap_uid, subject, from_address, to_address, 
                        date_sent, 
                        imap_config_id,
                        labels, priority
                    FROM emails
                    WHERE imap_config_id = ?
                    ORDER BY COALESCE(date_sent, date_maildog_fetched) DESC
                    LIMIT ? OFFSET ?
                    "#.to_string(),
                )
            }
            (false, true) => {
                // Only label filter
                let label_conditions: Vec<String> = filter_labels
                    .iter()
                    .map(|_| "labels LIKE ?".to_string())
                    .collect();
                let label_where = label_conditions.join(" OR ");

                (
                    format!(
                        "SELECT COUNT(*) as count FROM emails WHERE ({})",
                        label_where
                    ),
                    format!(
                        r#"
                        SELECT 
                            imap_uid, subject, from_address, to_address, 
                            date_sent, 
                            imap_config_id,
                            labels, priority
                        FROM emails
                        WHERE ({})
                        ORDER BY COALESCE(date_sent, date_maildog_fetched) DESC
                        LIMIT ? OFFSET ?
                        "#,
                        label_where
                    ),
                )
            }
            (true, true) => {
                // Both filters
                let label_conditions: Vec<String> = filter_labels
                    .iter()
                    .map(|_| "labels LIKE ?".to_string())
                    .collect();
                let label_where = label_conditions.join(" OR ");

                (
                    format!(
                        "SELECT COUNT(*) as count FROM emails WHERE imap_config_id = ? AND ({})",
                        label_where
                    ),
                    format!(
                        r#"
                        SELECT 
                            imap_uid, subject, from_address, to_address, 
                            date_sent, 
                            imap_config_id,
                            labels, priority
                        FROM emails
                        WHERE imap_config_id = ? AND ({})
                        ORDER BY COALESCE(date_sent, date_maildog_fetched) DESC
                        LIMIT ? OFFSET ?
                        "#,
                        label_where
                    ),
                )
            }
        };

        // Execute count query
        let mut count_query_builder = sqlx::query_scalar::<_, i64>(&count_query);
        
        if let Some(config_id) = imap_config_id.0 {
            count_query_builder = count_query_builder.bind(config_id);
        }

        for label in &filter_labels {
            // Use JSON array search pattern for SQLite
            // Match pattern like ["label"] or ["label","other"] or ["other","label"]
            let pattern = format!("%\"{}\"%", label);
            count_query_builder = count_query_builder.bind(pattern);
        }

        let total = count_query_builder
            .fetch_one(&state.db_pool)
            .await
            .map_err(|e| {
                tracing::error!("Failed to count emails: {:?}", e);
                poem::Error::from_string(
                    "Failed to fetch emails count",
                    poem::http::StatusCode::INTERNAL_SERVER_ERROR,
                )
            })?;

        // Execute select query
        let mut select_query_builder = sqlx::query(&select_query);
        
        if let Some(config_id) = imap_config_id.0 {
            select_query_builder = select_query_builder.bind(config_id);
        }

        for label in &filter_labels {
            // Use JSON array search pattern for SQLite
            // Match pattern like ["label"] or ["label","other"] or ["other","label"]
            let pattern = format!("%\"{}\"%", label);
            select_query_builder = select_query_builder.bind(pattern);
        }

        select_query_builder = select_query_builder.bind(page_size).bind(offset);

        let emails = select_query_builder
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
            .map(|row| {
                use sqlx::Row;
                
                // Parse labels from JSON string to Vec<String>
                let labels: Vec<String> = row
                    .try_get::<Option<String>, _>("labels")
                    .ok()
                    .flatten()
                    .and_then(|json_str| serde_json::from_str::<Vec<String>>(&json_str).ok())
                    .unwrap_or_default();

                let date_sent = row
                    .try_get::<Option<time::OffsetDateTime>, _>("date_sent")
                    .ok()
                    .flatten();

                EmailListItem {
                    imap_uid: row.try_get("imap_uid").unwrap_or(0),
                    subject: row.try_get("subject").ok().flatten(),
                    from_address: row.try_get("from_address").ok().flatten(),
                    to_address: row.try_get("to_address").ok().flatten(),
                    created_at: date_sent
                        .map(|dt| {
                            dt.format(&time::format_description::well_known::Rfc3339)
                                .unwrap_or_else(|_| dt.to_string())
                        })
                        .unwrap_or_default(),
                    imap_config_id: row.try_get("imap_config_id").unwrap_or(0),
                    labels,
                    priority: row.try_get("priority").ok().flatten(),
                }
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
                flags, size_bytes, has_attachments, folder_name, created_at, updated_at, imap_config_id,
                labels, priority
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

    /// Reindex all emails by reapplying rules and categories
    #[oai(
        path = "/emails/reindex",
        method = "post",
        tag = "super::ApiTags::Email"
    )]
    async fn reindex_emails(
        &self,
        state: Data<&Arc<AppState>>,
        /// Optional IMAP config ID to reindex only specific account emails
        imap_config_id: Query<Option<i64>>,
    ) -> poem::Result<Json<ReindexResponse>> {
        use crate::rules::apply::categorize_email;

        // Clear existing categories, labels, and reset priority for emails to be reindexed
        let clear_query = if let Some(config_id) = imap_config_id.0 {
            sqlx::query(
                "UPDATE emails SET category = NULL, labels = NULL, priority = 5 WHERE imap_config_id = ?"
            )
            .bind(config_id)
        } else {
            sqlx::query("UPDATE emails SET category = NULL, labels = NULL, priority = 5")
        };

        let cleared_count = clear_query
            .execute(&state.db_pool)
            .await
            .map_err(|e| {
                tracing::error!("Failed to clear email categories: {:?}", e);
                poem::Error::from_string(
                    "Failed to clear email categories",
                    poem::http::StatusCode::INTERNAL_SERVER_ERROR,
                )
            })?
            .rows_affected();

        // Get all email UIDs to reprocess
        let email_ids: Vec<(i64, i64)> = sqlx::query_as(
            "SELECT imap_uid, imap_config_id FROM emails
             WHERE (? IS NULL OR imap_config_id = ?)",
        )
        .bind(imap_config_id.0)
        .bind(imap_config_id.0)
        .fetch_all(&state.db_pool)
        .await
        .map_err(|e| {
            tracing::error!("Failed to fetch email IDs: {:?}", e);
            poem::Error::from_string(
                "Failed to fetch email IDs",
                poem::http::StatusCode::INTERNAL_SERVER_ERROR,
            )
        })?;

        let total_emails = email_ids.len();
        let mut processed_count = 0;
        let mut failed_count = 0;
        let batch_size = 100;
        for batch in email_ids.chunks(batch_size) {
            for &(email_uid, config_id) in batch {
                match categorize_email(&state.db_pool, email_uid, config_id).await {
                    Ok(_) => processed_count += 1,
                    Err(e) => {
                        tracing::warn!("Failed to reindex email {} for config {}: {:?}", email_uid, config_id, e);
                        failed_count += 1;
                    }
                }
            }

            tokio::time::sleep(tokio::time::Duration::from_millis(10)).await;
        }

        tracing::info!(
            "Email reindexing completed: {} total, {} processed, {} failed, {} cleared",
            total_emails, processed_count, failed_count, cleared_count
        );

        Ok(Json(ReindexResponse {
            message: "Email reindexing completed".to_string(),
            total_emails: total_emails as i64,
            processed_emails: processed_count,
            failed_emails: failed_count,
            cleared_emails: cleared_count as i64,
        }))
    }
}

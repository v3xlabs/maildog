use crate::rules::types::Action;
use anyhow::Result;
use sqlx::SqlitePool;
use std::collections::{HashMap, HashSet};

/// Apply a list of actions to an email
pub async fn apply_actions(
    pool: &SqlitePool,
    imap_uid: i64,
    imap_config_id: i64,
    actions: Vec<Action>,
) -> Result<()> {
    let mut labels = HashSet::new();
    let mut priority = None;

    let existing_labels: Option<String> =
        sqlx::query_scalar("SELECT labels FROM emails WHERE imap_uid = ? AND imap_config_id = ?")
            .bind(imap_uid)
            .bind(imap_config_id)
            .fetch_optional(pool)
            .await?
            .flatten();

    if let Some(existing) = existing_labels {
        if let Ok(parsed) = serde_json::from_str::<Vec<String>>(&existing) {
            labels.extend(parsed);
        }
    }

    for action in actions {
        match action {
            Action::AddLabel(label) => {
                labels.insert(label);
            }
            Action::SetPriority(value) => {
                priority = Some(value);
            }
        }
    }

    let mut tx = pool.begin().await?;
    if !labels.is_empty() {
        let labels_json = serde_json::to_string(&labels.into_iter().collect::<Vec<_>>())?;
        sqlx::query(
            "UPDATE emails SET labels = ?, updated_at = CURRENT_TIMESTAMP
             WHERE imap_uid = ? AND imap_config_id = ?",
        )
        .bind(labels_json)
        .bind(imap_uid)
        .bind(imap_config_id)
        .execute(&mut *tx)
        .await?;
    }

    if let Some(value) = priority {
        sqlx::query(
            "UPDATE emails SET priority = ?, updated_at = CURRENT_TIMESTAMP
             WHERE imap_uid = ? AND imap_config_id = ?",
        )
        .bind(i64::from(value))
        .bind(imap_uid)
        .bind(imap_config_id)
        .execute(&mut *tx)
        .await?;
    }

    tx.commit().await?;
    Ok(())
}

fn insert_raw_headers(headers: &mut HashMap<String, String>, raw_message: &[u8]) {
    let raw_headers = String::from_utf8_lossy(raw_message);
    let header_section = raw_headers
        .split_once("\r\n\r\n")
        .or_else(|| raw_headers.split_once("\n\n"))
        .map_or(raw_headers.as_ref(), |(section, _)| section);

    let mut current_name = None;
    let mut current_value = String::new();
    let mut insert_current = |name: Option<String>, value: &mut String| {
        if let Some(name) = name {
            headers
                .entry(name)
                .and_modify(|existing| {
                    existing.push_str(", ");
                    existing.push_str(value.trim());
                })
                .or_insert_with(|| value.trim().to_string());
        }
        value.clear();
    };

    for line in header_section.lines() {
        if line.starts_with(' ') || line.starts_with('\t') {
            current_value.push(' ');
            current_value.push_str(line.trim());
            continue;
        }

        insert_current(current_name.take(), &mut current_value);
        if let Some((name, value)) = line.split_once(':') {
            current_name = Some(name.trim().to_ascii_lowercase());
            current_value.push_str(value.trim());
        }
    }
    insert_current(current_name, &mut current_value);
}

/// Categorize one email within its owning IMAP configuration.
pub async fn categorize_email(
    pool: &SqlitePool,
    imap_uid: i64,
    imap_config_id: i64,
) -> Result<Vec<Action>> {
    use crate::rules::RuleEngine;

    let row = sqlx::query!(
        "SELECT from_address, to_address, subject, cc_address, bcc_address, reply_to, message_id, raw_message
         FROM emails WHERE imap_uid = ? AND imap_config_id = ?",
        imap_uid,
        imap_config_id,
    )
    .fetch_one(pool)
    .await?;

    let mut headers = HashMap::new();
    if let Some(from) = row.from_address {
        headers.insert("from".to_string(), from);
    }
    if let Some(to) = row.to_address {
        headers.insert("to".to_string(), to);
    }
    if let Some(subject) = row.subject {
        headers.insert("subject".to_string(), subject);
    }
    if let Some(cc) = row.cc_address {
        headers.insert("cc".to_string(), cc);
    }
    if let Some(bcc) = row.bcc_address {
        headers.insert("bcc".to_string(), bcc);
    }
    if let Some(reply_to) = row.reply_to {
        headers.insert("reply-to".to_string(), reply_to);
    }
    if let Some(message_id) = row.message_id {
        headers.insert("message-id".to_string(), message_id);
    }
    if let Some(raw_message) = row.raw_message {
        insert_raw_headers(&mut headers, &raw_message);
    }

    let mut engine = RuleEngine::from_db(pool).await?;
    let actions = engine.evaluate(&headers);
    if !actions.is_empty() {
        apply_actions(pool, imap_uid, imap_config_id, actions.clone()).await?;
    }

    Ok(actions)
}

/// Bulk categorize all emails (or just uncategorized ones).
pub async fn categorize_all_emails(
    pool: &SqlitePool,
    only_uncategorized: bool,
) -> Result<CategorizeStats> {
    let query = if only_uncategorized {
        "SELECT imap_uid, imap_config_id FROM emails
         WHERE labels IS NULL OR labels = '[]' ORDER BY date_sent DESC"
    } else {
        "SELECT imap_uid, imap_config_id FROM emails ORDER BY date_sent DESC"
    };
    let emails: Vec<(i64, i64)> = sqlx::query_as(query).fetch_all(pool).await?;
    let mut stats = CategorizeStats {
        total: emails.len(),
        categorized: 0,
        failed: 0,
    };

    for (imap_uid, imap_config_id) in emails {
        match categorize_email(pool, imap_uid, imap_config_id).await {
            Ok(actions) if !actions.is_empty() => stats.categorized += 1,
            Ok(_) => {}
            Err(_) => stats.failed += 1,
        }
    }

    Ok(stats)
}

#[derive(Debug, Clone)]
pub struct CategorizeStats {
    pub total: usize,
    pub categorized: usize,
    pub failed: usize,
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::rules::db;
    use crate::rules::types::{Action, Condition, Rule};
    use sqlx::SqlitePool;

    async fn setup_test_db() -> SqlitePool {
        let pool = SqlitePool::connect("sqlite::memory:").await.unwrap();

        // Create tables
        sqlx::query(
            "CREATE TABLE emails (
                imap_uid INTEGER PRIMARY KEY,
                imap_config_id INTEGER NOT NULL DEFAULT 1,
                from_address TEXT,
                to_address TEXT,
                subject TEXT,
                cc_address TEXT,
                bcc_address TEXT,
                reply_to TEXT,
                message_id TEXT,
                raw_message BLOB,
                labels TEXT,
                priority INTEGER DEFAULT 5,
                date_sent DATETIME,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )",
        )
        .execute(&pool)
        .await
        .unwrap();

        sqlx::query(
            "CREATE TABLE email_rules (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                rule_json TEXT NOT NULL,
                priority INTEGER DEFAULT 0,
                enabled BOOLEAN DEFAULT TRUE,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL
            )",
        )
        .execute(&pool)
        .await
        .unwrap();

        pool
    }

    #[tokio::test]
    async fn test_apply_label_action() {
        let pool = setup_test_db().await;

        sqlx::query("INSERT INTO emails (imap_uid, from_address, subject) VALUES (?, ?, ?)")
            .bind(1)
            .bind("test@v3x.email")
            .bind("Test Subject")
            .execute(&pool)
            .await
            .unwrap();

        let actions = vec![Action::AddLabel("work".to_string())];
        apply_actions(&pool, 1, 1, actions).await.unwrap();

        let labels_json: Option<String> =
            sqlx::query_scalar("SELECT labels FROM emails WHERE imap_uid = 1")
                .fetch_one(&pool)
                .await
                .unwrap();

        let labels: Vec<String> = serde_json::from_str(&labels_json.unwrap()).unwrap();
        assert!(labels.contains(&"work".to_string()));
    }

    #[tokio::test]
    async fn test_apply_label_actions() {
        let pool = setup_test_db().await;

        sqlx::query("INSERT INTO emails (imap_uid, from_address) VALUES (?, ?)")
            .bind(1)
            .bind("test@v3x.email")
            .execute(&pool)
            .await
            .unwrap();

        let actions = vec![
            Action::AddLabel("urgent".to_string()),
            Action::AddLabel("review".to_string()),
        ];
        apply_actions(&pool, 1, 1, actions).await.unwrap();

        let labels_json: Option<String> =
            sqlx::query_scalar("SELECT labels FROM emails WHERE imap_uid = 1")
                .fetch_one(&pool)
                .await
                .unwrap();

        let labels: Vec<String> = serde_json::from_str(&labels_json.unwrap()).unwrap();
        assert_eq!(labels.len(), 2);
        assert!(labels.contains(&"urgent".to_string()));
        assert!(labels.contains(&"review".to_string()));
    }

    #[tokio::test]
    async fn test_apply_priority_action() {
        let pool = setup_test_db().await;

        sqlx::query("INSERT INTO emails (imap_uid, from_address) VALUES (?, ?)")
            .bind(1)
            .bind("test@v3x.email")
            .execute(&pool)
            .await
            .unwrap();

        let actions = vec![Action::SetPriority(10)];
        apply_actions(&pool, 1, 1, actions).await.unwrap();

        let priority: i64 = sqlx::query_scalar("SELECT priority FROM emails WHERE imap_uid = 1")
            .fetch_one(&pool)
            .await
            .unwrap();

        assert_eq!(priority, 10);
    }

    #[tokio::test]
    async fn test_apply_multiple_actions() {
        let pool = setup_test_db().await;

        sqlx::query("INSERT INTO emails (imap_uid, from_address, subject) VALUES (?, ?, ?)")
            .bind(1)
            .bind("test@v3x.email")
            .bind("Important")
            .execute(&pool)
            .await
            .unwrap();

        let actions = vec![
            Action::AddLabel("important".to_string()),
            Action::AddLabel("urgent".to_string()),
            Action::SetPriority(9),
        ];
        apply_actions(&pool, 1, 1, actions).await.unwrap();

        let row = sqlx::query!("SELECT labels, priority FROM emails WHERE imap_uid = 1")
            .fetch_one(&pool)
            .await
            .unwrap();

        assert_eq!(row.priority, Some(9));

        let labels: Vec<String> = serde_json::from_str(&row.labels.unwrap()).unwrap();
        assert_eq!(labels.len(), 2);
        assert!(labels.contains(&"urgent".to_string()));
        assert!(labels.contains(&"important".to_string()));
    }

    #[tokio::test]
    async fn test_categorize_email_with_rules() {
        let pool = setup_test_db().await;

        // Insert an email
        sqlx::query("INSERT INTO emails (imap_uid, from_address, subject) VALUES (?, ?, ?)")
            .bind(1)
            .bind("alice@v3x.email")
            .bind("[URGENT] Project Update")
            .execute(&pool)
            .await
            .unwrap();

        // Create a rule
        let rule = Rule {
            id: "urgent-work".to_string(),
            name: "Urgent Work Emails".to_string(),
            condition: Condition::And {
                conditions: vec![
                    Condition::HeaderContains {
                        name: "from".to_string(),
                        substring: "@v3x.email".to_string(),
                    },
                    Condition::HeaderContains {
                        name: "subject".to_string(),
                        substring: "URGENT".to_string(),
                    },
                ],
            },
            actions: vec![
                Action::AddLabel("work".to_string()),
                Action::SetPriority(10),
            ],
            priority: 10,
            enabled: true,
        };

        db::save_rule(&pool, &rule).await.unwrap();

        // Categorize the email
        let actions = categorize_email(&pool, 1, 1).await.unwrap();
        assert_eq!(actions.len(), 2);

        // Check that the email was updated
        let row = sqlx::query!("SELECT labels, priority FROM emails WHERE imap_uid = 1")
            .fetch_one(&pool)
            .await
            .unwrap();

        let labels: Vec<String> = serde_json::from_str(&row.labels.unwrap()).unwrap();
        assert!(labels.contains(&"work".to_string()));
        assert_eq!(row.priority, Some(10));
    }
    #[tokio::test]
    async fn test_categorize_email_matches_raw_message_headers() {
        let pool = setup_test_db().await;
        sqlx::query("INSERT INTO emails (imap_uid, raw_message) VALUES (?, ?)")
            .bind(1)
            .bind(b"Content-Type: text/calendar\r\n\r\nBEGIN:VCALENDAR".as_slice())
            .execute(&pool)
            .await
            .unwrap();

        db::save_rule(
            &pool,
            &Rule {
                id: "calendar".to_string(),
                name: "Calendar".to_string(),
                condition: Condition::HeaderContains {
                    name: "content-type".to_string(),
                    substring: "text/calendar".to_string(),
                },
                actions: vec![Action::AddLabel("calendar-invites".to_string())],
                priority: 1,
                enabled: true,
            },
        )
        .await
        .unwrap();

        let actions = categorize_email(&pool, 1, 1).await.unwrap();
        assert_eq!(
            actions,
            vec![Action::AddLabel("calendar-invites".to_string())]
        );
    }

    #[tokio::test]
    async fn test_apply_actions_does_not_cross_imap_configurations() {
        let pool = SqlitePool::connect("sqlite::memory:").await.unwrap();
        sqlx::query(
            "CREATE TABLE emails (
                imap_uid INTEGER NOT NULL,
                imap_config_id INTEGER NOT NULL,
                labels TEXT,
                priority INTEGER,
                updated_at DATETIME,
                UNIQUE(imap_uid, imap_config_id)
            )",
        )
        .execute(&pool)
        .await
        .unwrap();

        sqlx::query("INSERT INTO emails (imap_uid, imap_config_id) VALUES (1, 1), (1, 2)")
            .execute(&pool)
            .await
            .unwrap();

        apply_actions(&pool, 1, 1, vec![Action::AddLabel("work".to_string())])
            .await
            .unwrap();

        let labels: Vec<Option<String>> = sqlx::query_scalar(
            "SELECT labels FROM emails WHERE imap_uid = 1 ORDER BY imap_config_id",
        )
        .fetch_all(&pool)
        .await
        .unwrap();
        assert_eq!(labels, vec![Some("[\"work\"]".to_string()), None]);
    }
}

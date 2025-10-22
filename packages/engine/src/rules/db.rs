use crate::rules::types::Rule;
use anyhow::{Context, Result};
use sqlx::SqlitePool;

/// Load all enabled rules from the database, ordered by priority
pub async fn load_rules(pool: &SqlitePool) -> Result<Vec<Rule>> {
    let records = sqlx::query!(
        "SELECT rule_json FROM email_rules WHERE enabled = TRUE ORDER BY priority DESC, created_at ASC"
    )
    .fetch_all(pool)
    .await?;

    let rules = records
        .into_iter()
        .filter_map(|rec| serde_json::from_str(&rec.rule_json).ok())
        .collect();

    Ok(rules)
}

/// Load all rules (including disabled) from the database
pub async fn load_all_rules(pool: &SqlitePool) -> Result<Vec<Rule>> {
    let records = sqlx::query!(
        "SELECT rule_json FROM email_rules ORDER BY priority DESC, created_at ASC"
    )
    .fetch_all(pool)
    .await?;

    let rules = records
        .into_iter()
        .filter_map(|rec| serde_json::from_str(&rec.rule_json).ok())
        .collect();

    Ok(rules)
}

/// Save a new rule to the database
pub async fn save_rule(pool: &SqlitePool, rule: &Rule) -> Result<()> {
    let rule_json = serde_json::to_string(rule).context("Failed to serialize rule to JSON")?;
    let now = chrono::Utc::now().timestamp();

    sqlx::query!(
        "INSERT INTO email_rules (id, name, rule_json, priority, enabled, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)",
        rule.id,
        rule.name,
        rule_json,
        rule.priority,
        rule.enabled,
        now,
        now,
    )
    .execute(pool)
    .await?;

    Ok(())
}

/// Update an existing rule in the database
pub async fn update_rule(pool: &SqlitePool, rule: &Rule) -> Result<()> {
    let rule_json = serde_json::to_string(rule).context("Failed to serialize rule to JSON")?;
    let now = chrono::Utc::now().timestamp();

    let result = sqlx::query!(
        "UPDATE email_rules 
         SET name = ?, rule_json = ?, priority = ?, enabled = ?, updated_at = ?
         WHERE id = ?",
        rule.name,
        rule_json,
        rule.priority,
        rule.enabled,
        now,
        rule.id,
    )
    .execute(pool)
    .await?;

    if result.rows_affected() == 0 {
        anyhow::bail!("Rule with id '{}' not found", rule.id);
    }

    Ok(())
}

/// Delete a rule from the database
pub async fn delete_rule(pool: &SqlitePool, id: &str) -> Result<()> {
    let result = sqlx::query!("DELETE FROM email_rules WHERE id = ?", id)
        .execute(pool)
        .await?;

    if result.rows_affected() == 0 {
        anyhow::bail!("Rule with id '{}' not found", id);
    }

    Ok(())
}

/// Get a single rule by ID
pub async fn get_rule(pool: &SqlitePool, id: &str) -> Result<Option<Rule>> {
    let record = sqlx::query!("SELECT rule_json FROM email_rules WHERE id = ?", id)
        .fetch_optional(pool)
        .await?;

    match record {
        Some(rec) => {
            let rule =
                serde_json::from_str(&rec.rule_json).context("Failed to deserialize rule from JSON")?;
            Ok(Some(rule))
        }
        None => Ok(None),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::rules::types::{Action, Condition};
    use sqlx::SqlitePool;

    async fn setup_test_db() -> SqlitePool {
        let pool = SqlitePool::connect("sqlite::memory:").await.unwrap();
        
        // Create the email_rules table
        sqlx::query(
            "CREATE TABLE email_rules (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                rule_json TEXT NOT NULL,
                priority INTEGER DEFAULT 0,
                enabled BOOLEAN DEFAULT TRUE,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL
            )"
        ).execute(&pool).await.unwrap();

        pool
    }

    fn create_test_rule() -> Rule {
        Rule {
            id: "test-rule-1".to_string(),
            name: "Test Rule".to_string(),
            condition: Condition::HeaderContains {
                name: "from".to_string(),
                substring: "test@v3x.email".to_string(),
            },
            actions: vec![Action::SetCategory("test".to_string())],
            priority: 5,
            enabled: true,
        }
    }

    #[tokio::test]
    async fn test_save_and_load_rule() {
        let pool = setup_test_db().await;
        let rule = create_test_rule();

        save_rule(&pool, &rule).await.unwrap();
        let loaded_rules = load_rules(&pool).await.unwrap();

        assert_eq!(loaded_rules.len(), 1);
        assert_eq!(loaded_rules[0].id, rule.id);
        assert_eq!(loaded_rules[0].name, rule.name);
        assert_eq!(loaded_rules[0].priority, rule.priority);
    }

    #[tokio::test]
    async fn test_update_rule() {
        let pool = setup_test_db().await;
        let mut rule = create_test_rule();

        save_rule(&pool, &rule).await.unwrap();

        rule.name = "Updated Name".to_string();
        rule.priority = 10;
        update_rule(&pool, &rule).await.unwrap();

        let loaded = get_rule(&pool, &rule.id).await.unwrap().unwrap();
        assert_eq!(loaded.name, "Updated Name");
        assert_eq!(loaded.priority, 10);
    }

    #[tokio::test]
    async fn test_delete_rule() {
        let pool = setup_test_db().await;
        let rule = create_test_rule();

        save_rule(&pool, &rule).await.unwrap();
        delete_rule(&pool, &rule.id).await.unwrap();

        let loaded = get_rule(&pool, &rule.id).await.unwrap();
        assert!(loaded.is_none());
    }

    #[tokio::test]
    async fn test_load_only_enabled_rules() {
        let pool = setup_test_db().await;
        
        let mut rule1 = create_test_rule();
        rule1.id = "rule-1".to_string();
        rule1.enabled = true;
        
        let mut rule2 = create_test_rule();
        rule2.id = "rule-2".to_string();
        rule2.enabled = false;

        save_rule(&pool, &rule1).await.unwrap();
        save_rule(&pool, &rule2).await.unwrap();

        let enabled_rules = load_rules(&pool).await.unwrap();
        assert_eq!(enabled_rules.len(), 1);
        assert_eq!(enabled_rules[0].id, "rule-1");

        let all_rules = load_all_rules(&pool).await.unwrap();
        assert_eq!(all_rules.len(), 2);
    }

    #[tokio::test]
    async fn test_priority_ordering() {
        let pool = setup_test_db().await;
        
        let mut rule1 = create_test_rule();
        rule1.id = "rule-1".to_string();
        rule1.priority = 1;
        
        let mut rule2 = create_test_rule();
        rule2.id = "rule-2".to_string();
        rule2.priority = 10;

        let mut rule3 = create_test_rule();
        rule3.id = "rule-3".to_string();
        rule3.priority = 5;

        save_rule(&pool, &rule1).await.unwrap();
        save_rule(&pool, &rule2).await.unwrap();
        save_rule(&pool, &rule3).await.unwrap();

        let rules = load_rules(&pool).await.unwrap();
        assert_eq!(rules[0].id, "rule-2"); // priority 10
        assert_eq!(rules[1].id, "rule-3"); // priority 5
        assert_eq!(rules[2].id, "rule-1"); // priority 1
    }

    #[tokio::test]
    async fn test_delete_nonexistent_rule() {
        let pool = setup_test_db().await;
        let result = delete_rule(&pool, "nonexistent").await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_update_nonexistent_rule() {
        let pool = setup_test_db().await;
        let rule = create_test_rule();
        let result = update_rule(&pool, &rule).await;
        assert!(result.is_err());
    }
}

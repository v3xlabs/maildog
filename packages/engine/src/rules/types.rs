use serde::{Deserialize, Serialize};

/// Represents a single email categorization rule
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Rule {
    pub id: String,
    pub name: String,
    pub condition: Condition,
    pub actions: Vec<Action>,
    pub priority: i32,
    pub enabled: bool,
}

/// Condition types for evaluating email headers
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(tag = "type", rename_all = "camelCase")]
pub enum Condition {
    /// Exact match (case-insensitive)
    #[serde(rename_all = "camelCase")]
    HeaderEquals { 
        name: String, 
        value: String 
    },
    
    /// Substring match (case-insensitive)
    #[serde(rename_all = "camelCase")]
    HeaderContains { 
        name: String, 
        substring: String 
    },
    
    /// Regex pattern match
    #[serde(rename_all = "camelCase")]
    HeaderMatches { 
        name: String, 
        pattern: String 
    },
    
    /// All conditions must be true
    And { 
        conditions: Vec<Condition> 
    },
    
    /// At least one condition must be true
    Or { 
        conditions: Vec<Condition> 
    },
    
    /// Negates the inner condition
    Not { 
        condition: Box<Condition> 
    },
}

/// Actions to apply when a rule matches
#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, Eq)]
#[serde(tag = "type", content = "value", rename_all = "camelCase")]
pub enum Action {
    /// Add a label to the email
    AddLabel(String),
    
    /// Set priority level (0-255)
    SetPriority(u8),
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json;

    #[test]
    fn test_serialize_rule() {
        let rule = Rule {
            id: "rule-1".to_string(),
            name: "Work Email".to_string(),
            condition: Condition::And {
                conditions: vec![
                    Condition::HeaderContains {
                        name: "from".to_string(),
                        substring: "@v3x.email".to_string(),
                    },
                    Condition::Not {
                        condition: Box::new(Condition::HeaderContains {
                            name: "subject".to_string(),
                            substring: "spam".to_string(),
                        }),
                    },
                ],
            },
            actions: vec![
                Action::AddLabel("work".to_string()),
                Action::SetPriority(5),
            ],
            priority: 10,
            enabled: true,
        };

        let json = serde_json::to_string_pretty(&rule).unwrap();
        assert!(json.contains("work"));
        assert!(json.contains("@v3x.email"));
    }

    #[test]
    fn test_deserialize_rule() {
        let json = r#"{
            "id": "rule-2",
            "name": "Newsletter",
            "condition": {
                "type": "headerContains",
                "name": "subject",
                "substring": "newsletter"
            },
            "actions": [
                {
                    "type": "addLabel",
                    "value": "newsletters"
                },
                {
                    "type": "addLabel",
                    "value": "read-later"
                }
            ],
            "priority": 5,
            "enabled": true
        }"#;

        let rule: Rule = serde_json::from_str(json).unwrap();
        assert_eq!(rule.id, "rule-2");
        assert_eq!(rule.name, "Newsletter");
        assert_eq!(rule.priority, 5);
        assert_eq!(rule.actions.len(), 2);
    }
}

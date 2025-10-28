use crate::rules::types::{Action, Condition, Rule};
use anyhow::Result;
use regex::Regex;
use std::collections::HashMap;

/// Rule engine for evaluating email rules and applying actions
pub struct RuleEngine {
    rules: Vec<Rule>,
    regex_cache: HashMap<String, Regex>,
}

impl RuleEngine {
    /// Create a new rule engine with the given rules
    pub fn new(mut rules: Vec<Rule>) -> Self {
        rules.sort_by(|a, b| b.priority.cmp(&a.priority));
        
        Self {
            rules,
            regex_cache: HashMap::new(),
        }
    }

    /// Load rules from database
    pub async fn from_db(pool: &sqlx::SqlitePool) -> Result<Self> {
        let rules = crate::rules::db::load_rules(pool).await?;
        Ok(Self::new(rules))
    }

    /// Evaluate all rules against email headers and return actions from first match
    /// Headers are matched case-insensitively by name
    pub fn evaluate(&mut self, headers: &HashMap<String, String>) -> Vec<Action> {
        // Create case-insensitive header lookup
        let normalized_headers: HashMap<String, String> = headers
            .iter()
            .map(|(k, v)| (k.to_lowercase(), v.clone()))
            .collect();

        let rules = self.rules.clone();
        
        // Evaluate rules in priority order
        for rule in &rules {
            if !rule.enabled {
                continue;
            }

            if self.evaluate_condition(&rule.condition, &normalized_headers) {
                // Short-circuit on first match
                return rule.actions.clone();
            }
        }

        // No rules matched
        vec![]
    }

    /// Add a new rule to the engine
    pub fn add_rule(&mut self, rule: Rule) -> Result<()> {
        self.rules.push(rule);
        // Re-sort by priority
        self.rules.sort_by(|a, b| b.priority.cmp(&a.priority));
        Ok(())
    }

    /// Remove a rule by ID
    pub fn remove_rule(&mut self, id: &str) -> Result<()> {
        self.rules.retain(|r| r.id != id);
        Ok(())
    }

    /// Update an existing rule
    pub fn update_rule(&mut self, rule: Rule) -> Result<()> {
        if let Some(existing) = self.rules.iter_mut().find(|r| r.id == rule.id) {
            *existing = rule;
            // Re-sort by priority
            self.rules.sort_by(|a, b| b.priority.cmp(&a.priority));
            Ok(())
        } else {
            anyhow::bail!("Rule with id '{}' not found", rule.id)
        }
    }

    /// Get all rules currently in the engine
    pub fn get_rules(&self) -> &[Rule] {
        &self.rules
    }

    /// Evaluate a single condition against headers
    fn evaluate_condition(
        &mut self,
        condition: &Condition,
        headers: &HashMap<String, String>,
    ) -> bool {
        match condition {
            Condition::HeaderEquals { name, value } => {
                let normalized_name = name.to_lowercase();
                headers
                    .get(&normalized_name)
                    .map(|v| v.eq_ignore_ascii_case(value))
                    .unwrap_or(false)
            }

            Condition::HeaderContains { name, substring } => {
                let normalized_name = name.to_lowercase();
                headers
                    .get(&normalized_name)
                    .map(|v| v.to_lowercase().contains(&substring.to_lowercase()))
                    .unwrap_or(false)
            }

            Condition::HeaderMatches { name, pattern } => {
                let normalized_name = name.to_lowercase();
                
                // Get or compile regex pattern
                let regex = match self.regex_cache.get(pattern) {
                    Some(r) => r,
                    None => {
                        // Compile and cache the regex
                        match Regex::new(pattern) {
                            Ok(r) => {
                                self.regex_cache.insert(pattern.clone(), r);
                                self.regex_cache.get(pattern).unwrap()
                            }
                            Err(_) => return false, // Invalid regex, treat as no match
                        }
                    }
                };

                headers
                    .get(&normalized_name)
                    .map(|v| regex.is_match(v))
                    .unwrap_or(false)
            }

            Condition::And { conditions } => {
                conditions.iter().all(|c| self.evaluate_condition(c, headers))
            }

            Condition::Or { conditions } => {
                conditions.iter().any(|c| self.evaluate_condition(c, headers))
            }

            Condition::Not { condition } => {
                !self.evaluate_condition(condition, headers)
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::rules::types::{Action, Condition, Rule};

    fn create_test_headers() -> HashMap<String, String> {
        let mut headers = HashMap::new();
        headers.insert("from".to_string(), "alice@v3x.email".to_string());
        headers.insert("to".to_string(), "bob@v3x.email".to_string());
        headers.insert("subject".to_string(), "[URGENT] Project Update".to_string());
        headers.insert("x-priority".to_string(), "1".to_string());
        headers
    }

    #[test]
    fn test_header_equals() {
        let mut engine = RuleEngine::new(vec![Rule {
            id: "1".to_string(),
            name: "Test".to_string(),
            condition: Condition::HeaderEquals {
                name: "from".to_string(),
                value: "alice@v3x.email".to_string(),
            },
            actions: vec![Action::AddLabel("matched".to_string())],
            priority: 1,
            enabled: true,
        }]);

        let headers = create_test_headers();
        let actions = engine.evaluate(&headers);
        assert_eq!(actions.len(), 1);
        assert_eq!(actions[0], Action::AddLabel("matched".to_string()));
    }

    #[test]
    fn test_header_equals_case_insensitive() {
        let mut engine = RuleEngine::new(vec![Rule {
            id: "1".to_string(),
            name: "Test".to_string(),
            condition: Condition::HeaderEquals {
                name: "FROM".to_string(), // uppercase header name
                value: "ALICE@v3x.email".to_string(), // uppercase value
            },
            actions: vec![Action::AddLabel("matched".to_string())],
            priority: 1,
            enabled: true,
        }]);

        let headers = create_test_headers();
        let actions = engine.evaluate(&headers);
        assert_eq!(actions.len(), 1);
    }

    #[test]
    fn test_header_contains() {
        let mut engine = RuleEngine::new(vec![Rule {
            id: "1".to_string(),
            name: "Test".to_string(),
            condition: Condition::HeaderContains {
                name: "subject".to_string(),
                substring: "URGENT".to_string(),
            },
            actions: vec![Action::SetPriority(10)],
            priority: 1,
            enabled: true,
        }]);

        let headers = create_test_headers();
        let actions = engine.evaluate(&headers);
        assert_eq!(actions.len(), 1);
        assert_eq!(actions[0], Action::SetPriority(10));
    }

    #[test]
    fn test_header_matches_regex() {
        let mut engine = RuleEngine::new(vec![Rule {
            id: "1".to_string(),
            name: "Test".to_string(),
            condition: Condition::HeaderMatches {
                name: "from".to_string(),
                pattern: r"^[\w\.-]+@v3x\.email$".to_string(),
            },
            actions: vec![Action::AddLabel("external".to_string())],
            priority: 1,
            enabled: true,
        }]);

        let headers = create_test_headers();
        let actions = engine.evaluate(&headers);
        assert_eq!(actions.len(), 1);
    }

    #[test]
    fn test_and_condition() {
        let mut engine = RuleEngine::new(vec![Rule {
            id: "1".to_string(),
            name: "Test".to_string(),
            condition: Condition::And {
                conditions: vec![
                    Condition::HeaderContains {
                        name: "from".to_string(),
                        substring: "v3x.email".to_string(),
                    },
                    Condition::HeaderContains {
                        name: "subject".to_string(),
                        substring: "URGENT".to_string(),
                    },
                ],
            },
            actions: vec![Action::SetPriority(9)],
            priority: 1,
            enabled: true,
        }]);

        let headers = create_test_headers();
        let actions = engine.evaluate(&headers);
        assert_eq!(actions.len(), 1);
    }

    #[test]
    fn test_or_condition() {
        let mut engine = RuleEngine::new(vec![Rule {
            id: "1".to_string(),
            name: "Test".to_string(),
            condition: Condition::Or {
                conditions: vec![
                    Condition::HeaderContains {
                        name: "from".to_string(),
                        substring: "nonexistent.com".to_string(),
                    },
                    Condition::HeaderContains {
                        name: "subject".to_string(),
                        substring: "URGENT".to_string(),
                    },
                ],
            },
            actions: vec![Action::AddLabel("important".to_string())],
            priority: 1,
            enabled: true,
        }]);

        let headers = create_test_headers();
        let actions = engine.evaluate(&headers);
        assert_eq!(actions.len(), 1);
    }

    #[test]
    fn test_not_condition() {
        let mut engine = RuleEngine::new(vec![Rule {
            id: "1".to_string(),
            name: "Test".to_string(),
            condition: Condition::Not {
                condition: Box::new(Condition::HeaderContains {
                    name: "subject".to_string(),
                    substring: "spam".to_string(),
                }),
            },
            actions: vec![Action::AddLabel("clean".to_string())],
            priority: 1,
            enabled: true,
        }]);

        let headers = create_test_headers();
        let actions = engine.evaluate(&headers);
        assert_eq!(actions.len(), 1);
    }

    #[test]
    fn test_nested_conditions() {
        let mut engine = RuleEngine::new(vec![Rule {
            id: "1".to_string(),
            name: "Complex Rule".to_string(),
            condition: Condition::And {
                conditions: vec![
                    Condition::Or {
                        conditions: vec![
                            Condition::HeaderContains {
                                name: "from".to_string(),
                                substring: "v3x.email".to_string(),
                            },
                            Condition::HeaderContains {
                                name: "from".to_string(),
                                substring: "v3x.email".to_string(),
                            },
                        ],
                    },
                    Condition::Not {
                        condition: Box::new(Condition::HeaderContains {
                            name: "subject".to_string(),
                            substring: "spam".to_string(),
                        }),
                    },
                ],
            },
            actions: vec![Action::AddLabel("trusted".to_string())],
            priority: 1,
            enabled: true,
        }]);

        let headers = create_test_headers();
        let actions = engine.evaluate(&headers);
        assert_eq!(actions.len(), 1);
    }

    #[test]
    fn test_priority_ordering() {
        let mut engine = RuleEngine::new(vec![
            Rule {
                id: "low".to_string(),
                name: "Low Priority".to_string(),
                condition: Condition::HeaderContains {
                    name: "from".to_string(),
                    substring: "v3x.email".to_string(),
                },
                actions: vec![Action::AddLabel("low".to_string())],
                priority: 1,
                enabled: true,
            },
            Rule {
                id: "high".to_string(),
                name: "High Priority".to_string(),
                condition: Condition::HeaderContains {
                    name: "from".to_string(),
                    substring: "v3x.email".to_string(),
                },
                actions: vec![Action::AddLabel("high".to_string())],
                priority: 10,
                enabled: true,
            },
        ]);

        let headers = create_test_headers();
        let actions = engine.evaluate(&headers);
        // Should match high priority rule first
        assert_eq!(actions[0], Action::AddLabel("high".to_string()));
    }

    #[test]
    fn test_disabled_rule() {
        let mut engine = RuleEngine::new(vec![Rule {
            id: "1".to_string(),
            name: "Disabled".to_string(),
            condition: Condition::HeaderContains {
                name: "from".to_string(),
                substring: "v3x.email".to_string(),
            },
            actions: vec![Action::AddLabel("matched".to_string())],
            priority: 1,
            enabled: false,
        }]);

        let headers = create_test_headers();
        let actions = engine.evaluate(&headers);
        assert_eq!(actions.len(), 0);
    }

    #[test]
    fn test_missing_header() {
        let mut engine = RuleEngine::new(vec![Rule {
            id: "1".to_string(),
            name: "Test".to_string(),
            condition: Condition::HeaderContains {
                name: "nonexistent".to_string(),
                substring: "value".to_string(),
            },
            actions: vec![Action::AddLabel("matched".to_string())],
            priority: 1,
            enabled: true,
        }]);

        let headers = create_test_headers();
        let actions = engine.evaluate(&headers);
        assert_eq!(actions.len(), 0);
    }

    #[test]
    fn test_invalid_regex() {
        let mut engine = RuleEngine::new(vec![Rule {
            id: "1".to_string(),
            name: "Test".to_string(),
            condition: Condition::HeaderMatches {
                name: "from".to_string(),
                pattern: "[invalid(".to_string(), // Invalid regex
            },
            actions: vec![Action::AddLabel("matched".to_string())],
            priority: 1,
            enabled: true,
        }]);

        let headers = create_test_headers();
        let actions = engine.evaluate(&headers);
        // Should not panic, just return no match
        assert_eq!(actions.len(), 0);
    }

    #[test]
    fn test_regex_caching() {
        let mut engine = RuleEngine::new(vec![Rule {
            id: "1".to_string(),
            name: "Test".to_string(),
            condition: Condition::HeaderMatches {
                name: "from".to_string(),
                pattern: r".*@v3x\.email".to_string(),
            },
            actions: vec![Action::AddLabel("cached".to_string())],
            priority: 1,
            enabled: true,
        }]);

        let headers = create_test_headers();
        
        // First evaluation should cache the regex
        engine.evaluate(&headers);
        assert_eq!(engine.regex_cache.len(), 1);
        
        // Second evaluation should use cached regex
        let actions = engine.evaluate(&headers);
        assert_eq!(actions.len(), 1);
        assert_eq!(engine.regex_cache.len(), 1);
    }

    #[test]
    fn test_multiple_actions() {
        let mut engine = RuleEngine::new(vec![Rule {
            id: "1".to_string(),
            name: "Multi-Action".to_string(),
            condition: Condition::HeaderContains {
                name: "subject".to_string(),
                substring: "URGENT".to_string(),
            },
            actions: vec![
                Action::AddLabel("urgent".to_string()),
                Action::AddLabel("important".to_string()),
                Action::SetPriority(10),
            ],
            priority: 1,
            enabled: true,
        }]);

        let headers = create_test_headers();
        let actions = engine.evaluate(&headers);
        assert_eq!(actions.len(), 3);
    }

    #[test]
    fn test_add_rule() {
        let mut engine = RuleEngine::new(vec![]);
        
        engine.add_rule(Rule {
            id: "1".to_string(),
            name: "New Rule".to_string(),
            condition: Condition::HeaderContains {
                name: "from".to_string(),
                substring: "v3x.email".to_string(),
            },
            actions: vec![Action::AddLabel("new".to_string())],
            priority: 5,
            enabled: true,
        }).unwrap();

        assert_eq!(engine.get_rules().len(), 1);
    }

    #[test]
    fn test_remove_rule() {
        let mut engine = RuleEngine::new(vec![Rule {
            id: "1".to_string(),
            name: "To Remove".to_string(),
            condition: Condition::HeaderContains {
                name: "from".to_string(),
                substring: "v3x.email".to_string(),
            },
            actions: vec![Action::AddLabel("removed".to_string())],
            priority: 1,
            enabled: true,
        }]);

        engine.remove_rule("1").unwrap();
        assert_eq!(engine.get_rules().len(), 0);
    }

    #[test]
    fn test_update_rule() {
        let mut engine = RuleEngine::new(vec![Rule {
            id: "1".to_string(),
            name: "Original".to_string(),
            condition: Condition::HeaderContains {
                name: "from".to_string(),
                substring: "v3x.email".to_string(),
            },
            actions: vec![Action::AddLabel("original".to_string())],
            priority: 1,
            enabled: true,
        }]);

        engine.update_rule(Rule {
            id: "1".to_string(),
            name: "Updated".to_string(),
            condition: Condition::HeaderContains {
                name: "from".to_string(),
                substring: "v3x.email".to_string(),
            },
            actions: vec![Action::AddLabel("updated".to_string())],
            priority: 10,
            enabled: true,
        }).unwrap();

        let rules = engine.get_rules();
        assert_eq!(rules[0].name, "Updated");
        assert_eq!(rules[0].priority, 10);
    }
}

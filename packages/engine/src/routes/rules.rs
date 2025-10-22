use std::sync::Arc;

use poem::http::StatusCode;
use poem::web::Data;
use poem::{Error, Result as PoemResult};
use poem_openapi::{param::Path, payload::Json, Object, OpenApi};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::rules::{Action, Condition, Rule};
use crate::state::AppState;

fn internal_error<E: std::fmt::Display>(err: E) -> Error {
    Error::from_string(
        format!("Database error: {}", err),
        StatusCode::INTERNAL_SERVER_ERROR,
    )
}

fn bad_request<E: std::fmt::Display>(err: E) -> Error {
    Error::from_string(format!("Invalid rule payload: {}", err), StatusCode::BAD_REQUEST)
}

#[derive(Debug, Serialize, Deserialize, Object)]
pub struct RuleResponse {
    pub id: String,
    pub name: String,
    pub condition: serde_json::Value,
    pub actions: Vec<serde_json::Value>,
    pub priority: i32,
    pub enabled: bool,
}

impl From<Rule> for RuleResponse {
    fn from(rule: Rule) -> Self {
        Self {
            id: rule.id,
            name: rule.name,
            condition: serde_json::to_value(&rule.condition).unwrap_or_default(),
            actions: rule
                .actions
                .into_iter()
                .map(|action| serde_json::to_value(action).unwrap_or_default())
                .collect(),
            priority: rule.priority,
            enabled: rule.enabled,
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Object)]
pub struct RuleListResponse {
    pub rules: Vec<RuleResponse>,
    pub total: usize,
}

#[derive(Debug, Serialize, Deserialize, Object)]
pub struct CreateRuleRequest {
    pub name: String,
    pub condition: serde_json::Value,
    pub actions: Vec<serde_json::Value>,
    pub priority: i32,
    pub enabled: bool,
}

#[derive(Debug, Serialize, Deserialize, Object)]
pub struct UpdateRuleRequest {
    pub name: String,
    pub condition: serde_json::Value,
    pub actions: Vec<serde_json::Value>,
    pub priority: i32,
    pub enabled: bool,
}

#[derive(Debug, Serialize, Deserialize, Object)]
pub struct MessageResponse {
    pub message: String,
}

#[derive(Debug, Serialize, Deserialize, Object)]
pub struct CategorizeResponse {
    pub actions_applied: usize,
}

#[derive(Debug, Serialize, Deserialize, Object)]
pub struct RuleApi;

#[OpenApi]
impl RuleApi {
    /// List all email rules
    #[oai(path = "/rules", method = "get", tag = "crate::routes::ApiTags::Rules")]
    async fn list_rules(
        &self,
        state: Data<&Arc<AppState>>,
    ) -> PoemResult<Json<RuleListResponse>> {
        let rules = crate::rules::db::load_all_rules(&state.db_pool)
            .await
            .map_err(internal_error)?;

        let responses: Vec<RuleResponse> = rules.into_iter().map(RuleResponse::from).collect();
        Ok(Json(RuleListResponse {
            total: responses.len(),
            rules: responses,
        }))
    }

    /// Create a new email rule
    #[oai(path = "/rules", method = "post", tag = "crate::routes::ApiTags::Rules")]
    async fn create_rule(
        &self,
        state: Data<&Arc<AppState>>,
        request: Json<CreateRuleRequest>,
    ) -> PoemResult<Json<MessageResponse>> {
        let condition: Condition = serde_json::from_value(request.condition.clone()).map_err(bad_request)?;
        let actions: Vec<Action> = request
            .actions
            .iter()
            .map(|value| serde_json::from_value(value.clone()))
            .collect::<Result<Vec<Action>, _>>()
            .map_err(bad_request)?;

        let rule = Rule {
            id: Uuid::new_v4().to_string(),
            name: request.name.clone(),
            condition,
            actions,
            priority: request.priority,
            enabled: request.enabled,
        };

        let rule_id = rule.id.clone();
        crate::rules::db::save_rule(&state.db_pool, &rule)
            .await
            .map_err(internal_error)?;

        Ok(Json(MessageResponse {
            message: format!("Rule '{}' created", rule_id),
        }))
    }

    /// Update an existing email rule
    #[oai(path = "/rules/:id", method = "put", tag = "crate::routes::ApiTags::Rules")]
    async fn update_rule(
        &self,
        state: Data<&Arc<AppState>>,
        id: Path<String>,
        request: Json<UpdateRuleRequest>,
    ) -> PoemResult<Json<MessageResponse>> {
        let condition: Condition = serde_json::from_value(request.condition.clone()).map_err(bad_request)?;
        let actions: Vec<Action> = request
            .actions
            .iter()
            .map(|value| serde_json::from_value(value.clone()))
            .collect::<Result<Vec<Action>, _>>()
            .map_err(bad_request)?;

        let rule = Rule {
            id: id.0.clone(),
            name: request.name.clone(),
            condition,
            actions,
            priority: request.priority,
            enabled: request.enabled,
        };

        crate::rules::db::update_rule(&state.db_pool, &rule)
            .await
            .map_err(internal_error)?;

        Ok(Json(MessageResponse {
            message: format!("Rule '{}' updated", id.0),
        }))
    }

    /// Delete an email rule
    #[oai(path = "/rules/:id", method = "delete", tag = "crate::routes::ApiTags::Rules")]
    async fn delete_rule(
        &self,
        state: Data<&Arc<AppState>>,
        id: Path<String>,
    ) -> PoemResult<Json<MessageResponse>> {
        crate::rules::db::delete_rule(&state.db_pool, &id.0)
            .await
            .map_err(internal_error)?;

        Ok(Json(MessageResponse {
            message: format!("Rule '{}' deleted", id.0),
        }))
    }

    /// Manually categorize a specific email by IMAP UID
    #[oai(path = "/emails/:uid/categorize", method = "post", tag = "crate::routes::ApiTags::Rules")]
    async fn categorize_email(
        &self,
        state: Data<&Arc<AppState>>,
        uid: Path<i64>,
    ) -> PoemResult<Json<CategorizeResponse>> {
        let actions = crate::rules::apply::categorize_email(&state.db_pool, uid.0)
            .await
            .map_err(internal_error)?;

        Ok(Json(CategorizeResponse {
            actions_applied: actions.len(),
        }))
    }
}

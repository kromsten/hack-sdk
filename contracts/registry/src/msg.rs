use cw83::{registry_execute, registry_query, AccountInfoResponse};
use common::{ProxyData, CreateAccountMsg, AccountQuery};
use cosmwasm_schema::{cw_serde, QueryResponses};
use cosmwasm_std::Empty;




#[cw_serde]
pub struct InstantiateMsg {
    pub allowed_code_ids    :   Vec<u64>,
    pub admin               :   Option<String>,  
}


#[cw_serde]
pub struct MigrateMsg {}


#[registry_execute]
#[cw_serde]
pub enum ExecuteMsg {}


#[registry_query]
#[cw_serde]
#[derive(QueryResponses)]
pub enum QueryMsg {}

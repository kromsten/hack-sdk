use cosmwasm_schema::{cw_serde, QueryResponses};
use cosmwasm_std::Empty;
use cw83::{registry_execute, registry_query, AccountInfoResponse as AccountInfoResponseBase, AccountQuery, CreateAccountMsg
};


pub type AccountInfoResponse = AccountInfoResponseBase<Empty>;






#[cw_serde]
pub struct InstantiateMsg {}


#[cw_serde]
pub struct MigrateMsg {}


#[registry_execute]
#[cw_serde]
pub enum ExecuteMsg {


}

#[registry_query]
#[cw_serde]
#[derive(QueryResponses)]
pub enum QueryMsg {

   
}

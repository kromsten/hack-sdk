use cosmwasm_schema::{cw_serde, QueryResponses};
use cosmwasm_std::{Binary, CosmosMsg, Empty};
use cw82::smart_account_query;
use cw_ownable::cw_ownable_query;
use cw_utils::Expiration;
use saa::{schemars::JsonSchema, CredentialData, Verifiable};



#[cw_serde]
pub struct InstantiateAccountMsg<T: Verifiable = CredentialData> {
    pub account_data: T
}


#[cw_serde]
pub enum ExecuteAccountMsg<T = Empty,  E = Option<Empty>, A = Binary> {
    /// Proxy method for executing cosmos messages
    Execute { 
        msgs: Vec<CosmosMsg<T>> 
    },
 
    /// Registry only method to update the owner to the current NFT holder
    UpdateOwnership { 
        /// New owner
        new_owner: String, 
        /// New account data
        new_account_data: Option<A> 
    },

    /// Owner only method to update account data
    UpdateAccountData { 
        /// New account data
        new_account_data: A 
    },

    /// Extension
    Extension {
        msg: E
    }
}


#[smart_account_query]
#[cw_ownable_query]
#[cw_serde]
#[derive(QueryResponses)]
pub enum QueryAccountMsg <T = Binary, Q: JsonSchema = Empty> {

    /// Registry address
    #[returns(String)]
    Registry {},


    #[returns(())]
    Extension { msg: Q }
   
}


#[cw_serde]
pub struct MigrateAccountMsg<T = Empty> {
    pub params: Box<Option<T>>,
}

use common::{account::{ExecuteAccountMsg, InstantiateAccountMsg, MigrateAccountMsg, QueryAccountMsg}, CreateAccountMsg, ProxyData};
use cosmwasm_std::{Addr, Binary, CosmosMsg, CustomMsg, Empty, Response, Timestamp};
use cosmwasm_schema::cw_serde;
use saa::{CredentialData, CredentialId};

use crate::error::ContractError;


#[cw_serde]
pub struct AuthPayload {
    pub hrp:              Option<String>,
    pub address:          Option<String>,
    pub credential_id:    Option<CredentialId>,
}


#[cw_serde]
pub struct IndexedAuthPayload {
    pub payload: AuthPayload,
    pub index: u8
}


#[cw_serde]
pub enum ValidSignaturesPayload {
    Generic(AuthPayload),
    Multiple(Vec<Option<IndexedAuthPayload>>)
}


#[cw_serde]
pub struct CosmosMsgDataToSign {
    pub messages   :  Vec<CosmosMsg<Empty>>,
    pub chain_id   :  String,
    pub timestamp  :  Timestamp
}

impl CustomMsg for CosmosMsgDataToSign {}




#[cw_serde]
pub struct SignedCosmosMsgs {
    pub data        : CosmosMsgDataToSign,
    pub payload     : Option<AuthPayload>,
    pub signature   : Binary,
}


#[cw_serde]
pub struct SignedAccountActions {
    pub data        : Binary,
    pub payload     : Option<AuthPayload>,
    pub signature   : Binary,
}


impl CustomMsg for SignedCosmosMsgs {}
impl CustomMsg for SignedAccountActions {}


#[cw_serde]
pub struct FullInfoResponse {
    pub ownership: cw_ownable::Ownership<Addr>,
}



pub type ContractResponse = Response::<SignedCosmosMsgs>;
pub type ContractResult = Result<ContractResponse, ContractError>;

pub type ExecuteMsg = ExecuteAccountMsg<SignedCosmosMsgs, SignedAccountActions, CredentialData>;
pub type QueryMsg = QueryAccountMsg<SignedCosmosMsgs, Empty>;
pub type MigrateMsg = MigrateAccountMsg;



pub type InstantiateMsg = ProxyData;

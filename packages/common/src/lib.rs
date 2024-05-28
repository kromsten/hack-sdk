#![allow(unused_imports, unused_variables)]

use cosmwasm_schema::cw_serde;
use cosmwasm_std::Binary;
use cw_utils::Expiration;
use saa::CredentialData;




#[cw_serde]
pub struct SessionConfig {
    /// if true, the contract generate a session key that can be used to bypass need for supplying a signature
    /// the rest of the fields are ignored if this is false (default: true)
    pub generate_key            :   Option<bool>,
    /// if true, the generated session key can be used as the viewing key for querying data
    pub can_view                :   Option<bool>,
    /// optional expiration object for the newly generated session key
    pub expires                 :   Option<Expiration>,
}




#[cw_serde]
pub struct AbstractionParams {
    /// secret address generated in background used to sign transactions
    /// meant to be passed so that a contract can give it a feegrant
    pub feegrant_signer         :   Option<String>,
    /// if true, the contract generate a session key that can be used to bypass need for supplying a signature
    /// can be retrieved through authenticated queries. (default: true)
    pub session_config          :   Option<SessionConfig>,
}




#[cw_serde]
pub struct ProxyData {
    /// params that help to abstact interaction with Secret Network
    pub abstraction_params   :   AbstractionParams,
    /// data used to authenticate a user and authorise for actions in future
    pub auth_data            :   CredentialData,
    /// additional payload to execute action immdeiately after authentication or account creation
    pub payload              :   Option<Binary>
}


pub mod account;
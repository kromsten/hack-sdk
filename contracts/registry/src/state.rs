use cosmwasm_schema::cw_serde;
use cw_storage_plus::{Item, Map};
use saa::CredentialId;


type AccoundId = u64;




#[cw_serde]
pub struct CreationCache {  
    pub account_id          :      AccoundId,
    pub credentials_ids     :      Vec<CredentialId>,
    pub code_id             :      u64,
}


#[cw_serde]
pub struct ProxyAccountInfo {
    pub code_id             :     u64,
    pub contract_address    :     String,
}



pub const ALLOWED_CODE_IDS  :    Item<Vec<u64>>                     =     Item::new("acids");


pub const ACCOUNT_INDEX     :    Item<u64>                          =     Item::new("index");


pub const CREATION_CACHE    :    Item<CreationCache>                =     Item::new("cache");


pub const CREDENTIAL_IDS    :    Map<CredentialId, AccoundId>       =     Map::new("cred_ids");


pub const ACCOUNTS          :    Map<AccoundId, ProxyAccountInfo>   =     Map::new("accounts");
use std::borrow::BorrowMut;

use cosmwasm_std::{to_json_binary, Binary, Deps, DepsMut, Env, MessageInfo, Reply, Response, StdError, StdResult};
use cw_ownable::{get_ownership, is_owner};


#[cfg(not(feature = "library"))]
use cosmwasm_std::entry_point;

use crate::{
    error::ContractError, execute, msg::{ContractResult, InstantiateMsg, MigrateMsg, QueryMsg} 
};

use saa::Verifiable;

#[cfg(target_arch = "wasm32")]
use crate::utils::query_if_registry;

pub const CONTRACT_NAME: &str = "crates:cw82-temp";
pub const CONTRACT_VERSION: &str = env!("CARGO_PKG_VERSION");


#[cfg_attr(not(feature = "library"), entry_point)]
pub fn instantiate(deps: DepsMut, env : Env, info : MessageInfo, msg : InstantiateMsg) -> ContractResult {
    msg.auth_data.verify()?;

    return Ok(Response::new()
        .add_attributes(vec![
            ("action", "instantiate"),
        ])
    );
}


#[cfg_attr(not(feature = "library"), entry_point)]
pub fn query(deps: Deps, env : Env, msg: QueryMsg) -> StdResult<Binary> {
    todo!()
}


#[cfg_attr(not(feature = "library"), entry_point)]
pub fn migrate(deps: DepsMut, _: Env, _: MigrateMsg) -> ContractResult {
    todo!()
}


#[cfg_attr(not(feature = "library"), entry_point)]
pub fn reply(deps: DepsMut, env: Env, msg: Reply) -> ContractResult {
    todo!()
}
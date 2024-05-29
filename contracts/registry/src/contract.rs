#[cfg(not(feature = "library"))]
use cosmwasm_std::entry_point;
use cosmwasm_std::{DepsMut, Deps, Env, MessageInfo, Reply, StdResult, Binary, Response};

use cw82::Cw82Contract;
use cw83::CREATE_ACCOUNT_REPLY_ID;

use crate::{
    creation::{create_proxy_account, create_proxy_account_reply}, error::ContractError, msg::{ExecuteMsg, InstantiateMsg, MigrateMsg, QueryMsg}, query::query_account_info, state::{ACCOUNT_INDEX, ALLOWED_CODE_IDS} 
};

pub const CONTRACT_NAME: &str = "crates:registry";
pub const CONTRACT_VERSION: &str = env!("CARGO_PKG_VERSION");


#[cfg_attr(not(feature = "library"), entry_point)]
pub fn instantiate(deps: DepsMut, _ : Env, _ : MessageInfo, msg : InstantiateMsg) 
-> Result<Response, ContractError> {

    cw2::set_contract_version(deps.storage, CONTRACT_NAME, CONTRACT_VERSION)?;
    cw22::set_contract_supported_interface(
        deps.storage, 
        &[
            cw22::ContractSupportedInterface {
                supported_interface: cw83::INTERFACE_NAME.into(),
                version: CONTRACT_VERSION.into()
            }
        ]
    )?;

    ACCOUNT_INDEX.save(deps.storage, &0)?;
    ALLOWED_CODE_IDS.save(deps.storage, &msg.allowed_code_ids)?;
    // REGISTRY_PARAMS.save(deps.storage, &msg.params)?;

    Ok(Response::new()
        .add_attributes(vec![
            ("action", "instantiate"),
        ])
    )
}


#[cfg_attr(not(feature = "library"), entry_point)]
pub fn execute(deps: DepsMut, env : Env, info : MessageInfo, msg : ExecuteMsg) 
-> Result<Response, ContractError> {

    match msg {
        ExecuteMsg::CreateAccount(
            msg
        ) => create_proxy_account(
            deps, 
            env,
            info,
            msg
        ),
    }
}


#[cfg_attr(not(feature = "library"), entry_point)]
pub fn query(deps: Deps, _ : Env, msg: QueryMsg) -> StdResult<Binary> {
    match msg {
        QueryMsg::AccountInfo(
            acc_query
        ) => query_account_info(deps, acc_query.query),
    }
}



#[cfg_attr(not(feature = "library"), entry_point)]
pub fn reply(deps: DepsMut, env : Env, msg : Reply) 
-> Result<Response, ContractError> {
    create_proxy_account_reply(deps, env, msg)
}


#[cfg_attr(not(feature = "library"), entry_point)]
pub fn migrate(_: DepsMut, _: Env, _: MigrateMsg) -> StdResult<Response> {
    Ok(Response::default().add_attribute("action", "migrate"))
}
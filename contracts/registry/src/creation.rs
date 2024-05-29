use common::CreateAccountMsg;
use cosmwasm_std::{ensure, ensure_eq, from_json, to_json_binary, Api, DepsMut, Env, MessageInfo, Reply, Response, StdResult, Storage, SubMsg, SubMsgResult, WasmMsg};
use saa::CredentialsWrapper;


use crate::{
    error::ContractError, 
    state::{
        CreationCache, ProxyAccountInfo, 
        ACCOUNTS, ACCOUNT_INDEX, ALLOWED_CODE_IDS, CREATION_CACHE, CREDENTIAL_IDS
    } 
};


pub const CREATE_ACCOUNT_REPLY_ID   :   u64 = 1;


fn ensure_can_create(
    api         :   &dyn Api,
    storage     :   &dyn Storage,
    env         :   &Env,
    create_msg  :   &CreateAccountMsg
) -> Result<(), ContractError> {
    ensure_eq!(
        create_msg.chain_id, env.block.chain_id,
        ContractError::InvalidChainId {}
    );
    ensure!(
        !CREATION_CACHE.exists(storage),
        ContractError::Unauthorized {}
    );
    let code_ids = ALLOWED_CODE_IDS.load(storage)?;
    ensure!(
        code_ids.contains(&create_msg.code_id),
        ContractError::InvalidCodeId {}
    );
    let auth = &create_msg.msg.auth_data;
    if !auth.credentials.is_empty() {
        ensure!(
            auth.ids().iter().all(|id| {
                !CREDENTIAL_IDS.has(storage, id.clone())
            }), ContractError::AccountExists {}
        );
    };

    Ok(())
}


pub fn create_proxy_account(
    deps        :   DepsMut,
    env         :   Env,
    info        :   MessageInfo,
    create_msg  :   CreateAccountMsg,
) -> Result<Response, ContractError> {
    ensure_can_create(deps.api, deps.storage, &env, &create_msg)?;
    
    let label = format!("account-{}",  env.block.height);
    let cosmos_proxy = &create_msg.msg;
    let account_id = ACCOUNT_INDEX.load(deps.storage)?;

    CREATION_CACHE.save(deps.storage, &CreationCache {
        account_id,
        credentials_ids     : cosmos_proxy.auth_data.ids(),
        code_id             : create_msg.code_id,
    })?;


    let init_msg = WasmMsg::Instantiate { 
        msg: to_json_binary(&create_msg.msg)?, 
        code_id: create_msg.code_id,
        funds: info.funds, 
        label,
        admin: Some(env.contract.address.to_string())
    };

     return Ok(
        Response::new()
        .add_submessage(SubMsg::reply_on_success(
            init_msg,
            CREATE_ACCOUNT_REPLY_ID,
        ))
    ); 

}




pub fn create_proxy_account_reply(deps: DepsMut, _env: Env, msg: Reply) -> Result<Response, ContractError> {
    ensure!(msg.id == CREATE_ACCOUNT_REPLY_ID, ContractError::UnexpectedReplyId { id: msg.id });

    let res = cw_utils::parse_reply_instantiate_data(msg)?;
    deps.api.addr_validate(res.contract_address.as_str())?;

    let cashed = CREATION_CACHE.load(deps.storage)?;

    cashed.credentials_ids.iter()
        .map(|id| CREDENTIAL_IDS.save(
            deps.storage, 
            id.clone(), 
            &cashed.account_id
        ))
        .collect::<StdResult<Vec<()>>>()?;


    ACCOUNT_INDEX.save(deps.storage, &(cashed.account_id + 1))?;


    ACCOUNTS.save(
        deps.storage,
        cashed.account_id.clone(),
        &ProxyAccountInfo {
            code_id            :  cashed.code_id,
            contract_address   :  res.contract_address,
        }
    )?;

    CREATION_CACHE.remove(deps.storage);

    Ok(Response::default())
}

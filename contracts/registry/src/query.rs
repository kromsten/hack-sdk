
use common::{AccountCredential, AccountQuery};
use cosmwasm_std::{
    ensure, to_json_binary, Binary, Deps, Empty, Env, StdError, StdResult
};
use cw83::AccountInfoResponse;


use crate::state::{ACCOUNTS, CREDENTIAL_IDS};




pub fn query_account_info(
    deps        :   Deps, 
    cred        :   AccountCredential,
) -> StdResult<Binary> {

    let account_id = if let Some(cred_id) = cred.credential_id {
        CREDENTIAL_IDS.load(deps.storage, cred_id.0)?
    } else if let Some(account_id) = cred.account_id {
        account_id.u64()
    }else {
        return Err( StdError::NotFound { kind: "ProxyAccount".into() });
    };

    let account = ACCOUNTS.load(deps.storage, account_id)?;

    to_json_binary(&AccountInfoResponse::<Empty> {
        address: account.contract_address,
        info: None
    })
}

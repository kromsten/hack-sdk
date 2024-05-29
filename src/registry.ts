import { findConfigContract, loadContractConfig } from "./config";
import { executeContract, queryContract } from "./contract";
import { FIRST_CHAIN_ID } from "./env";
import { type AccountQuery, type ChainData, type Credential, type RegistryExecuteMsg, type RegistryQueryMsg } from "./types";



export const createAccountWithCaller = async (
    data            :       ChainData,
    credentials     :       Credential[],
) => {
    
    const account = findConfigContract("account", "first");

    const msg : RegistryExecuteMsg = {
        create_account: {
            chain_id: FIRST_CHAIN_ID!,
            code_id: account.code_id,
            msg: {
                abstraction_params: {},
                auth_data: { with_caller: true, credentials },
            }
        }
    }

    const tx = executeContract(
        data.firstSigningClient,
        data.firstAccount,
        "registry",
        "first",
        msg,
    )

    console.log("Create account tx: ", tx);
    return tx;
}



export const createAccount = async (
    data            :       ChainData,
    credentials     :       Credential[],
    with_caller?    :       boolean
) => {
    
    const account = findConfigContract("account", "first");

    const msg : RegistryExecuteMsg = {
        create_account: {
            chain_id: FIRST_CHAIN_ID!,
            code_id: account.code_id,
            msg: {
                abstraction_params: {},
                auth_data: { 
                    credentials,
                    with_caller: with_caller ?? false, 
                },
            }
        }
    }

    const tx = await executeContract(
        data.firstSigningClient,
        data.firstAccount,
        "registry",
        "first",
        msg,
    )

    return tx;
}



export const getAccountInfo = async (
    data            :       ChainData,
    query           :       AccountQuery
) => {

    const regQuery : RegistryQueryMsg = {
        account_info: {
            query
        }
    }    

    try {
        const res = await queryContract(
            data.firstQueryClient,
            "registry",
            "first",
            regQuery
        )
        return res;

    } catch (e : any) {
        return { error: e.toString() }
    }

}










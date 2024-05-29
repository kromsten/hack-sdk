import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { SigningCosmWasmClient, type WasmExtension  } from "@cosmjs/cosmwasm-stargate"
import type { GovExtension, IbcExtension, QueryClient } from "@cosmjs/stargate";
import type { IbcClient } from "@confio/relayer";

export type ContractName = "registry" | "account"
export type ChainType = "first" | "second";


export type ChainQueryClient = QueryClient & WasmExtension & IbcExtension & GovExtension;


export type ChainData = {
    firstWallet          : DirectSecp256k1HdWallet;
    secondWallet         : DirectSecp256k1HdWallet;
    firstAccount         : string;
    secondAccount        : string;
    firstSigningClient   : SigningCosmWasmClient;
    secondSigningClient  : SigningCosmWasmClient;
    firstQueryClient     : ChainQueryClient;
    secondQueryClient    : ChainQueryClient;
    firstIbcClient       : IbcClient;
    secondIbcClient      : IbcClient;
}


export type Contract = {
    code_id: number;
    name:    ContractName
    address?: string;
    migrate?: boolean;
}


export type ContractInfo = {
    contracts: Contract[];
}



export type ContractConfig = {
    contract_info_first?: ContractInfo;
    contract_info_second?: ContractInfo;
}

export type IbcInfo = {
    connectionId : string;
    clientId: string;
    portId: string;
    channelId: string;
}


export type IBCConfig = {
    first:  IbcInfo
    second: IbcInfo
}


export type GasConfig = {
    gasUsage: {
        [operation: string]: {
            gasUsed: string;
            txHash: string;
        }
    }
}


export type Expiration = 
    { at_height: number }  | 
    { at_time: string }    | 
    { never: {} };



export type SessionConfig = {
    generate_key?       :   boolean,
    can_view?           :   boolean,
    expires?            :   Expiration
}


export type AbstractionParams = {
    session_config?                 :   SessionConfig,
    feegrant_signer?                :   string,
}


export type Caller = {}

export interface EvmCredential {
    message     :   string
    signature   :   string
    signer      :   string
}

export interface Secp256K1 {
    message     :   string;
    signature   :   string;
    pubkey      :   string;
    hrp?        :   string;
}

export interface Ed25519 {
    message     :   string;
    signature   :   string;
    pubkey      :   string;
}


export interface CosmosArbitrary {
    message     :   string;
    signature   :   string;
    pubkey      :   string;
    hrp?        :   string;
}



export type Credential = 
    { caller: Caller } | 
    { evm: EvmCredential } | 
    { secp256k1: Secp256K1 } | 
    { ed25519: Ed25519 } | 
    { cosmos_arbitrary: CosmosArbitrary };



export type CredentialData = {
    credentials         :   Credential[],
    with_caller?        :   boolean,
    primary_index?      :   number
}



export type CosmosProxyMsg = {
    abstraction_params          :       AbstractionParams,
    auth_data                   :       CredentialData,
    extension?                  :       {}
}


export type CreateAccountMsg = {
    code_id         :       number,
    chain_id        :       string,
    //label?          :       string
    msg             :       CosmosProxyMsg
}



export type AccountQuery = {
    account_id?     :   string,
    credential_id?  :   string,
}


export type RegistryInitMsg = {
    allowed_code_ids         :       number[],
    admin?                   :       string
}

export type RegistryExecuteMsg = 
    { create_account: CreateAccountMsg } |
    { extension: { msg: {} } }           


export type RegistryQueryMsg = 
    { account_info: {  query: AccountQuery  } }  |
    { allowed_code_ids: {}  }    
   
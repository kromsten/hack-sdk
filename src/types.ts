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
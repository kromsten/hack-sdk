
import type { ExecuteResult, IndexedTx, SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import type { ChainData, ChainQueryClient, ChainType, ContractName, RegistryInitMsg } from "./types";

import { readFileSync, existsSync } from "fs"
import { loadContractConfig, updateGasUsage } from "./config";
import { findConfigContract, updateCodeId, updateContractAddress } from "./config";



const GET_MESSAGE_ATTEMPTS_MAX = 3;
const GET_MESSAGE_ATTEMPTS_DELAY = 2000;

const CONTRACT_FOLDER = "artifacts/"


export const nameToFilePath = (contract_name: ContractName) => {
    let fileName : string;

    if (contract_name == "registry") {
        fileName = "cw83_temp";
    } else if (contract_name == "account") {
        fileName = "cw82_temp";
    } else {
        fileName = contract_name;
    }
    return CONTRACT_FOLDER + fileName + ".wasm";
}


export const nameToInitMsg = async (
    name            : ContractName, 
    chain           : ChainType,
    _attempt        : number = 1
)   => {

    if (name == "account") {

        return {}

    } else if (name == "registry") {

        const msg : RegistryInitMsg = {
            allowed_code_ids: [findConfigContract("account", chain).code_id],
        }
        return msg
    } else {
        throw new Error("Can't get instantiate message for " + name + " contract");
    }
}


export const uploadContract = async (
    client: SigningCosmWasmClient,
    sender: string,
    name: ContractName,
    chain: ChainType
) : Promise<number> => {

    const wasmPath = nameToFilePath(name);

    if (!existsSync(wasmPath)) {
        throw new Error(name + " contract not found");
    }

    console.log("Uploading contract", name + ".wasm to", chain, "chain");
    
    const wasm_byte_code = readFileSync(wasmPath) as Uint8Array;

    try {
        const res = await client.upload(sender, wasm_byte_code, "auto")
        console.log("Successfull uploaded", name, "with code id", res.codeId, "to", chain, "chain. Used gas:", res.gasUsed, "\n");
        updateGasUsage(name, "upload", res.transactionHash, res.gasUsed.toString(10));
        updateCodeId(res.codeId, name, chain);
        return res.codeId;

    } catch (error) {   
        throw new Error("Error uploading " + name + " contract: " + error);
    }

}



export const instantiateContract = async (
    client: SigningCosmWasmClient,
    sender: string,
    code_id: number,
    name: ContractName,
    chain: ChainType
) : Promise<string> => {
    
    const initMsg = await nameToInitMsg(name, chain);
    console.log("Instantiating contract", name, "from code id", code_id, "on", chain, "chain");

    try {
        const res = await client.instantiate(
            sender, 
            code_id, 
            initMsg, 
            `${name}-${new Date().toISOString()}`,
            "auto",
            { admin: sender }
        );
        console.log("Successfully instantiated", name, "with contract address", res.contractAddress, "on", chain,  "chain. Used gas:", res.gasUsed, "\n");
        updateGasUsage(name, "instantiate", res.transactionHash, res.gasUsed.toString(10));
        updateContractAddress(res.contractAddress, code_id, chain);
        return res.contractAddress

    } catch (error) {
        
        throw new Error("Error instantiating " + name + " contract: " + error);
    }
}







export const queryContract = async (
    client : ChainQueryClient,
    name   : ContractName,
    chain  : ChainType,
    query  : object
) : Promise<any> => {
    const contract = findConfigContract(name, chain);
    try {
        return await client.wasm.queryContractSmart(contract.address!, query);
    } catch (error) {
        throw new Error("Error querying " + name + " contract with" +  JSON.stringify(query) + " on " + chain + " chain: " + error);
    }
}



export const executeContract = async (
    client : SigningCosmWasmClient,
    sender : string,
    contract: ContractName,
    chain: ChainType,
    msg: object,
) : Promise<ExecuteResult> => {

    const contractInfo = findConfigContract(contract, chain);
    const operation = Object.keys(msg)[0];

    try {
        const res = await client.execute(sender, contractInfo.address!, msg, "auto");
        updateGasUsage(contract, operation, res.transactionHash, res.gasUsed.toString(10));
        return res;
    } catch (error) {
        throw new Error("Error executing " + contract + " contract with " +  JSON.stringify(msg) + " on " + chain + " chain: " + error);
    }
}




export function queryBothChains<T> (
    chainData: ChainData, 
    querier: (client: ChainQueryClient, chain: ChainType) => Promise<T>
) : Promise<[T, T]> {
    return Promise.all([
        querier(chainData.firstQueryClient,  "first"),
        querier(chainData.secondQueryClient, "second")
    ]);
}


export function queryBothChainsWithArg<T, A> (
    chainData: ChainData, 
    querier: (client: ChainQueryClient, chain: ChainType, arg: A) => Promise<T>,
    firstArg: A,
    secondArg: A
) : Promise<[T, T]> {
    return Promise.all([
        querier(chainData.firstQueryClient,  "first", firstArg),
        querier(chainData.secondQueryClient, "second", secondArg)
    ]);
}




export const queryContractsEvents = async (
    client : SigningCosmWasmClient,
    sender : string,
    contract: ContractName,
    chain: ChainType,
 ) : Promise<IndexedTx[]> => {
    const contractInfo = findConfigContract(contract, chain);

    const query = [

    
          {
            key: "message.module",
            value: "wasm"
          },
    
          {
            key: "wasm._contract_address",
            value: contractInfo.address!
          },
    ];

    const res = await client.searchTx(query);

    return res;
}

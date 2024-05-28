import * as env from './env';
import initChain from './chain';
import type { ChainData, ChainType, ContractConfig, Contract, ContractName } from './types';
import { initContractConfig, loadContractConfig, saveContractConfig, saveIbcConfig, ibcConfigExists } from './config';

import type { SigningCosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { instantiateContract, uploadContract } from './contract';
import { initGasConfig } from './config';
import { sys } from 'typescript';
import { ClientState } from "cosmjs-types/ibc/lightclients/tendermint/v1/tendermint";
import { State } from "cosmjs-types/ibc/core/connection/v1/connection";



export const contractsToUpload = () : ContractName[] => {
    // registry, account
    return [  ]
}



export const checkedEnv = async () => {

    Object.entries(env).forEach(([key, value]) => {
        if (value === undefined) {
            throw new Error("Environment variable " + key + " is not defined");
        }

        if (value === "") {
            throw new Error("Environment variable " + key + " is not set");
        }
    });
    return env;
}


/// Uploads a new version of the contract using a wasm file and instantiates it
/// Updates `code_id` and `address` of the contract object passed as an argument 
/// and returns the updated version
export const updatedContract = async (
    client   : SigningCosmWasmClient,
    sender   : string,
    contract : Contract,
    chain    : ChainType
) : Promise<Contract> =>{
    
    try {
        const codeId = await uploadContract(client, sender, contract.name, chain);
        contract.code_id = codeId;
    } catch (error) {
        throw new Error("Error uploading " +  contract.name + " contract: " + error);
    }
    return await updatedContractAddress(client, sender, contract, chain);
}


/// Instantiates the contract using a message defined in `types.ts`
/// Updates `address` of the contract object passed as an argument and returns the updated version
export const updatedContractAddress = async (
    client   : SigningCosmWasmClient,
    sender   : string,
    contract : Contract,
    chain    : ChainType
) : Promise<Contract> =>{
    try {
        return {
            ...contract,
            address: await instantiateContract(client , sender, contract.code_id, contract.name, chain)
        }
    } catch (error) {
        throw new Error("Error instantiating " + contract.name + " contract: " + error);
    }
}

/// simply uploads and instantiates all known contracts
export const initContracts = async (
    client: SigningCosmWasmClient, 
    sender: string,
    chain: ChainType
) : Promise<Contract[]> => {
    const contracts : Contract[] = [];

    for (const name of contractsToUpload()) {
        contracts.push(await updatedContract(client, sender, { name, code_id: 0 }, chain));
    }
    return contracts;
}


/// checks if:
/// - contract configiration file missing any of the mandatory contracts
/// - all the code ids from the contracts are found on the chain
/// - all the contract addresses are found on the chain
/// Does the deployments if they were necessary and tell if changes were made
/// Return `updated` boolean and a list of the "checked" contracts
export const checkedChainContracts = async (
    client: SigningCosmWasmClient, 
    sender: string,
    contracts: Contract[],
    chain: ChainType
) : Promise<{ updated: boolean, contracts: Contract[] }> => {
    const codes = await client.getCodes();
    const checkedContracts : Contract[] = [];
    let updated = false;

    const mustContracts = contractsToUpload();
    
    for (let i = 0; i < mustContracts.length; i++) {
        const name = mustContracts[i];
        const index = contracts.findIndex(x => x.name === name)
        const indexInMust = mustContracts.findIndex(x => x === name);
        if (index === -1 && indexInMust >= i) {
                updated = true;
                console.log(`Contract ${name} not found on chain. Uploading`);
                checkedContracts.push(
                    await updatedContract(client, sender, { name, code_id: 0 }, chain)
                );
        }
    }


    for (const contract of contracts) {

        if (contract.migrate && contract.address ) {
            const codeId = await uploadContract(client, sender, contract.name, chain);
            contract.code_id = codeId;
            contract.migrate = false;
            console.log("Migrating " + contract.name + " contract");
            await client.migrate(sender, contract.address, contract.code_id, {}, "auto")
            checkedContracts.push(contract);
        } else if (!codes.find(x => x.id === contract.code_id)) {
            updated = true;
            console.warn(`Code id for ${contract.name} not found on chain. Re-uploading`);
            checkedContracts.push(
                await updatedContract(client, sender, contract, chain)
            );
        } else {
            const inited = await client.getContracts(contract.code_id);
            const last = inited.length ? inited[inited.length - 1] : undefined;
            if (contract.address && last && last == contract.address) {

                checkedContracts.push(contract);

            } else {
                console.warn(`Contract address for ${contract.name} not found on chain. Re-instantiating`);
                updated = true;
                checkedContracts.push(
                    await updatedContractAddress(client, sender, contract, chain)
                );
            }
        }
    }

    for (const name of mustContracts) {
        if (!checkedContracts.find(x => x.name === name)) {
            updated = true;
            console.warn(`Contract ${name} not found on chain. Uploading`);
            checkedContracts.push(
                await updatedContract(client, sender, { name, code_id: 0 }, chain)
            );
        }
    }
    
    return { updated, contracts: checkedContracts };
}


/// checks whether there are contract to deploy to each chain and the configuration for them is valid
/// auto-deploy and auto-update the configuration if necessary
export const checkedContracts = async (data: ChainData) : Promise<ContractConfig> => {
    const config = loadContractConfig();

    const cif = config.contract_info_first;
    const cis = config.contract_info_second;

    const bothDefined    = Boolean(cif) && Boolean(cis);
    const onlyOneDefined = Number(Boolean(cif)) ^ Number(Boolean(cis));
    const noneDefined    = !Boolean(cif) && !Boolean(cis);

    if (onlyOneDefined) {
        // expect atomicity and only proceeds if both are defined
        // reset both and run again
        saveContractConfig({...config, contract_info_first: undefined, contract_info_second: undefined});
        return await checkedContracts(data);

    } else if (bothDefined) {
        
        const [firstChecked, secondChecled] = await Promise.all([
            checkedChainContracts(data.firstSigningClient, data.firstAccount, cif!.contracts, "first"),
            checkedChainContracts(data.secondSigningClient, data.secondAccount, cis!.contracts, "second")
        ]);

        if (firstChecked.updated) {
            config.contract_info_first = { contracts: firstChecked.contracts };
        }

        if (secondChecled.updated) {
            config.contract_info_second = { contracts: secondChecled.contracts };
        }
        
    } else if (noneDefined) {
        
        const [first, second] = await Promise.all([
            initContracts(data.firstSigningClient, data.firstAccount, "first"),
            initContracts(data.secondSigningClient, data.secondAccount, "second")
        ]);
        config.contract_info_first = { contracts: first };
        config.contract_info_second = { contracts: second };
    } else {
        throw new Error("Runtime Error: Should not reach this point");
    }
    saveContractConfig(config);
    return config;
}





export const checkedSetup = async () : Promise<ChainData> => {
    await checkedEnv();
    await initContractConfig();
    await initGasConfig();
    const chainData = await initChain();
    await checkedContracts(chainData);
    await checkedIbc(chainData);
    return chainData;
}





const getIbcConnection = async (data: ChainData) => {

    let firstConn, secondConn;

    const firstStates  = await data.firstQueryClient.ibc.client.allStates();
    const firstClients : string[] = []

    for (const state of firstStates.clientStates) {
        if (state.clientId.includes("localhost") || !state.clientState) continue;
        try {
            const stateRes = ClientState.decode(state.clientState.value);
            if (stateRes.chainId == env.SECOND_CHAIN_ID) {
                firstClients.push(state.clientId);
            }
        } catch (error) {
            console.log("Error", error)
        }
    }

    for (const clientId of firstClients.reverse()) {
        try {
            const clcs = await data.secondQueryClient.ibc.connection.clientConnections(clientId);

            if (clcs.connectionPaths.length == 1) {
                const id = clcs.connectionPaths[0];
                
                const secConnRes = await data.secondQueryClient.ibc.connection.connection(id);
                
                if (secConnRes.connection?.state == State.STATE_OPEN) {
                    
                    console.log("Second Conn", id, secConnRes)
                    //console.log("Connection found", secConnRes.connection)
                    
                    const conn = secConnRes.connection;
                    firstConn = { id, clientId }
                    secondConn = { id: conn.counterparty.connectionId, clientId: conn.counterparty.clientId }
                    break;
                }
                
            }
        } catch (error) {
            console.log("Error", error)
        }
    }

    return [firstConn, secondConn];
}



export const checkedIbc = async (data: ChainData)  => {

    if (ibcConfigExists()) return;

    const [firstConn, secondConn] = await getIbcConnection(data);

    if (!firstConn || !secondConn) {
        console.log("No connection found between the chains")
        sys.exit(1);
        return;
    }

    const channels =  (await data.firstQueryClient.ibc.channel.channels()).channels;
    
    const channel = channels.findLast((ch : any) => (ch.state == 3 && ch.portId == "transfer"));

    if (!channel) {
        console.log("No channel found between the chains")
        sys.exit(1);
        return;
    }
    
    saveIbcConfig({
        first: {
            clientId: firstConn.clientId,
            connectionId: firstConn.id,
            channelId: channel.channelId,
            portId: channel.portId
        },
        second: {
            clientId: secondConn.clientId,
            connectionId: secondConn.id,
            channelId: channel.counterparty.channelId,
            portId: channel.counterparty.portId
        }
    })

}

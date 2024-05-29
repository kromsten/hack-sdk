import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { SigningCosmWasmClient, setupWasmExtension  } from "@cosmjs/cosmwasm-stargate"
import { Comet38Client } from "@cosmjs/tendermint-rpc";
import { FIRST_ENDPOINT, FIRST_MNEMONIC, FIRST_PREFIX, FIRST_TOKEN, SECOND_ENDPOINT, SECOND_MNEMONIC, SECOND_PREFIX, SECOND_TOKEN  } from './env';
import type { ChainData, ChainQueryClient, ChainType } from "./types";
import { Decimal } from "@cosmjs/math";
import { sleep } from "bun";

import { IbcClient } from "@confio/relayer";

import { setupIbcExtension, QueryClient, setupGovExtension } from '@cosmjs/stargate';

const CONNECT_INTERVAL       = 3000;
const CONNECT_MAX_ATTEMPTS   = 10;


const gasPricer = (denom : string, amount?: string) => ({ amount: Decimal.fromUserInput(amount ?? "0.025", 6), denom } );
const gasPrice  = gasPricer(FIRST_TOKEN!);


export let firstWallet  : DirectSecp256k1HdWallet | undefined = undefined
export let secondWallet : DirectSecp256k1HdWallet | undefined = undefined

export let firstAccount  : string | undefined = undefined
export let secondAccount : string | undefined = undefined

export let firstSigningClient  : SigningCosmWasmClient | undefined = undefined
export let secondSigningClient : SigningCosmWasmClient | undefined = undefined

export let firstQueryClient  : ChainQueryClient | undefined = undefined
export let secondQueryClient : ChainQueryClient | undefined = undefined

export let firstIbcClient  : IbcClient | undefined = undefined;
export let secondIbcClient : IbcClient | undefined = undefined;


export const getAccount = async (chain: ChainType) => {
    if (chain === "first") {
        if (firstAccount) return firstAccount;
        if (firstWallet) {
            const accounts = await firstWallet.getAccounts();
            firstAccount = accounts[0].address;
            return firstAccount;
        }
        return undefined;
    } else if (chain === "second") {
        if (secondAccount) return secondAccount;
        if (secondWallet) {
            const accounts = await secondWallet.getAccounts();
            secondAccount = accounts[0].address;
            return secondAccount;
        }
        return undefined;
    } else {
        return undefined;
    }
}


export const initWallets = async () => {
    if (!firstWallet || !firstAccount) {
        firstWallet = await DirectSecp256k1HdWallet.fromMnemonic(FIRST_MNEMONIC!, {
            prefix: FIRST_PREFIX
        });
        firstAccount = (await firstWallet.getAccounts())[0].address;
    }

    if (!secondWallet || !secondAccount) {
        secondWallet = await DirectSecp256k1HdWallet.fromMnemonic(SECOND_MNEMONIC!, {
            prefix: SECOND_PREFIX
        });
        secondAccount = (await secondWallet.getAccounts())[0].address;
    }

    return { firstWallet, secondWallet, firstAccount, secondAccount }
}


export const initClients = async (
    firstWallet     : DirectSecp256k1HdWallet, 
    secondWallet    : DirectSecp256k1HdWallet,
    attempt         : number = 1
) : Promise<{ 
    firstSigningClient  : SigningCosmWasmClient,
    secondSigningClient : SigningCosmWasmClient,
    firstQueryClient    : ChainQueryClient,
    secondQueryClient   : ChainQueryClient,
    firstIbcClient      : IbcClient,
    secondIbcClient     : IbcClient
}> => {

    if (!(firstQueryClient && firstIbcClient && firstSigningClient 
        && secondQueryClient && secondIbcClient && secondSigningClient)) {
    
        try {
            const [firstClient, secondClient] = await Promise.all([
                Comet38Client.connect(FIRST_ENDPOINT!),
                Comet38Client.connect(SECOND_ENDPOINT!)
            ]);

    
            [firstSigningClient, secondSigningClient] = await Promise.all([
                SigningCosmWasmClient.createWithSigner(firstClient, firstWallet, { gasPrice }),
                SigningCosmWasmClient.createWithSigner(secondClient, secondWallet, { 
                    gasPrice
                }),
            ]);
    
            firstQueryClient  = QueryClient.withExtensions(firstClient, setupWasmExtension, setupIbcExtension, setupGovExtension);
            secondQueryClient = QueryClient.withExtensions(secondClient, setupWasmExtension, setupIbcExtension, setupGovExtension);
    
            firstIbcClient =  await IbcClient.connectWithSigner(FIRST_ENDPOINT!, firstWallet, firstAccount!, { 
                estimatedBlockTime: 6000, 
                estimatedIndexerTime: 600,  
                gasPrice 
            })
    
            secondIbcClient = await IbcClient.connectWithSigner(SECOND_ENDPOINT!, secondWallet, secondAccount!, { 
                estimatedBlockTime: 6000, 
                estimatedIndexerTime: 600,  
                gasPrice: gasPricer(SECOND_TOKEN!, ) 
            })
    
            
        } catch (error) {
            console.log("Error connecting to clients: ", error);
    
            if (attempt >= CONNECT_MAX_ATTEMPTS) {
                throw new Error("Max connection attempts reached. Could not connect to the chains");
            }
    
            console.log("Retrying in ", Math.round(CONNECT_INTERVAL / 1000), "seconds\n");        
            await sleep(CONNECT_INTERVAL);
            return await initClients(firstWallet, secondWallet, attempt + 1);
        }
    }



    return { 
        firstSigningClient, secondSigningClient, 
        firstQueryClient, secondQueryClient, 
        firstIbcClient, secondIbcClient
    }
}


export const initChain = async () : Promise<ChainData> => {
    const wallets = await initWallets();
    const clients = await initClients(wallets.firstWallet, wallets.secondWallet);
    return { ...wallets, ...clients }
}


export const getChainData = initChain;


export default initChain;
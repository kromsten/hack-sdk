import { expect, describe, test } from 'vitest';
import { createAccount, getAccountInfo } from '../src/registry';
import type { ChainData, Credential } from '../src/types';
import { getChainData } from '../src/chain';
import { beforeAll } from 'bun:test';
import { FIRST_PREFIX } from '../src/env';

describe('Account Creation', () => {


    let data : ChainData;

    const signer = "cosmos1pkptre7fdkl6gfrzlesjjvhxhlc3r4gmmk8rs6";
    const pubkey = "A08EGB7ro1ORuFhjOnZcSgwYlpe0DSFjVNUIkNNQxwKQ";

    const credentials : Credential[] = [
        { 
            cosmos_arbitrary: {
                message:  "SGVsbG8sIHdvcmxk",
                signature: "x9jjSFv8/n1F8gOSRjddakYDbvroQm8ZoDWht/Imc1t5xUW49+Xaq7gwcsE+LCpqYoTBxnaXLg/xgJjYymCWvw==",
                pubkey,
                hrp:  "cosmos"
        }
    }]

    beforeAll(async () => {
        data = await getChainData();
    })


    test('Creating an account', async () => {
        const res = await createAccount(data, credentials) 
        const event = res.events.find((e : any) => e.type === "instantiate");
        const attribute = (event?.attributes ?? []).find((a : any) => a.key === "_contract_address");
        expect(attribute).toBeDefined();
        
        const accountAddress = attribute!.value;
        expect(accountAddress).toContain(FIRST_PREFIX);

        let info : any = await getAccountInfo(data, { account_id: "0" })
        expect(info.address).toBeDefined();
        expect(info.address).toEqual(accountAddress);

        info = await getAccountInfo(data, { account_id: "1" })
        expect(info.error).toContain("not found")

        info = await getAccountInfo(data, { credential_id: pubkey })
        expect(info.address).toEqual(accountAddress);
    });

});

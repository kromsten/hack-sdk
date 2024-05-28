import type { ChainData } from '../src/types';
import { describe, beforeAll, expect } from 'vitest';
import { getChainData } from '../src/chain';


describe('Setup tests', () => {
    let chainData : ChainData;

    beforeAll(async () => {
        try {
            chainData = await getChainData();
        } catch (e: any) {
            console.error(`Error getting chain data: ${e.message}`);
            process.exit(1);
        }
        expect(chainData).toBeDefined();
    })
});

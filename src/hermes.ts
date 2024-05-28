import { findConfigContract } from "./config";
import { FIRST_CHAIN_ID, SECOND_CHAIN_ID } from "./env";

export type CreateChannelPost = {
    firstContract: string;
    secondContract: string;
    firstConnection?: string;
}




export const createChannelWithHermes = async (
    post : CreateChannelPost,
    config_dir    : string = "./hermes/configLocal.toml"
) : Promise<string>  => {
    const hermes = Bun.which("hermes");
    const commandCommon = `${hermes} --config ${config_dir} create channel --a-chain ${FIRST_CHAIN_ID}  --a-port wasm.${post.firstContract} --b-port wasm.${post.secondContract} --channel-version ics-xcall --order ordered `;
    const command =  `${hermes} version` // commandCommon + (post.firstConnection ? ` --a-connection ${post.firstConnection}` : `--b-chain test-2  --new-client-connection`);
    console.log("Creating a channel with hermes using:\n" + command);
    const res = await Bun.$`${command}`;
    const text = res.stdout.toString();
    console.log("res:", res.stderr.toString(), res.stdout.toString())
    //console.log("Channel creation with Hermes", res);
    return text;
}




export const createChannelWithHermesRes = async (
    post : CreateChannelPost,
    CONFIG_DIR    : string
) : Promise<Response>  => {
    try {
        return new Response(await createChannelWithHermes(post, CONFIG_DIR));
    } catch (e: any) {
        return new Response(`Error creating channel with hermes:\n${e.message}`, {status: 500});
    }
}

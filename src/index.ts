import Bun from "bun";

const env = Bun.env;

let HERMES_BINARY : string;
let CONFIG_DIR    : string;

const PORT = 8080;
const DEFAULT_TIMEOUT = 10_000 // 10 seconds
const STATUS_INTERVAL_STEP = 1000; // 1 second
const TEST_RETRIES_MAX = 3;



let testsScheduledTimeout : Timer | null = null;
let scheduledStatusInterval : Timer | null = null;
let scheduledStatusStep  : number = 0;


const populateEnv = async () => {

    HERMES_BINARY = Bun.which("hermes") ?? env.HERMES_BINARY ?? "hermes";

    if (env.NODE_ENV !== "production") {
        CONFIG_DIR = "configs/config.toml";

        try {
            await testHermes();
        } catch (e: any) {
            console.error(`Error testing hermes: ${e.message}`);
            process.exit(1);
        }
        return;
    }
    CONFIG_DIR = env.CONFIG_DIR! ?? "/app/network/hermes/config.toml";
}



const resetSchedule = () => {
    if (testsScheduledTimeout) {
        clearTimeout(testsScheduledTimeout!);
        testsScheduledTimeout = null;
    };

    if (scheduledStatusInterval) {
        clearInterval(scheduledStatusInterval!);
        scheduledStatusInterval = null;
    }

    scheduledStatusStep = 0;
}


// Call runTests in 10 seconds
const scheduleTests = async () => {
    resetSchedule()
    if (env.NODE_ENV !== "production") {
        console.log("\nRunning tests automatically in 5 seconds\n")
        testsScheduledTimeout = setTimeout(runTests, 5_000);
    } else {
        scheduledStatusStep =  Math.floor(DEFAULT_TIMEOUT / STATUS_INTERVAL_STEP) - 1;
        scheduledStatusInterval = setInterval(scheduleTaskStatusStep, STATUS_INTERVAL_STEP);
        testsScheduledTimeout = setTimeout(runTests, DEFAULT_TIMEOUT);
    }
}


const scheduleTaskStatusStep = () => {
    if (!testsScheduledTimeout) return;

    if (scheduledStatusStep > 0) {
        console.log(`\nRUNNING TESTS IN ${scheduledStatusStep} SECONDS\n`);
    } else {
        console.log(`\nRUNNING TESTS NOW\n`);
    }
    scheduledStatusStep = Math.max(0, scheduledStatusStep - 1);
}


const runTests = async (attempt = 0) => {
    resetSchedule();
    try {
        const res = await Bun.$`bun test --timeout 20000`.text();
        console.log("Ran bun tests. Results:\n")
        console.log(res)

    } catch (e: any) {
        console.error(`Error running tests: ${e.message}`);
        if (attempt >= TEST_RETRIES_MAX) {
            console.error("Max test retries reached. Exiting");
            process.exit(1);
        } else {
            console.log("Retrying in 5 seconds\n");
            await new Promise(resolve => setTimeout(resolve, 5_000));
            runTests(attempt + 1);
        }
    }
}

// get env variabls and populate the command


const testBash = async () : Promise<Response> => {
    const listDir = await Bun.$`echo "Hello, World!"`;
    // @ts-ignore
    const message = listDir.text()
    return new Response(message);
}

const testLs = async () : Promise<Response> => {
    const listDir = await Bun.$`ls -la`;
    // @ts-ignore
    const message = listDir.text()
    return new Response(message);
}

export const testHermes = async () : Promise<Response> =>  {
    const version = await Bun.$`${HERMES_BINARY} --version`;
    // @ts-ignore
    const message = version.text()
    return new Response(message);
}


const main = async () => {
    await populateEnv();
    await scheduleTests();
}


try {
    if (import.meta.path === Bun.main) {
        main();
    }
} catch (e: any) {
    console.error(`Error: ${e.message}`);
}



require('dotenv').config();
const { processMessage } = require('./api/brain');

async function runTest() {
    console.log("--- TESTING BRAIN ---");
    const key = process.env.GOOGLE_API_KEY;
    console.log("API Key Present:", !!key);
    if (key) console.log("API Key Length:", key.length);

    // Test just one query to debug
    const q = "help me buy furniture";
    console.log(`\nQ: "${q}"`);
    const result = await processMessage(q);
    console.log("A:", result);
}

runTest();

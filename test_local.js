require('dotenv').config();
const { processMessage } = require('./api/brain');

async function runTest() {
    console.log("--- TESTING BRAIN ---");
    const key = process.env.GOOGLE_API_KEY;
    console.log("API Key Present:", !!key);

    const q = "dimensions of B-MLT-KT beds";
    console.log(`\nQ: "${q}"`);

    const result = await processMessage(q);
    console.log("A:", result);
}

runTest();

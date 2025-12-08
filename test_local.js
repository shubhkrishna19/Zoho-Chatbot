require('dotenv').config();
const { processMessage } = require('./api/brain');

async function runTest() {
    console.log("--- TESTING BRAIN ---");
    const key = process.env.GOOGLE_API_KEY;
    console.log("API Key Present:", !!key);

    const q = "dimensions of Malt Bed";
    console.log(`\nQ: "${q}"`);

    // This query tests the "Product Name Mapping" logic.
    // "Malt Bed" is mapped to SKU "B-MLT-KT" in product_names.json

    const result = await processMessage(q);
    console.log("A:", result);
}

runTest();

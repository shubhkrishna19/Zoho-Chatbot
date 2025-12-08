require('dotenv').config();
const brain = require('./api/brain');

// Run Test
(async () => {
    console.log("--- TESTING BRAIN ---");
    console.log("API Key Present:", !!process.env.GOOGLE_API_KEY);

    const queries = [
        "dimensions of skiddo tv unit",
        "dimensions of andre wardrobe",
        "buy me tv unit"
    ];

    for (const q of queries) {
        console.log(`\nQ: "${q}"`);
        const result = await brain.processMessage(q);
        console.log("A:", result);
    }
})();

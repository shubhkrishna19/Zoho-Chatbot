require('dotenv').config();
const brain = require('./api/brain');

// Run Test
(async () => {
    console.log("--- TESTING BRAIN DEBUG ---");
    const key = process.env.GOOGLE_API_KEY;
    console.log("API Key configured:", key ? "YES (" + key.substring(0, 5) + "...)" : "NO");

    const query = "how can you help me"; // User reported failure
    console.log(`\nQ: "${query}"`);

    try {
        const result = await brain.processMessage(query);
        console.log("A:", JSON.stringify(result, null, 2));
    } catch (e) {
        console.error("TEST CRASHED:", e);
    }
})();

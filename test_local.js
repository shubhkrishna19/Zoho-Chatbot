require('dotenv').config();
const brain = require('./api/brain');

(async () => {
    console.log('--- LOCAL BRAIN SMOKE TEST ---');
    const key = process.env.MINIMAX_API_KEY;
    console.log('MiniMax API key configured:', key ? `YES (${key.substring(0, 5)}...)` : 'NO');

    const queries = [
        'Show me TV Units',
        'Return policy',
        'Track my order',
    ];

    for (const query of queries) {
        const result = await brain.processMessage(query);
        console.log(`\nQ: ${query}`);
        console.log(JSON.stringify(result, null, 2));
    }
})().catch((error) => {
    console.error('LOCAL TEST FAILED:', error);
    process.exit(1);
});

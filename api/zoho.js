const { processMessage } = require('./brain');

const DEBUG_LOGGING = (process.env.DEBUG_LOGGING || '').toLowerCase() === 'true';

function sanitizePayload(body) {
    if (!body || typeof body !== 'object') return body;
    const clone = { ...body };
    if (clone.data && clone.data.message) {
        clone.data = { ...clone.data, message: '[redacted]' };
    }
    if (clone.message) clone.message = '[redacted]';
    if (clone.text) clone.text = '[redacted]';
    return clone;
}

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        if (DEBUG_LOGGING) {
            console.log("--- ZOHO PAYLOAD ---");
            console.log(JSON.stringify(req.body, null, 2));
        } else {
            console.log("Zoho request received", JSON.stringify(sanitizePayload(req.body)));
        }

        // 1. Handle "Trigger" Event (Chat Started)
        if (req.body && req.body.handler === 'trigger') {
            return res.json({
                replies: [{ text: "Hi! How can I help you with your furniture today?" }]
            });
        }

        // 2. Extract message from Zoho format
        let userMessage = '';
        let rawMessage = (req.body?.data?.message) || req.body?.message || req.body?.text;

        if (rawMessage) {
            if (typeof rawMessage === 'string') {
                userMessage = rawMessage;
            } else if (typeof rawMessage === 'object') {
                userMessage = rawMessage.text || rawMessage.content || rawMessage.payload || '';
            }
        }

        // 3. Fallback if no message found
        if (!userMessage) {
            console.log("No user message found. Sending debug reply.");
            return res.json({
                replies: [{ text: "DEBUG: I received your request but no message text. Handler: " + (req.body.handler || 'unknown') }]
            });
        }

        const result = await processMessage(userMessage);
        res.json({ replies: [{ text: result.reply }] });

    } catch (e) {
        console.error('Zoho Adapter Error:', e);
        res.json({
            replies: [{ text: "I'm having trouble right now. Error: " + e.message }]
        });
    }
};

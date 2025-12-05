const { processMessage } = require('./brain');

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
        // Handle Zoho "Trigger" Event
        if (req.body && req.body.handler === 'trigger') {
            return res.json({
                replies: [{ text: "Hi! How can I help you with your furniture today?" }]
            });
        }

        // Extract message from Zoho format
        let userMessage = '';
        let rawMessage = (req.body?.data?.message) || req.body?.message || req.body?.text;

        if (rawMessage) {
            if (typeof rawMessage === 'string') {
                userMessage = rawMessage;
            } else if (typeof rawMessage === 'object') {
                userMessage = rawMessage.text || rawMessage.content || rawMessage.payload || '';
            }
        }

        if (!userMessage) {
            return res.json({
                replies: [{ text: "I didn't catch that. Could you say it again?" }]
            });
        }

        const result = await processMessage(userMessage);
        res.json({ replies: [{ text: result.reply }] });

    } catch (e) {
        console.error('Zoho Adapter Error:', e);
        res.json({
            replies: [{ text: "I'm having trouble right now. Please contact +918800609609." }]
        });
    }
};

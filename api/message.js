const { processMessage } = require('./brain');

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Only allow POST
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    const { message } = req.body || {};

    if (!message) {
        res.status(400).json({ error: 'Missing message' });
        return;
    }

    try {
        const result = await processMessage(message);
        res.status(200).json(result);
    } catch (e) {
        console.error('API Error:', e);
        res.status(200).json({
            reply: 'I\'m having trouble right now. Please contact us at +918800609609 or care@bluewud.com'
        });
    }
};

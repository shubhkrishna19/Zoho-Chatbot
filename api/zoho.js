require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { processMessage } = require('./brain');

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// Adapter for Zoho SalesIQ Zobot Webhook
app.post('*', async (req, res) => {
    try {
        // 1. Handle "Trigger" Event (Chat Started)
        if (req.body.handler === 'trigger') {
            return res.json({
                replies: [{ text: "Hi! How can I help you with your furniture today?" }]
            });
        }

        // 2. Handle "Message" Event (User Replied)
        let userMessage = '';

        // Zoho often puts the message in req.body.data.message
        // But sometimes 'message' is an OBJECT, not a string.
        let rawMessage = (req.body.data && req.body.data.message) || req.body.message || req.body.text;

        if (rawMessage) {
            if (typeof rawMessage === 'string') {
                userMessage = rawMessage;
            } else if (typeof rawMessage === 'object') {
                // Try known fields inside the message object
                userMessage = rawMessage.text || rawMessage.content || rawMessage.payload || '';
            }
        }

        if (!userMessage) {
            // If we can't find the message, ask for clarification
            return res.json({
                replies: [{ text: "I didn't catch that. Could you say it again?" }]
            });
        }

        // Process with our Brain
        const result = await processMessage(userMessage);

        const response = {
            replies: [
                { text: result.reply }
            ]
        };

        res.json(response);

    } catch (e) {
        console.error('Zoho Adapter Error:', e);
        res.json({
            replies: [{ text: "I'm having a little trouble thinking right now. Please try again." }]
        });
    }
});

module.exports = app;

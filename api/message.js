require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { processMessage } = require('./brain');

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

app.post('*', async (req, res) => {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Missing message' });

    try {
        const result = await processMessage(message);
        res.json(result);
    } catch (e) {
        console.error('API Error:', e);
        res.json({ reply: 'I’m having trouble right now, please try again later.' });
    }
});

module.exports = app;

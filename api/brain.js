const fetch = require('node-fetch');
const knowledgeBase = require('./knowledge');

// Hard‑coded intents
const intents = [
    {
        patterns: [/warranty/i, /guarantee/i],
        reply: 'All our furniture comes with a 1‑year warranty against manufacturing defects.'
    },
    {
        patterns: [/shipping/i, /delivery time/i, /delivery/i, /ship/i, /track/i],
        reply: 'We ship within 2-4 days of order confirmation. Delivery usually takes 5-7 business days depending on your location.'
    },
    {
        patterns: [/material/i, /wood/i, /solid wood/i, /teak/i, /sheesham/i, /plywood/i],
        reply: 'We exclusively manufacture furniture using high-quality Engineered Wood (Particle Board and MDF). We do not use solid wood, which allows us to offer premium designs at affordable prices.'
    },
    {
        patterns: [/care/i, /clean/i, /maintenance/i, /water/i],
        reply: 'To clean engineered wood furniture, simply wipe it with a damp cloth and dry it immediately. Avoid direct contact with water or placing hot items directly on the surface.'
    },
    {
        patterns: [/assembly/i, /install/i, /carpenter/i, /diy/i],
        reply: 'Most of our products are designed for easy DIY (Do-It-Yourself) assembly and come with a detailed manual and hardware. For complex items, we may offer carpenter assistance in select cities.'
    },
    {
        patterns: [/durability/i, /strong/i, /life/i, /lasting/i],
        reply: 'Our engineered wood is pre-laminated and treated to be moisture-resistant and termite-resistant, ensuring long-lasting durability when used with standard care.'
    },
    {
        patterns: [/talk to human/i, /customer care/i, /agent/i, /representative/i, /support/i, /human/i, /contact/i, /call/i, /phone/i, /email/i],
        reply: 'For any query, call us or whatsapp us at +918800609609, we are available to take your call between 09:00 AM to 06:00 PM on weekdays.\n\nFor Installation Support, call us or whatsapp us at +918800609609.\n\nAlso you can mail us at care@bluewud.com',
    }
];

function findIntent(message) {
    for (const i of intents) {
        if (i.patterns.some(p => p.test(message))) return i;
    }
    return null;
}

async function callGoogleGemini(userMsg) {
    const apiKey = process.env.GOOGLE_API_KEY;
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;
    const body = {
        contents: [{
            role: 'user',
            parts: [{
                text: `You are a helpful assistant for Bluewud, a furniture brand. 
        
        CORE KNOWLEDGE:
        - We manufacture furniture using high-quality Engineered Wood (Particle Board and MDF).
        - We do NOT sell solid wood, teak, or sheesham.
        
        FAQ DATABASE:
        ${knowledgeBase}
        
        INSTRUCTIONS:
        - Use the FAQ DATABASE to answer questions accurately.
        - Keep responses SHORT, NATURAL, and FRIENDLY.
        - Do NOT mention "Engineered Wood" or policies in every reply. Only mention them if the user asks about materials or wood type.
        - If the user says "Hi" or "Hello", just say "Hi! How can I help you with your furniture today?"
        - If asked about contacting support/agent, provide this EXACT text: "For any query, call us or whatsapp us at +918800609609, we are available to take your call between 09:00 AM to 06:00 PM on weekdays. For Installation Support, call us or whatsapp us at +918800609609. Also you can mail us at care@bluewud.com"
        
        User Query: ${userMsg}`
            }]
        }]
    };

    try {
        const resp = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const data = await resp.json();
        return data?.candidates?.[0]?.content?.parts?.[0]?.text || 'I’m sorry, I could not answer that. (Error: ' + (data.error?.message || 'Unknown') + ')';
    } catch (e) {
        console.error('Gemini API Error:', e);
        return 'I’m having trouble connecting to my brain right now. Please try again.';
    }
}

// Main Processor Function
async function processMessage(message) {
    // 1. Check Intents
    const matched = findIntent(message);
    if (matched) {
        return { reply: matched.reply, action: matched.action || null };
    }

    // 2. Call AI
    const aiReply = await callGoogleGemini(message);
    return { reply: aiReply, action: null };
}

module.exports = { processMessage };

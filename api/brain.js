require('dotenv').config();
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// ============================================
// LOAD DATABASES (FAQs + Products)
// ============================================
let database = null;
let productsDb = null;

function loadDatabases() {
    try {
        // Load FAQs
        const dbPath = path.join(__dirname, '..', 'data', 'database.json');
        const data = fs.readFileSync(dbPath, 'utf8');
        database = JSON.parse(data);
        console.log(`✅ FAQs loaded: ${database.categories.length} categories`);

        // Load Products
        const prodPath = path.join(__dirname, '..', 'data', 'products.json');
        if (fs.existsSync(prodPath)) {
            const prodData = fs.readFileSync(prodPath, 'utf8');
            productsDb = JSON.parse(prodData);
            console.log(`✅ Products loaded: ${productsDb.products.length} items`);
        }
        return true;
    } catch (error) {
        console.error('❌ Failed to load databases:', error.message);
        return false;
    }
}

// Load on startup
loadDatabases();

// ============================================
// GET CONFIG & MESSAGES
// ============================================
function getConfig() {
    return database?.config || {
        botName: "Bluewud Furniture Expert",
        contact: {
            phone: "8800609609",
            whatsapp: "+918800609609",
            email: "care@bluewud.com",
            hours: "09:00 AM - 06:00 PM (Mon-Sat)"
        }
    };
}

function getMessage(key) {
    const defaults = {
        welcome: "Welcome to Bluewud! 👋 How can I help you today?",
        error: "I'm having trouble right now. Please contact us at +918800609609 or care@bluewud.com",
        handoff: "📞 Phone/WhatsApp: +918800609609\n📧 Email: care@bluewud.com\n⏰ Hours: 09:00 AM - 06:00 PM (Mon-Sat)",
        goodbye: "Thank you for contacting us! Have a great day! 👋"
    };
    return database?.messages?.[key] || defaults[key] || '';
}

// ============================================
// SEARCH FUNCTIONS
// ============================================
function searchFaqs(query) {
    if (!database || !database.categories) return null;

    const queryLower = query.toLowerCase();
    const words = queryLower.split(/\s+/).filter(w => w.length > 2);

    let bestMatch = null;
    let bestScore = 0;

    for (const category of database.categories) {
        for (const faq of category.faqs || []) {
            let score = 0;
            // Check keywords (exact match)
            for (const keyword of faq.keywords || []) {
                if (queryLower.includes(keyword.toLowerCase())) score += 10;
            }
            // Check question text (word match)
            const qLower = (faq.q || '').toLowerCase();
            for (const word of words) {
                if (qLower.includes(word)) score += 5;
            }

            if (score > bestScore) {
                bestScore = score;
                bestMatch = { ...faq, category: category.name };
            }
        }
    }
    return bestScore >= 10 ? bestMatch : null;
}

function searchProducts(query) {
    if (!productsDb || !productsDb.products) return [];

    const queryLower = query.toLowerCase();
    // Extract potential SKU (simple heuristic: words with hyphens or uppercase codes)
    const terms = queryLower.split(/[\s,]+/).filter(w => w.length > 2);

    const matches = productsDb.products.filter(p => {
        const sku = p.sku.toLowerCase();
        // Match exact SKU or SKU parts
        if (sku === queryLower) return true;
        if (terms.some(t => sku.includes(t))) return true;
        return false;
    });

    // Return top 3 matches
    return matches.slice(0, 3);
}

// ============================================
// INTENT RECOGNITION
// ============================================
const intents = [
    {
        patterns: [/^hi$/i, /^hello$/i, /^hey$/i, /^hii+$/i, /good\s*(morning|afternoon|evening)/i],
        reply: "Hi there! 👋 I'm your Bluewud assistant. Ask me about our products, shipping, or warranty!",
        category: "greeting"
    },
    {
        patterns: [/^bye$/i, /^goodbye$/i, /thank.*bye/i, /^ok\s*bye/i],
        reply: "Thank you for chatting with Bluewud! Have a great day! 👋",
        category: "farewell"
    },
    {
        patterns: [/talk\s*to\s*(human|agent|person)/i, /customer\s*(care|service|support)/i, /call.*support/i],
        reply: "📞 Phone/WhatsApp: +918800609609\n📧 Email: care@bluewud.com\n⏰ Hours: 09:00 AM - 06:00 PM (Mon-Sat)",
        category: "handoff",
        action: "handoff"
    }
];

function findIntent(message) {
    const cleanMsg = message.trim().toLowerCase();
    for (const intent of intents) {
        if (intent.patterns.some(pattern => pattern.test(cleanMsg))) {
            return {
                reply: intent.reply,
                action: intent.action || null,
                category: intent.category
            };
        }
    }
    return null;
}

// ============================================
// KNOWLEDGE BASE BUILDER
// ============================================
function buildKnowledgeString() {
    if (!database || !database.categories) return '';
    let knowledge = `GENERAL POLICIES:\n`;
    for (const category of database.categories) {
        for (const faq of category.faqs || []) {
            knowledge += `- Q: ${faq.q} A: ${faq.a}\n`;
        }
    }
    return knowledge;
}

// ============================================
// GEMINI AI INTEGRATION
// ============================================
async function callGoogleGemini(userMsg, productContext = []) {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) return "I'm having connection issues. Please call +918800609609.";

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const config = getConfig();

    // Context Construction
    let contextString = "";
    if (productContext.length > 0) {
        contextString = "\nRELEVANT PRODUCT DATA:\n";
        productContext.forEach(p => {
            const dims = p.dimensions ? `${p.dimensions.L}x${p.dimensions.B}x${p.dimensions.H} cm` : 'N/A';
            const w = p.weight ? `${(p.weight / 1000).toFixed(1)} kg` : 'N/A';
            contextString += `- SKU: ${p.sku} | Type: ${p.category} | Dims: ${dims} | Weight: ${w}\n`;
        });
    }

    const systemPrompt = `You are the specific AI assistant for Bluewud, an engineered wood furniture brand.
STRICT INSTRUCTIONS:
1. ONLY answer based on the provided FAQ DATABASE and PRODUCT DATA.
2. If the answer is not in the data, verify if it's a general furniture question. If yes, answer briefly. If no, say "I don't have that info, please contact support."
3. DO NOT hallucinate specs, prices, or policies.
4. Keep answers PROFESSIONAL, CONCISE (max 3 sentences), and HELPFUL.
5. NO "drunk" or weird informal language. Be polite and formal but friendly.

CONTACT: ${config.contact.phone} | ${config.contact.email}
CURRENT OFFER: Use code WINTER10 for 10% off.

FAQ DATABASE:
${buildKnowledgeString()}

${contextString}

USER QUESTION: "${userMsg}"
YOUR ANSWER:`;

    const body = {
        contents: [{ role: 'user', parts: [{ text: userMsg }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: {
            temperature: 0.2, // Very low for strict factualness
            maxOutputTokens: 250,
            topP: 0.8
        }
    };

    try {
        const resp = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const data = await resp.json();

        if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
            return data.candidates[0].content.parts[0].text;
        }
        console.error('Gemini API Error details:', JSON.stringify(data));
        return "I apologize, I'm having trouble processing that right now. Please contact our support team.";
    } catch (e) {
        console.error('Gemini network error:', e);
        return "I'm having connection trouble. Please try again or contact support.";
    }
}

// ============================================
// MAIN HANDLER
// ============================================
async function processMessage(message) {
    try {
        if (!message || !message.trim()) return { reply: "I didn't catch that.", action: null };

        // 1. Direct Intents
        const intent = findIntent(message);
        if (intent) return intent;

        // 2. Direct FAQ Match (High Confidence)
        const faq = searchFaqs(message);
        if (faq) return { reply: faq.a, category: faq.category, action: null };

        // 3. Product Search
        const products = searchProducts(message);

        // 4. AI Response with Context
        const aiReply = await callGoogleGemini(message, products);
        return { reply: aiReply, category: 'ai_response', action: null };

    } catch (error) {
        console.error('Handler error:', error);
        return { reply: "I encountered a system error. Please contact +918800609609.", action: null };
    }
}

module.exports = { processMessage };

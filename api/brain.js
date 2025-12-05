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
        const dbPath = path.join(__dirname, '..', 'data', 'database.json');
        const data = fs.readFileSync(dbPath, 'utf8');
        database = JSON.parse(data);
        console.log(`✅ FAQs loaded: ${database.categories.length} categories`);

        const prodPath = path.join(__dirname, '..', 'data', 'products.json');
        if (fs.existsSync(prodPath)) {
            const prodData = fs.readFileSync(prodPath, 'utf8');
            productsDb = JSON.parse(prodData);
            console.log(`✅ Products loaded: ${productsDb.products.length} items`);
        }
    } catch (error) {
        console.error('❌ Failed to load databases:', error.message);
    }
}
loadDatabases();

// ============================================
// GET CONFIG & MESSAGES
// ============================================
function getConfig() {
    return database?.config || {
        botName: "Bluewud Bot",
        contact: { phone: "8800609609", email: "care@bluewud.com", hours: "09:00 AM - 06:00 PM" }
    };
}

function getMessage(key) {
    return database?.messages?.[key] || '';
}

// ============================================
// SEARCH
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
            for (const keyword of faq.keywords || []) {
                if (queryLower.includes(keyword.toLowerCase())) score += 10;
            }
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
    return bestScore >= 15 ? bestMatch : null; // Increased threshold
}

function searchProducts(query) {
    if (!productsDb || !productsDb.products) return [];
    const queryLower = query.toLowerCase();
    const terms = queryLower.split(/[\s,]+/).filter(w => w.length > 2);
    return productsDb.products.filter(p => {
        const sku = p.sku.toLowerCase();
        return sku === queryLower || terms.some(t => sku.includes(t));
    }).slice(0, 3);
}

// ============================================
// INTENT
// ============================================
const intents = [
    { patterns: [/^hi$/i, /^hello$/i], reply: "Hi! I'm Bluewud's AI assistant. I can help with products, specs, and policies.", category: "greeting" },
    { patterns: [/^bye$/i], reply: "Goodbye! Have a nice day!", category: "farewell" },
    { patterns: [/talk.*human/i, /customer\s*care/i], reply: "📞 Call +918800609609 (9AM-6PM) or email care@bluewud.com", category: "handoff", action: "handoff" }
];

function findIntent(message) {
    const cleanMsg = message.trim().toLowerCase();
    for (const intent of intents) {
        if (intent.patterns.some(p => p.test(cleanMsg))) return intent;
    }
    return null;
}

// ============================================
// KNOWLEDGE
// ============================================
function buildKnowledgeString() {
    if (!database) return '';
    let k = '';
    for (const c of database.categories) {
        for (const f of c.faqs || []) k += `Q: ${f.q} A: ${f.a}\n`;
    }
    return k;
}

// ============================================
// GEMINI
// ============================================
async function callGoogleGemini(userMsg, productContext = []) {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) return "API Key missing.";

    const contextString = productContext.map(p =>
        `- SKU: ${p.sku} (${p.category}) Dims: ${p.dimensions.L}x${p.dimensions.B}x${p.dimensions.H}cm Weight: ${p.weight / 1000}kg`
    ).join('\n');

    const systemPrompt = `You are Bluewud's AI assistant. 
STRICT RULES:
1. ONLY USE THE PROVIDED DATA. DO NOT INVENT ANSWERS.
2. DO NOT mention carpenters, YouTube, or third-party services unless explicitly in the FAQs.
3. If specific info is missing, say "I don't have that detail, please contact support."
4. Be polite but FACTUAL and CONCISE.
5. NO informal language.

DATA:
${buildKnowledgeString()}
${contextString}

USER: ${userMsg}`;

    const body = {
        contents: [{ role: 'user', parts: [{ text: userMsg }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: { temperature: 0.1, maxOutputTokens: 200 }
    };

    try {
        const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const data = await resp.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        return text ? text : "I'm not sure, please call +918800609609.";
    } catch (e) {
        return "Connection error.";
    }
}

// ============================================
// PROCESS
// ============================================
async function processMessage(message) {
    try {
        if (!message?.trim()) return { reply: "Please say something." };

        const intent = findIntent(message);
        if (intent) return intent;

        const faq = searchFaqs(message);
        if (faq) return { reply: faq.a, category: faq.category };

        const products = searchProducts(message);
        const aiReply = await callGoogleGemini(message, products);

        return { reply: aiReply, category: 'ai_response' };

    } catch (error) {
        console.error(error);
        return { reply: "Error processing request, please call support." };
    }
}

module.exports = { processMessage };

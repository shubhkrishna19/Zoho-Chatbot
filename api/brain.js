require('dotenv').config();
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const DEBUG_LOGGING = (process.env.DEBUG_LOGGING || '').toLowerCase() === 'true';

// ============================================
// CONFIG & CONSTANTS
// ============================================
const CONFIG = {
    botName: "Bluewud Bot",
    contact: { phone: "+918800609609", email: "care@bluewud.com" }
};

const CATEGORY_URLS = {
    "TV Units": "https://bluewud.com/collections/tv-units-cabinets",
    "Coffee Tables": "https://bluewud.com/collections/coffee-tables",
    "Study Tables": "https://bluewud.com/collections/study-tables-desks",
    "Shoe Racks": "https://bluewud.com/collections/shoe-racks",
    "Wardrobes": "https://bluewud.com/collections/wardrobes",
    "Wall Shelves": "https://bluewud.com/collections/wall-shelves",
    "Beds": "https://bluewud.com/collections/beds",
    "Bedside Tables": "https://bluewud.com/collections/bedside-tables",
    "Dressing Console": "https://bluewud.com/collections/dressing-tables",
    "Dining Tables": "https://bluewud.com/collections/dining-tables",
    "Laptop Tables": "https://bluewud.com/collections/laptop-tables",
    "Book Shelves": "https://bluewud.com/collections/bookshelves"
};

// ============================================
// LOAD DATABASES (FAQs + Products + Names)
// ============================================
let database = null;
let productsDb = null;
let productNames = [];

function loadDatabases() {
    try {
        const dbPath = path.join(__dirname, 'data', 'database.json');
        if (fs.existsSync(dbPath)) {
            const data = fs.readFileSync(dbPath, 'utf8');
            database = JSON.parse(data);
            console.log(`✅ FAQs loaded: ${database.categories.length} categories`);
        }

        const prodPath = path.join(__dirname, 'data', 'products.json');
        if (fs.existsSync(prodPath)) {
            const prodData = fs.readFileSync(prodPath, 'utf8');
            productsDb = JSON.parse(prodData);
            console.log(`✅ Products loaded: ${productsDb.products.length} items`);
        }

        const namePath = path.join(__dirname, 'data', 'product_names.json');
        if (fs.existsSync(namePath)) {
            const nameData = fs.readFileSync(namePath, 'utf8');
            productNames = JSON.parse(nameData);
            console.log(`✅ Product Names loaded: ${productNames.length} mappings`);
        }
    } catch (error) {
        console.error('❌ Failed to load databases:', error.message);
    }
}
loadDatabases();

// ============================================
// SEARCH LOGIC (RAG)
// ============================================
function searchFaqs(query) {
    if (!database || !database.categories) return [];

    const queryLower = query.toLowerCase();
    const words = queryLower.split(/\s+/).filter(w => w.length > 2);

    let matches = [];

    for (const category of database.categories) {
        for (const faq of category.faqs || []) {
            let score = 0;
            const qLower = (faq.q || '').toLowerCase();
            const keywords = faq.keywords || [];

            // 1. Keyword Exact Match (High weight)
            for (const kw of keywords) {
                if (queryLower.includes(kw.toLowerCase())) score += 15;
            }

            // 2. Question Word Match (Medium weight)
            let wordMatches = 0;
            for (const word of words) {
                if (qLower.includes(word)) {
                    score += 5;
                    wordMatches++;
                }
            }

            // Must match at least some context (STRICTER)
            // 1 keyword (15) OR 3+ context words (15)
            if (score >= 15 || wordMatches >= 3) {
                matches.push({ ...faq, category: category.name, score });
            }
        }
    }

    // Sort by score and return top 3
    return matches.sort((a, b) => b.score - a.score).slice(0, 3);
}

function normalizeText(value = '') {
    return value
        .toString()
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function levenshtein(a, b) {
    if (a === b) return 0;
    if (!a) return b.length;
    if (!b) return a.length;
    const matrix = Array.from({ length: b.length + 1 }, (_, i) => [i]);
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            const cost = a[j - 1] === b[i - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j - 1] + cost
            );
        }
    }
    return matrix[b.length][a.length];
}

function similarityScore(a, b) {
    const distance = levenshtein(a, b);
    const longest = Math.max(a.length, b.length) || 1;
    return 1 - distance / longest;
}

function searchProducts(query) {
    if (!productsDb || !productsDb.products) return [];
    const normalizedQuery = normalizeText(query);
    const queryTokens = normalizedQuery.split(' ').filter(Boolean);

    const nameMatches = productNames.map(p => ({
        ...p,
        normName: normalizeText(p.name),
        normKeywords: (p.keywords || []).map(normalizeText)
    }));

    const candidates = productsDb.products.map(product => {
        const sku = normalizeText(product.sku);
        const category = normalizeText(product.category || '');
        const nameEntry = nameMatches.find(n => sku.startsWith(normalizeText(n.sku).replace(/-xx$/, '')));
        const matchedKeywords = [];
        let score = 0;

        // Exact SKU match
        if (normalizedQuery === sku) score += 30;

        // SKU token overlap
        if (queryTokens.some(t => sku.includes(t))) score += 10;

        // Category cues
        if (category && queryTokens.some(t => category.includes(t))) score += 6;

        if (nameEntry) {
            if (normalizedQuery.includes(nameEntry.normName)) score += 25;
            nameEntry.normKeywords.forEach(keyword => {
                if (keyword && normalizedQuery.includes(keyword)) {
                    matchedKeywords.push(keyword);
                    score += 12;
                }
            });

            // Fuzzy name match as fallback
            const similarity = similarityScore(normalizedQuery, nameEntry.normName);
            if (similarity > 0.6) score += Math.round(similarity * 10);
        }

        // Fuzzy SKU partials
        const skuSimilarity = similarityScore(normalizedQuery, sku);
        if (skuSimilarity > 0.6) score += Math.round(skuSimilarity * 8);

        return {
            ...product,
            name: nameEntry?.name,
            _score: score,
            _matchedKeywords: matchedKeywords
        };
    });

    return candidates
        .filter(c => c._score > 0)
        .sort((a, b) => b._score - a._score)
        .slice(0, 3)
        .map(({ _score, _matchedKeywords, ...rest }) => rest);
}

// ============================================
// INTENTS
// ============================================
const intents = [
    { patterns: [/^hi[!.]?$/i, /^hello[!.]?$/i, /^hey$/i], reply: "Hi! I'm Bluewud's AI assistant. I can help with products, specs, and policies.", category: "greeting" },
    { patterns: [/^bye[!.]?$/i, /^goodbye$/i], reply: "Goodbye! Have a nice day!", category: "farewell" },
    // Strict handoff: Must ask for human
    { patterns: [/talk.*human/i, /speak.*agent/i, /customer\s*care/i, /contact\s*support/i], reply: "📞 Call +918800609609 (9AM-6PM) or email care@bluewud.com", category: "handoff", action: "handoff" }
];

function findIntent(message) {
    const cleanMsg = message.trim().toLowerCase();
    for (const intent of intents) {
        if (intent.patterns.some(p => p.test(cleanMsg))) return intent;
    }
    return null;
}

// ============================================
// GEMINI AI CALL
// ============================================
async function callGoogleGemini(userMsg, productContext, faqContext) {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) return "My brain is offline (API Key missing).";

    const hasProducts = productContext.length > 0;
    const prodStr = hasProducts
        ? "RELEVANT PRODUCTS FOUND:\n" + productContext.map(p => `- SKU: ${p.sku} | Name: ${p.name} | Dims: ${p.dimensions?.L}x${p.dimensions?.B}x${p.dimensions?.H}cm | Price: ₹${p.price}`).join('\n')
        : "NO MATCHING PRODUCTS FOUND IN DATABASE.";

    const faqStr = faqContext.length > 0
        ? "RELEVANT FAQs:\n" + faqContext.map(f => `Q: ${f.q}\nA: ${f.a}`).join('\n\n')
        : "NO RELEVANT FAQs FOUND.";

    const categoryLinks = Object.entries(CATEGORY_URLS)
        .map(([k, v]) => `- ${k}: ${v}`)
        .join('\n');

    const systemPrompt = `You are Bluewud's smart AI assistant.
    
    CORE DATA:
    ${prodStr}
    
    ${faqStr}
    
    SHOPPING LINKS:
    ${categoryLinks}
    
    CONTACT INFO:
    Phone: ${CONFIG.contact.phone}
    Email: ${CONFIG.contact.email}

    CRITICAL RULES:
    1. IF "NO MATCHING PRODUCTS FOUND" is shown above, and the user asks for specific product details (dimensions, price, material of a specific item), YOU MUST SAY: "I couldn't find details for that specific product in my database. Please contact support or check our website."
    2. DO NOT use the "RELEVANT FAQs" to answer specific product sizing questions unless the FAQ is explicitly about that specific model.
    3. If the user asks general questions (warranty, shipping), use the "RELEVANT FAQs".
    4. Be helpful but truthful. Do not Hallucinate or guess dimensions.
    
    USER QUERY: ${userMsg}`;

    const body = {
        contents: [{ role: 'user', parts: [{ text: userMsg }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: { temperature: 0.1, maxOutputTokens: 1000 }
    };

    const attemptGeminiCall = async () => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        try {
            const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
                signal: controller.signal
            });

            const data = await resp.json();
            return { resp, data };
        } finally {
            clearTimeout(timeout);
        }
    };

    try {
        let responseData = null;
        const maxAttempts = 3;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                responseData = await attemptGeminiCall();
                break;
            } catch (error) {
                const isLastAttempt = attempt === maxAttempts;
                if (error.name === 'AbortError') {
                    if (DEBUG_LOGGING) console.error(`Gemini request timed out on attempt ${attempt}`);
                } else {
                    if (DEBUG_LOGGING) console.error(`Gemini request failed on attempt ${attempt}:`, error.message);
                }
                if (isLastAttempt) throw error;
                const backoff = 300 * Math.pow(2, attempt - 1);
                await new Promise(resolve => setTimeout(resolve, backoff));
            }
        }

        if (!responseData) return "I'm having trouble thinking (no response).";

        const { resp, data } = responseData;

        // DEBUG: Check for API Errors (Non-200 OK)
        if (!resp.ok) {
            if (DEBUG_LOGGING) console.error("Gemini API Error:", JSON.stringify(data, null, 2));
            const errMsg = data?.error?.message || "Unknown API Error";
            return `I'm having trouble thinking (Error ${resp.status}: ${errMsg}). Please contact support.`;
        }

        if (DEBUG_LOGGING) console.log("Gemini Success:", JSON.stringify(data, null, 2));
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        // DEBUG: Safety Blocks
        if (!text && data.promptFeedback) {
            return `I cannot answer this (Safety Block: ${JSON.stringify(data.promptFeedback)}).`;
        }

        return text || "I'm having trouble thinking (Empty Response).";

    } catch (e) {
        console.error("Gemini Network Error:", e.message);
        return `I'm having trouble connecting to my brain (${e.message}).`;
    }
}

// ============================================
// MAIN PROCESS
// ============================================
async function processMessage(message) {
    try {
        if (!message?.trim()) return { reply: "Please say something." };

        // 1. Check Intents (Strict Handcoded)
        const intent = findIntent(message);
        if (intent) return intent;

        // 2. RAG: Search DB
        const products = searchProducts(message);
        const faqs = searchFaqs(message);

        // 3. AI Generation
        const aiReply = await callGoogleGemini(message, products, faqs);
        return { reply: aiReply, category: 'ai_response' };

    } catch (error) {
        console.error("Brain Error:", error);
        return { reply: "Error processing request, please call support." };
    }
}

module.exports = { processMessage };

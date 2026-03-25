require('dotenv').config();
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const DEBUG_LOGGING = (process.env.DEBUG_LOGGING || '').toLowerCase() === 'true';

const DEFAULT_CONFIG = {
    botName: 'BlueBot',
    companyName: 'Bluewud Concepts Pvt. Ltd.',
    tagline: "Every home's a story!",
    contact: {
        phone: '+918800609609',
        whatsapp: '+918800609609',
        email: 'care@bluewud.com',
        hours: '09:00 AM - 06:00 PM (Mon-Sat)',
    },
    currentOffer: null,
};

const CATEGORY_URLS = {
    'TV Units': 'https://bluewud.com/collections/tv-units-cabinets',
    'Coffee Tables': 'https://bluewud.com/collections/coffee-tables',
    'Study Tables': 'https://bluewud.com/collections/study-tables-desks',
    'Shoe Racks': 'https://bluewud.com/collections/shoe-racks',
    Wardrobes: 'https://bluewud.com/collections/wardrobes',
    'Wall Shelves': 'https://bluewud.com/collections/wall-shelves',
    Beds: 'https://bluewud.com/collections/beds',
    'Bedside Tables': 'https://bluewud.com/collections/bedside-tables',
    'Dressing Console': 'https://bluewud.com/collections/dressing-tables',
    'Dining Tables': 'https://bluewud.com/collections/dining-tables',
    'Laptop Tables': 'https://bluewud.com/collections/laptop-tables',
    'Book Shelves': 'https://bluewud.com/collections/bookshelves',
};

const CATEGORY_KEYWORDS = {
    'TV Units': ['tv unit', 'tv stand', 'entertainment unit', 'media unit', 'tv cabinet'],
    'Coffee Tables': ['coffee table', 'centre table', 'center table'],
    'Study Tables': ['study table', 'study desk', 'office desk', 'desk'],
    'Shoe Racks': ['shoe rack', 'shoe cabinet', 'shoe storage'],
    Wardrobes: ['wardrobe', 'almirah', 'closet'],
    'Wall Shelves': ['wall shelf', 'wall shelves', 'floating shelf', 'shelf'],
    Beds: ['bed', 'queen bed', 'king bed', 'single bed'],
    'Bedside Tables': ['bedside', 'side table', 'night stand', 'nightstand'],
    'Dressing Console': ['dressing table', 'dresser', 'dressing console'],
    'Dining Tables': ['dining table', 'dining set'],
    'Laptop Tables': ['laptop table', 'folding table', 'portable desk'],
    'Book Shelves': ['bookshelf', 'book shelf', 'book rack'],
};

const NAVIGATION_CHIPS = {
    browse_tv_units: { label: 'Browse TV Units', query: 'Show me TV Units' },
    browse_study_tables: { label: 'Browse Study Tables', query: 'Show me Study Tables' },
    browse_coffee_tables: { label: 'Browse Coffee Tables', query: 'Show me Coffee Tables' },
    track_order: { label: 'Track Order', query: 'Track my order' },
    warranty: { label: 'Warranty Info', query: 'Warranty policy' },
    returns: { label: 'Return Policy', query: 'Return policy' },
    support: { label: 'Talk to Support', query: 'Talk to human agent' },
};

let runtimeConfig = { ...DEFAULT_CONFIG, contact: { ...DEFAULT_CONFIG.contact } };
let database = null;
let productsDb = null;
let productNames = [];

function loadDatabases() {
    try {
        const dbPath = path.join(__dirname, 'data', 'database.json');
        if (fs.existsSync(dbPath)) {
            database = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
            if (database?.config) {
                runtimeConfig = {
                    ...runtimeConfig,
                    ...database.config,
                    contact: {
                        ...runtimeConfig.contact,
                        ...(database.config.contact || {}),
                    },
                };
            }
            console.log(`FAQs loaded: ${database?.categories?.length || 0} categories`);
        }

        const productPath = path.join(__dirname, 'data', 'products.json');
        if (fs.existsSync(productPath)) {
            productsDb = JSON.parse(fs.readFileSync(productPath, 'utf8'));
            console.log(`Products loaded: ${productsDb?.products?.length || 0} items`);
        }

        const namesPath = path.join(__dirname, 'data', 'product_names.json');
        if (fs.existsSync(namesPath)) {
            productNames = JSON.parse(fs.readFileSync(namesPath, 'utf8'));
            console.log(`Product name mappings loaded: ${productNames.length}`);
        }
    } catch (error) {
        console.error('Failed to load chatbot databases:', error.message);
    }
}

loadDatabases();

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

function searchFaqs(query) {
    if (!database?.categories) return [];

    const queryLower = normalizeText(query);
    const words = queryLower.split(/\s+/).filter((word) => word.length > 2);
    const matches = [];

    for (const category of database.categories) {
        for (const faq of category.faqs || []) {
            const question = normalizeText(faq.q || '');
            const answer = normalizeText(faq.a || '');
            let score = 0;
            let wordMatches = 0;

            for (const keyword of faq.keywords || []) {
                const normalizedKeyword = normalizeText(keyword);
                if (normalizedKeyword && queryLower.includes(normalizedKeyword)) {
                    score += 15;
                }
            }

            for (const word of words) {
                if (question.includes(word) || answer.includes(word)) {
                    score += 5;
                    wordMatches += 1;
                }
            }

            if (score >= 15 || wordMatches >= 3) {
                matches.push({ ...faq, category: category.name, score });
            }
        }
    }

    return matches.sort((a, b) => b.score - a.score).slice(0, 3);
}

function searchProducts(query) {
    if (!productsDb?.products) return [];

    const normalizedQuery = normalizeText(query);
    const queryTokens = normalizedQuery.split(' ').filter(Boolean);
    const normalizedNames = productNames.map((entry) => ({
        ...entry,
        normName: normalizeText(entry.name),
        normSku: normalizeText(entry.sku).replace(/-xx$/, ''),
        normKeywords: (entry.keywords || []).map(normalizeText),
    }));

    const candidates = productsDb.products.map((product) => {
        const normalizedSku = normalizeText(product.sku);
        const normalizedCategory = normalizeText(product.category || '');
        const nameEntry = normalizedNames.find((entry) => normalizedSku.startsWith(entry.normSku));
        let score = 0;

        if (normalizedQuery === normalizedSku) score += 30;
        if (queryTokens.some((token) => normalizedSku.includes(token))) score += 10;
        if (normalizedCategory && queryTokens.some((token) => normalizedCategory.includes(token))) score += 8;

        if (nameEntry) {
            if (normalizedQuery.includes(nameEntry.normName)) score += 25;
            for (const keyword of nameEntry.normKeywords) {
                if (keyword && normalizedQuery.includes(keyword)) {
                    score += 12;
                }
            }
            const nameSimilarity = similarityScore(normalizedQuery, nameEntry.normName);
            if (nameSimilarity > 0.6) score += Math.round(nameSimilarity * 10);
        }

        const skuSimilarity = similarityScore(normalizedQuery, normalizedSku);
        if (skuSimilarity > 0.6) score += Math.round(skuSimilarity * 8);

        return {
            ...product,
            displayName: nameEntry?.name || `${product.category || 'Bluewud'} (${product.sku})`,
            _score: score,
        };
    });

    return candidates
        .filter((candidate) => candidate._score > 0)
        .sort((a, b) => b._score - a._score)
        .slice(0, 3)
        .map(({ _score, ...product }) => product);
}

function findCategoryMatch(query) {
    const normalizedQuery = normalizeText(query);
    const entries = Object.entries(CATEGORY_KEYWORDS);

    for (const [category, keywords] of entries) {
        if (normalizeText(category) && normalizedQuery.includes(normalizeText(category))) {
            return category;
        }
        if (keywords.some((keyword) => normalizedQuery.includes(normalizeText(keyword)))) {
            return category;
        }
    }

    return null;
}

function pickChips(keys) {
    return keys
        .map((key) => NAVIGATION_CHIPS[key])
        .filter(Boolean);
}

function formatDimensions(product) {
    const dims = product?.dimensions || {};
    const values = [dims.L, dims.B, dims.H];
    if (!values.every((value) => value !== undefined && value !== null && value !== '')) {
        return 'Size not listed';
    }
    const numericValues = values.map((value) => Number(value));
    if (numericValues.every((value) => !Number.isNaN(value) && value <= 0)) {
        return 'Size not listed';
    }
    return `${dims.L} x ${dims.B} x ${dims.H} cm`;
}

function formatWeight(weightValue) {
    if (weightValue === undefined || weightValue === null || weightValue === '') {
        return 'Weight not listed';
    }
    const numeric = Number(weightValue);
    if (Number.isNaN(numeric)) {
        return `${weightValue}`;
    }
    if (numeric >= 1000) {
        return `${(numeric / 1000).toFixed(1)} kg`;
    }
    return `${numeric} kg`;
}

function getCategoryUrl(category) {
    return CATEGORY_URLS[category] || 'https://bluewud.com/collections/all';
}

function buildOfferLine() {
    if (!runtimeConfig?.currentOffer?.name || !runtimeConfig?.currentOffer?.discount) {
        return '';
    }
    const code = runtimeConfig.currentOffer.code ? ` Use code ${runtimeConfig.currentOffer.code}.` : '';
    return `Current offer: ${runtimeConfig.currentOffer.name} - ${runtimeConfig.currentOffer.discount}.${code}`;
}

function sanitizeReply(text) {
    return String(text || '')
        .replace(/<think>[\s\S]*?<\/think>/gi, '')
        .replace(/<think>/gi, '')
        .replace(/<\/think>/gi, '')
        .replace(/\u2013|\u2014/g, '-')
        .replace(/\r/g, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

function buildCategoryBrowseReply(category) {
    const offerLine = buildOfferLine();
    const reply = [
        `You can browse our ${category} collection here: ${getCategoryUrl(category)}`,
        offerLine,
        'If you want, I can also help you compare size, category, or best-fit options.',
    ]
        .filter(Boolean)
        .join('\n');

    return {
        reply,
        category: 'category_browse',
        chips: pickChips(['track_order', 'support']),
    };
}

function buildFaqReply(faq, categoryMatch) {
    const replyParts = [faq.a];

    if (categoryMatch) {
        replyParts.push(`If you want to browse ${categoryMatch}, here is the collection: ${getCategoryUrl(categoryMatch)}`);
    }

    return {
        reply: sanitizeReply(replyParts.join('\n')),
        category: faq.category || 'faq',
        chips: pickChips(['track_order', 'support']),
    };
}

function buildProductReply(products, categoryMatch) {
    const filteredProducts =
        categoryMatch
            ? products.filter(
                  (product) => normalizeText(product.category || '') === normalizeText(categoryMatch)
              )
            : products;
    const displayProducts = (filteredProducts.length ? filteredProducts : products).slice(0, 3);
    const relevantCategory = categoryMatch || products[0]?.category || null;
    const browseUrl = relevantCategory ? getCategoryUrl(relevantCategory) : 'https://bluewud.com/collections/all';
    const lines = displayProducts.map((product) => {
        const boxes = product.boxes ? ` | Boxes: ${product.boxes}` : '';
        return `- ${product.displayName} | SKU: ${product.sku} | Size: ${formatDimensions(product)} | Shipping weight: ${formatWeight(product.weight)}${boxes}`;
    });

    const reply = [
        displayProducts.length === 1
            ? 'I found the closest match in our catalog:'
            : 'Here are the closest matches I found in our catalog:',
        lines.join('\n'),
        `Browse more here: ${browseUrl}`,
    ].join('\n');

    return {
        reply,
        category: 'product_match',
        chips: pickChips(['track_order', 'support']),
    };
}

function buildOrderTrackingReply() {
    return {
        reply: 'I can help with a placed order. Tap "Track Order", then enter your Order ID and the phone number or email used on that order.',
        category: 'order_tracking',
        chips: pickChips(['track_order', 'support']),
    };
}

function looksLikeBrowsingQuery(query) {
    return /browse|show|shop|looking for|looking to buy|explore|collection|options|recommend/i.test(query);
}

function looksLikeProductSpecQuery(query) {
    return /price|dimension|dimensions|size|sizes|weight|spec|specs|material|sku|model/i.test(query);
}

function findIntent(message) {
    const cleanMessage = message.trim().toLowerCase();
    const intents = [
        {
            patterns: [/^hi[!.]?$/i, /^hello[!.]?$/i, /^hey[!.]?$/i],
            reply: "Hi, I'm BlueBot. I can help with products, policies, and placed-order support.",
            category: 'greeting',
            chips: pickChips(['browse_tv_units', 'browse_study_tables', 'track_order', 'support']),
        },
        {
            patterns: [/^bye[!.]?$/i, /^goodbye$/i],
            reply: 'Thanks for visiting Bluewud. If you need product help or order support later, I am here.',
            category: 'farewell',
        },
        {
            patterns: [/talk.*human/i, /talk.*support/i, /speak.*agent/i, /customer\s*care/i, /contact\s*support/i, /need.*support/i, /support.*team/i],
            reply: `You can reach our team on ${runtimeConfig.contact.whatsapp || runtimeConfig.contact.phone} or ${runtimeConfig.contact.email}.`,
            category: 'handoff',
            action: 'handoff',
            chips: pickChips(['track_order']),
        },
        {
            patterns: [/track.*order/i, /where.*order/i, /order.*status/i, /placed.*order/i],
            ...buildOrderTrackingReply(),
        },
    ];

    const intent = intents.find((candidate) =>
        candidate.patterns.some((pattern) => pattern.test(cleanMessage))
    );
    if (!intent) {
        return null;
    }

    const { patterns, ...responseIntent } = intent;
    return responseIntent;
}

function directReplyForMessage(message, products, faqs, categoryMatch) {
    if (products.length > 0 && (looksLikeProductSpecQuery(message) || products.length === 1)) {
        return buildProductReply(products, categoryMatch);
    }

    if (faqs.length > 0 && faqs[0].score >= 20) {
        return buildFaqReply(faqs[0], categoryMatch);
    }

    if (categoryMatch && looksLikeBrowsingQuery(message)) {
        return buildCategoryBrowseReply(categoryMatch);
    }

    return null;
}

function productContextLines(products) {
    if (!products.length) {
        return 'NO MATCHING PRODUCTS FOUND IN DATABASE.';
    }

    return `RELEVANT PRODUCTS FOUND:\n${products
        .map(
            (product) =>
                `- SKU: ${product.sku} | Name: ${product.displayName} | Category: ${product.category || 'Bluewud'} | Size: ${formatDimensions(product)} | Shipping weight: ${formatWeight(product.weight)} | Boxes: ${product.boxes || 'N/A'}`
        )
        .join('\n')}`;
}

function faqContextLines(faqs) {
    if (!faqs.length) {
        return 'NO RELEVANT FAQS FOUND.';
    }

    return `RELEVANT FAQS:\n${faqs.map((faq) => `Q: ${faq.q}\nA: ${faq.a}`).join('\n\n')}`;
}

function buildAiSystemPrompt(products, faqs, categoryMatch) {
    const offerLine = buildOfferLine();
    const categoryLinks = Object.entries(CATEGORY_URLS)
        .map(([name, url]) => `- ${name}: ${url}`)
        .join('\n');

    return `You are ${runtimeConfig.botName}, the AI assistant for ${runtimeConfig.companyName}.
Bluewud sells furniture on bluewud.com and helps shoppers with product selection, policies, and placed-order guidance.

${productContextLines(products)}

${faqContextLines(faqs)}

PRIMARY CATEGORY MATCH:
${categoryMatch || 'None'}

SHOPPING CATEGORY LINKS:
${categoryLinks}

SUPPORT CONTACT:
- Phone/WhatsApp: ${runtimeConfig.contact.whatsapp || runtimeConfig.contact.phone}
- Email: ${runtimeConfig.contact.email}
- Hours: ${runtimeConfig.contact.hours || 'Business hours'}

${offerLine || ''}

RESPONSE RULES:
1. Keep replies short, clear, and chat-friendly.
2. Never invent dimensions, pricing, material, stock, or delivery promises.
3. If product data is present, use only the catalog facts that were retrieved.
4. If the user wants to browse a category, include the most relevant collection link.
5. If the user asks for order status, tell them to use the Track Order flow with Order ID and phone/email verification.
6. If the question is policy-related and FAQ data is present, answer directly from the FAQ context.
7. If you are unsure, say so plainly and offer support contact.
8. Do not use markdown headers. Bullets are fine when listing options.`;
}

function getAiProvider() {
    return process.env.MINIMAX_API_KEY ? 'minimax' : null;
}

function getMiniMaxBaseUrl() {
    return (process.env.MINIMAX_BASE_URL || 'https://api.minimax.io/v1').replace(/\/$/, '');
}

async function callMiniMax(userMessage, products, faqs, categoryMatch) {
    const apiKey = process.env.MINIMAX_API_KEY;
    if (!apiKey) {
        return null;
    }

    const requestBody = {
        model: process.env.MINIMAX_MODEL || 'MiniMax-M2.5',
        messages: [
            { role: 'system', content: buildAiSystemPrompt(products, faqs, categoryMatch) },
            { role: 'user', content: userMessage },
        ],
        temperature: 0.15,
        max_tokens: 400,
        reasoning_split: true,
    };

    const baseUrl = getMiniMaxBaseUrl();

    const attemptMiniMaxCall = async () => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        try {
            const response = await fetch(`${baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify(requestBody),
                signal: controller.signal,
            });
            const payload = await response.json();
            return { response, payload };
        } finally {
            clearTimeout(timeout);
        }
    };

    try {
        let result = null;
        for (let attempt = 1; attempt <= 3; attempt += 1) {
            try {
                result = await attemptMiniMaxCall();
                break;
            } catch (error) {
                if (DEBUG_LOGGING) {
                    console.error(`MiniMax attempt ${attempt} failed:`, error.message);
                }
                if (attempt === 3) {
                    throw error;
                }
                await new Promise((resolve) => setTimeout(resolve, 300 * Math.pow(2, attempt - 1)));
            }
        }

        if (!result) {
            return null;
        }

        if (!result.response.ok) {
            if (DEBUG_LOGGING) {
                console.error('MiniMax API error:', result.payload);
            }
            return null;
        }

        const text = result.payload?.choices?.[0]?.message?.content;
        return sanitizeReply(text);
    } catch (error) {
        console.error('MiniMax network error:', error.message);
        return null;
    }
}

async function callAiModel(userMessage, products, faqs, categoryMatch) {
    if (getAiProvider() !== 'minimax') {
        return null;
    }
    return callMiniMax(userMessage, products, faqs, categoryMatch);
}

function fallbackReply(message, categoryMatch, faqs) {
    if (faqs.length > 0) {
        return buildFaqReply(faqs[0], categoryMatch);
    }

    if (categoryMatch) {
        return buildCategoryBrowseReply(categoryMatch);
    }

    return {
        reply: `I can help with product categories, furniture specs, warranty, returns, delivery, and placed-order guidance. You can also reach our team on ${runtimeConfig.contact.whatsapp || runtimeConfig.contact.phone}.`,
        category: 'fallback',
        chips: pickChips(['browse_tv_units', 'browse_study_tables', 'track_order', 'support']),
    };
}

async function processMessage(message) {
    try {
        if (!message || !message.trim()) {
            return { reply: 'Please send a message so I can help.' };
        }

        const intent = findIntent(message);
        if (intent) {
            return intent;
        }

        const categoryMatch = findCategoryMatch(message);
        const products = searchProducts(message);
        const faqs = searchFaqs(message);

        const directReply = directReplyForMessage(message, products, faqs, categoryMatch);
        if (directReply) {
            return directReply;
        }

        const aiReply = await callAiModel(message, products, faqs, categoryMatch);
        if (aiReply) {
            return {
                reply: aiReply,
                category: 'ai_response',
                chips: pickChips(['track_order', 'support']),
            };
        }

        return fallbackReply(message, categoryMatch, faqs);
    } catch (error) {
        console.error('Brain error:', error);
        return {
            reply: `I hit a technical issue. You can still reach our team on ${runtimeConfig.contact.whatsapp || runtimeConfig.contact.phone} or ${runtimeConfig.contact.email}.`,
            category: 'error',
            chips: pickChips(['support', 'track_order']),
        };
    }
}

module.exports = { processMessage, __test__: { getAiProvider, getMiniMaxBaseUrl, sanitizeReply } };

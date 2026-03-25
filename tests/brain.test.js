const test = require('node:test');
const assert = require('node:assert/strict');
const productsDb = require('../api/data/products.json');

const brainModulePath = require.resolve('../api/brain');
const managedEnvKeys = ['MINIMAX_API_KEY', 'MINIMAX_MODEL', 'MINIMAX_BASE_URL', 'GOOGLE_API_KEY', 'AI_PROVIDER'];
const originalEnv = { ...process.env };

function resetEnv() {
  for (const key of managedEnvKeys) {
    if (Object.prototype.hasOwnProperty.call(originalEnv, key)) {
      process.env[key] = originalEnv[key];
    } else {
      delete process.env[key];
    }
  }
}

function loadBrain(envOverrides = {}) {
  resetEnv();
  Object.assign(process.env, envOverrides);
  delete require.cache[brainModulePath];
  return require('../api/brain');
}

test.after(() => {
  resetEnv();
  delete require.cache[brainModulePath];
});

test('MiniMax provider selection ignores stale Gemini settings', () => {
  const brain = loadBrain({ MINIMAX_API_KEY: 'test-key', AI_PROVIDER: 'gemini' });
  assert.equal(brain.__test__.getAiProvider(), 'minimax');
});

test('MiniMax base URL defaults to the international endpoint', () => {
  const brain = loadBrain();
  assert.equal(brain.__test__.getMiniMaxBaseUrl(), 'https://api.minimax.io/v1');
});

test('sanitizeReply strips MiniMax reasoning tags', () => {
  const brain = loadBrain();
  assert.equal(brain.__test__.sanitizeReply('<think>hidden chain</think>Visible answer'), 'Visible answer');
});

test('deterministic product, category, policy, and order flows still resolve locally', async () => {
  const brain = loadBrain();
  const firstSku = productsDb.products[0].sku;

  const productReply = await brain.processMessage(`What are the dimensions of ${firstSku}?`);
  assert.equal(productReply.category, 'product_match');
  assert.match(productReply.reply, new RegExp(firstSku, 'i'));

  const categoryReply = await brain.processMessage('Show me TV Units');
  assert.equal(categoryReply.category, 'category_browse');
  assert.match(categoryReply.reply, /tv-units-cabinets/i);

  const policyReply = await brain.processMessage('Return policy');
  assert.notEqual(policyReply.category, 'ai_response');
  assert.notEqual(policyReply.category, 'fallback');

  const orderReply = await brain.processMessage('Track my order');
  assert.equal(orderReply.category, 'order_tracking');
  assert.match(orderReply.reply, /Track Order/i);
  assert.equal('patterns' in orderReply, false);
});

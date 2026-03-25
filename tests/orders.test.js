const test = require('node:test');
const assert = require('node:assert/strict');

const ordersApiPath = require.resolve('../api/orders');
const originalEnv = { ...process.env };

function resetEnv() {
  process.env = { ...originalEnv };
}

function loadOrdersApi(envOverrides = {}) {
  resetEnv();
  Object.assign(process.env, envOverrides);
  delete require.cache[ordersApiPath];
  return require('../api/orders');
}

function createRes() {
  return {
    statusCode: 200,
    headers: {},
    payload: null,
    setHeader(key, value) {
      this.headers[key] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    },
    end() {
      return this;
    },
  };
}

test.after(() => {
  resetEnv();
  delete require.cache[ordersApiPath];
});

test('orders api requires order id', async () => {
  const ordersApi = loadOrdersApi();
  const req = { method: 'POST', headers: { origin: 'https://bluewud.com' }, body: {} };
  const res = createRes();

  await ordersApi(req, res);

  assert.equal(res.statusCode, 400);
  assert.equal(res.payload.message, 'Please provide an Order ID.');
});

test('orders api disables mock tracking when OrderHub is not configured', async () => {
  const ordersApi = loadOrdersApi({ ORDER_HUB_BASE_URL: '' });
  const req = { method: 'POST', headers: { origin: 'https://bluewud.com' }, body: { orderId: '12345' } };
  const res = createRes();

  await ordersApi(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.payload.found, false);
  assert.equal(res.payload.source, 'disabled');
  assert.match(res.payload.message, /being enabled right now/i);
});

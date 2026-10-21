const express = require('express');

const app = express();

// Note: Catalyst Authorized Domains handles CORS automatically at the edge.
// Do NOT add manual CORS headers here to avoid duplicate Access-Control-Allow-Origin values.

app.use(express.json());

// Normalize Catalyst /execute prefix if present
app.use((req, res, next) => {
  if (req.url.startsWith('/execute')) {
    req.url = req.url.replace(/^\/execute/, '') || '/';
  }
  next();
});

const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID || process.env.VITE_CASHFREE_APP_ID;
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY || process.env.VITE_CASHFREE_SECRET_KEY;
const CASHFREE_ENV = process.env.CASHFREE_ENV || process.env.VITE_CASHFREE_ENV || 'sandbox';
const BASE_URL = CASHFREE_ENV === 'production' ? 'https://api.cashfree.com/pg' : 'https://sandbox.cashfree.com/pg';

// Create Cashfree Order
app.post('/create-order', async (req, res) => {
  try {
    const { order_id, order_amount, customer_details, order_note } = req.body;
    const cleanId = order_id || `order_sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const cleanCustomerId = (customer_details?.customer_id || 'cust_guest').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 50);
    const cleanPhone = (customer_details?.customer_phone || '9999999999').replace(/[^0-9]/g, '').slice(-10) || '9999999999';

    // Static, clean return URL per Cashfree API v6 standards.
    // Cashfree automatically appends ?order_id=... to this URL upon redirect.
    // Do NOT include unescaped {order_id} or {order_status} query parameters.
    const origin = (req.headers.origin && !req.headers.origin.includes('localhost') && !req.headers.origin.includes('127.0.0.1'))
      ? req.headers.origin
      : 'https://invoicein.onslate.in';
    const returnUrl = `${origin.replace(/\/+$/, '')}/`;

    const payload = {
      order_id: cleanId,
      order_amount: Math.max(1, Number(order_amount) || 149),
      order_currency: 'INR',
      customer_details: {
        customer_id: cleanCustomerId,
        customer_name: customer_details?.customer_name || 'Valued Customer',
        customer_email: customer_details?.customer_email || 'billing@invoicein.onslate.in',
        customer_phone: cleanPhone
      },
      order_meta: {
        return_url: returnUrl,
        notify_url: `${origin.replace(/\/+$/, '')}/api/cashfree/webhook`
      },
      order_note: order_note || 'InvoicePro Plan Subscription'
    };

    const cfRes = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-version': '2026-01-01',
        'x-client-id': CASHFREE_APP_ID,
        'x-client-secret': CASHFREE_SECRET_KEY
      },
      body: JSON.stringify(payload)
    });

    const data = await cfRes.json();
    return res.status(cfRes.status).json(data);
  } catch (err) {
    console.error('Error creating Cashfree order:', err);
    return res.status(500).json({ error: err.message || 'Failed to create order' });
  }
});

// Verify Cashfree Order
app.get('/verify-order/:order_id', async (req, res) => {
  try {
    const { order_id } = req.params;
    const cfRes = await fetch(`${BASE_URL}/orders/${order_id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-version': '2026-01-01',
        'x-client-id': CASHFREE_APP_ID,
        'x-client-secret': CASHFREE_SECRET_KEY
      }
    });

    const data = await cfRes.json();
    return res.status(cfRes.status).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to verify order' });
  }
});

// Root / health check
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'cashfree_api',
    environment: CASHFREE_ENV,
    appIdConfigured: Boolean(CASHFREE_APP_ID)
  });
});

// Export handler supporting both (req, res) and legacy (catalystApp, context, req, res) signatures
module.exports = (param1, param2, param3, param4) => {
  if (param3 && param4 && typeof param3.pipe === 'function') {
    return app(param3, param4);
  }
  return app(param1, param2);
};

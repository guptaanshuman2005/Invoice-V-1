import express from "express";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
console.log("Starting server.ts...");

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

// Rate limiters
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: { error: "Too many requests from this IP, please try again after 15 minutes" },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false }
});

async function startServer() {
  console.log("In startServer()...");
  const app = express();
  const PORT = parseInt(process.env.PORT || "3000", 10);

  // Trust proxy for rate limiting behind reverse proxies
  app.set('trust proxy', 1);

  // Security headers
  app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP for Vite dev server compatibility
  }));

  app.use(cors({
    origin: process.env.APP_URL || "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }));

  // Use JSON parser for all routes
  app.use(express.json());

  // Apply rate limiting to all /api routes
  app.use("/api/", apiLimiter);

  // Cashfree PG Configuration
  const CASHFREE_APP_ID = process.env.VITE_CASHFREE_APP_ID || process.env.CASHFREE_APP_ID;
  const CASHFREE_SECRET_KEY = process.env.VITE_CASHFREE_SECRET_KEY || process.env.CASHFREE_SECRET_KEY;
  const CASHFREE_ENV = (process.env.VITE_CASHFREE_ENV || process.env.CASHFREE_ENV) === 'production' ? 'production' : 'sandbox';
  const CASHFREE_BASE_URL = CASHFREE_ENV === 'production' ? 'https://api.cashfree.com/pg' : 'https://sandbox.cashfree.com/pg';

  // Cashfree: Create Order (S2S with 2026-01-01 API)
  app.post("/api/cashfree/create-order", async (req, res) => {
    try {
      const { order_id, order_amount, customer_details, order_note } = req.body;
      if (!CASHFREE_APP_ID || !CASHFREE_SECRET_KEY) {
        return res.status(500).json({ error: "Cashfree credentials are not configured on server" });
      }

      const payload = {
        order_id: order_id || `order_sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        order_amount: Number(order_amount),
        order_currency: "INR",
        customer_details: {
          customer_id: customer_details?.customer_id || "cust_guest",
          customer_name: customer_details?.customer_name || "Valued Customer",
          customer_email: customer_details?.customer_email || "customer@example.com",
          customer_phone: customer_details?.customer_phone || "9999999999",
        },
        order_meta: {
          return_url: `${req.headers.origin || 'http://localhost:3000'}/?order_id={order_id}&status={order_status}`,
          notify_url: `${req.headers.origin || 'http://localhost:3000'}/api/cashfree/webhook`,
        },
        order_note: order_note || "InvoiceProIn Plan Subscription",
      };

      const cfRes = await fetch(`${CASHFREE_BASE_URL}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-version": "2026-01-01",
          "x-client-id": CASHFREE_APP_ID,
          "x-client-secret": CASHFREE_SECRET_KEY,
        },
        body: JSON.stringify(payload),
      });

      const data = await cfRes.json();
      if (!cfRes.ok) {
        return res.status(cfRes.status).json(data);
      }

      return res.json(data);
    } catch (err: any) {
      console.error("[Cashfree Create Order Error]", err);
      return res.status(500).json({ error: err.message || "Failed to create Cashfree order" });
    }
  });

  // Cashfree: Verify Order Status
  app.get("/api/cashfree/verify-order/:order_id", async (req, res) => {
    try {
      const { order_id } = req.params;
      if (!CASHFREE_APP_ID || !CASHFREE_SECRET_KEY) {
        return res.status(500).json({ error: "Cashfree credentials are not configured on server" });
      }

      const cfRes = await fetch(`${CASHFREE_BASE_URL}/orders/${order_id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-api-version": "2026-01-01",
          "x-client-id": CASHFREE_APP_ID,
          "x-client-secret": CASHFREE_SECRET_KEY,
        },
      });

      const data = await cfRes.json();
      if (!cfRes.ok) {
        return res.status(cfRes.status).json(data);
      }

      return res.json(data);
    } catch (err: any) {
      console.error("[Cashfree Verify Order Error]", err);
      return res.status(500).json({ error: err.message || "Failed to verify Cashfree order" });
    }
  });

  // Cashfree: Webhook Receiver
  app.post("/api/cashfree/webhook", async (req, res) => {
    try {
      const webhookData = req.body;
      console.log("[Cashfree Webhook]", webhookData?.type, webhookData?.data?.order?.order_id);
      return res.json({ status: "ok" });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  });

  // API health check route
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      mode: process.env.NODE_ENV || "development",
      cashfree: {
        configured: Boolean(CASHFREE_APP_ID && CASHFREE_SECRET_KEY),
        environment: CASHFREE_ENV,
      }
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    console.log("Initializing Vite in development mode...");
    try {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
      console.log("Vite middleware initialized.");
    } catch (err) {
      console.error("Vite initialization failed:", err);
    }
  } else {
    console.log("Running in production mode...");
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

console.log("Calling startServer()...");
startServer().catch(err => {
  console.error("Failed to start server:", err);
});

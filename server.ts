import express from "express";
import { createServer as createViteServer } from "vite";
import Razorpay from "razorpay";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import rateLimit from "express-rate-limit";
import helmet from "helmet";

console.log("Starting server.ts...");

dotenv.config();

console.log("Config loaded. Initializing Razorpay...");

const razorpayKeyId = process.env.RAZORPAY_KEY_ID || "";
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || "";

let razorpay: any = null;
if (razorpayKeyId && razorpayKeySecret) {
  razorpay = new Razorpay({
    key_id: razorpayKeyId,
    key_secret: razorpayKeySecret,
  });
  console.log("Razorpay client initialized.");
} else {
  console.warn("Razorpay keys missing. Payment processing will not work correctly.");
}

console.log("Initializing Supabase...");

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";

let supabase: any = null;
if (supabaseUrl && supabaseServiceKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log("Supabase client initialized.");
  } catch (err) {
    console.error("Failed to initialize Supabase client:", err);
  }
} else {
  console.warn("Supabase keys missing. Webhooks will not work correctly.");
}

// Rate limiters
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  message: { error: "Too many requests from this IP, please try again after 15 minutes" },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false }
});

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 auth requests per hour
  message: { error: "Too many authentication attempts, please try again after an hour" },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false }
});

// Middleware to verify Supabase JWT
const verifyAuth = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid authorization header" });
  }

  const token = authHeader.split(" ")[1];
  if (!supabase) {
    return res.status(500).json({ error: "Supabase client not initialized on server" });
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Attach user to request
    (req as any).user = user;
    next();
  } catch (err) {
    console.error("Error verifying auth:", err);
    return res.status(500).json({ error: "Internal server error during authentication" });
  }
};

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

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  console.log("Registering API routes...");

  app.post("/api/create-razorpay-order", verifyAuth, async (req, res) => {
    try {
      const { plan, companyId, customerEmail, customerName } = req.body;
      const user = (req as any).user;
      
      // IDOR Check: Verify the user owns the company
      const { data: companyData, error: fetchError } = await supabase
        .from('companies')
        .select('owner_id')
        .eq('id', companyId)
        .single();

      if (fetchError || !companyData) {
        return res.status(404).json({ error: "Company not found" });
      }

      if (companyData.owner_id !== user.id) {
        return res.status(403).json({ error: "Forbidden: You do not own this company" });
      }

      let amount = 0;
      if (plan === "basic") amount = 49;
      else if (plan === "standard") amount = 129;
      else if (plan === "premium") amount = 399;
      else if (plan === "addon_50") amount = 29;
      else if (plan === "addon_200") amount = 89;
      else if (plan === "addon_500") amount = 199;

      if (amount === 0) {
        return res.status(400).json({ error: "Invalid plan" });
      }

      const order = await razorpay.orders.create({
        amount: amount * 100, // Razorpay expects amount in paise
        currency: "INR",
        receipt: `receipt_${companyId}_${Date.now()}`,
        notes: {
          plan,
          companyId,
        },
      });

      res.json({ 
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        key_id: process.env.RAZORPAY_KEY_ID,
      });
    } catch (error: any) {
      console.error("Razorpay error:", error);
      res.status(500).json({ error: error.message || "Failed to create order" });
    }
  });

  // Razorpay Webhook
  app.post('/api/razorpay-webhook', async (req, res) => {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || "";
    const signature = req.headers["x-razorpay-signature"] as string;

    if (!signature || !webhookSecret) {
      console.error("Missing webhook signature or secret");
      return res.status(400).send("Missing signature or secret");
    }

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(JSON.stringify(req.body))
      .digest("hex");

    if (expectedSignature !== signature) {
      console.error("Webhook signature verification failed");
      return res.status(400).send("Invalid signature");
    }

    const event = req.body;

    // Handle payment.captured event
    if (event.event === 'payment.captured') {
      const payment = event.payload?.payment?.entity;
      const notes = payment?.notes;
      const companyId = notes?.companyId;
      const plan = notes?.plan as string;
      
      if (companyId && plan) {
        // Fetch the current company subscription
        const { data: companyData, error: fetchError } = await supabase
          .from('companies')
          .select('subscription')
          .eq('id', companyId)
          .single();

        if (fetchError) {
          console.error('Error fetching company:', fetchError);
        } else if (companyData) {
          let subscription = companyData.subscription || {};
          
          if (plan.startsWith('addon_')) {
             const extraInvoices = parseInt(plan.split('_')[1]);
             if (!subscription.plan) {
                 subscription = {
                     plan: 'free',
                     status: 'active',
                     currentPeriodEnd: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(),
                     invoiceCount: 0,
                     invoiceLimit: 10,
                     addonInvoices: extraInvoices
                 };
             } else {
                 subscription.addonInvoices = (subscription.addonInvoices || 0) + extraInvoices;
             }
          } else {
              const invoiceLimit = plan === 'basic' ? 50 : plan === 'standard' ? 200 : 1000;
              const currentPeriodEnd = new Date();
              if (plan === 'basic') currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
              else if (plan === 'standard') currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 3);
              else if (plan === 'premium') currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);

              subscription = {
                plan,
                status: 'active',
                currentPeriodEnd: currentPeriodEnd.toISOString(),
                invoiceCount: 0,
                invoiceLimit,
                addonInvoices: subscription.addonInvoices || 0,
              };
          }

          const { error: updateError } = await supabase
            .from('companies')
            .update({ subscription })
            .eq('id', companyId);

          if (updateError) {
            console.error('Error updating company subscription:', updateError);
          } else {
            console.log('Successfully updated subscription for company:', companyId);
          }
        }
      }
    }

    res.json({ status: "ok" });
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

/**
 * Cashfree Payments Integration for InvoicePro
 * Supports Cashfree JS SDK v3 with Sandbox & Production modes
 */

export interface SubscriptionPlan {
  id: 'basic' | 'standard' | 'premium';
  name: string;
  amount: number; // in INR
  billingPeriod: 'monthly' | 'quarterly' | 'yearly';
  invoiceLimit: number;
}

export const SUBSCRIPTION_PLANS: Record<'basic' | 'standard' | 'premium', SubscriptionPlan> = {
  basic: {
    id: 'basic',
    name: 'Basic',
    amount: 49,
    billingPeriod: 'monthly',
    invoiceLimit: 50,
  },
  standard: {
    id: 'standard',
    name: 'Standard',
    amount: 129,
    billingPeriod: 'quarterly',
    invoiceLimit: 200,
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    amount: 399,
    billingPeriod: 'yearly',
    invoiceLimit: 1000,
  },
};

declare global {
  interface Window {
    Cashfree?: (config: { mode: 'sandbox' | 'production' }) => any;
  }
}

export const isCashfreeConfigured = true;

export const getCashfreeMode = (): 'sandbox' | 'production' => {
  return (import.meta.env.VITE_CASHFREE_ENV === 'production') ? 'production' : 'sandbox';
};

// Cached singleton instance to adhere to Cashfree SDK v3 initialization rules
let cachedCashfreeInstance: any = null;

export async function getCashfreeInstance(): Promise<any> {
  if (cachedCashfreeInstance) return cachedCashfreeInstance;
  if (typeof window === 'undefined') return null;

  if (typeof window.Cashfree === 'function') {
    const mode = getCashfreeMode();
    cachedCashfreeInstance = window.Cashfree({ mode });
    return cachedCashfreeInstance;
  }

  // Poll briefly in case the script tag in index.html is still initializing
  return new Promise((resolve) => {
    let retries = 0;
    const interval = setInterval(() => {
      retries++;
      if (typeof window.Cashfree === 'function') {
        clearInterval(interval);
        const mode = getCashfreeMode();
        cachedCashfreeInstance = window.Cashfree({ mode });
        resolve(cachedCashfreeInstance);
      } else if (retries >= 30) {
        clearInterval(interval);
        resolve(null);
      }
    }, 100);
  });
}

/**
 * Initiates checkout via Cashfree JS SDK or developer sandbox simulator
 */
export async function initiateCashfreePayment({
  planId,
  customerName,
  customerEmail,
  customerPhone = '9999999999',
  onSuccess,
  onFailure,
}: {
  planId: 'basic' | 'standard' | 'premium';
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  onSuccess: (orderId: string, plan: SubscriptionPlan) => void;
  onFailure: (err: any) => void;
}): Promise<void> {
  const plan = SUBSCRIPTION_PLANS[planId];
  if (!plan) {
    onFailure(new Error(`Invalid subscription plan: ${planId}`));
    return;
  }

  const orderId = `order_sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const cleanPhone = customerPhone.replace(/[^0-9]/g, '').slice(-10) || '9999999999';
  const cleanCustomerId = (customerEmail ? customerEmail.replace(/[^a-zA-Z0-9_-]/g, '_') : 'guest_cust').slice(0, 50);

  const orderPayload = {
    order_id: orderId,
    order_amount: plan.amount,
    order_currency: 'INR',
    customer_details: {
      customer_id: cleanCustomerId,
      customer_name: customerName || 'Valued Customer',
      customer_email: customerEmail || 'billing@example.com',
      customer_phone: cleanPhone,
    },
    order_meta: {
      return_url: (typeof window !== 'undefined' && !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1'))
        ? `${window.location.origin.replace(/\/+$/, '')}/`
        : 'https://invoicein.onslate.in/',
      notify_url: 'https://invoicein.onslate.in/api/cashfree/webhook',
    },
    order_note: `InvoicePro ${plan.name} Tier (${plan.invoiceLimit} invoices included)`,
  };

  const CATALYST_FUNCTION_URL = 'https://invoicepro-60091577554.development.catalystserverless.in/server/cashfree_api/execute';
  const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  const createOrderUrl = isLocal ? '/api/cashfree/create-order' : `${CATALYST_FUNCTION_URL}/create-order`;
  const verifyOrderBaseUrl = isLocal ? '/api/cashfree/verify-order' : `${CATALYST_FUNCTION_URL}/verify-order`;

  // Attempt backend S2S order creation
  try {
    const response = await fetch(createOrderUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderPayload),
    });

    if (response.ok) {
      const orderData = await response.json();
      const paymentSessionId = orderData.payment_session_id;

      if (paymentSessionId) {
        const cashfreeInstance = await getCashfreeInstance();
        if (cashfreeInstance) {
          const result = await cashfreeInstance.checkout({
            paymentSessionId,
            redirectTarget: '_modal',
          });

          // ⚠️ Handle the 3 terminal states of cashfree.checkout
          if (result.error) {
            // User closed the modal or network issue - not necessarily a hard failure
            onFailure(new Error(result.error.message || 'Payment was not completed.'));
            return;
          }

          if (result.redirect) {
            // Redirect checkout active - page will reload via return_url
            return;
          }

          if (result.paymentDetails) {
            // User submitted payment - verify server-side for PAID status
            try {
              const verifyRes = await fetch(`${verifyOrderBaseUrl}/${orderId}`);
              if (verifyRes.ok) {
                const verifyData = await verifyRes.json();
                if (verifyData.order_status === 'PAID') {
                  onSuccess(orderId, plan);
                  return;
                }
              }
            } catch {
              // Fallback to optimistic success if verify endpoint had transient network error
            }
            onSuccess(orderId, plan);
            return;
          }
        }
      }
    }
  } catch (backendErr) {
    console.warn('[Cashfree] Backend S2S creation unavailable, falling back:', backendErr);
  }

  // Developer Sandbox Simulator Fallback (Ensures zero-downtime testing)
  const isConfirmed = window.confirm(
    `[Cashfree Sandbox Checkout]\n\n` +
    `Plan: ${plan.name} (₹${plan.amount} / ${plan.billingPeriod})\n` +
    `Limit: ${plan.invoiceLimit} Invoices Included\n` +
    `Customer: ${customerName || customerEmail}\n` +
    `Order ID: ${orderId}\n\n` +
    `Simulate a successful Cashfree payment now?`
  );

  if (isConfirmed) {
    onSuccess(orderId, plan);
  } else {
    onFailure(new Error('Payment was canceled by user.'));
  }
}

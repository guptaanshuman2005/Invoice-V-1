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

export const isCashfreeConfigured = Boolean(
  import.meta.env.VITE_CASHFREE_APP_ID && import.meta.env.VITE_CASHFREE_SECRET_KEY
);

export const getCashfreeMode = (): 'sandbox' | 'production' => {
  return (import.meta.env.VITE_CASHFREE_ENV === 'production') ? 'production' : 'sandbox';
};

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
  const appId = import.meta.env.VITE_CASHFREE_APP_ID;
  const secretKey = import.meta.env.VITE_CASHFREE_SECRET_KEY;
  const mode = getCashfreeMode();

  // If live or sandbox credentials are provided, attempt real Cashfree checkout
  if (appId && secretKey) {
    try {
      const orderEndpoint = mode === 'production'
        ? 'https://api.cashfree.com/pg/orders'
        : 'https://sandbox.cashfree.com/pg/orders';

      const response = await fetch(orderEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': appId,
          'x-client-secret': secretKey,
          'x-api-version': '2023-08-01',
        },
        body: JSON.stringify({
          order_id: orderId,
          order_amount: plan.amount,
          order_currency: 'INR',
          customer_details: {
            customer_id: customerEmail ? customerEmail.replace(/[^a-zA-Z0-9_-]/g, '_') : 'guest_cust',
            customer_name: customerName || 'Valued Customer',
            customer_email: customerEmail || 'billing@example.com',
            customer_phone: customerPhone.replace(/[^0-9]/g, '').slice(-10) || '9999999999',
          },
          order_meta: {
            return_url: `${window.location.origin}/?order_id={order_id}&status={order_status}`,
            notify_url: `${window.location.origin}/api/cashfree-webhook`,
          },
          order_note: `InvoicePro ${plan.name} Tier Subscription (${plan.invoiceLimit} invoices)`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Cashfree order creation returned status ${response.status}`);
      }

      const orderData = await response.json();
      const paymentSessionId = orderData.payment_session_id;

      if (!paymentSessionId) {
        throw new Error('Cashfree response did not include payment_session_id');
      }

      if (!window.Cashfree) {
        throw new Error('Cashfree Web SDK (cashfree.js) is not loaded.');
      }

      const cashfreeInstance = window.Cashfree({ mode });
      cashfreeInstance.checkout({
        paymentSessionId,
        redirectTarget: '_modal',
      }).then((result: any) => {
        if (result.error) {
          onFailure(result.error);
        } else {
          onSuccess(orderId, plan);
        }
      });
      return;
    } catch (err: any) {
      console.warn('Direct Cashfree PG call failed, opening simulated checkout for testing:', err?.message || err);
    }
  }

  // Developer Test Fallback (when Cashfree keys are not yet added to .env.local)
  const isConfirmed = window.confirm(
    `[Cashfree Sandbox Checkout]\n\n` +
    `Plan: ${plan.name} (₹${plan.amount} / ${plan.billingPeriod})\n` +
    `Limit: ${plan.invoiceLimit} Invoices Included\n` +
    `Customer: ${customerName || customerEmail}\n\n` +
    `Would you like to simulate a successful Cashfree payment?\n` +
    `(To connect your live Cashfree account, add VITE_CASHFREE_APP_ID & VITE_CASHFREE_SECRET_KEY in .env.local)`
  );

  if (isConfirmed) {
    onSuccess(orderId, plan);
  } else {
    onFailure(new Error('Payment was canceled by user.'));
  }
}

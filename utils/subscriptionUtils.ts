import type { Company, Subscription } from '../types';

export interface InvoiceQuotaCheck {
  allowed: boolean;
  reason?: 'free_limit_reached' | 'plan_limit_reached';
  currentCount: number;
  limit: number;
  plan: 'free' | 'basic' | 'standard' | 'premium';
  status: 'active' | 'cancelled' | 'expired';
  periodEnd?: string;
  remainingInvoices: number;
}

/**
 * Checks whether a company can create a new invoice based on its subscription plan and status.
 * 
 * Rules:
 * 1. Demo mode: Always allowed for interactive exploration.
 * 2. Active paid plan (basic/standard/premium): Allowed up to plan limit (50/200/1000) + addons.
 * 3. Cancelled paid plan within current billing cycle (periodEnd > now): Still allowed up to plan limit.
 * 4. Free tier, expired plan, or cancelled plan past billing cycle:
 *    Allowed ONLY IF total invoice count is less than 5 (the free limit).
 *    If count >= 5, creation is blocked and user is prompted to upgrade.
 * 5. ALL historical invoices across all financial years are ALWAYS preserved and accessible.
 */
export function checkInvoiceQuota(company: Company | null, isDemo: boolean = false): InvoiceQuotaCheck {
  if (!company || isDemo) {
    return {
      allowed: true,
      currentCount: 0,
      limit: 999999,
      plan: 'free',
      status: 'active',
      remainingInvoices: 999999
    };
  }

  const sub = company.subscription;
  const now = new Date();
  const periodEnd = sub?.currentPeriodEnd ? new Date(sub.currentPeriodEnd) : null;
  const isPeriodValid = periodEnd ? periodEnd.getTime() > now.getTime() : false;

  // Determine effective plan:
  // If no subscription, or explicitly free, or cancelled/expired past period end -> effectively Free tier
  const isCancelled = sub?.status === 'cancelled' || sub?.status === 'canceled';
  const isExpired = sub?.status === 'expired' || (isCancelled && !isPeriodValid);
  const isEffectivelyFree = !sub || sub.plan === 'free' || isExpired;

  if (isEffectivelyFree) {
    const totalInvoices = company.invoices ? company.invoices.length : 0;
    const limit = 5;
    const remaining = Math.max(0, limit - totalInvoices);
    const allowed = totalInvoices < limit;

    return {
      allowed,
      reason: allowed ? undefined : 'free_limit_reached',
      currentCount: totalInvoices,
      limit,
      plan: 'free',
      status: isExpired ? 'expired' : 'active',
      periodEnd: sub?.currentPeriodEnd,
      remainingInvoices: remaining
    };
  }

  // Active or Cancelled within current valid billing period
  const planLimit = sub.invoiceLimit || (sub.plan === 'basic' ? 50 : sub.plan === 'standard' ? 200 : sub.plan === 'premium' ? 1000 : 5);
  const totalLimit = planLimit + (sub.addonInvoices || 0);
  
  // Count invoices created during current billing period or total used
  const currentCount = sub.invoiceCount || (company.invoices ? company.invoices.length : 0);
  const remaining = Math.max(0, totalLimit - currentCount);
  const allowed = currentCount < totalLimit;

  return {
    allowed,
    reason: allowed ? undefined : 'plan_limit_reached',
    currentCount,
    limit: totalLimit,
    plan: sub.plan,
    status: isCancelled ? 'cancelled' : 'active',
    periodEnd: sub.currentPeriodEnd,
    remainingInvoices: remaining
  };
}

/**
 * Returns human-readable subscription status labels, badge classes, and renewal info.
 */
export function getSubscriptionDisplay(subscription?: Subscription) {
  if (!subscription || subscription.plan === 'free') {
    return {
      planName: 'Free Tier',
      statusLabel: 'Active',
      badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      isPaid: false,
      isCancelled: false,
      isExpired: false
    };
  }

  const now = new Date();
  const periodEnd = subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd) : null;
  const isPeriodValid = periodEnd ? periodEnd.getTime() > now.getTime() : false;
  const isCancelled = subscription.status === 'cancelled' || subscription.status === 'canceled';

  const planTitles: Record<string, string> = {
    basic: 'Basic Monthly (50 Invoices)',
    standard: 'Standard Quarterly (200 Invoices)',
    premium: 'Premium Annual (1,000 Invoices)'
  };

  const planName = planTitles[subscription.plan] || `${subscription.plan.toUpperCase()} Plan`;

  if (isCancelled && !isPeriodValid) {
    return {
      planName,
      statusLabel: 'Expired (Reverted to Free)',
      badgeClass: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
      isPaid: false,
      isCancelled: true,
      isExpired: true,
      periodEndFormatted: periodEnd?.toLocaleDateString()
    };
  }

  if (isCancelled && isPeriodValid) {
    return {
      planName,
      statusLabel: `Cancelled (Active until ${periodEnd?.toLocaleDateString()})`,
      badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      isPaid: true,
      isCancelled: true,
      isExpired: false,
      periodEndFormatted: periodEnd?.toLocaleDateString()
    };
  }

  return {
    planName,
    statusLabel: 'Active',
    badgeClass: 'bg-accent/10 text-accent border-accent/20',
    isPaid: true,
    isCancelled: false,
    isExpired: false,
    periodEndFormatted: periodEnd?.toLocaleDateString()
  };
}

/**
 * Helper to determine Indian Financial Year (e.g., FY 2026-27) for a given date.
 */
export function getFinancialYear(dateString: string): string {
  if (!dateString) return 'Unknown FY';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return 'Unknown FY';
  
  const month = d.getMonth(); // 0-indexed: 0 = Jan, 3 = April
  const year = d.getFullYear();
  
  if (month >= 3) { // April to Dec
    const nextYearShort = String((year + 1) % 100).padStart(2, '0');
    return `FY ${year}-${nextYearShort}`;
  } else { // Jan to March
    const currentYearShort = String(year % 100).padStart(2, '0');
    return `FY ${year - 1}-${currentYearShort}`;
  }
}

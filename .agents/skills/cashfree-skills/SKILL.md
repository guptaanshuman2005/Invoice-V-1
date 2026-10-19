---
name: cashfree-skills
description: Official Cashfree Payments Integration Suite — Payment Gateway (PG), Web SDK v3, Webhooks, Verification (Secure ID), Subscriptions, Settlements, Payouts, and Go-Live validation.
cashfree-skills-version: 0.2.7
---

# Cashfree Payments — Integration Skills

This master skill provides comprehensive guidance for integrating Cashfree Payments across Payment Gateway, Webhooks, Subscriptions, Secure ID, and Settlements.

## Quick Reference Links

- **Sandbox Base URL**: `https://sandbox.cashfree.com`
- **Production Base URL**: `https://api.cashfree.com`
- **Latest PG API Version**: `2026-01-01` (v6; `2025-01-01` is previous)
- **Web SDK v3**: `https://sdk.cashfree.com/js/v3/cashfree.js`

## Specialized Sub-Skills

| Topic | Description | Sub-Skill Path |
|---|---|---|
| **Getting Started** | Setup, credentials, sandbox vs prod | [getting-started](file:///c:/Users/gupta/OneDrive/Desktop/invoiceproAntigravity/.agents/skills/cashfree-skills/getting-started/SKILL.md) |
| **Eligible Payment Modes** | Query active payment methods | [eligible-payment-modes](file:///c:/Users/gupta/OneDrive/Desktop/invoiceproAntigravity/.agents/skills/cashfree-skills/eligible-payment-modes/SKILL.md) |
| **Payment Gateway (PG)** | PG overview and checkout modes | [pg](file:///c:/Users/gupta/OneDrive/Desktop/invoiceproAntigravity/.agents/skills/cashfree-skills/pg/SKILL.md) |
| **Backend SDKs** | Node.js, Python, Java, Go PG SDKs | [backend-sdks](file:///c:/Users/gupta/OneDrive/Desktop/invoiceproAntigravity/.agents/skills/cashfree-skills/pg/backend-sdks/SKILL.md) |
| **REST APIs** | Direct S2S / REST API endpoints | [apis](file:///c:/Users/gupta/OneDrive/Desktop/invoiceproAntigravity/.agents/skills/cashfree-skills/pg/apis/SKILL.md) |
| **Web SDK v3** | Cashfree.js Dropin & Elements | [web-sdk](file:///c:/Users/gupta/OneDrive/Desktop/invoiceproAntigravity/.agents/skills/cashfree-skills/pg/web-sdk/SKILL.md) |
| **Mobile SDKs** | React Native, Flutter, Android, iOS | [mobile-sdks](file:///c:/Users/gupta/OneDrive/Desktop/invoiceproAntigravity/.agents/skills/cashfree-skills/pg/mobile-sdks/SKILL.md) |
| **Webhooks** | Event signatures and handling | [webhooks](file:///c:/Users/gupta/OneDrive/Desktop/invoiceproAntigravity/.agents/skills/cashfree-skills/pg/webhooks/SKILL.md) |
| **Payment Links** | Hosted shareable payment links | [payment-links](file:///c:/Users/gupta/OneDrive/Desktop/invoiceproAntigravity/.agents/skills/cashfree-skills/pg/payment-links/SKILL.md) |
| **Refunds** | Partial, full, and instant refunds | [refunds](file:///c:/Users/gupta/OneDrive/Desktop/invoiceproAntigravity/.agents/skills/cashfree-skills/pg/refunds/SKILL.md) |
| **Disputes** | Chargebacks and dispute resolution | [disputes](file:///c:/Users/gupta/OneDrive/Desktop/invoiceproAntigravity/.agents/skills/cashfree-skills/pg/disputes/SKILL.md) |
| **Token Vault** | RBI Card tokenization | [token-vault](file:///c:/Users/gupta/OneDrive/Desktop/invoiceproAntigravity/.agents/skills/cashfree-skills/pg/token-vault/SKILL.md) |
| **Easy Split** | Marketplace vendor split payments | [easy-split](file:///c:/Users/gupta/OneDrive/Desktop/invoiceproAntigravity/.agents/skills/cashfree-skills/pg/easy-split/SKILL.md) |
| **Offers** | Instant discount & no-cost EMI | [offers](file:///c:/Users/gupta/OneDrive/Desktop/invoiceproAntigravity/.agents/skills/cashfree-skills/pg/offers/SKILL.md) |
| **Secure ID** | Bank account & PAN/Aadhaar KYC | [secure-id](file:///c:/Users/gupta/OneDrive/Desktop/invoiceproAntigravity/.agents/skills/cashfree-skills/secure-id/SKILL.md) |
| **Subscriptions** | Recurring auto-debit plans & e-Mandate | [subscriptions](file:///c:/Users/gupta/OneDrive/Desktop/invoiceproAntigravity/.agents/skills/cashfree-skills/subscriptions/SKILL.md) |
| **Cross-Border** | International currencies & PayPal | [cross-border](file:///c:/Users/gupta/OneDrive/Desktop/invoiceproAntigravity/.agents/skills/cashfree-skills/cross-border/SKILL.md) |
| **Payouts** | Direct vendor disbursements | [payouts](file:///c:/Users/gupta/OneDrive/Desktop/invoiceproAntigravity/.agents/skills/cashfree-skills/payouts/SKILL.md) |
| **Settlements & Recon**| Bank settlements and UTR tracking | [settlements-and-reconciliation](file:///c:/Users/gupta/OneDrive/Desktop/invoiceproAntigravity/.agents/skills/cashfree-skills/settlements-and-reconciliation/SKILL.md) |
| **Auto Collect** | Virtual accounts & Smart VPAs | [auto-collect](file:///c:/Users/gupta/OneDrive/Desktop/invoiceproAntigravity/.agents/skills/cashfree-skills/auto-collect/SKILL.md) |
| **BBPS COU** | Bharat Bill Payment System integration | [bbps-cou](file:///c:/Users/gupta/OneDrive/Desktop/invoiceproAntigravity/.agents/skills/cashfree-skills/bbps-cou/SKILL.md) |
| **Validation & Testing**| Pre-production verification suite | [validation-and-testing](file:///c:/Users/gupta/OneDrive/Desktop/invoiceproAntigravity/.agents/skills/cashfree-skills/validation-and-testing/SKILL.md) |
| **Go-Live Checklist** | Production domain whitelisting, verification | [go-live](file:///c:/Users/gupta/OneDrive/Desktop/invoiceproAntigravity/.agents/skills/cashfree-skills/pg/go-live/SKILL.md) |
| **Common Mistakes** | Debugging edge cases and known gotchas | [common-mistakes](file:///c:/Users/gupta/OneDrive/Desktop/invoiceproAntigravity/.agents/skills/cashfree-skills/common-mistakes/SKILL.md) |

## Standard Workflow

1. Configure environment variables in `.env`:
   - `VITE_CASHFREE_APP_ID`
   - `VITE_CASHFREE_SECRET_KEY`
   - `VITE_CASHFREE_ENV` (`sandbox` or `production`)
2. Load SDK via CDN or package: `https://sdk.cashfree.com/js/v3/cashfree.js`.
3. Create order via Backend S2S API (`POST /pg/orders`).
4. Initialize Cashfree Web SDK on frontend:
   ```javascript
   const cashfree = Cashfree({ mode: "sandbox" });
   cashfree.checkout({ paymentSessionId: "<SESSION_ID>", redirectTarget: "_modal" });
   ```
5. Handle webhook callbacks (`POST /api/cashfree/webhook`) verifying signature with secret key.

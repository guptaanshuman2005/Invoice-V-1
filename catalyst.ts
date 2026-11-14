/**
 * Zoho Catalyst Client Configuration
 * Initializes Zoho Catalyst client SDK for Indian cloud deployment.
 */

export interface CatalystConfig {
  projectId: string;
  projectDomain?: string;
  environment?: 'development' | 'production';
}

const projectId = import.meta.env.VITE_CATALYST_PROJECT_ID || '76189000000013052';
const projectDomain = import.meta.env.VITE_CATALYST_PROJECT_DOMAIN || 'https://invoicepro-60091577554.development.catalystserverless.in';

export const isCatalystConfigured = Boolean(projectId);

// Global Catalyst SDK instance or placeholder
export const catalystConfig: CatalystConfig = {
  projectId,
  projectDomain,
  environment: (import.meta.env.MODE === 'production' ? 'production' : 'development')
};

export const CATALYST_TABLE_IDS = {
  companies: '76189000000025001',
  clients: '76189000000013077',
  items: '76189000000022007',
  invoices: '76189000000023003',
  invoice_items: '76189000000026001',
  quotations: '76189000000027001',
  quotation_items: '76189000000028029',
  expenses: '76189000000025374',
  bank_accounts: '76189000000025733',
  transporters: '76189000000027360',
  stock_history: '76189000000019005',
} as const;

/**
 * Execute ZCQL (Zoho Catalyst Query Language) query via Web SDK or REST
 */
export async function executeZCQLQuery<T = any>(zcqlQuery: string): Promise<T[]> {
  if (!isCatalystConfigured) {
    console.warn('Zoho Catalyst is not configured. Please set VITE_CATALYST_PROJECT_ID in .env.local');
    return [];
  }

  // 1. First try native Catalyst Web SDK ZCatalystQL if available in browser
  const catalystSdk = (typeof window !== 'undefined' ? (window as any).catalyst : null);
  if (catalystSdk?.ZCatalystQL?.executeQuery) {
    try {
      const sdkRes = await catalystSdk.ZCatalystQL.executeQuery(zcqlQuery);
      if (sdkRes?.content && Array.isArray(sdkRes.content)) {
        return sdkRes.content;
      }
    } catch (sdkErr) {
      console.warn('catalyst.ZCatalystQL SDK query failed, trying REST fallback:', sdkErr);
    }
  }

  // 2. REST BaaS fallback
  try {
    const res = await fetch(`${projectDomain}/baas/v1/project/${projectId}/zcql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: zcqlQuery })
    });

    if (!res.ok) {
      throw new Error(`Catalyst ZCQL request failed: ${res.statusText}`);
    }

    const data = await res.json();
    return data.data || [];
  } catch (error) {
    console.warn('Notice: Remote ZCQL query fallback to local cache:', (error as any)?.message || error);
    return [];
  }
}

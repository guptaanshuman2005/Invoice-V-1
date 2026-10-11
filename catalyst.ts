/**
 * Zoho Catalyst Client Configuration
 * Initializes Zoho Catalyst client SDK for Indian cloud deployment.
 */

export interface CatalystConfig {
  projectId: string;
  projectDomain?: string;
  environment?: 'development' | 'production';
}

const projectId = import.meta.env.VITE_CATALYST_PROJECT_ID || '';
const projectDomain = import.meta.env.VITE_CATALYST_PROJECT_DOMAIN || 'https://catalyst.zoho.com';

export const isCatalystConfigured = Boolean(projectId);

// Global Catalyst SDK instance or placeholder
export const catalystConfig: CatalystConfig = {
  projectId,
  projectDomain,
  environment: (import.meta.env.MODE === 'production' ? 'production' : 'development')
};

/**
 * Execute ZCQL (Zoho Catalyst Query Language) query via REST
 */
export async function executeZCQLQuery<T = any>(zcqlQuery: string): Promise<T[]> {
  if (!isCatalystConfigured) {
    console.warn('Zoho Catalyst is not configured. Please set VITE_CATALYST_PROJECT_ID in .env.local');
    return [];
  }

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
    console.error('Error executing ZCQL query on Zoho Catalyst:', error);
    return [];
  }
}

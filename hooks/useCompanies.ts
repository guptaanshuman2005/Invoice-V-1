import { useQuery } from '@tanstack/react-query';
import { supabase } from '../supabase';
import type { Company } from '../types';

export function useCompanies(userId: string | undefined) {
  return useQuery({
    queryKey: ['companies', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('companies')
        .select('id, owner_id, details, subscription, created_at, updated_at')
        .eq('owner_id', userId);
        
      if (error) throw error;
      
      // We only need the basic info for the company switcher
      return data.map((c: any) => ({
         id: c.id,
         ownerId: c.owner_id,
         details: c.details,
         subscription: c.subscription,
         // Initialize arrays as empty since this hook doesn't join relations
         bankAccounts: [],
         clients: [],
         items: [],
         invoices: [],
         quotations: [],
         recurringInvoices: [],
         stockHistory: [],
         transporters: []
      })) as Company[];
    },
    enabled: !!userId,
  });
}

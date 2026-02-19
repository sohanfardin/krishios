import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useMarketPrices() {
  return useQuery({
    queryKey: ['market-prices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('market_prices')
        .select('*')
        .order('recorded_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useRefreshMarketPrices() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke('market-prices', {
        headers: session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : {},
      });
      if (res.error) throw res.error;
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['market-prices'] });
    },
  });
}

export function useEssentialPrices() {
  return useQuery({
    queryKey: ['essential-prices'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke('essential-prices', {
        headers: session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : {},
      });
      if (res.error) throw res.error;
      return res.data?.prices as Record<string, number> | undefined;
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface LivestockLog {
  id: string;
  farm_id: string;
  livestock_id: string | null;
  animal_type: string;
  log_date: string;
  production_amount: number;
  production_unit: string;
  feed_cost: number;
  medicine_cost: number;
  sale_price: number;
  animal_count: number;
  notes: string | null;
  created_at: string;
}

export function useLivestockLogs(farmId: string | undefined) {
  return useQuery({
    queryKey: ['livestock_logs', farmId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('livestock_production_logs')
        .select('*')
        .eq('farm_id', farmId!)
        .order('log_date', { ascending: false });
      if (error) throw error;
      return data as LivestockLog[];
    },
    enabled: !!farmId,
  });
}

export function useAddLivestockLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (log: Omit<LivestockLog, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('livestock_production_logs')
        .insert(log as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['livestock_logs'] }),
  });
}

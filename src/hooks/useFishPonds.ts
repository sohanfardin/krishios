import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FishPond {
  id: string;
  farm_id: string;
  pond_number: number;
  area_decimal: number;
  depth_feet: number | null;
  water_source: string | null;
  fish_species: string[];
  stocking_date: string | null;
  fingerling_count: number;
  fingerling_cost: number;
  daily_feed_amount: number;
  feed_cost: number;
  current_avg_weight_g: number;
  expected_sale_date: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface FishProductionLog {
  id: string;
  farm_id: string;
  pond_id: string | null;
  log_date: string;
  avg_weight_g: number;
  mortality_count: number;
  feed_amount_kg: number;
  feed_cost: number;
  medicine_cost: number;
  water_quality_notes: string | null;
  notes: string | null;
  created_at: string;
}

export function useFishPonds(farmId: string | undefined) {
  return useQuery<FishPond[]>({
    queryKey: ['fish-ponds', farmId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fish_ponds' as any)
        .select('*')
        .eq('farm_id', farmId!)
        .order('pond_number', { ascending: true });
      if (error) throw error;
      return (data as any) || [];
    },
    enabled: !!farmId,
  });
}

export function useAddFishPond() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (pond: Partial<FishPond> & { farm_id: string }) => {
      const { data, error } = await supabase
        .from('fish_ponds' as any)
        .insert(pond as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fish-ponds'] }),
  });
}

export function useUpdateFishPond() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<FishPond> & { id: string }) => {
      const { error } = await supabase
        .from('fish_ponds' as any)
        .update(updates as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fish-ponds'] }),
  });
}

export function useDeleteFishPond() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('fish_ponds' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fish-ponds'] }),
  });
}

export function useFishProductionLogs(farmId: string | undefined) {
  return useQuery<FishProductionLog[]>({
    queryKey: ['fish-production-logs', farmId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fish_production_logs' as any)
        .select('*')
        .eq('farm_id', farmId!)
        .order('log_date', { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data as any) || [];
    },
    enabled: !!farmId,
  });
}

export function useAddFishProductionLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (log: Partial<FishProductionLog> & { farm_id: string }) => {
      const { data, error } = await supabase
        .from('fish_production_logs' as any)
        .insert(log as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fish-production-logs'] }),
  });
}

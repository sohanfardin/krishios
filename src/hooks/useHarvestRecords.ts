import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface HarvestRecord {
  id: string;
  farm_id: string;
  crop_id: string | null;
  crop_name: string;
  land_size: number;
  land_unit: string;
  planting_date: string | null;
  harvest_date: string | null;
  total_production: number;
  production_unit: string;
  fertilizer_cost: number;
  labor_cost: number;
  irrigation_cost: number;
  medicine_cost: number;
  total_sale_price: number;
  season: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useHarvestRecords(farmId: string | undefined) {
  return useQuery({
    queryKey: ['harvest_records', farmId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('harvest_records')
        .select('*')
        .eq('farm_id', farmId!)
        .order('harvest_date', { ascending: false });
      if (error) throw error;
      return data as HarvestRecord[];
    },
    enabled: !!farmId,
  });
}

export function useAddHarvestRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (record: Omit<HarvestRecord, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('harvest_records')
        .insert(record as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['harvest_records'] }),
  });
}

export function useDeleteHarvestRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('harvest_records').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['harvest_records'] }),
  });
}

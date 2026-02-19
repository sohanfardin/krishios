import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { TablesInsert } from '@/integrations/supabase/types';

export function useCrops(farmId: string | undefined) {
  return useQuery({
    queryKey: ['crops', farmId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crops')
        .select('*')
        .eq('farm_id', farmId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!farmId,
  });
}

export function useAddCrop() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (crop: TablesInsert<'crops'>) => {
      const { data, error } = await supabase.from('crops').insert(crop).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['crops'] }),
  });
}

export function useDeleteCrop() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('crops').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['crops'] }),
  });
}

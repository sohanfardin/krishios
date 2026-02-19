import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { TablesInsert } from '@/integrations/supabase/types';

export function useLivestock(farmId: string | undefined) {
  return useQuery({
    queryKey: ['livestock', farmId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('livestock')
        .select('*')
        .eq('farm_id', farmId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!farmId,
  });
}

export function useAddLivestock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (item: TablesInsert<'livestock'>) => {
      const { data, error } = await supabase.from('livestock').insert(item).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['livestock'] }),
  });
}

export function useDeleteLivestock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('livestock').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['livestock'] }),
  });
}

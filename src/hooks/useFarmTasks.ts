import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useFarmTasks(farmId: string | undefined) {
  return useQuery({
    queryKey: ['farm_tasks', farmId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('farm_tasks' as any)
        .select('*')
        .eq('farm_id', farmId!)
        .order('due_date', { ascending: true });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!farmId,
  });
}

export function useAddFarmTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (task: any) => {
      const { data, error } = await supabase.from('farm_tasks' as any).insert(task).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['farm_tasks'] }),
  });
}

export function useToggleTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_completed }: { id: string; is_completed: boolean }) => {
      const { error } = await supabase.from('farm_tasks' as any).update({ is_completed } as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['farm_tasks'] }),
  });
}

export function useDeleteFarmTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('farm_tasks' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['farm_tasks'] }),
  });
}

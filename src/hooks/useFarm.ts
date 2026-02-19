import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useFarms() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['farms', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('farms')
        .select('*')
        .order('created_at');
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useActiveFarm() {
  const { data: farms, ...rest } = useFarms();
  return { farm: farms?.[0] ?? null, farms, ...rest };
}

export function useCreateFarm() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (farm: { name: string; type: string; district?: string; upazila?: string }) => {
      const { data, error } = await supabase
        .from('farms')
        .insert({ ...farm, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['farms'] }),
  });
}

export function useUpdateFarm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; type?: string; district?: string; upazila?: string }) => {
      const { data, error } = await supabase
        .from('farms')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farms'] });
      queryClient.invalidateQueries({ queryKey: ['weather'] });
    },
  });
}

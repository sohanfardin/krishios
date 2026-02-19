import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { TablesInsert } from '@/integrations/supabase/types';

export function useFinanceTransactions(farmId: string | undefined) {
  return useQuery({
    queryKey: ['finance', farmId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('finance_transactions')
        .select('*')
        .eq('farm_id', farmId!)
        .order('transaction_date', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!farmId,
  });
}

export function useFinanceSummary(farmId: string | undefined) {
  const { data: transactions } = useFinanceTransactions(farmId);
  
  const revenue = transactions?.filter(t => t.type === 'revenue').reduce((sum, t) => sum + Number(t.amount), 0) ?? 0;
  const expenses = transactions?.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0) ?? 0;
  const profit = revenue - expenses;

  return { revenue, expenses, profit, transactions };
}

export function useAddTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (tx: TablesInsert<'finance_transactions'>) => {
      const { data, error } = await supabase.from('finance_transactions').insert(tx).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['finance'] }),
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('finance_transactions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['finance'] }),
  });
}

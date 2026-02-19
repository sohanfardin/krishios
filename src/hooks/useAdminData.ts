import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useAllUsers() {
  return useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useAllSubscriptions() {
  return useQuery({
    queryKey: ['admin-subscriptions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useAllPaymentRequests() {
  return useQuery({
    queryKey: ['admin-payments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_requests')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useAllFarms() {
  return useQuery({
    queryKey: ['admin-farms'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('farms')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useAllCrops() {
  return useQuery({
    queryKey: ['admin-crops'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crops')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useAllLivestock() {
  return useQuery({
    queryKey: ['admin-livestock'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('livestock')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useAllFishPonds() {
  return useQuery({
    queryKey: ['admin-fish-ponds'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fish_ponds' as any)
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data as any[]) || [];
    },
  });
}


export function useApprovePayment() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ paymentId, userId, plan }: { paymentId: string; userId: string; plan: string }) => {
      // Update payment request status
      const { error: payErr } = await supabase
        .from('payment_requests')
        .update({ status: 'approved', verified_at: new Date().toISOString() })
        .eq('id', paymentId);
      if (payErr) throw payErr;

      // Calculate expiry
      const days = plan === 'yearly' ? 365 : plan === 'half_yearly' ? 180 : 30;
      const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

      // Upsert subscription
      const { error: subErr } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: userId,
          plan,
          status: 'active',
          starts_at: new Date().toISOString(),
          expires_at: expiresAt,
        }, { onConflict: 'user_id' });
      // If upsert fails due to no unique constraint, insert
      if (subErr) {
        await supabase.from('subscriptions').insert({
          user_id: userId,
          plan,
          status: 'active',
          starts_at: new Date().toISOString(),
          expires_at: expiresAt,
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-payments'] });
      qc.invalidateQueries({ queryKey: ['admin-subscriptions'] });
    },
  });
}

export function useRejectPayment() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (paymentId: string) => {
      const { error } = await supabase
        .from('payment_requests')
        .update({ status: 'rejected' })
        .eq('id', paymentId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-payments'] });
    },
  });
}

export function useToggleSubscription() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, plan }: { userId: string; plan: 'pro' | 'half_yearly' | 'yearly' | 'free' }) => {
      if (plan === 'free') {
        await supabase
          .from('subscriptions')
          .update({ plan: 'free', status: 'active', expires_at: null })
          .eq('user_id', userId);
      } else {
        const days = plan === 'yearly' ? 365 : plan === 'half_yearly' ? 180 : 30;
        const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
        const { data } = await supabase
          .from('subscriptions')
          .update({ plan, status: 'active', starts_at: new Date().toISOString(), expires_at: expiresAt })
          .eq('user_id', userId)
          .select();
        if (!data || data.length === 0) {
          await supabase.from('subscriptions').insert({
            user_id: userId,
            plan,
            status: 'active',
            starts_at: new Date().toISOString(),
            expires_at: expiresAt,
          });
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users-subs'] });
      qc.invalidateQueries({ queryKey: ['admin-subscriptions'] });
      qc.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });
}

export function useAdminStats() {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [users, farms, crops, livestock, payments, fishPonds] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('farms').select('id', { count: 'exact', head: true }),
        supabase.from('crops').select('id', { count: 'exact', head: true }),
        supabase.from('livestock').select('id', { count: 'exact', head: true }),
        supabase.from('payment_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('fish_ponds' as any).select('id', { count: 'exact', head: true }),
      ]);
      return {
        totalUsers: users.count || 0,
        totalFarms: farms.count || 0,
        totalCrops: crops.count || 0,
        totalLivestock: livestock.count || 0,
        pendingPayments: payments.count || 0,
        totalFishPonds: (fishPonds as any).count || 0,
      };
    },
  });
}

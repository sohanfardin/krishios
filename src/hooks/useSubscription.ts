import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface SubscriptionStatus {
  plan: string; // 'trial' | 'pro' | 'yearly' | 'free'
  isTrialActive: boolean;
  isPremium: boolean;
  isFree: boolean;
  trialDaysLeft: number;
  expiresAt: string | null;
}

export interface DailyUsage {
  voice_count: number;
  image_count: number;
  question_count: number;
  last_subscription_reminder: string | null;
}

const FREE_LIMITS = {
  voice: 0,
  images: 0,
  questions: 0,
  crops: 3,
  livestock: 3,
  fishPonds: 2,
};

const PREMIUM_LIMITS = {
  voice: 20,
  images: 10,
  questions: 20,
};

export function useSubscriptionStatus() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async (): Promise<SubscriptionStatus> => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        return { plan: 'free', isTrialActive: false, isPremium: false, isFree: true, trialDaysLeft: 0, expiresAt: null };
      }

      const now = new Date();
      const expiresAt = data.expires_at ? new Date(data.expires_at) : null;
      const isExpired = expiresAt ? now > expiresAt : false;
      const isPremium = (data.plan === 'pro' || data.plan === 'yearly' || data.plan === 'half_yearly') && data.status === 'active' && !isExpired;
      const isTrialActive = data.plan === 'trial' && !isExpired;
      const isFree = !isPremium && !isTrialActive;

      const trialDaysLeft = isTrialActive && expiresAt
        ? Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
        : 0;

      return {
        plan: data.plan,
        isTrialActive,
        isPremium,
        isFree,
        trialDaysLeft,
        expiresAt: data.expires_at,
      };
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
}

export function useDailyUsage() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['daily_usage', user?.id],
    queryFn: async (): Promise<DailyUsage> => {
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('daily_usage')
        .select('*')
        .eq('user_id', user!.id)
        .eq('usage_date', today)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        return { voice_count: 0, image_count: 0, question_count: 0, last_subscription_reminder: null };
      }

      return {
        voice_count: data.voice_count,
        image_count: data.image_count,
        question_count: data.question_count,
        last_subscription_reminder: data.last_subscription_reminder,
      };
    },
    enabled: !!user,
    staleTime: 30 * 1000,
  });
}

export function useIncrementUsage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (type: 'voice' | 'image' | 'question') => {
      const today = new Date().toISOString().split('T')[0];
      const col = type === 'voice' ? 'voice_count' : type === 'image' ? 'image_count' : 'question_count';

      // Upsert: insert or update
      const { data: existing } = await supabase
        .from('daily_usage')
        .select('id, voice_count, image_count, question_count')
        .eq('user_id', user!.id)
        .eq('usage_date', today)
        .maybeSingle();

      if (existing) {
        const newVal = (existing[col as keyof typeof existing] as number) + 1;
        await supabase.from('daily_usage').update({ [col]: newVal }).eq('id', existing.id);
      } else {
        await supabase.from('daily_usage').insert({
          user_id: user!.id,
          usage_date: today,
          [col]: 1,
        });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['daily_usage'] }),
  });
}

export function useMarkSubscriptionReminder() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const today = new Date().toISOString().split('T')[0];

      const { data: existing } = await supabase
        .from('daily_usage')
        .select('id')
        .eq('user_id', user!.id)
        .eq('usage_date', today)
        .maybeSingle();

      if (existing) {
        await supabase.from('daily_usage').update({ last_subscription_reminder: today }).eq('id', existing.id);
      } else {
        await supabase.from('daily_usage').insert({
          user_id: user!.id,
          usage_date: today,
          last_subscription_reminder: today,
        });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['daily_usage'] }),
  });
}

export function useCanPerformAction() {
  const { data: sub } = useSubscriptionStatus();
  const { data: usage } = useDailyUsage();

  // Premium or trial = limited but generous
  if (sub?.isPremium || sub?.isTrialActive) {
    const u = usage || { voice_count: 0, image_count: 0, question_count: 0, last_subscription_reminder: null };
    return {
      canVoice: u.voice_count < PREMIUM_LIMITS.voice,
      canImage: u.image_count < PREMIUM_LIMITS.images,
      canQuestion: u.question_count < PREMIUM_LIMITS.questions,
      canAddCrop: (_count: number) => true,
      canAddLivestock: (_count: number) => true,
      canAddFishPond: (_count: number) => true,
      showAIAlerts: true,
      isFree: false,
      limits: { ...PREMIUM_LIMITS, crops: Infinity, livestock: Infinity, fishPonds: Infinity },
      usage: u,
      sub,
    };
  }

  // Free tier - no AI facilities
  const u = usage || { voice_count: 0, image_count: 0, question_count: 0, last_subscription_reminder: null };
  return {
    canVoice: false,
    canImage: false,
    canQuestion: false,
    canAddCrop: (currentCount: number) => currentCount < FREE_LIMITS.crops,
    canAddLivestock: (currentCount: number) => currentCount < FREE_LIMITS.livestock,
    canAddFishPond: (currentCount: number) => currentCount < FREE_LIMITS.fishPonds,
    showAIAlerts: false,
    isFree: true,
    limits: FREE_LIMITS,
    usage: u,
    sub,
  };
}

export { FREE_LIMITS, PREMIUM_LIMITS };

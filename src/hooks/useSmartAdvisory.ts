import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface AIRecommendation {
  type: string;
  emoji: string;
  title_bn: string;
  title_en: string;
  description_bn: string;
  description_en: string;
  explanation_bn: string;
  explanation_en?: string;
  action_steps_bn: string[];
  urgency: string;
  confidence: number;
  priority: 'high' | 'medium' | 'low';
}

export function useSmartAdvisory(farmId: string | undefined) {
  const { user } = useAuth();
  return useQuery<{ recommendations: AIRecommendation[]; weather: any }>({
    queryKey: ['smart-advisory', farmId],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/smart-advisory`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ type: 'recommendations', farmId }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || 'Smart advisory error');
      }

      return resp.json();
    },
    enabled: !!user && !!farmId,
    staleTime: 15 * 60 * 1000, // 15 min cache
    refetchInterval: 30 * 60 * 1000, // refresh every 30 min
    retry: 1,
  });
}

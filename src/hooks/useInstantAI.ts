import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AISuggestion {
  emoji: string;
  title_bn: string;
  title_en: string;
  description_bn: string;
  description_en: string;
  urgency: string;
}

/**
 * Triggers instant AI analysis after crop/livestock is added.
 * Sends details to smart-advisory, shows toast suggestions, and saves alerts.
 */
export async function triggerInstantAI({
  farmId,
  type,
  language,
}: {
  farmId: string;
  type: 'crop_added' | 'livestock_added';
  language: string;
}) {
  const bn = language === 'bn';

  try {
    // Show loading toast
    const loadingId = toast.loading(bn ? '🧠 AI পরামর্শ তৈরি হচ্ছে...' : '🧠 Generating AI suggestions...');

    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;

    const { data, error } = await supabase.functions.invoke('smart-advisory', {
      body: { type: 'recommendations', farmId },
    });

    toast.dismiss(loadingId);

    if (error) {
      console.error('AI suggestion error:', error);
      return;
    }

    const recommendations: AISuggestion[] = data?.recommendations || [];

    if (recommendations.length === 0) return;

    // Show top 2 suggestions as toasts
    const topRecs = recommendations.slice(0, 2);
    for (const rec of topRecs) {
      toast.info(
        `${rec.emoji} ${bn ? rec.title_bn : rec.title_en}`,
        {
          description: bn ? rec.description_bn : rec.description_en,
          duration: 8000,
        }
      );
    }

    // Save important alerts to the alerts table
    const urgentRecs = recommendations.filter(
      (r: any) => r.urgency === 'জরুরি' || r.priority === 'high'
    );

    const userId = session.data.session?.user?.id;
    if (userId && urgentRecs.length > 0) {
      const alertInserts = urgentRecs.map((r: any) => ({
        user_id: userId,
        farm_id: farmId,
        alert_type: type === 'crop_added' ? 'crop_advisory' : 'livestock_advisory',
        severity: r.urgency === 'জরুরি' ? 'critical' : 'warning',
        title_bn: r.title_bn,
        message_bn: r.description_bn,
      }));

      await supabase.from('alerts').insert(alertInserts);
    }

    return recommendations;
  } catch (e) {
    console.error('triggerInstantAI error:', e);
  }
}

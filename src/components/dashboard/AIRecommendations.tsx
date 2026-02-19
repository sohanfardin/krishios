import { useLanguage } from '@/contexts/LanguageContext';
import { Sparkles, ChevronRight, Lightbulb, TrendingUp, AlertCircle, Droplets, Leaf, Heart, DollarSign, Loader2, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useActiveFarm } from '@/hooks/useFarm';
import { useSmartAdvisory, type AIRecommendation } from '@/hooks/useSmartAdvisory';
import { useCanPerformAction } from '@/hooks/useSubscription';
import { useNavigation } from '@/contexts/NavigationContext';

export function AIRecommendations() {
  const { language } = useLanguage();
  const { farm } = useActiveFarm();
  const { data, isLoading, isError } = useSmartAdvisory(farm?.id);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const bn = language === 'bn';
  const permissions = useCanPerformAction();
  const { navigateTo } = useNavigation();

  const recommendations = data?.recommendations || [];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'irrigation': return <Droplets className="w-4 h-4" />;
      case 'fertilizer': return <Leaf className="w-4 h-4" />;
      case 'disease_risk': return <AlertCircle className="w-4 h-4" />;
      case 'animal_health': return <Heart className="w-4 h-4" />;
      case 'financial': return <DollarSign className="w-4 h-4" />;
      case 'harvest': return <TrendingUp className="w-4 h-4" />;
      case 'weather_alert': return <AlertCircle className="w-4 h-4" />;
      default: return <Lightbulb className="w-4 h-4" />;
    }
  };

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-destructive bg-destructive/5';
      case 'medium': return 'border-l-warning bg-warning/5';
      case 'low': return 'border-l-info bg-info/5';
      default: return 'border-l-muted bg-muted/5';
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    if (urgency === 'জরুরি') return 'bg-destructive/10 text-destructive';
    if (urgency === 'মাঝারি') return 'bg-warning/10 text-warning';
    return 'bg-info/10 text-info';
  };

  const displayRecs = recommendations;
  const hasData = displayRecs.length > 0;

  return (
    <div className="bg-card rounded-2xl p-5 shadow-sm border border-border animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">
            {bn ? 'এআই পরামর্শ' : 'AI Recommendations'}
          </h3>
        </div>
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
        ) : (
          <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
            {bn ? `${displayRecs.length}টি` : `${displayRecs.length} New`}
          </span>
        )}
      </div>

      {permissions.isFree && !permissions.showAIAlerts ? (
        <div className="py-6 flex flex-col items-center justify-center text-muted-foreground">
          <Crown className="w-8 h-8 text-accent-foreground mb-2" />
          <p className="text-sm font-medium">{bn ? 'AI পরামর্শ প্রিমিয়াম সুবিধা' : 'AI Recommendations are Premium'}</p>
          <p className="text-xs mt-1 mb-3">{bn ? 'আপগ্রেড করে সকল AI পরামর্শ পান' : 'Upgrade to get all AI recommendations'}</p>
          <button onClick={() => navigateTo('premium')} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
            {bn ? 'আপগ্রেড করুন' : 'Upgrade'}
          </button>
        </div>
      ) : hasData ? (
      <div className="space-y-3">
        {displayRecs.map((rec, index) => (
          <div
            key={index}
            className={cn(
              "rounded-xl border-l-4 transition-all cursor-pointer animate-fade-in",
              getPriorityStyle(rec.priority),
              expandedId === String(index) ? 'ring-2 ring-primary/20' : ''
            )}
            style={{ animationDelay: `${index * 100}ms` }}
            onClick={() => setExpandedId(expandedId === String(index) ? null : String(index))}
          >
            <div className="p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl flex-shrink-0">{rec.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {getTypeIcon(rec.type)}
                    <h4 className="font-semibold text-foreground text-sm">
                      {bn ? rec.title_bn : rec.title_en}
                    </h4>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {bn ? rec.description_bn : rec.description_en}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium", getUrgencyBadge(rec.urgency))}>
                      {rec.urgency}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {bn ? `আত্মবিশ্বাস: ${rec.confidence}%` : `Confidence: ${rec.confidence}%`}
                    </span>
                  </div>
                </div>
                <ChevronRight className={cn(
                  "w-5 h-5 text-muted-foreground transition-transform flex-shrink-0",
                  expandedId === String(index) && 'rotate-90'
                )} />
              </div>

              {expandedId === String(index) && (
                <div className="mt-4 pt-4 border-t border-border animate-fade-in">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm">💡</span>
                    <span className="text-sm font-medium text-primary">
                      {bn ? 'কেন এই পরামর্শ?' : 'Why this recommendation?'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    {bn ? rec.explanation_bn : (rec.explanation_en || rec.explanation_bn)}
                  </p>

                  {rec.action_steps_bn?.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-foreground mb-1.5">
                        {bn ? '📋 পদক্ষেপ:' : '📋 Action Steps:'}
                      </p>
                      <ul className="space-y-1">
                        {rec.action_steps_bn.map((step, i) => (
                          <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                            <span className="text-primary font-bold mt-0.5">{i + 1}.</span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      ) : (
        <div className="py-8 flex flex-col items-center justify-center text-muted-foreground">
          <span className="text-4xl mb-3">✨</span>
          <p className="text-sm font-medium">{language === 'bn' ? 'কোনো পরামর্শ নেই' : 'No recommendations yet'}</p>
          <p className="text-xs mt-1">{language === 'bn' ? 'ফসল ও পশু যোগ করলে AI পরামর্শ পাবেন' : 'Add crops & livestock to get AI advice'}</p>
        </div>
      )}
    </div>
  );
}

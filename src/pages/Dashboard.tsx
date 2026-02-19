import { useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { AlertsPanel } from '@/components/dashboard/AlertsPanel';
import { WeatherWidget } from '@/components/dashboard/WeatherWidget';
import { ProductionChart } from '@/components/dashboard/ProductionChart';
import { CropOverview } from '@/components/dashboard/CropOverview';
import { LivestockOverview } from '@/components/dashboard/LivestockOverview';
import { FishOverview } from '@/components/dashboard/FishOverview';
import { AIRecommendations } from '@/components/dashboard/AIRecommendations';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { useSubscriptionStatus, useDailyUsage, useMarkSubscriptionReminder } from '@/hooks/useSubscription';
import { useNavigation } from '@/contexts/NavigationContext';
import { toast } from 'sonner';
import { Crown, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

const bnMonths = ['জানুয়ারি','ফেব্রুয়ারি','মার্চ','এপ্রিল','মে','জুন','জুলাই','আগস্ট','সেপ্টেম্বর','অক্টোবর','নভেম্বর','ডিসেম্বর'];
function toBn(n: number | string): string {
  const d = ['০','১','২','৩','৪','৫','৬','৭','৮','৯'];
  return String(n).replace(/\d/g, c => d[parseInt(c)]);
}

export function Dashboard({ onOpenTutorial }: { onOpenTutorial?: () => void }) {
  const { t, language } = useLanguage();
  const { data: sub } = useSubscriptionStatus();
  const { data: usage } = useDailyUsage();
  const { navigateTo } = useNavigation();
  const markReminder = useMarkSubscriptionReminder();
  const now = new Date();
  const bn = language === 'bn';
  const dateStr = bn
    ? `${toBn(now.getDate())} ${bnMonths[now.getMonth()]}, ${toBn(now.getFullYear())}`
    : now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  // Daily subscription reminder for free users
  useEffect(() => {
    if (!sub || !usage) return;
    if (sub.isPremium || sub.isTrialActive) return;
    const today = new Date().toISOString().split('T')[0];
    if (usage.last_subscription_reminder === today) return;
    
    // Show reminder once per day
    markReminder.mutate();
    toast(bn ? '⭐ প্রিমিয়াম আপগ্রেড করুন!' : '⭐ Upgrade to Premium!', {
      description: bn
        ? 'আনলিমিটেড AI পরামর্শ, ভয়েস ইনপুট, রোগ শনাক্তকরণ এবং আরও অনেক কিছু পেতে আপগ্রেড করুন।'
        : 'Get unlimited AI advice, voice input, disease detection and much more.',
      duration: 10000,
      icon: <Crown className="w-5 h-5 text-accent-foreground" />,
    });
  }, [sub, usage]);

  return (
    <div className="space-y-4 sm:space-y-6 pb-6 sm:pb-8">
      {/* Trial/Free Banner */}
      {sub?.isPremium && (
        <div className="bg-accent/10 border border-accent/30 rounded-xl p-3 animate-fade-in">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">👑</span>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">
                {bn ? `প্রিমিয়াম (${sub.plan === 'yearly' ? 'বার্ষিক' : sub.plan === 'half_yearly' ? '৬ মাস' : 'মাসিক'})` : `Premium (${sub.plan})`}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {bn ? 'সব সুবিধা আনলিমিটেড!' : 'Unlimited access!'}
              </p>
            </div>
          </div>
          {sub.expiresAt && (() => {
            const expDate = new Date(sub.expiresAt!);
            const nowDate = new Date();
            const totalDays = sub.plan === 'yearly' ? 365 : sub.plan === 'half_yearly' ? 180 : 30;
            const daysLeft = Math.max(0, Math.ceil((expDate.getTime() - nowDate.getTime()) / (1000 * 60 * 60 * 24)));
            const pct = Math.max(0, (daysLeft / totalDays) * 100);
            return (
              <>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-accent transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1 text-right">
                  {bn ? `${toBn(daysLeft)}/${toBn(totalDays)} দিন বাকি` : `${daysLeft}/${totalDays} days left`}
                </p>
              </>
            );
          })()}
        </div>
      )}
      {sub?.isTrialActive && (
        <div className="bg-primary/10 border border-primary/30 rounded-xl p-3 animate-fade-in">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-lg">🎉</span>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">
                  {bn ? `ট্রায়াল — ${toBn(sub.trialDaysLeft)} দিন বাকি` : `Trial — ${sub.trialDaysLeft} days left`}
                </p>
                <p className="text-[10px] text-muted-foreground">{bn ? 'সব সুবিধা আনলিমিটেড!' : 'All features unlimited!'}</p>
              </div>
            </div>
            <Button 
              variant="default" 
              size="sm" 
              onClick={() => navigateTo('premium')}
              className="bg-primary hover:bg-primary/90 text-white text-xs h-7 px-2 shrink-0"
            >
              {bn ? 'আপগ্রেড' : 'Upgrade'}
            </Button>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${Math.max(0, (sub.trialDaysLeft / 15) * 100)}%` }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1 text-right">
            {bn ? `${toBn(sub.trialDaysLeft)}/১৫ দিন` : `${sub.trialDaysLeft}/15 days`}
          </p>
        </div>
      )}
      {sub?.isFree && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-3 flex items-center justify-between gap-2 animate-fade-in">
          <div className="flex items-center gap-2 min-w-0">
            <Crown className="w-5 h-5 text-destructive shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground">
                {bn ? 'ফ্রি ট্রায়াল শেষ!' : 'Trial ended!'}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {bn ? 'আনলিমিটেড ব্যবহারে আপগ্রেড করুন' : 'Upgrade for unlimited access'}
              </p>
            </div>
          </div>
          <Button 
            variant="default" 
            size="sm" 
            onClick={() => navigateTo('premium')}
            className="bg-destructive hover:bg-destructive/90 text-white text-xs h-7 px-2 shrink-0"
          >
            {bn ? 'আপগ্রেড' : 'Upgrade'}
          </Button>
        </div>
      )}

      {/* Welcome Header */}
      <div className="animate-fade-in">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <h1 className="text-xl sm:text-3xl font-bold text-foreground">
            {t('dashboard.title')} 👋
          </h1>
          {onOpenTutorial && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenTutorial}
              className="shrink-0 gap-1.5 text-[10px] sm:text-xs h-7 sm:h-8 px-2 sm:px-3"
            >
              <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">{bn ? 'কীভাবে ব্যবহার করবেন?' : 'How to use?'}</span>
              <span className="sm:hidden">{bn ? 'গাইড' : 'Guide'}</span>
            </Button>
          )}
        </div>
        <p className="text-sm sm:text-base text-muted-foreground">
          {t('dashboard.subtitle')} • {dateStr}
        </p>
      </div>

      {/* Quick Actions */}
      <QuickActions />

      {/* Stats Cards */}
      <StatsCards />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left Column - Charts and Crops */}
        <div className="lg:col-span-2 space-y-6">
          <ProductionChart />
          <div id="section-crops">
            <CropOverview />
          </div>
          <div id="section-livestock">
            <LivestockOverview />
          </div>
          <div id="section-fish">
            <FishOverview />
          </div>
        </div>

        {/* Right Column - Weather, Alerts, AI */}
        <div className="space-y-6">
          <WeatherWidget />
          <div id="section-alerts">
            <AlertsPanel />
          </div>
          <AIRecommendations />
        </div>
      </div>
    </div>
  );
}

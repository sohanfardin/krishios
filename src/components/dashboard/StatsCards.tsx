import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCrops } from '@/hooks/useCrops';
import { useLivestock } from '@/hooks/useLivestock';
import { useFishPonds } from '@/hooks/useFishPonds';
import { useActiveFarm } from '@/hooks/useFarm';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { EditFarmDialog } from '@/components/farm/EditFarmDialog';

interface StatCard {
  key: string;
  emoji: string;
  value: string;
  change: number;
  trend: 'up' | 'down';
  color: 'primary' | 'secondary' | 'accent' | 'info' | 'success';
  action: 'farm-dialog' | 'scroll-crops' | 'scroll-livestock' | 'scroll-fish' | 'scroll-alerts';
}

export function StatsCards() {
  const { t, language } = useLanguage();
  const [farmDialogOpen, setFarmDialogOpen] = useState(false);
  const { farm } = useActiveFarm();
  const { data: crops = [] } = useCrops(farm?.id);
  const { data: livestock = [] } = useLivestock(farm?.id);
  const { data: fishPonds = [] } = useFishPonds(farm?.id);
  
  const { data: alerts = [] } = useQuery({
    queryKey: ['alerts', farm?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .eq('farm_id', farm!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!farm?.id,
  });

  // Deduplicate alerts by title+message
  const uniqueAlertCount = new Set(alerts.map(a => `${a.title_bn}-${a.message_bn}`)).size;

  // Convert numbers to Bengali if needed
  const formatNumber = (num: number) => {
    if (language === 'bn') {
      return num.toString().replace(/\d/g, (digit) => {
        const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
        return bengaliDigits[parseInt(digit)];
      });
    }
    return num.toString();
  };

  const stats: StatCard[] = [
    {
      key: 'dashboard.totalFarms',
      emoji: '🏡',
      value: formatNumber(1),
      change: 0,
      trend: 'up',
      color: 'primary',
      action: 'farm-dialog',
    },
    {
      key: 'dashboard.activeCrops',
      emoji: '🌾',
      value: formatNumber(crops.length),
      change: 0,
      trend: 'up',
      color: 'secondary',
      action: 'scroll-crops',
    },
    {
      key: 'dashboard.livestock',
      emoji: '🐄',
      value: formatNumber(livestock.reduce((sum, item) => sum + (item.count || 0), 0)),
      change: 0,
      trend: 'up',
      color: 'accent',
      action: 'scroll-livestock',
    },
    {
      key: language === 'bn' ? 'মাছ চাষ' : 'Fish Ponds',
      emoji: '🐟',
      value: formatNumber(fishPonds.length),
      change: 0,
      trend: 'up',
      color: 'success',
      action: 'scroll-fish',
    },
    {
      key: 'dashboard.alerts',
      emoji: '⚠️',
      value: formatNumber(uniqueAlertCount),
      change: 0,
      trend: 'down',
      color: 'info',
      action: 'scroll-alerts',
    },
  ];

  const colorStyles: Record<string, string> = {
    primary: 'bg-primary/10 border-primary/20',
    secondary: 'bg-secondary/10 border-secondary/20',
    accent: 'bg-accent/10 border-accent/20',
    info: 'bg-info/10 border-info/20',
    success: 'bg-success/10 border-success/20',
  };

  const iconBgStyles: Record<string, string> = {
    primary: 'bg-gradient-primary',
    secondary: 'bg-gradient-secondary',
    accent: 'bg-gradient-accent',
    info: 'bg-gradient-sky',
    success: 'bg-gradient-primary',
  };

  const handleCardClick = (action: StatCard['action']) => {
    if (action === 'farm-dialog') {
      setFarmDialogOpen(true);
    } else {
      const sectionId = action === 'scroll-crops' ? 'section-crops'
        : action === 'scroll-livestock' ? 'section-livestock'
        : action === 'scroll-fish' ? 'section-fish'
        : 'section-alerts';
      const target = document.getElementById(sectionId);
      if (target) {
        const scrollContainer = document.getElementById('main-scroll-container');
        if (scrollContainer) {
          const containerRect = scrollContainer.getBoundingClientRect();
          const targetRect = target.getBoundingClientRect();
          const scrollTop = scrollContainer.scrollTop + (targetRect.top - containerRect.top) - 20;
          scrollContainer.scrollTo({ top: scrollTop, behavior: 'smooth' });
        }
      }
    }
  };

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-4">
        {stats.map((stat, index) => (
          <div
            key={stat.key}
            onClick={() => handleCardClick(stat.action)}
            className={cn(
              "stat-card border-2 animate-fade-in cursor-pointer hover:shadow-lg transition-shadow",
              colorStyles[stat.color]
            )}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-start justify-between mb-2 sm:mb-4">
              <div className={cn(
                "icon-container shadow-lg w-10 h-10 sm:w-12 sm:h-12",
                iconBgStyles[stat.color]
              )}>
                <span className="text-xl sm:text-2xl">{stat.emoji}</span>
              </div>
              {stat.change !== 0 && (
                <div className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium",
                  stat.trend === 'up' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                )}>
                  {stat.trend === 'up' ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  <span>{Math.abs(stat.change)}%</span>
                </div>
              )}
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-foreground mb-0.5 sm:mb-1">{stat.value}</p>
            <p className="text-xs sm:text-sm text-muted-foreground">{stat.key.startsWith('dashboard.') ? t(stat.key) : stat.key}</p>
          </div>
        ))}
      </div>

      <EditFarmDialog
        open={farmDialogOpen}
        onOpenChange={setFarmDialogOpen}
        farm={farm}
      />
    </>
  );
}

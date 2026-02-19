import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { useLivestock } from '@/hooks/useLivestock';
import { useActiveFarm } from '@/hooks/useFarm';

interface LivestockItem {
  id: string;
  emoji: string;
  nameBn: string;
  nameEn: string;
  count: number;
  healthy: number;
  production: string;
  productionBn: string;
  productEmoji: string;
  status: 'good' | 'warning' | 'alert';
}

export function LivestockOverview() {
  const { t, language } = useLanguage();
  const { farm } = useActiveFarm();
  const { data: livestockData = [] } = useLivestock(farm?.id);

  const hasData = livestockData.length > 0;

  // Map Supabase livestock to UI format
  const livestockMap: Record<string, { emoji: string; nameBn: string; nameEn: string; productionBn: string; production: string; productEmoji: string }> = {
    'cattle': { emoji: '🐄', nameBn: 'গরু', nameEn: 'Cow', productionBn: 'দুধ/দিন', production: 'milk/day', productEmoji: '🥛' },
    'goat': { emoji: '🐐', nameBn: 'ছাগল', nameEn: 'Goat', productionBn: 'দুধ/দিন', production: 'milk/day', productEmoji: '🥛' },
    'sheep': { emoji: '🐑', nameBn: 'ভেড়া', nameEn: 'Sheep', productionBn: 'উল', production: 'wool', productEmoji: '🧵' },
    'chicken': { emoji: '🐔', nameBn: 'মুরগি', nameEn: 'Chicken', productionBn: 'ডিম/দিন', production: 'eggs/day', productEmoji: '🥚' },
    'duck': { emoji: '🦆', nameBn: 'হাঁস', nameEn: 'Duck', productionBn: 'ডিম/দিন', production: 'eggs/day', productEmoji: '🥚' },
  };

  const livestock: LivestockItem[] = livestockData.map((item, index) => {
    const typeInfo = livestockMap[item.animal_type.toLowerCase()] || { 
      emoji: '🐾', 
      nameBn: item.animal_type, 
      nameEn: item.animal_type,
      productionBn: 'উৎপাদন',
      production: 'production',
      productEmoji: '📊'
    };
    
    return {
      id: item.id,
      emoji: typeInfo.emoji,
      nameBn: typeInfo.nameBn,
      nameEn: typeInfo.nameEn,
      count: item.count || 0,
      healthy: Math.max(0, (item.count || 0) - 1), // Assume at least 1 might be unhealthy
      production: `${item.daily_production_amount || 0} ${typeInfo.production}`,
      productionBn: `${item.daily_production_amount || 0} ${typeInfo.productionBn}`,
      productEmoji: typeInfo.productEmoji,
      status: (item.last_illness_date && new Date(item.last_illness_date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) ? 'warning' : 'good',
    };
  });

  const getStatusColor = (status: LivestockItem['status']) => {
    switch (status) {
      case 'good':
        return 'bg-success/10 border-success/20';
      case 'warning':
        return 'bg-warning/10 border-warning/20';
      case 'alert':
        return 'bg-destructive/10 border-destructive/20';
      default:
        return 'bg-muted border-border';
    }
  };

  const getStatusBadge = (status: LivestockItem['status']) => {
    switch (status) {
      case 'good':
        return { color: 'bg-success', label: language === 'bn' ? 'সুস্থ' : 'Healthy' };
      case 'warning':
        return { color: 'bg-warning', label: language === 'bn' ? 'সতর্ক' : 'Warning' };
      case 'alert':
        return { color: 'bg-destructive', label: language === 'bn' ? 'জরুরি' : 'Alert' };
      default:
        return { color: 'bg-muted', label: '' };
    }
  };

  return (
    <div className="bg-card rounded-2xl p-5 shadow-sm border border-border animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">🐄</span>
          <h3 className="text-lg font-semibold text-foreground">
            {language === 'bn' ? 'পশুসম্পদ' : 'Livestock'}
          </h3>
        </div>
        <button className="text-sm text-primary font-medium hover:underline">
          {t('common.viewAll')}
        </button>
      </div>

      {hasData ? (
      <div className="space-y-3">
        {livestock.map((item, index) => {
          const statusBadge = getStatusBadge(item.status);
          return (
            <div
              key={item.id}
              className={cn(
                "flex items-center gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer hover:shadow-md animate-fade-in",
                getStatusColor(item.status)
              )}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="w-14 h-14 rounded-xl bg-card flex items-center justify-center shadow-sm">
                <span className="text-3xl">{item.emoji}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-foreground">
                    {language === 'bn' ? item.nameBn : item.nameEn}
                  </h4>
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full text-white",
                    statusBadge.color
                  )}>
                    {statusBadge.label}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>
                    {language === 'bn' ? `সংখ্যা: ${item.count}টি` : `Count: ${item.count}`}
                  </span>
                  <span>•</span>
                  <span>
                    {language === 'bn' ? `সুস্থ: ${item.healthy}টি` : `Healthy: ${item.healthy}`}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 justify-end">
                  <span className="text-lg">{item.productEmoji}</span>
                  <span className="font-semibold text-foreground">
                    {language === 'bn' ? item.productionBn : item.production}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      ) : (
        <div className="py-8 flex flex-col items-center justify-center text-muted-foreground">
          <span className="text-4xl mb-3">🐄</span>
          <p className="text-sm font-medium">{language === 'bn' ? 'কোনো পশু যোগ করা হয়নি' : 'No livestock added yet'}</p>
          <p className="text-xs mt-1">{language === 'bn' ? 'পশু যোগ করুন বাটনে ক্লিক করুন' : 'Click Add Livestock to get started'}</p>
        </div>
      )}
    </div>
  );
}

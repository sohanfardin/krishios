import { useLanguage } from '@/contexts/LanguageContext';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useCrops } from '@/hooks/useCrops';
import { useActiveFarm } from '@/hooks/useFarm';

interface Crop {
  id: string;
  emoji: string;
  nameKey: string;
  nameBn: string;
  nameEn: string;
  area: string;
  stage: string;
  stageBn: string;
  health: number;
  daysToHarvest: number;
  color: string;
}

export function CropOverview() {
  const { t, language } = useLanguage();
  const { farm } = useActiveFarm();
  const { data: cropsData = [] } = useCrops(farm?.id);

  const hasData = cropsData.length > 0;

  // Map Supabase crops to UI format
  const cropEmojis: Record<string, string> = {
    'rice': '🌾', 'wheat': '🌾', 'corn': '🌽', 'potato': '🥔',
    'tomato': '🍅', 'cabbage': '🥬', 'spinach': '🥬', 'lettuce': '🥬',
    'carrot': '🥕', 'onion': '🧅', 'garlic': '🧄', 'cucumber': '🥒',
    'chili': '🌶️', 'eggplant': '🍆', 'bean': '🫘', 'peas': '🫛',
  };

  const stageMap: Record<string, { en: string; bn: string }> = {
    'seedling': { en: 'Seedling', bn: 'চারা পর্যায়' },
    'vegetative': { en: 'Growing', bn: 'বৃদ্ধি পর্যায়' },
    'budding': { en: 'Budding', bn: 'কুঁড়ি পর্যায়' },
    'flowering': { en: 'Flowering', bn: 'ফুল ফোটার পর্যায়' },
    'fruiting': { en: 'Fruiting', bn: 'ফল ধরার পর্যায়' },
    'ripening': { en: 'Ripening', bn: 'পাকার পর্যায়' },
    'harvest_ready': { en: 'Harvest Ready', bn: 'ফসল তোলার প্রস্তুতি' },
  };

  // Calculate health based on growth stage and days
  const getHealthScore = (crop: any) => {
    const stage = crop.growth_stage?.toLowerCase() || 'seedling';
    const stageScore = (['seedling', 'vegetative', 'budding', 'flowering', 'fruiting', 'ripening', 'harvest_ready'].indexOf(stage) + 1) * 10;
    return Math.min(95, Math.max(60, stageScore));
  };

  // Calculate days to harvest
  const getDaysToHarvest = (crop: any) => {
    if (!crop.estimated_harvest) return 45;
    const today = new Date();
    const harvestDate = new Date(crop.estimated_harvest);
    const daysLeft = Math.ceil((harvestDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, daysLeft);
  };

  const getHealthColor = (health: number) => {
    if (health >= 90) return 'bg-success';
    if (health >= 70) return 'bg-primary';
    if (health >= 50) return 'bg-warning';
    return 'bg-destructive';
  };

  const getHealthLabel = (health: number) => {
    if (health >= 90) return language === 'bn' ? 'চমৎকার' : 'Excellent';
    if (health >= 70) return language === 'bn' ? 'ভালো' : 'Good';
    if (health >= 50) return language === 'bn' ? 'মাঝারি' : 'Fair';
    return language === 'bn' ? 'দুর্বল' : 'Poor';
  };

  return (
    <div className="bg-card rounded-2xl p-5 shadow-sm border border-border animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">🌾</span>
          <h3 className="text-lg font-semibold text-foreground">
            {language === 'bn' ? 'ফসলের অবস্থা' : 'Crop Status'}
          </h3>
        </div>
        <button className="text-sm text-primary font-medium hover:underline">
          {t('common.viewAll')}
        </button>
      </div>

      {hasData ? (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {cropsData.map((crop, index) => {
          const emoji = cropEmojis[crop.name?.toLowerCase() || 'rice'] || '🌾';
          const stage = crop.growth_stage?.toLowerCase() || 'seedling';
          const stageInfo = stageMap[stage] || stageMap['seedling'];
          const health = getHealthScore(crop);
          const daysToHarvest = getDaysToHarvest(crop);
          
          return (
            <div
              key={crop.id}
              className={cn(
                "p-4 rounded-xl border border-border bg-muted/30 hover:bg-muted/50 transition-all cursor-pointer card-interactive animate-fade-in"
              )}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-card flex items-center justify-center shadow-sm">
                  <span className="text-2xl">{emoji}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-foreground">
                    {crop.name}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {crop.land_size} {crop.land_unit || 'বিঘা'}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      {language === 'bn' ? stageInfo.bn : stageInfo.en}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {language === 'bn' ? `${daysToHarvest} দিন বাকি` : `${daysToHarvest} days left`}
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">{t('crops.health')}</span>
                  <span className={cn(
                    "font-medium",
                    health >= 70 ? 'text-success' : health >= 50 ? 'text-warning' : 'text-destructive'
                  )}>
                    {getHealthLabel(health)} ({health}%)
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all duration-500", getHealthColor(health))}
                    style={{ width: `${health}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
      ) : (
        <div className="py-8 flex flex-col items-center justify-center text-muted-foreground">
          <span className="text-4xl mb-3">🌾</span>
          <p className="text-sm font-medium">{language === 'bn' ? 'কোনো ফসল যোগ করা হয়নি' : 'No crops added yet'}</p>
          <p className="text-xs mt-1">{language === 'bn' ? 'ফসল যোগ করুন বাটনে ক্লিক করুন' : 'Click Add Crop to get started'}</p>
        </div>
      )}
    </div>
  );
}

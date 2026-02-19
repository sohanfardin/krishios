import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { useFishPonds } from '@/hooks/useFishPonds';
import { useActiveFarm } from '@/hooks/useFarm';

const speciesEmojis: Record<string, string> = {
  'রুই': '🐟', 'কাতলা': '🐟', 'মৃগেল': '🐟',
  'তেলাপিয়া': '🐠', 'পাঙ্গাস': '🐡', 'মিক্স': '🐟',
};

function toBn(n: number | string): string {
  const d = ['০','১','২','৩','৪','৫','৬','৭','৮','৯'];
  return String(n).replace(/\d/g, c => d[parseInt(c)]);
}

export function FishOverview() {
  const { language } = useLanguage();
  const bn = language === 'bn';
  const { farm } = useActiveFarm();
  const { data: ponds = [] } = useFishPonds(farm?.id);

  const hasData = ponds.length > 0;

  const getDaysToHarvest = (pond: any) => {
    if (!pond.expected_sale_date) return null;
    const days = Math.ceil((new Date(pond.expected_sale_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
  };

  const getStatusInfo = (pond: any) => {
    const days = getDaysToHarvest(pond);
    if (days !== null && days <= 7) return { color: 'bg-warning/10 border-warning/20', badge: 'bg-warning', label: bn ? 'বিক্রয় প্রস্তুত' : 'Sale Ready' };
    if (pond.status === 'inactive') return { color: 'bg-muted border-border', badge: 'bg-muted-foreground', label: bn ? 'নিষ্ক্রিয়' : 'Inactive' };
    return { color: 'bg-success/10 border-success/20', badge: 'bg-success', label: bn ? 'সক্রিয়' : 'Active' };
  };

  return (
    <div className="bg-card rounded-2xl p-5 shadow-sm border border-border animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">🐟</span>
          <h3 className="text-lg font-semibold text-foreground">
            {bn ? 'মাছ চাষ' : 'Fish Farming'}
          </h3>
        </div>
        <button className="text-sm text-primary font-medium hover:underline">
          {bn ? 'সব দেখুন' : 'View All'}
        </button>
      </div>

      {hasData ? (
        <div className="space-y-3">
          {ponds.map((pond, index) => {
            const status = getStatusInfo(pond);
            const daysLeft = getDaysToHarvest(pond);
            const species = pond.fish_species || [];
            const mainSpecies = species[0] || 'মাছ';
            const emoji = speciesEmojis[mainSpecies] || '🐟';

            return (
              <div
                key={pond.id}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer hover:shadow-md animate-fade-in",
                  status.color
                )}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-14 h-14 rounded-xl bg-card flex items-center justify-center shadow-sm">
                  <span className="text-3xl">{emoji}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-foreground">
                      {bn ? `পুকুর #${toBn(pond.pond_number)}` : `Pond #${pond.pond_number}`}
                    </h4>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full text-white", status.badge)}>
                      {status.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                    <span>{bn ? `${toBn(pond.area_decimal)} শতাংশ` : `${pond.area_decimal} dec`}</span>
                    <span>•</span>
                    <span>{species.join(', ') || (bn ? 'প্রজাতি নেই' : 'No species')}</span>
                  </div>
                </div>
                <div className="text-right">
                  {pond.current_avg_weight_g > 0 && (
                    <p className="font-semibold text-foreground text-sm">
                      {bn ? `${toBn(pond.current_avg_weight_g)}g` : `${pond.current_avg_weight_g}g`}
                    </p>
                  )}
                  {daysLeft !== null && (
                    <p className="text-xs text-muted-foreground">
                      {bn ? `${toBn(daysLeft)} দিন বাকি` : `${daysLeft} days left`}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-8 flex flex-col items-center justify-center text-muted-foreground">
          <span className="text-4xl mb-3">🐟</span>
          <p className="text-sm font-medium">{bn ? 'কোনো পুকুর যোগ করা হয়নি' : 'No ponds added yet'}</p>
          <p className="text-xs mt-1">{bn ? 'মাছ চাষ বাটনে ক্লিক করুন' : 'Click Fish Farming button to get started'}</p>
        </div>
      )}
    </div>
  );
}

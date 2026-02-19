import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Plus, Search, Trash2, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLivestock, useDeleteLivestock } from '@/hooks/useLivestock';
import { useActiveFarm } from '@/hooks/useFarm';
import { AddLivestockDialog } from '@/components/livestock/AddLivestockDialog';
import { toast } from 'sonner';
import { useCanPerformAction } from '@/hooks/useSubscription';
import { UpgradePrompt } from '@/components/shared/UpgradePrompt';

const animalEmoji: Record<string, string> = {
  chicken: '🐔', cow: '🐄', goat: '🐐', duck: '🦆', buffalo: '🐃', pigeon: '🐦',
};

const animalNames: Record<string, { bn: string; en: string }> = {
  chicken: { bn: 'মুরগি', en: 'Chicken' },
  cow: { bn: 'গরু', en: 'Cow' },
  goat: { bn: 'ছাগল', en: 'Goat' },
  duck: { bn: 'হাঁস', en: 'Duck' },
  buffalo: { bn: 'মহিষ', en: 'Buffalo' },
  pigeon: { bn: 'কবুতর', en: 'Pigeon' },
};

export function LivestockPage() {
  const { language, t } = useLanguage();
  const { farm } = useActiveFarm();
  const { data: livestock, isLoading } = useLivestock(farm?.id);
  const deleteLivestock = useDeleteLivestock();
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');
  const bn = language === 'bn';
  const permissions = useCanPerformAction();
  const livestockCount = livestock?.length || 0;

  const handleAddClick = () => {
    if (!permissions.canAddLivestock(livestockCount)) {
      toast.error(bn ? `ফ্রি প্ল্যানে সর্বোচ্চ ${permissions.limits.livestock}টি পশু যোগ করা যায়। আপগ্রেড করুন!` : `Free plan allows max ${permissions.limits.livestock} livestock. Upgrade!`);
      return;
    }
    setShowAdd(true);
  };

  const filtered = livestock?.filter(l =>
    l.animal_type.toLowerCase().includes(search.toLowerCase()) ||
    (l.breed || '').toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  const totalCount = filtered.reduce((s, l) => s + l.count, 0);

  const handleDelete = async (id: string) => {
    try {
      await deleteLivestock.mutateAsync(id);
      toast.success(bn ? 'মুছে ফেলা হয়েছে' : 'Deleted');
    } catch {
      toast.error(bn ? 'ত্রুটি' : 'Error');
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
            🐄 {t('livestock.title')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {bn ? `${totalCount}টি পশু • ${filtered.length} গ্রুপ` : `${totalCount} animals • ${filtered.length} groups`}
          </p>
        </div>
        <button onClick={handleAddClick} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors shadow-lg touch-target">
          <Plus className="w-5 h-5" />
          <span>{bn ? 'পশু যোগ করুন' : 'Add Livestock'}</span>
        </button>
      </div>

      <div className="flex gap-3 animate-fade-in" style={{ animationDelay: '100ms' }}>
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder={bn ? 'পশু খুঁজুন...' : 'Search livestock...'}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-muted border-0 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">{bn ? 'লোড হচ্ছে...' : 'Loading...'}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <span className="text-5xl mb-4 block">🐄</span>
          <p className="text-muted-foreground">{bn ? 'কোনো পশু নেই। পশু যোগ করুন!' : 'No livestock yet. Add your first!'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((item, index) => (
            <div key={item.id} className="bg-card rounded-2xl p-5 border-2 border-success/30 card-interactive animate-fade-in" style={{ animationDelay: `${(index + 2) * 100}ms` }}>
              <div className="flex items-start gap-4 mb-4">
                <div className="w-16 h-16 rounded-xl bg-gradient-card flex items-center justify-center shadow-sm">
                  <span className="text-4xl">{animalEmoji[item.animal_type] || '🐾'}</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground text-lg">
                    {bn ? animalNames[item.animal_type]?.bn : animalNames[item.animal_type]?.en || item.animal_type}
                  </h3>
                  {item.breed && <p className="text-sm text-muted-foreground">{item.breed}</p>}
                  {item.age_group && <p className="text-xs text-muted-foreground capitalize">{item.age_group}</p>}
                </div>
                <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-muted/50 rounded-xl p-3">
                  <div className="flex items-center gap-1 text-muted-foreground mb-1">
                    <span className="text-sm">#️⃣</span>
                    <span className="text-xs">{bn ? 'সংখ্যা' : 'Count'}</span>
                  </div>
                  <p className="font-semibold text-foreground">{item.count}</p>
                </div>
                <div className="bg-muted/50 rounded-xl p-3">
                  <div className="flex items-center gap-1 text-muted-foreground mb-1">
                    <Heart className="w-3 h-3" />
                    <span className="text-xs">{bn ? 'খাদ্য' : 'Feed'}</span>
                  </div>
                  <p className="font-semibold text-foreground">৳{Number(item.feed_cost || 0).toLocaleString()}</p>
                </div>
                <div className="bg-muted/50 rounded-xl p-3">
                  <div className="flex items-center gap-1 text-muted-foreground mb-1">
                    <span className="text-sm">📊</span>
                    <span className="text-xs">{bn ? 'উৎপাদন' : 'Prod.'}</span>
                  </div>
                  <p className="font-semibold text-foreground">
                    {(item as any).daily_production_amount ? `${(item as any).daily_production_amount} ${(item as any).daily_production_unit || ''}` : '-'}
                  </p>
                </div>
              </div>
              {(item as any).last_illness_date && (
                <div className="flex items-center justify-between p-3 bg-destructive/5 rounded-xl text-sm">
                  <span className="text-muted-foreground">{bn ? '🩺 শেষ অসুস্থতা' : '🩺 Last Illness'}</span>
                  <span className="font-medium text-foreground">{new Date((item as any).last_illness_date).toLocaleDateString(bn ? 'bn-BD' : 'en-US')}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {farm && <AddLivestockDialog open={showAdd} onOpenChange={setShowAdd} farmId={farm.id} />}
    </div>
  );
}

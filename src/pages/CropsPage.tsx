import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Plus, Search, Filter, Camera, ChevronRight, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCrops, useDeleteCrop } from '@/hooks/useCrops';
import { useActiveFarm } from '@/hooks/useFarm';
import { AddCropDialog } from '@/components/crops/AddCropDialog';
import { toast } from 'sonner';
import { useCanPerformAction } from '@/hooks/useSubscription';
import { UpgradePrompt } from '@/components/shared/UpgradePrompt';

const stageEmoji: Record<string, string> = {
  seedling: '🌱', growing: '🌿', flowering: '🌸', fruiting: '🍎', harvesting: '🌾',
};

const stageLabels: Record<string, { bn: string; en: string }> = {
  seedling: { bn: 'চারা', en: 'Seedling' },
  growing: { bn: 'বৃদ্ধি', en: 'Growing' },
  flowering: { bn: 'ফুল ফোটা', en: 'Flowering' },
  fruiting: { bn: 'ফল ধরা', en: 'Fruiting' },
  harvesting: { bn: 'ফসল তোলা', en: 'Harvesting' },
};

export function CropsPage() {
  const { language, t } = useLanguage();
  const { farm } = useActiveFarm();
  const { data: crops, isLoading } = useCrops(farm?.id);
  const deleteCrop = useDeleteCrop();
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');
  const bn = language === 'bn';
  const permissions = useCanPerformAction();
  const cropCount = crops?.length || 0;

  const handleAddClick = () => {
    if (!permissions.canAddCrop(cropCount)) {
      toast.error(bn ? `ফ্রি প্ল্যানে সর্বোচ্চ ${permissions.limits.crops}টি ফসল যোগ করা যায়। আপগ্রেড করুন!` : `Free plan allows max ${permissions.limits.crops} crops. Upgrade!`);
      return;
    }
    setShowAdd(true);
  };

  const filtered = crops?.filter(c => c.name.toLowerCase().includes(search.toLowerCase())) ?? [];

  const getHealthColor = (health: string | null) => {
    switch (health) {
      case 'healthy': return 'bg-success';
      case 'warning': return 'bg-warning';
      case 'diseased': return 'bg-destructive';
      default: return 'bg-primary';
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCrop.mutateAsync(id);
      toast.success(bn ? 'ফসল মুছে ফেলা হয়েছে' : 'Crop deleted');
    } catch {
      toast.error(bn ? 'ত্রুটি' : 'Error');
    }
  };

  const getDaysToHarvest = (date: string | null) => {
    if (!date) return null;
    const diff = Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
            🌾 {t('crops.title')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {bn ? `${filtered.length}টি সক্রিয় ফসল` : `${filtered.length} active crops`}
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleAddClick} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors shadow-lg touch-target">
            <Plus className="w-5 h-5" />
            <span>{t('crops.addNew')}</span>
          </button>
        </div>
      </div>

      <div className="flex gap-3 animate-fade-in" style={{ animationDelay: '100ms' }}>
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder={bn ? 'ফসল খুঁজুন...' : 'Search crops...'}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-muted border-0 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">{bn ? 'লোড হচ্ছে...' : 'Loading...'}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <span className="text-5xl mb-4 block">🌾</span>
          <p className="text-muted-foreground">{bn ? 'কোনো ফসল নেই। নতুন ফসল যোগ করুন!' : 'No crops yet. Add your first crop!'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((crop, index) => {
            const days = getDaysToHarvest(crop.estimated_harvest);
            const stage = crop.growth_stage || 'seedling';
            return (
              <div key={crop.id} className="bg-card rounded-2xl p-5 border border-border card-interactive animate-fade-in" style={{ animationDelay: `${(index + 2) * 100}ms` }}>
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-card flex items-center justify-center shadow-sm">
                    <span className="text-3xl">{stageEmoji[stage] || '🌾'}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground text-lg">{crop.name}</h3>
                    {crop.variety && <p className="text-sm text-muted-foreground">{crop.variety}</p>}
                    {crop.land_size && <p className="text-xs text-muted-foreground">{crop.land_size} {crop.land_unit || 'bigha'}</p>}
                  </div>
                  <button onClick={() => handleDelete(crop.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-primary/10 text-primary">
                    {bn ? stageLabels[stage]?.bn : stageLabels[stage]?.en || stage}
                  </span>
                  {days !== null && (
                    <span className="text-xs text-muted-foreground">
                      {bn ? `${days} দিন বাকি` : `${days} days left`}
                    </span>
                  )}
                </div>
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{t('crops.health')}</span>
                    <span className="font-medium text-foreground capitalize">{crop.health_status || 'healthy'}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className={cn("h-full rounded-full transition-all duration-500", getHealthColor(crop.health_status))}
                      style={{ width: crop.health_status === 'healthy' ? '90%' : crop.health_status === 'warning' ? '60%' : '30%' }} />
                  </div>
                </div>
                {crop.planting_date && (
                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-border">
                    <span className="text-sm text-muted-foreground">{bn ? 'রোপণ' : 'Planted'}</span>
                    <span className="font-medium text-foreground text-sm">{new Date(crop.planting_date).toLocaleDateString(bn ? 'bn-BD' : 'en-US')}</span>
                  </div>
                )}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {(crop as any).soil_type && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      🌍 {(crop as any).soil_type}
                    </span>
                  )}
                  {crop.irrigation_method && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-info/10 text-info">
                      💧 {crop.irrigation_method}
                    </span>
                  )}
                  {crop.fertilizer_usage && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-success/10 text-success">
                      🧪 {crop.fertilizer_usage}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {farm && <AddCropDialog open={showAdd} onOpenChange={setShowAdd} farmId={farm.id} />}
    </div>
  );
}

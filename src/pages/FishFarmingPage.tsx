import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useActiveFarm } from '@/hooks/useFarm';
import { useFishPonds, useFishProductionLogs, useDeleteFishPond, type FishPond } from '@/hooks/useFishPonds';
import { AddPondDialog } from '@/components/fish/AddPondDialog';
import { AddFishLogDialog } from '@/components/fish/AddFishLogDialog';
import { Plus, Trash2, BarChart3, Calendar, Droplets, Fish } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useCanPerformAction } from '@/hooks/useSubscription';

export function FishFarmingPage() {
  const { language } = useLanguage();
  const { farm } = useActiveFarm();
  const { data: ponds, isLoading } = useFishPonds(farm?.id);
  const { data: logs } = useFishProductionLogs(farm?.id);
  const deletePond = useDeleteFishPond();
  const [showAddPond, setShowAddPond] = useState(false);
  const [showAddLog, setShowAddLog] = useState(false);
  const bn = language === 'bn';
  const permissions = useCanPerformAction();
  const pondCount = ponds?.length || 0;

  const handleAddPondClick = () => {
    if (!permissions.canAddFishPond(pondCount)) {
      toast.error(bn ? `ফ্রি প্ল্যানে সর্বোচ্চ ${permissions.limits.fishPonds}টি পুকুর যোগ করা যায়। আপগ্রেড করুন!` : `Free plan allows max ${permissions.limits.fishPonds} ponds. Upgrade!`);
      return;
    }
    setShowAddPond(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePond.mutateAsync(id);
      toast.success(bn ? 'মুছে ফেলা হয়েছে' : 'Deleted');
    } catch {
      toast.error(bn ? 'ত্রুটি' : 'Error');
    }
  };

  const totalFingerlings = ponds?.reduce((s, p) => s + p.fingerling_count, 0) || 0;
  const totalArea = ponds?.reduce((s, p) => s + Number(p.area_decimal), 0) || 0;
  const totalFeedCost = ponds?.reduce((s, p) => s + Number(p.feed_cost), 0) || 0;
  const totalFingerlingCost = ponds?.reduce((s, p) => s + Number(p.fingerling_cost), 0) || 0;

  const getDaysRemaining = (pond: FishPond) => {
    if (!pond.expected_sale_date) return null;
    const diff = Math.ceil((new Date(pond.expected_sale_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
            🐟 {bn ? 'মাছ চাষ' : 'Fish Farming'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {bn ? `${ponds?.length || 0}টি পুকুর • ${totalFingerlings} পোনা` : `${ponds?.length || 0} ponds • ${totalFingerlings} fingerlings`}
          </p>
        </div>
        <div className="flex gap-2">
          {(ponds?.length || 0) > 0 && (
            <button onClick={() => setShowAddLog(true)} className="flex items-center gap-2 px-4 py-2.5 bg-secondary text-secondary-foreground rounded-xl font-medium hover:bg-secondary/90 transition-colors shadow-lg touch-target">
              <BarChart3 className="w-5 h-5" />
              <span>{bn ? 'লগ যোগ' : 'Add Log'}</span>
            </button>
          )}
          <button onClick={handleAddPondClick} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors shadow-lg touch-target">
            <Plus className="w-5 h-5" />
            <span>{bn ? 'পুকুর যোগ' : 'Add Pond'}</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {(ponds?.length || 0) > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-fade-in" style={{ animationDelay: '100ms' }}>
          <div className="bg-card rounded-2xl p-4 border border-border shadow-sm">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Droplets className="w-4 h-4" />
              <span className="text-xs">{bn ? 'মোট আয়তন' : 'Total Area'}</span>
            </div>
            <p className="text-xl font-bold text-foreground">{totalArea} {bn ? 'শতাংশ' : 'dec'}</p>
          </div>
          <div className="bg-card rounded-2xl p-4 border border-border shadow-sm">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Fish className="w-4 h-4" />
              <span className="text-xs">{bn ? 'মোট পোনা' : 'Total Fingerlings'}</span>
            </div>
            <p className="text-xl font-bold text-foreground">{totalFingerlings.toLocaleString()}</p>
          </div>
          <div className="bg-card rounded-2xl p-4 border border-border shadow-sm">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <span className="text-sm">💰</span>
              <span className="text-xs">{bn ? 'পোনা খরচ' : 'Fingerling Cost'}</span>
            </div>
            <p className="text-xl font-bold text-foreground">৳{totalFingerlingCost.toLocaleString()}</p>
          </div>
          <div className="bg-card rounded-2xl p-4 border border-border shadow-sm">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <span className="text-sm">🍲</span>
              <span className="text-xs">{bn ? 'দৈনিক খাদ্য খরচ' : 'Daily Feed Cost'}</span>
            </div>
            <p className="text-xl font-bold text-foreground">৳{totalFeedCost.toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* Pond Cards */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">{bn ? 'লোড হচ্ছে...' : 'Loading...'}</div>
      ) : (ponds?.length || 0) === 0 ? (
        <div className="text-center py-12">
          <span className="text-5xl mb-4 block">🐟</span>
          <p className="text-muted-foreground">{bn ? 'কোনো পুকুর নেই। মাছ চাষ শুরু করুন!' : 'No ponds yet. Start fish farming!'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {ponds!.map((pond, index) => {
            const daysLeft = getDaysRemaining(pond);
            const pondLogs = logs?.filter(l => l.pond_id === pond.id) || [];
            const latestLog = pondLogs[0];

            return (
              <div key={pond.id} className="bg-card rounded-2xl p-5 border-2 border-info/30 card-interactive animate-fade-in" style={{ animationDelay: `${(index + 2) * 100}ms` }}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-xl bg-info/10 flex items-center justify-center">
                      <span className="text-3xl">🐟</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground text-lg">
                        {bn ? `পুকুর #${pond.pond_number}` : `Pond #${pond.pond_number}`}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {pond.area_decimal} {bn ? 'শতাংশ' : 'dec'} • {pond.depth_feet ? `${pond.depth_feet} ${bn ? 'ফুট' : 'ft'}` : ''}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(pond.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Species Tags */}
                {pond.fish_species.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {pond.fish_species.map(sp => (
                      <span key={sp} className="px-2 py-0.5 bg-info/10 text-info rounded-full text-xs font-medium">{sp}</span>
                    ))}
                  </div>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="bg-muted/50 rounded-xl p-2.5 text-center">
                    <p className="text-xs text-muted-foreground">{bn ? 'পোনা' : 'Fish'}</p>
                    <p className="font-semibold text-foreground text-sm">{pond.fingerling_count}</p>
                  </div>
                  <div className="bg-muted/50 rounded-xl p-2.5 text-center">
                    <p className="text-xs text-muted-foreground">{bn ? 'গড় ওজন' : 'Avg Wt'}</p>
                    <p className="font-semibold text-foreground text-sm">
                      {(latestLog?.avg_weight_g || pond.current_avg_weight_g || 0)}g
                    </p>
                  </div>
                  <div className="bg-muted/50 rounded-xl p-2.5 text-center">
                    <p className="text-xs text-muted-foreground">{bn ? 'খাদ্য/দিন' : 'Feed/d'}</p>
                    <p className="font-semibold text-foreground text-sm">{pond.daily_feed_amount}kg</p>
                  </div>
                </div>

                {/* Harvest Countdown */}
                {daysLeft !== null && (
                  <div className={cn(
                    "flex items-center justify-between p-3 rounded-xl text-sm",
                    daysLeft <= 7 ? "bg-warning/10" : "bg-success/10"
                  )}>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      {bn ? '📅 বিক্রয় কাউন্টডাউন' : '📅 Harvest Countdown'}
                    </span>
                    <span className="font-bold text-foreground">
                      {daysLeft} {bn ? 'দিন' : 'days'}
                    </span>
                  </div>
                )}

                {/* Water Source */}
                {pond.water_source && (
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <Droplets className="w-3 h-3" />
                    {bn ? 'পানির উৎস:' : 'Water:'} {pond.water_source}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Recent Logs */}
      {(logs?.length || 0) > 0 && (
        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm animate-fade-in">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            📊 {bn ? 'সাম্প্রতিক লগ' : 'Recent Logs'}
          </h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {logs!.slice(0, 10).map(log => {
              const pond = ponds?.find(p => p.id === log.pond_id);
              return (
                <div key={log.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-xl text-sm">
                  <div>
                    <span className="font-medium text-foreground">
                      {pond ? (bn ? `পুকুর #${pond.pond_number}` : `Pond #${pond.pond_number}`) : (bn ? 'সব পুকুর' : 'All ponds')}
                    </span>
                    <span className="text-muted-foreground ml-2">{new Date(log.log_date).toLocaleDateString(bn ? 'bn-BD' : 'en-US')}</span>
                  </div>
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    {log.avg_weight_g > 0 && <span>⚖️ {log.avg_weight_g}g</span>}
                    {log.feed_amount_kg > 0 && <span>🍲 {log.feed_amount_kg}kg</span>}
                    {log.mortality_count > 0 && <span className="text-destructive">💀 {log.mortality_count}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Dialogs */}
      {farm && (
        <>
          <AddPondDialog open={showAddPond} onOpenChange={setShowAddPond} farmId={farm.id} existingPondCount={ponds?.length || 0} />
          <AddFishLogDialog open={showAddLog} onOpenChange={setShowAddLog} farmId={farm.id} ponds={ponds || []} />
        </>
      )}
    </div>
  );
}

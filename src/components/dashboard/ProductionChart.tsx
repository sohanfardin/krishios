import { useLanguage } from '@/contexts/LanguageContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useActiveFarm } from '@/hooks/useFarm';
import { useHarvestRecords } from '@/hooks/useHarvestRecords';
import { useLivestockLogs } from '@/hooks/useLivestockLogs';
import { useFishProductionLogs, useFishPonds } from '@/hooks/useFishPonds';
import { AddHarvestDialog } from '@/components/production/AddHarvestDialog';
import { AddLivestockLogDialog } from '@/components/production/AddLivestockLogDialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

function toBn(n: number | string): string {
  const d = ['০','১','২','৩','৪','৫','৬','৭','৮','৯'];
  return String(n).replace(/\d/g, c => d[parseInt(c)]);
}

export function ProductionChart() {
  const { language } = useLanguage();
  const bn = language === 'bn';
  const { farm } = useActiveFarm();
  const { data: harvests = [] } = useHarvestRecords(farm?.id);
  const { data: livestockLogs = [] } = useLivestockLogs(farm?.id);
  const { data: fishLogs = [] } = useFishProductionLogs(farm?.id);
  const { data: fishPonds = [] } = useFishPonds(farm?.id);
  const [activeTab, setActiveTab] = useState<'yield' | 'livestock' | 'fish' | 'profit'>('yield');
  const [showHarvestDialog, setShowHarvestDialog] = useState(false);
  const [showLivestockLogDialog, setShowLivestockLogDialog] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const hasData = harvests.length > 0 || livestockLogs.length > 0 || fishLogs.length > 0 || fishPonds.length > 0;

  // Compute yield data from harvest records grouped by crop
  const yieldData = harvests.reduce((acc, h) => {
    const existing = acc.find(a => a.name === h.crop_name);
    if (existing) {
      existing.production += h.total_production;
      existing.landSize += h.land_size;
    } else {
      acc.push({ name: h.crop_name, production: h.total_production, landSize: h.land_size });
    }
    return acc;
  }, [] as { name: string; production: number; landSize: number }[]).map(d => ({
    name: d.name,
    [bn ? 'উৎপাদন' : 'Production']: d.production,
    [bn ? 'প্রতি বিঘা' : 'Per Unit']: d.landSize > 0 ? Math.round((d.production / d.landSize) * 10) / 10 : 0,
  }));

  // Profit data from harvest records
  const profitData = harvests.map(h => {
    const totalCost = h.fertilizer_cost + h.labor_cost + h.irrigation_cost + h.medicine_cost;
    return {
      name: h.crop_name + (h.harvest_date ? ` (${h.harvest_date.slice(5)})` : ''),
      [bn ? 'আয়' : 'Revenue']: h.total_sale_price,
      [bn ? 'খরচ' : 'Expenses']: totalCost,
    };
  });

  // Livestock data grouped by animal type
  const livestockData = livestockLogs.reduce((acc, l) => {
    const existing = acc.find(a => a.name === l.animal_type);
    if (existing) {
      existing.production += l.production_amount;
      existing.count += 1;
    } else {
      acc.push({ name: l.animal_type, production: l.production_amount, count: 1 });
    }
    return acc;
  }, [] as { name: string; production: number; count: number }[]).map(d => ({
    name: d.name,
    [bn ? 'মোট উৎপাদন' : 'Total Production']: d.production,
    [bn ? 'দিন' : 'Days']: d.count,
  }));

  // Cost breakdown pie chart
  const totalFertilizer = harvests.reduce((s, h) => s + h.fertilizer_cost, 0);
  const totalLabor = harvests.reduce((s, h) => s + h.labor_cost, 0);
  const totalIrrigation = harvests.reduce((s, h) => s + h.irrigation_cost, 0);
  const totalMedicine = harvests.reduce((s, h) => s + h.medicine_cost, 0);
  const totalRevenue = harvests.reduce((s, h) => s + h.total_sale_price, 0);
  const totalCostAll = totalFertilizer + totalLabor + totalIrrigation + totalMedicine;
  const netProfit = totalRevenue - totalCostAll;

  const costPieData = [
    { name: bn ? 'সার' : 'Fertilizer', value: totalFertilizer },
    { name: bn ? 'শ্রম' : 'Labor', value: totalLabor },
    { name: bn ? 'সেচ' : 'Irrigation', value: totalIrrigation },
    { name: bn ? 'ওষুধ' : 'Medicine', value: totalMedicine },
  ].filter(d => d.value > 0);

  const PIE_COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--destructive))'];

  const runAIAnalysis = async () => {
    if (!farm) return;
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('production-analysis', {
        body: { harvestRecords: harvests, livestockLogs, language },
      });
      if (error) throw error;
      setAiAnalysis(data);
      toast.success(bn ? '🧠 AI বিশ্লেষণ সম্পন্ন!' : '🧠 AI analysis complete!');
    } catch (e: any) {
      toast.error(e?.message || (bn ? 'ত্রুটি হয়েছে' : 'Error occurred'));
    } finally {
      setAiLoading(false);
    }
  };

  // Fish growth data - avg weight per pond over time
  const fishGrowthData = fishPonds.map(p => ({
    name: bn ? `পুকুর #${p.pond_number}` : `Pond #${p.pond_number}`,
    [bn ? 'গড় ওজন (g)' : 'Avg Weight (g)']: p.current_avg_weight_g || 0,
    [bn ? 'পোনা সংখ্যা' : 'Fingerlings']: p.fingerling_count || 0,
  }));

  // Fish cost data
  const totalFeedCostFish = fishPonds.reduce((s, p) => s + (p.feed_cost || 0), 0);
  const totalFingerlingCost = fishPonds.reduce((s, p) => s + (p.fingerling_cost || 0), 0);
  const fishLogFeedCost = fishLogs.reduce((s, l) => s + (l.feed_cost || 0), 0);
  const fishLogMedicineCost = fishLogs.reduce((s, l) => s + (l.medicine_cost || 0), 0);

  const tabs = [
    { key: 'yield', label: bn ? 'ফলন' : 'Yield', emoji: '🌾' },
    { key: 'livestock', label: bn ? 'পশুপালন' : 'Livestock', emoji: '🥚' },
    { key: 'fish', label: bn ? 'মাছ চাষ' : 'Fish', emoji: '🐟' },
    { key: 'profit', label: bn ? 'আয়-ব্যয়' : 'Profit', emoji: '💰' },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-foreground mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {bn ? toBn(entry.value) : entry.value}
              {activeTab === 'profit' ? ' ৳' : ''}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-card rounded-2xl p-5 shadow-sm border border-border animate-slide-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-xl">📊</span>
          <h3 className="text-lg font-semibold text-foreground">
            {bn ? 'উৎপাদন বিশ্লেষণ' : 'Production Analysis'}
          </h3>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap",
                activeTab === tab.key
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              <span>{tab.emoji}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {hasData ? (
        <>
          {/* Stats row */}
          {activeTab === 'profit' && harvests.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-success/10 rounded-xl p-3 text-center overflow-hidden">
                <p className="text-xs text-muted-foreground truncate">{bn ? 'মোট আয়' : 'Revenue'}</p>
                <p className="text-sm sm:text-lg font-bold text-success truncate">৳{bn ? toBn(totalRevenue) : totalRevenue.toLocaleString()}</p>
              </div>
              <div className="bg-destructive/10 rounded-xl p-3 text-center overflow-hidden">
                <p className="text-xs text-muted-foreground truncate">{bn ? 'মোট খরচ' : 'Cost'}</p>
                <p className="text-sm sm:text-lg font-bold text-destructive truncate">৳{bn ? toBn(totalCostAll) : totalCostAll.toLocaleString()}</p>
              </div>
              <div className={cn("rounded-xl p-3 text-center overflow-hidden", netProfit >= 0 ? "bg-success/10" : "bg-destructive/10")}>
                <p className="text-xs text-muted-foreground truncate">{bn ? 'নিট লাভ' : 'Net Profit'}</p>
                <p className={cn("text-sm sm:text-lg font-bold truncate", netProfit >= 0 ? "text-success" : "text-destructive")}>
                  ৳{bn ? toBn(Math.abs(netProfit)) : Math.abs(netProfit).toLocaleString()}
                  {netProfit < 0 && ` (${bn ? 'লস' : 'Loss'})`}
                </p>
              </div>
            </div>
          )}

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              {activeTab === 'profit' ? (
                costPieData.length > 0 ? (
                  <PieChart>
                    <Pie data={costPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {costPieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                ) : (
                  <BarChart data={profitData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey={bn ? 'আয়' : 'Revenue'} fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey={bn ? 'খরচ' : 'Expenses'} fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                )
              ) : activeTab === 'yield' ? (
                <BarChart data={yieldData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey={bn ? 'উৎপাদন' : 'Production'} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey={bn ? 'প্রতি বিঘা' : 'Per Unit'} fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : activeTab === 'fish' ? (
                fishGrowthData.length > 0 ? (
                  <BarChart data={fishGrowthData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey={bn ? 'গড় ওজন (g)' : 'Avg Weight (g)'} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey={bn ? 'পোনা সংখ্যা' : 'Fingerlings'} fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                ) : (
                  <BarChart data={[{ name: bn ? 'কোনো ডেটা নেই' : 'No data', value: 0 }]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                    <Bar dataKey="value" fill="hsl(var(--muted))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                )
              ) : (
                <BarChart data={livestockData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey={bn ? 'মোট উৎপাদন' : 'Total Production'} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* AI Analysis Button & Results */}
          <div className="mt-4 flex flex-col gap-3">
            <button
              onClick={runAIAnalysis}
              disabled={aiLoading}
              className="w-full py-2.5 bg-accent text-accent-foreground rounded-xl text-sm font-semibold hover:bg-accent/80 transition-colors disabled:opacity-50"
            >
              {aiLoading ? (bn ? '🧠 বিশ্লেষণ চলছে...' : '🧠 Analyzing...') : (bn ? '🧠 AI বিশ্লেষণ চালান' : '🧠 Run AI Analysis')}
            </button>

            {aiAnalysis && (
              <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                <p className="text-sm font-medium text-foreground">{aiAnalysis.summary_bn || ''}</p>
                {aiAnalysis.alerts?.map((a: any, i: number) => (
                  <div key={i} className={cn("text-xs px-3 py-2 rounded-lg", a.type === 'warning' ? 'bg-warning/10 text-warning' : a.type === 'success' ? 'bg-success/10 text-success' : 'bg-info/10 text-info')}>
                    {a.type === 'warning' ? '⚠️' : a.type === 'success' ? '✅' : 'ℹ️'} {a.message}
                  </div>
                ))}
                {aiAnalysis.recommendations?.map((r: string, i: number) => (
                  <p key={i} className="text-xs text-muted-foreground">💡 {r}</p>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
          <span className="text-4xl mb-3">📊</span>
          <p className="text-sm font-medium">{bn ? 'এখনও কোনো উৎপাদন ডেটা নেই' : 'No production data yet'}</p>
          <p className="text-xs mt-1 mb-4">{bn ? 'ফসল কাটার তথ্য বা পশু উৎপাদন লগ যোগ করুন' : 'Add harvest records or livestock logs'}</p>
          <div className="flex gap-2">
            {farm && (
              <>
                <button onClick={() => setShowHarvestDialog(true)} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
                  🌾 {bn ? 'ফসল উৎপাদন যোগ' : 'Add Harvest'}
                </button>
                <button onClick={() => setShowLivestockLogDialog(true)} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:bg-secondary/90 transition-colors">
                  🐄 {bn ? 'পশু উৎপাদন যোগ' : 'Add Livestock Log'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Add data buttons when data exists */}
      {hasData && farm && (
        <div className="flex gap-2 mt-4">
          <button onClick={() => setShowHarvestDialog(true)} className="flex-1 py-2 bg-primary/10 text-primary rounded-lg text-xs font-medium hover:bg-primary/20 transition-colors">
            + {bn ? 'ফসল উৎপাদন যোগ' : 'Add Harvest'}
          </button>
          <button onClick={() => setShowLivestockLogDialog(true)} className="flex-1 py-2 bg-secondary/10 text-secondary rounded-lg text-xs font-medium hover:bg-secondary/20 transition-colors">
            + {bn ? 'পশু উৎপাদন যোগ' : 'Add Livestock Log'}
          </button>
        </div>
      )}

      {farm && (
        <>
          <AddHarvestDialog open={showHarvestDialog} onOpenChange={setShowHarvestDialog} farmId={farm.id} />
          <AddLivestockLogDialog open={showLivestockLogDialog} onOpenChange={setShowLivestockLogDialog} farmId={farm.id} />
        </>
      )}
    </div>
  );
}

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useActiveFarm } from '@/hooks/useFarm';
import { useHarvestRecords } from '@/hooks/useHarvestRecords';
import { useLivestockLogs } from '@/hooks/useLivestockLogs';
import { AddHarvestDialog } from '@/components/production/AddHarvestDialog';
import { AddLivestockLogDialog } from '@/components/production/AddLivestockLogDialog';
import { Plus, Sparkles, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

function toBn(n: number | string): string {
  const d = ['০','১','২','৩','৪','৫','৬','৭','৮','৯'];
  return String(n).replace(/\d/g, c => d[parseInt(c)]);
}

export function ProductionPage() {
  const { language } = useLanguage();
  const bn = language === 'bn';
  const { farm } = useActiveFarm();
  const { data: harvests = [] } = useHarvestRecords(farm?.id);
  const { data: livestockLogs = [] } = useLivestockLogs(farm?.id);
  const [showHarvest, setShowHarvest] = useState(false);
  const [showLivestock, setShowLivestock] = useState(false);
  const [activeTab, setActiveTab] = useState<'crops' | 'livestock' | 'revenue'>('crops');
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Crop production data grouped by crop
  const cropData = harvests.reduce((acc, h) => {
    const existing = acc.find(a => a.name === h.crop_name);
    if (existing) {
      existing.production += h.total_production;
      existing.revenue += h.total_sale_price;
      existing.cost += h.fertilizer_cost + h.labor_cost + h.irrigation_cost + h.medicine_cost;
    } else {
      acc.push({
        name: h.crop_name,
        production: h.total_production,
        revenue: h.total_sale_price,
        cost: h.fertilizer_cost + h.labor_cost + h.irrigation_cost + h.medicine_cost,
      });
    }
    return acc;
  }, [] as { name: string; production: number; revenue: number; cost: number }[]);

  // Livestock production over time
  const livestockTimeline = livestockLogs
    .sort((a, b) => a.log_date.localeCompare(b.log_date))
    .reduce((acc, l) => {
      const date = l.log_date;
      const existing = acc.find(a => a.date === date);
      if (existing) {
        existing[bn ? 'উৎপাদন' : 'Production'] += l.production_amount;
        existing[bn ? 'আয়' : 'Revenue'] += l.sale_price;
      } else {
        acc.push({
          date,
          name: new Date(date).toLocaleDateString(bn ? 'bn-BD' : 'en-US', { month: 'short', day: 'numeric' }),
          [bn ? 'উৎপাদন' : 'Production']: l.production_amount,
          [bn ? 'আয়' : 'Revenue']: l.sale_price,
        });
      }
      return acc;
    }, [] as any[]);

  // Revenue by product type
  const revenueByProduct = [
    ...cropData.map(c => ({ name: c.name, value: c.revenue, type: 'crop' })),
    ...livestockLogs.reduce((acc, l) => {
      const existing = acc.find(a => a.name === l.animal_type);
      if (existing) existing.value += l.sale_price;
      else acc.push({ name: l.animal_type, value: l.sale_price, type: 'livestock' });
      return acc;
    }, [] as { name: string; value: number; type: string }[]),
  ].filter(d => d.value > 0);

  const PIE_COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--destructive))', 'hsl(var(--success))'];

  // Summary stats
  const totalCropProduction = harvests.reduce((s, h) => s + h.total_production, 0);
  const totalCropRevenue = harvests.reduce((s, h) => s + h.total_sale_price, 0);
  const totalLivestockProduction = livestockLogs.reduce((s, l) => s + l.production_amount, 0);
  const totalLivestockRevenue = livestockLogs.reduce((s, l) => s + l.sale_price, 0);
  const totalRevenue = totalCropRevenue + totalLivestockRevenue;

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
      toast.error(e?.message || (bn ? 'ত্রুটি' : 'Error'));
    }
    setAiLoading(false);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-foreground mb-1">{label}</p>
          {payload.map((e: any, i: number) => (
            <p key={i} className="text-sm" style={{ color: e.color }}>{e.name}: {e.value.toLocaleString()}</p>
          ))}
        </div>
      );
    }
    return null;
  };

  const tabs = [
    { key: 'crops', label: bn ? 'ফসল' : 'Crops', emoji: '🌾' },
    { key: 'livestock', label: bn ? 'পশুপালন' : 'Livestock', emoji: '🥚' },
    { key: 'revenue', label: bn ? 'আয়' : 'Revenue', emoji: '💰' },
  ];

  const hasData = harvests.length > 0 || livestockLogs.length > 0;

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
            📊 {bn ? 'উৎপাদন ব্যবস্থাপনা' : 'Production Management'}
          </h1>
          <p className="text-muted-foreground mt-1">{bn ? 'ফসল, দুধ, ডিম উৎপাদন ও বিক্রয় তথ্য' : 'Crop, milk, egg production & sales data'}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={runAIAnalysis} disabled={aiLoading || !hasData} className="flex items-center gap-2 px-4 py-2.5 bg-accent text-accent-foreground rounded-xl font-medium hover:bg-accent/80 transition-colors disabled:opacity-50">
            {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>{bn ? 'AI বিশ্লেষণ' : 'AI Analysis'}</span>
          </button>
          <button onClick={() => setShowHarvest(true)} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors shadow-lg">
            <Plus className="w-5 h-5" />
            <span>{bn ? 'ফসল উৎপাদন' : 'Add Harvest'}</span>
          </button>
          <button onClick={() => setShowLivestock(true)} className="flex items-center gap-2 px-4 py-2.5 bg-secondary text-secondary-foreground rounded-xl font-medium hover:bg-secondary/90 transition-colors shadow-lg">
            <Plus className="w-5 h-5" />
            <span>{bn ? 'পশু উৎপাদন' : 'Add Livestock Log'}</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-fade-in" style={{ animationDelay: '100ms' }}>
        <div className="bg-primary/10 border-2 border-primary/20 rounded-2xl p-4">
          <p className="text-xs text-muted-foreground">{bn ? 'ফসল উৎপাদন' : 'Crop Production'}</p>
          <p className="text-xl font-bold text-foreground">{bn ? toBn(totalCropProduction) : totalCropProduction.toLocaleString()} <span className="text-sm font-normal">kg</span></p>
        </div>
        <div className="bg-secondary/10 border-2 border-secondary/20 rounded-2xl p-4">
          <p className="text-xs text-muted-foreground">{bn ? 'পশু উৎপাদন' : 'Livestock Output'}</p>
          <p className="text-xl font-bold text-foreground">{bn ? toBn(totalLivestockProduction) : totalLivestockProduction.toLocaleString()}</p>
        </div>
        <div className="bg-success/10 border-2 border-success/20 rounded-2xl p-4">
          <p className="text-xs text-muted-foreground">{bn ? 'ফসল আয়' : 'Crop Revenue'}</p>
          <p className="text-xl font-bold text-success">৳{bn ? toBn(totalCropRevenue) : totalCropRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-success/10 border-2 border-success/20 rounded-2xl p-4">
          <p className="text-xs text-muted-foreground">{bn ? 'মোট আয়' : 'Total Revenue'}</p>
          <p className="text-xl font-bold text-success">৳{bn ? toBn(totalRevenue) : totalRevenue.toLocaleString()}</p>
        </div>
      </div>

      {/* Charts */}
      {hasData && (
        <div className="bg-card rounded-2xl border border-border p-5 animate-fade-in" style={{ animationDelay: '200ms' }}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h3 className="text-lg font-semibold text-foreground">{bn ? 'উৎপাদন চার্ট' : 'Production Charts'}</h3>
            <div className="flex gap-2">
              {tabs.map(tab => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
                  className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                    activeTab === tab.key ? "bg-primary text-primary-foreground shadow-md" : "bg-muted text-muted-foreground hover:bg-muted/80")}>
                  <span>{tab.emoji}</span><span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              {activeTab === 'crops' ? (
                <BarChart data={cropData.map(c => ({ name: c.name, [bn ? 'উৎপাদন (kg)' : 'Production (kg)']: c.production, [bn ? 'আয় (৳)' : 'Revenue (৳)']: c.revenue }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey={bn ? 'উৎপাদন (kg)' : 'Production (kg)'} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey={bn ? 'আয় (৳)' : 'Revenue (৳)'} fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : activeTab === 'livestock' ? (
                <LineChart data={livestockTimeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey={bn ? 'উৎপাদন' : 'Production'} stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey={bn ? 'আয়' : 'Revenue'} stroke="hsl(var(--success))" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              ) : (
                revenueByProduct.length > 0 ? (
                  <PieChart>
                    <Pie data={revenueByProduct} cx="50%" cy="50%" innerRadius={50} outerRadius={100} paddingAngle={3} dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {revenueByProduct.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                ) : (
                  <BarChart data={[{ name: bn ? 'ফসল' : 'Crops', value: totalCropRevenue }, { name: bn ? 'পশু' : 'Livestock', value: totalLivestockRevenue }]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                )
              )}
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* AI Analysis */}
      {aiAnalysis && (
        <div className="bg-card rounded-2xl border-2 border-primary/20 p-5 animate-fade-in">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-primary" /> {bn ? '🧠 AI উৎপাদন বিশ্লেষণ' : '🧠 AI Production Analysis'}
          </h2>
          <p className="text-sm text-foreground mb-3">{aiAnalysis.summary_bn || aiAnalysis.summary || ''}</p>
          {aiAnalysis.alerts?.map((a: any, i: number) => (
            <div key={i} className={cn("text-xs px-3 py-2 rounded-lg mb-2", a.type === 'warning' ? 'bg-warning/10 text-warning' : a.type === 'success' ? 'bg-success/10 text-success' : 'bg-info/10 text-info')}>
              {a.type === 'warning' ? '⚠️' : a.type === 'success' ? '✅' : 'ℹ️'} {a.message}
            </div>
          ))}
          {aiAnalysis.recommendations?.map((r: string, i: number) => (
            <p key={i} className="text-xs text-muted-foreground mb-1">💡 {r}</p>
          ))}
        </div>
      )}

      {/* Recent Records */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Harvests */}
        <div className="bg-card rounded-2xl border border-border animate-fade-in" style={{ animationDelay: '300ms' }}>
          <div className="p-5 border-b border-border flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">🌾 {bn ? 'সাম্প্রতিক ফসল' : 'Recent Harvests'}</h2>
            <button onClick={() => setShowHarvest(true)} className="text-xs px-3 py-1.5 bg-primary/10 text-primary rounded-lg font-medium hover:bg-primary/20">+ {bn ? 'যোগ' : 'Add'}</button>
          </div>
          {harvests.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <span className="text-3xl block mb-2">🌾</span>{bn ? 'কোনো ফসল উৎপাদন তথ্য নেই' : 'No harvest records'}
            </div>
          ) : (
            <div className="divide-y divide-border max-h-64 overflow-y-auto">
              {harvests.slice(0, 10).map(h => (
                <div key={h.id} className="flex items-center gap-3 p-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><span className="text-lg">🌾</span></div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">{h.crop_name}</p>
                    <p className="text-xs text-muted-foreground">{h.total_production} {h.production_unit} • ৳{h.total_sale_price.toLocaleString()}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{h.harvest_date ? new Date(h.harvest_date).toLocaleDateString(bn ? 'bn-BD' : 'en-US') : ''}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Livestock Logs */}
        <div className="bg-card rounded-2xl border border-border animate-fade-in" style={{ animationDelay: '400ms' }}>
          <div className="p-5 border-b border-border flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">🐄 {bn ? 'সাম্প্রতিক পশু উৎপাদন' : 'Recent Livestock Logs'}</h2>
            <button onClick={() => setShowLivestock(true)} className="text-xs px-3 py-1.5 bg-secondary/10 text-secondary rounded-lg font-medium hover:bg-secondary/20">+ {bn ? 'যোগ' : 'Add'}</button>
          </div>
          {livestockLogs.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <span className="text-3xl block mb-2">🥚</span>{bn ? 'কোনো পশু উৎপাদন তথ্য নেই' : 'No livestock logs'}
            </div>
          ) : (
            <div className="divide-y divide-border max-h-64 overflow-y-auto">
              {livestockLogs.slice(0, 10).map(l => (
                <div key={l.id} className="flex items-center gap-3 p-4">
                  <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center"><span className="text-lg">{l.animal_type === 'গরু' ? '🐄' : l.animal_type === 'মুরগি' ? '🐔' : l.animal_type === 'হাঁস' ? '🦆' : '🐐'}</span></div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">{l.animal_type}</p>
                    <p className="text-xs text-muted-foreground">{l.production_amount} {l.production_unit} • ৳{l.sale_price.toLocaleString()}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{new Date(l.log_date).toLocaleDateString(bn ? 'bn-BD' : 'en-US')}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {farm && (
        <>
          <AddHarvestDialog open={showHarvest} onOpenChange={setShowHarvest} farmId={farm.id} />
          <AddLivestockLogDialog open={showLivestock} onOpenChange={setShowLivestock} farmId={farm.id} />
        </>
      )}
    </div>
  );
}

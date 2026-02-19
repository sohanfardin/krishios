import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Plus, TrendingUp, TrendingDown, Wallet, Trash2, Sparkles, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFinanceSummary, useDeleteTransaction } from '@/hooks/useFinance';
import { useActiveFarm } from '@/hooks/useFarm';
import { AddTransactionDialog } from '@/components/finance/AddTransactionDialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const categoryLabels: Record<string, { bn: string; en: string }> = {
  crop_sales: { bn: 'ফসল বিক্রি', en: 'Crop Sales' },
  milk_sales: { bn: 'দুধ বিক্রি', en: 'Milk Sales' },
  egg_sales: { bn: 'ডিম বিক্রি', en: 'Egg Sales' },
  meat_sales: { bn: 'মাংস বিক্রি', en: 'Meat Sales' },
  other_revenue: { bn: 'অন্যান্য আয়', en: 'Other Revenue' },
  fertilizer: { bn: 'সার', en: 'Fertilizer' },
  feed: { bn: 'পশু খাদ্য', en: 'Feed' },
  medicine: { bn: 'ওষুধ', en: 'Medicine' },
  labor: { bn: 'শ্রমিক', en: 'Labor' },
  irrigation: { bn: 'সেচ', en: 'Irrigation' },
  seeds: { bn: 'বীজ', en: 'Seeds' },
  transport: { bn: 'পরিবহন', en: 'Transport' },
  equipment: { bn: 'সরঞ্জাম', en: 'Equipment' },
  other_expense: { bn: 'অন্যান্য', en: 'Other' },
};

export function FinancePage() {
  const { language } = useLanguage();
  const { farm } = useActiveFarm();
  const { revenue, expenses, profit, transactions } = useFinanceSummary(farm?.id);
  const deleteTx = useDeleteTransaction();
  const [showAdd, setShowAdd] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiReport, setAiReport] = useState('');
  const bn = language === 'bn';

  const generateAIReport = async () => {
    if (!farm) return;
    setIsAnalyzing(true);
    setAiReport('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/smart-advisory`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ type: 'finance_analysis', farmId: farm.id }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || 'AI error');
      }

      if (!resp.body) throw new Error('No response');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullText += content;
              setAiReport(fullText);
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }
    } catch (e: any) {
      toast.error(e.message || (bn ? 'AI ত্রুটি' : 'AI error'));
    }
    setIsAnalyzing(false);
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
            💰 {bn ? 'আর্থিক ব্যবস্থাপনা' : 'Financial Management'}
          </h1>
          <p className="text-muted-foreground mt-1">{bn ? 'আয়-ব্যয় হিসাব ও AI বিশ্লেষণ' : 'Revenue, Expense & AI Analysis'}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={generateAIReport} disabled={isAnalyzing} className="flex items-center gap-2 px-4 py-2.5 bg-accent text-accent-foreground rounded-xl font-medium hover:bg-accent/80 transition-colors touch-target disabled:opacity-50">
            {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>{bn ? 'AI রিপোর্ট' : 'AI Report'}</span>
          </button>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors shadow-lg touch-target">
            <Plus className="w-5 h-5" />
            <span>{bn ? 'লেনদেন যোগ করুন' : 'Add Transaction'}</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-in" style={{ animationDelay: '100ms' }}>
        <div className="bg-success/10 border-2 border-success/20 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center"><TrendingUp className="w-5 h-5 text-success" /></div>
            <span className="text-sm text-muted-foreground">{bn ? 'মোট আয়' : 'Total Revenue'}</span>
          </div>
          <p className="text-2xl font-bold text-foreground">৳{revenue.toLocaleString()}</p>
        </div>
        <div className="bg-destructive/10 border-2 border-destructive/20 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-destructive/20 flex items-center justify-center"><TrendingDown className="w-5 h-5 text-destructive" /></div>
            <span className="text-sm text-muted-foreground">{bn ? 'মোট খরচ' : 'Total Expenses'}</span>
          </div>
          <p className="text-2xl font-bold text-foreground">৳{expenses.toLocaleString()}</p>
        </div>
        <div className={cn("border-2 rounded-2xl p-5", profit >= 0 ? 'bg-success/10 border-success/20' : 'bg-destructive/10 border-destructive/20')}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center"><Wallet className="w-5 h-5 text-primary" /></div>
            <span className="text-sm text-muted-foreground">{bn ? 'নিট লাভ' : 'Net Profit'}</span>
          </div>
          <p className={cn("text-2xl font-bold", profit >= 0 ? 'text-success' : 'text-destructive')}>
            {profit >= 0 ? '+' : ''}৳{profit.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Time-series Charts */}
      {transactions && transactions.length > 0 && (() => {
        const monthlyData = transactions.reduce((acc, tx) => {
          const month = tx.transaction_date.slice(0, 7);
          const existing = acc.find(a => a.month === month);
          const amt = Number(tx.amount);
          if (existing) {
            if (tx.type === 'revenue') existing.revenue += amt;
            else existing.expense += amt;
          } else {
            acc.push({ month, revenue: tx.type === 'revenue' ? amt : 0, expense: tx.type === 'expense' ? amt : 0 });
          }
          return acc;
        }, [] as { month: string; revenue: number; expense: number }[])
          .sort((a, b) => a.month.localeCompare(b.month))
          .map(d => ({
            name: new Date(d.month + '-01').toLocaleDateString(bn ? 'bn-BD' : 'en-US', { month: 'short', year: '2-digit' }),
            [bn ? 'আয়' : 'Revenue']: d.revenue,
            [bn ? 'খরচ' : 'Expenses']: d.expense,
            [bn ? 'লাভ' : 'Profit']: d.revenue - d.expense,
          }));

        const categoryBreakdown = transactions
          .filter(tx => tx.type === 'expense')
          .reduce((acc, tx) => {
            const cat = bn ? (categoryLabels[tx.category]?.bn || tx.category) : (categoryLabels[tx.category]?.en || tx.category);
            const existing = acc.find(a => a.name === cat);
            if (existing) existing.value += Number(tx.amount);
            else acc.push({ name: cat, value: Number(tx.amount) });
            return acc;
          }, [] as { name: string; value: number }[]);

        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fade-in" style={{ animationDelay: '150ms' }}>
            <div className="bg-card rounded-2xl border border-border p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">{bn ? '📈 আয় বনাম খরচ বনাম লাভ' : '📈 Revenue vs Expense vs Profit'}</h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                    <Legend />
                    <Line type="monotone" dataKey={bn ? 'আয়' : 'Revenue'} stroke="hsl(var(--success))" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey={bn ? 'খরচ' : 'Expenses'} stroke="hsl(var(--destructive))" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey={bn ? 'লাভ' : 'Profit'} stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-card rounded-2xl border border-border p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">{bn ? '📊 বিভাগ অনুযায়ী খরচ' : '📊 Expense by Category'}</h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryBreakdown} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                    <YAxis type="category" dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} width={80} />
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                    <Bar dataKey="value" fill="hsl(var(--destructive))" radius={[0, 4, 4, 0]} name={bn ? 'খরচ (৳)' : 'Expense (৳)'} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        );
      })()}

      {aiReport && (
        <div className="bg-card rounded-2xl border-2 border-primary/20 p-5 animate-fade-in">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-primary" />
            {bn ? '🧠 AI আর্থিক বিশ্লেষণ' : '🧠 AI Financial Analysis'}
          </h2>
          <div className="prose prose-sm max-w-none text-foreground">
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{aiReport}</p>
          </div>
        </div>
      )}

      {/* Transactions List */}
      <div className="bg-card rounded-2xl border border-border animate-fade-in" style={{ animationDelay: '200ms' }}>
        <div className="p-5 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">{bn ? 'লেনদেন তালিকা' : 'Transaction List'}</h2>
        </div>
        {!transactions || transactions.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <span className="text-4xl block mb-3">📊</span>
            {bn ? 'কোনো লেনদেন নেই' : 'No transactions yet'}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {transactions.map(tx => (
              <div key={tx.id} className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", tx.type === 'revenue' ? 'bg-success/10' : 'bg-destructive/10')}>
                  <span className="text-lg">{tx.type === 'revenue' ? '💵' : '💸'}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground">
                    {bn ? categoryLabels[tx.category]?.bn : categoryLabels[tx.category]?.en || tx.category}
                  </p>
                  {tx.description && <p className="text-sm text-muted-foreground truncate">{tx.description}</p>}
                  <p className="text-xs text-muted-foreground">{new Date(tx.transaction_date).toLocaleDateString(bn ? 'bn-BD' : 'en-US')}</p>
                </div>
                <p className={cn("font-semibold", tx.type === 'revenue' ? 'text-success' : 'text-destructive')}>
                  {tx.type === 'revenue' ? '+' : '-'}৳{Number(tx.amount).toLocaleString()}
                </p>
                <button onClick={async () => { await deleteTx.mutateAsync(tx.id); toast.success(bn ? 'মুছে ফেলা হয়েছে' : 'Deleted'); }} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {farm && <AddTransactionDialog open={showAdd} onOpenChange={setShowAdd} farmId={farm.id} />}
    </div>
  );
}

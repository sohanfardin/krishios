import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAddTransaction } from '@/hooks/useFinance';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  farmId: string;
}

const revenueCategories = [
  { value: 'crop_sales', bn: 'ফসল বিক্রি', en: 'Crop Sales' },
  { value: 'milk_sales', bn: 'দুধ বিক্রি', en: 'Milk Sales' },
  { value: 'egg_sales', bn: 'ডিম বিক্রি', en: 'Egg Sales' },
  { value: 'meat_sales', bn: 'মাংস বিক্রি', en: 'Meat Sales' },
  { value: 'other_revenue', bn: 'অন্যান্য আয়', en: 'Other Revenue' },
];

const expenseCategories = [
  { value: 'fertilizer', bn: 'সার', en: 'Fertilizer' },
  { value: 'feed', bn: 'পশু খাদ্য', en: 'Animal Feed' },
  { value: 'medicine', bn: 'ওষুধ', en: 'Medicine' },
  { value: 'labor', bn: 'শ্রমিক', en: 'Labor' },
  { value: 'irrigation', bn: 'সেচ', en: 'Irrigation' },
  { value: 'seeds', bn: 'বীজ', en: 'Seeds' },
  { value: 'transport', bn: 'পরিবহন', en: 'Transport' },
  { value: 'equipment', bn: 'সরঞ্জাম', en: 'Equipment' },
  { value: 'other_expense', bn: 'অন্যান্য খরচ', en: 'Other Expense' },
];

export function AddTransactionDialog({ open, onOpenChange, farmId }: Props) {
  const { language } = useLanguage();
  const addTx = useAddTransaction();
  const [type, setType] = useState<'revenue' | 'expense'>('revenue');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const bn = language === 'bn';
  const categories = type === 'revenue' ? revenueCategories : expenseCategories;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !category) return;
    try {
      await addTx.mutateAsync({
        farm_id: farmId,
        type,
        amount: parseFloat(amount),
        category,
        description: description || null,
        transaction_date: date,
      });
      toast.success(bn ? 'লেনদেন যোগ হয়েছে!' : 'Transaction added!');
      onOpenChange(false);
      setAmount(''); setCategory(''); setDescription('');
    } catch {
      toast.error(bn ? 'ত্রুটি হয়েছে' : 'Error occurred');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">💰 {bn ? 'লেনদেন যোগ করুন' : 'Add Transaction'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <button type="button" onClick={() => { setType('revenue'); setCategory(''); }} className={`flex-1 py-2 rounded-xl font-medium transition-colors ${type === 'revenue' ? 'bg-success text-success-foreground' : 'bg-muted text-muted-foreground'}`}>
              {bn ? '💵 আয়' : '💵 Revenue'}
            </button>
            <button type="button" onClick={() => { setType('expense'); setCategory(''); }} className={`flex-1 py-2 rounded-xl font-medium transition-colors ${type === 'expense' ? 'bg-destructive text-destructive-foreground' : 'bg-muted text-muted-foreground'}`}>
              {bn ? '💸 খরচ' : '💸 Expense'}
            </button>
          </div>
          <div>
            <Label>{bn ? 'পরিমাণ (৳)' : 'Amount (৳)'} *</Label>
            <Input type="number" step="0.01" min="0" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" required />
          </div>
          <div>
            <Label>{bn ? 'বিভাগ' : 'Category'} *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue placeholder={bn ? 'নির্বাচন করুন' : 'Select'} /></SelectTrigger>
              <SelectContent>
                {categories.map(c => (
                  <SelectItem key={c.value} value={c.value}>{bn ? c.bn : c.en}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{bn ? 'তারিখ' : 'Date'}</Label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div>
            <Label>{bn ? 'বিবরণ' : 'Description'}</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder={bn ? 'ঐচ্ছিক বিবরণ...' : 'Optional description...'} rows={2} />
          </div>
          <button type="submit" disabled={addTx.isPending} className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50">
            {addTx.isPending ? (bn ? 'যোগ হচ্ছে...' : 'Adding...') : (bn ? 'লেনদেন যোগ করুন' : 'Add Transaction')}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

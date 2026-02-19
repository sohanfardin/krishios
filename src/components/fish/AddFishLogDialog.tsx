import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAddFishProductionLog, type FishPond } from '@/hooks/useFishPonds';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  farmId: string;
  ponds: FishPond[];
}

export function AddFishLogDialog({ open, onOpenChange, farmId, ponds }: Props) {
  const { language } = useLanguage();
  const addLog = useAddFishProductionLog();
  const bn = language === 'bn';

  const [pondId, setPondId] = useState('');
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
  const [avgWeight, setAvgWeight] = useState('');
  const [mortalityCount, setMortalityCount] = useState('');
  const [feedAmountKg, setFeedAmountKg] = useState('');
  const [feedCost, setFeedCost] = useState('');
  const [medicineCost, setMedicineCost] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addLog.mutateAsync({
        farm_id: farmId,
        pond_id: pondId || null,
        log_date: logDate,
        avg_weight_g: parseFloat(avgWeight) || 0,
        mortality_count: parseInt(mortalityCount) || 0,
        feed_amount_kg: parseFloat(feedAmountKg) || 0,
        feed_cost: parseFloat(feedCost) || 0,
        medicine_cost: parseFloat(medicineCost) || 0,
        notes: notes || null,
      });
      toast.success(bn ? '📊 লগ যোগ হয়েছে!' : '📊 Log added!');
      onOpenChange(false);
    } catch {
      toast.error(bn ? 'ত্রুটি' : 'Error');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>📊 {bn ? 'দৈনিক লগ যোগ করুন' : 'Add Daily Log'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{bn ? 'পুকুর' : 'Pond'}</Label>
              <Select value={pondId} onValueChange={setPondId}>
                <SelectTrigger><SelectValue placeholder={bn ? 'নির্বাচন' : 'Select'} /></SelectTrigger>
                <SelectContent>
                  {ponds.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {bn ? `পুকুর #${p.pond_number}` : `Pond #${p.pond_number}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{bn ? 'তারিখ' : 'Date'}</Label>
              <Input type="date" value={logDate} onChange={e => setLogDate(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{bn ? 'গড় ওজন (গ্রাম)' : 'Avg Weight (g)'}</Label>
              <Input type="number" step="0.1" value={avgWeight} onChange={e => setAvgWeight(e.target.value)} placeholder="350" />
            </div>
            <div>
              <Label>{bn ? 'মৃত্যু সংখ্যা' : 'Mortality'}</Label>
              <Input type="number" value={mortalityCount} onChange={e => setMortalityCount(e.target.value)} placeholder="0" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{bn ? 'খাদ্য (কেজি)' : 'Feed (kg)'}</Label>
              <Input type="number" step="0.1" value={feedAmountKg} onChange={e => setFeedAmountKg(e.target.value)} />
            </div>
            <div>
              <Label>{bn ? 'খাদ্য খরচ (৳)' : 'Feed Cost (৳)'}</Label>
              <Input type="number" step="0.01" value={feedCost} onChange={e => setFeedCost(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>{bn ? 'ওষুধ খরচ (৳)' : 'Medicine Cost (৳)'}</Label>
            <Input type="number" step="0.01" value={medicineCost} onChange={e => setMedicineCost(e.target.value)} placeholder="0" />
          </div>
          <div>
            <Label>{bn ? 'নোট' : 'Notes'}</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder={bn ? 'পানির রং, মাছের আচরণ...' : 'Water color, fish behavior...'} rows={2} />
          </div>
          <button type="submit" disabled={addLog.isPending} className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50">
            {addLog.isPending ? (bn ? 'যোগ হচ্ছে...' : 'Adding...') : (bn ? '📊 লগ সংরক্ষণ করুন' : '📊 Save Log')}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

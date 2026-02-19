import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useAddFishPond } from '@/hooks/useFishPonds';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { triggerInstantAI } from '@/hooks/useInstantAI';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  farmId: string;
  existingPondCount: number;
}

const FISH_SPECIES = [
  { value: 'রুই', labelBn: 'রুই', labelEn: 'Rohu' },
  { value: 'কাতলা', labelBn: 'কাতলা', labelEn: 'Catla' },
  { value: 'মৃগেল', labelBn: 'মৃগেল', labelEn: 'Mrigal' },
  { value: 'তেলাপিয়া', labelBn: 'তেলাপিয়া', labelEn: 'Tilapia' },
  { value: 'পাঙ্গাস', labelBn: 'পাঙ্গাস', labelEn: 'Pangasius' },
  { value: 'মিক্স', labelBn: 'মিক্স', labelEn: 'Mixed' },
];

export function AddPondDialog({ open, onOpenChange, farmId, existingPondCount }: Props) {
  const { language } = useLanguage();
  const addPond = useAddFishPond();
  const bn = language === 'bn';

  const [areaDecimal, setAreaDecimal] = useState('');
  const [depthFeet, setDepthFeet] = useState('');
  const [waterSource, setWaterSource] = useState('');
  const [selectedSpecies, setSelectedSpecies] = useState<string[]>([]);
  const [stockingDate, setStockingDate] = useState('');
  const [fingerlingCount, setFingerlingCount] = useState('');
  const [fingerlingCost, setFingerlingCost] = useState('');
  const [dailyFeedAmount, setDailyFeedAmount] = useState('');
  const [feedCost, setFeedCost] = useState('');
  const [currentAvgWeight, setCurrentAvgWeight] = useState('');
  const [expectedSaleDate, setExpectedSaleDate] = useState('');

  const toggleSpecies = (sp: string) => {
    setSelectedSpecies(prev =>
      prev.includes(sp) ? prev.filter(s => s !== sp) : [...prev, sp]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!areaDecimal) {
      toast.error(bn ? 'পুকুরের আয়তন দিন' : 'Enter pond area');
      return;
    }
    try {
      await addPond.mutateAsync({
        farm_id: farmId,
        pond_number: existingPondCount + 1,
        area_decimal: parseFloat(areaDecimal) || 0,
        depth_feet: depthFeet ? parseFloat(depthFeet) : null,
        water_source: waterSource || null,
        fish_species: selectedSpecies,
        stocking_date: stockingDate || null,
        fingerling_count: parseInt(fingerlingCount) || 0,
        fingerling_cost: parseFloat(fingerlingCost) || 0,
        daily_feed_amount: parseFloat(dailyFeedAmount) || 0,
        feed_cost: parseFloat(feedCost) || 0,
        current_avg_weight_g: parseFloat(currentAvgWeight) || 0,
        expected_sale_date: expectedSaleDate || null,
      });
      toast.success(bn ? '🐟 পুকুর যোগ হয়েছে!' : '🐟 Pond added!');
      onOpenChange(false);
      resetForm();
      triggerInstantAI({ farmId, type: 'livestock_added', language });
    } catch {
      toast.error(bn ? 'ত্রুটি হয়েছে' : 'Error occurred');
    }
  };

  const resetForm = () => {
    setAreaDecimal(''); setDepthFeet(''); setWaterSource('');
    setSelectedSpecies([]); setStockingDate(''); setFingerlingCount('');
    setFingerlingCost(''); setDailyFeedAmount(''); setFeedCost('');
    setCurrentAvgWeight(''); setExpectedSaleDate('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">🐟 {bn ? 'পুকুর যোগ করুন' : 'Add Pond'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Pond Profile */}
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {bn ? '📋 পুকুরের তথ্য' : '📋 Pond Profile'}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{bn ? 'আয়তন (শতাংশ/ডেসিমেল)' : 'Area (Decimal)'} *</Label>
              <Input type="number" step="0.1" value={areaDecimal} onChange={e => setAreaDecimal(e.target.value)} placeholder="33" required />
            </div>
            <div>
              <Label>{bn ? 'গভীরতা (ফুট)' : 'Depth (ft)'}</Label>
              <Input type="number" step="0.5" value={depthFeet} onChange={e => setDepthFeet(e.target.value)} placeholder="5" />
            </div>
          </div>
          <div>
            <Label>{bn ? 'পানির উৎস' : 'Water Source'}</Label>
            <Select value={waterSource} onValueChange={setWaterSource}>
              <SelectTrigger><SelectValue placeholder={bn ? 'নির্বাচন করুন' : 'Select'} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="বৃষ্টি">{bn ? '🌧️ বৃষ্টি' : '🌧️ Rain'}</SelectItem>
                <SelectItem value="টিউবওয়েল">{bn ? '🚰 টিউবওয়েল' : '🚰 Tubewell'}</SelectItem>
                <SelectItem value="খাল">{bn ? '🏞️ খাল/নদী' : '🏞️ Canal/River'}</SelectItem>
                <SelectItem value="মিশ্র">{bn ? '🔄 মিশ্র' : '🔄 Mixed'}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Fish Species */}
          <div>
            <Label>{bn ? 'মাছের প্রজাতি' : 'Fish Species'}</Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {FISH_SPECIES.map(sp => (
                <label key={sp.value} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors">
                  <Checkbox
                    checked={selectedSpecies.includes(sp.value)}
                    onCheckedChange={() => toggleSpecies(sp.value)}
                  />
                  <span className="text-sm">{bn ? sp.labelBn : sp.labelEn}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Production Data */}
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-2">
            {bn ? '🐟 উৎপাদন তথ্য' : '🐟 Production Data'}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{bn ? 'মাছ ছাড়ার তারিখ' : 'Stocking Date'}</Label>
              <Input type="date" value={stockingDate} onChange={e => setStockingDate(e.target.value)} />
            </div>
            <div>
              <Label>{bn ? 'মোট পোনা সংখ্যা' : 'Fingerling Count'}</Label>
              <Input type="number" value={fingerlingCount} onChange={e => setFingerlingCount(e.target.value)} placeholder="500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{bn ? 'পোনার দাম (৳)' : 'Fingerling Cost (৳)'}</Label>
              <Input type="number" step="0.01" value={fingerlingCost} onChange={e => setFingerlingCost(e.target.value)} placeholder="5000" />
            </div>
            <div>
              <Label>{bn ? 'বর্তমান গড় ওজন (গ্রাম)' : 'Avg Weight (g)'}</Label>
              <Input type="number" step="0.1" value={currentAvgWeight} onChange={e => setCurrentAvgWeight(e.target.value)} placeholder="200" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{bn ? 'দৈনিক খাদ্য (কেজি)' : 'Daily Feed (kg)'}</Label>
              <Input type="number" step="0.1" value={dailyFeedAmount} onChange={e => setDailyFeedAmount(e.target.value)} placeholder="5" />
            </div>
            <div>
              <Label>{bn ? 'খাদ্য খরচ (৳/দিন)' : 'Feed Cost (৳/day)'}</Label>
              <Input type="number" step="0.01" value={feedCost} onChange={e => setFeedCost(e.target.value)} placeholder="500" />
            </div>
          </div>
          <div>
            <Label>{bn ? 'সম্ভাব্য বিক্রয় তারিখ' : 'Expected Sale Date'}</Label>
            <Input type="date" value={expectedSaleDate} onChange={e => setExpectedSaleDate(e.target.value)} />
          </div>

          <button type="submit" disabled={addPond.isPending} className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50">
            {addPond.isPending ? (bn ? 'যোগ হচ্ছে...' : 'Adding...') : (bn ? '🐟 পুকুর যোগ করুন' : '🐟 Add Pond')}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

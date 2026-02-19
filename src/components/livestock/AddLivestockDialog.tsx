import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAddLivestock } from '@/hooks/useLivestock';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { triggerInstantAI } from '@/hooks/useInstantAI';
import { PhotoUpload } from '@/components/shared/PhotoUpload';
import { AISuggestionsPanel } from '@/components/shared/AISuggestionsPanel';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  farmId: string;
}

export function AddLivestockDialog({ open, onOpenChange, farmId }: Props) {
  const { language } = useLanguage();
  const addLivestock = useAddLivestock();
  const bn = language === 'bn';

  const [animalType, setAnimalType] = useState('chicken');
  const [breed, setBreed] = useState('');
  const [count, setCount] = useState('1');
  const [ageGroup, setAgeGroup] = useState('');
  const [feedCost, setFeedCost] = useState('');
  const [medicineCost, setMedicineCost] = useState('');
  const [dailyProductionAmount, setDailyProductionAmount] = useState('');
  const [dailyProductionUnit, setDailyProductionUnit] = useState('');
  const [lastIllnessDate, setLastIllnessDate] = useState('');
  const [vaccinationStatus, setVaccinationStatus] = useState('');
  const [photoPath, setPhotoPath] = useState('');
  const [aiDiagnosis, setAiDiagnosis] = useState<any>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [addedAnimalType, setAddedAnimalType] = useState('');
  const [addedBreed, setAddedBreed] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addLivestock.mutateAsync({
        farm_id: farmId,
        animal_type: animalType,
        breed: breed || null,
        count: parseInt(count) || 1,
        age_group: ageGroup || null,
        feed_cost: feedCost ? parseFloat(feedCost) : 0,
        vaccination_history: vaccinationStatus ? [{ status: vaccinationStatus, date: new Date().toISOString() }] : [],
        production_data: dailyProductionAmount ? { amount: parseFloat(dailyProductionAmount), unit: dailyProductionUnit || 'unit' } : {},
        // @ts-ignore - new columns
        medicine_cost: medicineCost ? parseFloat(medicineCost) : 0,
        daily_production_amount: dailyProductionAmount ? parseFloat(dailyProductionAmount) : 0,
        daily_production_unit: dailyProductionUnit || null,
        last_illness_date: lastIllnessDate || null,
      });
      toast.success(bn ? 'পশু যোগ হয়েছে!' : 'Livestock added!');
      setAddedAnimalType(animalType);
      setAddedBreed(breed);
      setShowSuggestions(true);
      resetForm();
      // Trigger AI instant suggestions
      triggerInstantAI({ farmId, type: 'livestock_added', language });
    } catch {
      toast.error(bn ? 'ত্রুটি হয়েছে' : 'Error occurred');
    }
  };

  const resetForm = () => {
    setBreed(''); setCount('1'); setAgeGroup(''); setFeedCost('');
    setMedicineCost(''); setDailyProductionAmount(''); setDailyProductionUnit('');
    setLastIllnessDate(''); setVaccinationStatus('');
    setPhotoPath(''); setAiDiagnosis(null);
  };

   const productionLabel = () => {
     if (animalType === 'গরু' || animalType === 'মহিষ' || animalType === 'ছাগল') return { bn: 'দৈনিক দুধ (লিটার)', en: 'Daily Milk (L)', unit: 'liter' };
     if (animalType === 'মুরগি' || animalType === 'হাঁস' || animalType === 'কবুতর' || animalType === 'কোয়েল') return { bn: 'দৈনিক ডিম (টি)', en: 'Daily Eggs', unit: 'piece' };
     if (animalType === 'মৌমাছি') return { bn: 'মাসিক মধু (কেজি)', en: 'Monthly Honey (kg)', unit: 'kg' };
     if (animalType === 'মাছ' || animalType === 'চিংড়ি') return { bn: 'দৈনিক উৎপাদন (কেজি)', en: 'Daily Production (kg)', unit: 'kg' };
     return { bn: 'দৈনিক উৎপাদন', en: 'Daily Production', unit: 'unit' };
   };

  const prodInfo = productionLabel();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">🐄 {bn ? 'পশু যোগ করুন' : 'Add Livestock'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic */}
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{bn ? '📋 মৌলিক তথ্য' : '📋 Basic Info'}</p>
           <div>
             <Label>{bn ? 'পশুর ধরন' : 'Animal Type'} *</Label>
             <Select value={animalType} onValueChange={v => { setAnimalType(v); setDailyProductionUnit(productionLabel().unit); }}>
               <SelectTrigger><SelectValue /></SelectTrigger>
               <SelectContent>
                 <SelectItem value="গরু">{bn ? 'গরু 🐄' : 'Cow 🐄'}</SelectItem>
                 <SelectItem value="মহিষ">{bn ? 'মহিষ 🐃' : 'Buffalo 🐃'}</SelectItem>
                 <SelectItem value="ছাগল">{bn ? 'ছাগল 🐐' : 'Goat 🐐'}</SelectItem>
                 <SelectItem value="ভেড়া">{bn ? 'ভেড়া 🐑' : 'Sheep 🐑'}</SelectItem>
                 <SelectItem value="মুরগি">{bn ? 'মুরগি 🐔' : 'Chicken 🐔'}</SelectItem>
                 <SelectItem value="হাঁস">{bn ? 'হাঁস 🦆' : 'Duck 🦆'}</SelectItem>
                 <SelectItem value="কবুতর">{bn ? 'কবুতর 🕊️' : 'Pigeon 🕊️'}</SelectItem>
                 <SelectItem value="কোয়েল">{bn ? 'কোয়েল 🐦' : 'Quail 🐦'}</SelectItem>
                 <SelectItem value="তিতির">{bn ? 'তিতির 🦃' : 'Turkey 🦃'}</SelectItem>
                 <SelectItem value="মাছ">{bn ? 'মাছ 🐟' : 'Fish 🐟'}</SelectItem>
                 <SelectItem value="চিংড়ি">{bn ? 'চিংড়ি 🦐' : 'Shrimp 🦐'}</SelectItem>
                 <SelectItem value="মৌমাছি">{bn ? 'মৌমাছি 🐝' : 'Honeybee 🐝'}</SelectItem>
               </SelectContent>
             </Select>
           </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{bn ? 'জাত' : 'Breed'}</Label>
              <Input value={breed} onChange={e => setBreed(e.target.value)} placeholder={bn ? 'যেমন: দেশি, সোনালি' : 'e.g. Local, Sonali'} />
            </div>
            <div>
              <Label>{bn ? 'সংখ্যা' : 'Count'} *</Label>
              <Input type="number" min="1" value={count} onChange={e => setCount(e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{bn ? 'বয়স দল' : 'Age Group'}</Label>
              <Select value={ageGroup} onValueChange={setAgeGroup}>
                <SelectTrigger><SelectValue placeholder={bn ? 'নির্বাচন করুন' : 'Select'} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="young">{bn ? 'বাচ্চা (০-৬ মাস)' : 'Young (0-6 mo)'}</SelectItem>
                  <SelectItem value="adult">{bn ? 'প্রাপ্তবয়স্ক' : 'Adult'}</SelectItem>
                  <SelectItem value="old">{bn ? 'বৃদ্ধ' : 'Old'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{bn ? 'টিকাদান' : 'Vaccination'}</Label>
              <Select value={vaccinationStatus} onValueChange={setVaccinationStatus}>
                <SelectTrigger><SelectValue placeholder={bn ? 'নির্বাচন করুন' : 'Select'} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="up_to_date">{bn ? 'হালনাগাদ ✅' : 'Up to date ✅'}</SelectItem>
                  <SelectItem value="partial">{bn ? 'আংশিক ⚠️' : 'Partial ⚠️'}</SelectItem>
                  <SelectItem value="none">{bn ? 'দেওয়া হয়নি ❌' : 'None ❌'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Production */}
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-2">{bn ? '📊 উৎপাদন ও খরচ' : '📊 Production & Cost'}</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{bn ? prodInfo.bn : prodInfo.en}</Label>
              <Input type="number" step="0.1" value={dailyProductionAmount} onChange={e => setDailyProductionAmount(e.target.value)} placeholder="0" />
            </div>
            <div>
              <Label>{bn ? 'খাদ্য খরচ (৳/মাস)' : 'Feed Cost (৳/mo)'}</Label>
              <Input type="number" step="0.01" value={feedCost} onChange={e => setFeedCost(e.target.value)} placeholder="0" />
            </div>
          </div>
          <div>
            <Label>{bn ? 'ওষুধ খরচ (৳/মাস)' : 'Medicine Cost (৳/mo)'}</Label>
            <Input type="number" step="0.01" value={medicineCost} onChange={e => setMedicineCost(e.target.value)} placeholder="0" />
          </div>

          {/* Health */}
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-2">{bn ? '🩺 স্বাস্থ্য' : '🩺 Health'}</p>
          <div>
            <Label>{bn ? 'শেষ অসুস্থতার তারিখ' : 'Last Illness Date'}</Label>
            <Input type="date" value={lastIllnessDate} onChange={e => setLastIllnessDate(e.target.value)} />
          </div>

          {/* Photo Upload */}
          <PhotoUpload
            bucket="livestock-images"
            farmId={farmId}
            analyzeType="livestock"
            onUpload={setPhotoPath}
            onAIResult={setAiDiagnosis}
          />

          <button type="submit" disabled={addLivestock.isPending || showSuggestions} className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50">
            {addLivestock.isPending ? (bn ? 'যোগ হচ্ছে...' : 'Adding...') : (bn ? '🐄 পশু যোগ করুন' : '🐄 Add Livestock')}
          </button>
        </form>

        <AISuggestionsPanel
          itemType="livestock"
          itemName={addedAnimalType}
          animalType={addedAnimalType}
          breed={addedBreed}
          visible={showSuggestions}
          onClose={() => { setShowSuggestions(false); onOpenChange(false); }}
        />
      </DialogContent>
    </Dialog>
  );
}

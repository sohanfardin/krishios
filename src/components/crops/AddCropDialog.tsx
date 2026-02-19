import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAddCrop } from '@/hooks/useCrops';
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

export function AddCropDialog({ open, onOpenChange, farmId }: Props) {
  const { language } = useLanguage();
  const addCrop = useAddCrop();
  const [name, setName] = useState('');
  const [variety, setVariety] = useState('');
  const [landSize, setLandSize] = useState('');
  const [landUnit, setLandUnit] = useState('bigha');
  const [plantingDate, setPlantingDate] = useState('');
  const [growthStage, setGrowthStage] = useState('seedling');
  const [irrigationMethod, setIrrigationMethod] = useState('');
  const [estimatedHarvest, setEstimatedHarvest] = useState('');
  const [fertilizerUsage, setFertilizerUsage] = useState('');
  const [lastIrrigationDate, setLastIrrigationDate] = useState('');
  const [lastFertilizerDate, setLastFertilizerDate] = useState('');
  const [soilType, setSoilType] = useState('');
  const [photoPath, setPhotoPath] = useState('');
  const [aiDiagnosis, setAiDiagnosis] = useState<any>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [addedCropName, setAddedCropName] = useState('');
  const [addedGrowthStage, setAddedGrowthStage] = useState('');
  const [addedSoilType, setAddedSoilType] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await addCrop.mutateAsync({
        farm_id: farmId,
        name,
        variety: variety || null,
        land_size: landSize ? parseFloat(landSize) : null,
        land_unit: landUnit,
        planting_date: plantingDate || null,
        growth_stage: growthStage,
        irrigation_method: irrigationMethod || null,
        estimated_harvest: estimatedHarvest || null,
        fertilizer_usage: fertilizerUsage || null,
        // @ts-ignore - new columns added via migration
        last_irrigation_date: lastIrrigationDate || null,
        last_fertilizer_date: lastFertilizerDate || null,
        soil_type: soilType || null,
      });
      toast.success(bn ? 'ফসল যোগ হয়েছে!' : 'Crop added!');
      setAddedCropName(name);
      setAddedGrowthStage(growthStage);
      setAddedSoilType(soilType);
      setShowSuggestions(true);
      resetForm();
      // Trigger AI instant suggestions
      triggerInstantAI({ farmId, type: 'crop_added', language });
    } catch {
      toast.error(bn ? 'ত্রুটি হয়েছে' : 'Error occurred');
    }
  };

  const resetForm = () => {
    setName(''); setVariety(''); setLandSize(''); setPlantingDate('');
    setEstimatedHarvest(''); setFertilizerUsage(''); setLastIrrigationDate('');
    setLastFertilizerDate(''); setSoilType(''); setIrrigationMethod('');
    setPhotoPath(''); setAiDiagnosis(null);
  };

  const bn = language === 'bn';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">🌾 {bn ? 'নতুন ফসল যোগ করুন' : 'Add New Crop'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Section: Basic Info */}
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{bn ? '📋 মৌলিক তথ্য' : '📋 Basic Info'}</p>
          </div>
          <div>
              <Label>{bn ? 'ফসলের নাম' : 'Crop Name'} *</Label>
              <Select value={name} onValueChange={setName}>
                <SelectTrigger><SelectValue placeholder={bn ? 'ফসল নির্বাচন করুন' : 'Select crop'} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ধান">{bn ? 'ধান 🌾' : 'Rice 🌾'}</SelectItem>
                  <SelectItem value="গম">{bn ? 'গম 🌿' : 'Wheat 🌿'}</SelectItem>
                  <SelectItem value="ভুট্টা">{bn ? 'ভুট্টা 🌽' : 'Corn 🌽'}</SelectItem>
                  <SelectItem value="পাট">{bn ? 'পাট 🧵' : 'Jute 🧵'}</SelectItem>
                  <SelectItem value="সরিষা">{bn ? 'সরিষা 🌻' : 'Mustard 🌻'}</SelectItem>
                  <SelectItem value="আলু">{bn ? 'আলু 🥔' : 'Potato 🥔'}</SelectItem>
                  <SelectItem value="পেঁয়াজ">{bn ? 'পেঁয়াজ 🧅' : 'Onion 🧅'}</SelectItem>
                  <SelectItem value="রসুন">{bn ? 'রসুন 🧄' : 'Garlic 🧄'}</SelectItem>
                  <SelectItem value="মরিচ">{bn ? 'মরিচ 🌶️' : 'Chili 🌶️'}</SelectItem>
                  <SelectItem value="টমেটো">{bn ? 'টমেটো 🍅' : 'Tomato 🍅'}</SelectItem>
                  <SelectItem value="বেগুন">{bn ? 'বেগুন 🍆' : 'Eggplant 🍆'}</SelectItem>
                  <SelectItem value="লাউ">{bn ? 'লাউ 🫛' : 'Gourd 🫛'}</SelectItem>
                  <SelectItem value="কুমড়া">{bn ? 'কুমড়া 🎃' : 'Pumpkin 🎃'}</SelectItem>
                  <SelectItem value="শসা">{bn ? 'শসা 🥒' : 'Cucumber 🥒'}</SelectItem>
                  <SelectItem value="মুলা">{bn ? 'মুলা 🥕' : 'Radish 🥕'}</SelectItem>
                  <SelectItem value="ফুলকপি">{bn ? 'ফুলকপি 🥦' : 'Cauliflower 🥦'}</SelectItem>
                  <SelectItem value="বাঁধাকপি">{bn ? 'বাঁধাকপি 🥬' : 'Cabbage 🥬'}</SelectItem>
                  <SelectItem value="পালংশাক">{bn ? 'পালংশাক 🥬' : 'Spinach 🥬'}</SelectItem>
                  <SelectItem value="মসুর ডাল">{bn ? 'মসুর ডাল 🫘' : 'Lentil 🫘'}</SelectItem>
                  <SelectItem value="ছোলা">{bn ? 'ছোলা 🫘' : 'Chickpea 🫘'}</SelectItem>
                  <SelectItem value="আম">{bn ? 'আম 🥭' : 'Mango 🥭'}</SelectItem>
                  <SelectItem value="লিচু">{bn ? 'লিচু 🍒' : 'Lychee 🍒'}</SelectItem>
                  <SelectItem value="কলা">{bn ? 'কলা 🍌' : 'Banana 🍌'}</SelectItem>
                  <SelectItem value="পেয়ারা">{bn ? 'পেয়ারা 🍈' : 'Guava 🍈'}</SelectItem>
                  <SelectItem value="তরমুজ">{bn ? 'তরমুজ 🍉' : 'Watermelon 🍉'}</SelectItem>
                  <SelectItem value="আখ">{bn ? 'আখ 🎋' : 'Sugarcane 🎋'}</SelectItem>
                  <SelectItem value="চা">{bn ? 'চা 🍵' : 'Tea 🍵'}</SelectItem>
                  <SelectItem value="অন্যান্য">{bn ? 'অন্যান্য ✏️' : 'Other ✏️'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{bn ? 'জমির আয়তন' : 'Land Size'}</Label>
              <Input type="number" step="0.1" value={landSize} onChange={e => setLandSize(e.target.value)} placeholder="0.0" />
            </div>
            <div>
              <Label>{bn ? 'একক' : 'Unit'}</Label>
              <Select value={landUnit} onValueChange={setLandUnit}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bigha">{bn ? 'বিঘা' : 'Bigha'}</SelectItem>
                  <SelectItem value="hectare">{bn ? 'হেক্টর' : 'Hectare'}</SelectItem>
                  <SelectItem value="acre">{bn ? 'একর' : 'Acre'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{bn ? 'রোপণের তারিখ' : 'Planting Date'}</Label>
              <Input type="date" value={plantingDate} onChange={e => setPlantingDate(e.target.value)} />
            </div>
            <div>
              <Label>{bn ? 'আনুমানিক ফসল তোলা' : 'Est. Harvest'}</Label>
              <Input type="date" value={estimatedHarvest} onChange={e => setEstimatedHarvest(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{bn ? 'বৃদ্ধি পর্যায়' : 'Growth Stage'}</Label>
              <Select value={growthStage} onValueChange={setGrowthStage}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="seedling">{bn ? 'চারা 🌱' : 'Seedling 🌱'}</SelectItem>
                  <SelectItem value="growing">{bn ? 'বৃদ্ধি 🌿' : 'Growing 🌿'}</SelectItem>
                  <SelectItem value="flowering">{bn ? 'ফুল ফোটা 🌸' : 'Flowering 🌸'}</SelectItem>
                  <SelectItem value="fruiting">{bn ? 'ফল ধরা 🍎' : 'Fruiting 🍎'}</SelectItem>
                  <SelectItem value="harvesting">{bn ? 'ফসল তোলা 🌾' : 'Harvesting 🌾'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{bn ? 'মাটির ধরন' : 'Soil Type'}</Label>
              <Select value={soilType} onValueChange={setSoilType}>
                <SelectTrigger><SelectValue placeholder={bn ? 'নির্বাচন করুন' : 'Select'} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="doash">{bn ? 'দোঁআশ' : 'Loamy'}</SelectItem>
                  <SelectItem value="etel">{bn ? 'এঁটেল' : 'Clay'}</SelectItem>
                  <SelectItem value="bele">{bn ? 'বেলে' : 'Sandy'}</SelectItem>
                  <SelectItem value="peat">{bn ? 'পিট' : 'Peat'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Section: Farming Methods */}
          <div className="space-y-1 pt-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{bn ? '🚿 কৃষি পদ্ধতি' : '🚿 Farming Methods'}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{bn ? 'সেচ পদ্ধতি' : 'Irrigation Method'}</Label>
              <Select value={irrigationMethod} onValueChange={setIrrigationMethod}>
                <SelectTrigger><SelectValue placeholder={bn ? 'নির্বাচন করুন' : 'Select'} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="drip">{bn ? 'ড্রিপ সেচ' : 'Drip'}</SelectItem>
                  <SelectItem value="manual">{bn ? 'ম্যানুয়াল' : 'Manual'}</SelectItem>
                  <SelectItem value="rain">{bn ? 'বৃষ্টি নির্ভর' : 'Rain-fed'}</SelectItem>
                  <SelectItem value="canal">{bn ? 'সেচ নল/খাল' : 'Canal'}</SelectItem>
                  <SelectItem value="pump">{bn ? 'পাম্প' : 'Pump'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{bn ? 'শেষ সেচের তারিখ' : 'Last Irrigation'}</Label>
              <Input type="date" value={lastIrrigationDate} onChange={e => setLastIrrigationDate(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{bn ? 'ব্যবহৃত সার' : 'Fertilizer Used'}</Label>
              <Input value={fertilizerUsage} onChange={e => setFertilizerUsage(e.target.value)} placeholder={bn ? 'যেমন: ইউরিয়া' : 'e.g. Urea'} />
            </div>
            <div>
              <Label>{bn ? 'শেষ সার দেওয়ার তারিখ' : 'Last Fertilizer Date'}</Label>
              <Input type="date" value={lastFertilizerDate} onChange={e => setLastFertilizerDate(e.target.value)} />
            </div>
          </div>

          {/* Section: Photo Upload */}
          <div className="space-y-1 pt-2">
            <PhotoUpload
              bucket="crop-images"
              farmId={farmId}
              analyzeType="crop"
              onUpload={setPhotoPath}
              onAIResult={setAiDiagnosis}
            />
          </div>

          <button type="submit" disabled={addCrop.isPending || !name || showSuggestions} className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50">
            {addCrop.isPending ? (bn ? 'যোগ হচ্ছে...' : 'Adding...') : (bn ? '🌾 ফসল যোগ করুন' : '🌾 Add Crop')}
          </button>
        </form>

        <AISuggestionsPanel
          itemType="crop"
          itemName={addedCropName}
          growthStage={addedGrowthStage}
          soilType={addedSoilType}
          visible={showSuggestions}
          onClose={() => { setShowSuggestions(false); onOpenChange(false); }}
        />
      </DialogContent>
    </Dialog>
  );
}

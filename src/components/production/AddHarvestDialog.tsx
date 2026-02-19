import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAddHarvestRecord } from '@/hooks/useHarvestRecords';
import { useCrops } from '@/hooks/useCrops';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { triggerInstantAI } from '@/hooks/useInstantAI';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  farmId: string;
}

export function AddHarvestDialog({ open, onOpenChange, farmId }: Props) {
  const { language } = useLanguage();
  const bn = language === 'bn';
  const addRecord = useAddHarvestRecord();
  const { data: crops = [] } = useCrops(farmId);

  const [cropName, setCropName] = useState('');
  const [customCropName, setCustomCropName] = useState('');
  const [cropId, setCropId] = useState('');
  const [totalProduction, setTotalProduction] = useState('');
  const [productionUnit, setProductionUnit] = useState('kg');
  const [pricePerUnit, setPricePerUnit] = useState('');

  const handleCropSelect = (value: string) => {
    const crop = crops.find(c => c.id === value);
    if (crop) {
      setCropId(crop.id);
      setCropName(crop.name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalCropName = cropName === 'অন্যান্য' ? customCropName : cropName;
    if (!finalCropName.trim() || !totalProduction || !pricePerUnit) return;
    const totalSalePrice = parseFloat(totalProduction) * parseFloat(pricePerUnit);
    try {
      await addRecord.mutateAsync({
        farm_id: farmId,
        crop_id: cropId || null,
        crop_name: finalCropName,
        land_size: 0,
        land_unit: 'bigha',
        planting_date: null,
        harvest_date: null,
        total_production: parseFloat(totalProduction) || 0,
        production_unit: productionUnit,
        fertilizer_cost: 0,
        labor_cost: 0,
        irrigation_cost: 0,
        medicine_cost: 0,
        total_sale_price: totalSalePrice,
        season: null,
        notes: null,
      });
      toast.success(bn ? '✅ ফসল উৎপাদন তথ্য সংরক্ষিত!' : '✅ Harvest record saved!');
      onOpenChange(false);
      resetForm();
      triggerInstantAI({ farmId, type: 'crop_added', language });
    } catch {
      toast.error(bn ? 'ত্রুটি হয়েছে' : 'Error occurred');
    }
  };

  const resetForm = () => {
    setCropName('');
    setCropId('');
    setTotalProduction('');
    setProductionUnit('kg');
    setPricePerUnit('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">🌾 {bn ? 'ফসল উৎপাদন তথ্য যোগ করুন' : 'Add Harvest Record'}</DialogTitle>
        </DialogHeader>
         <form onSubmit={handleSubmit} className="space-y-4">
            <div>
             <Label>{bn ? 'ফসলের নাম' : 'Crop Name'} *</Label>
             <Select value={cropName} onValueChange={(v) => { setCropName(v); setCropId(''); }}>
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
              {cropName === 'অন্যান্য' && (
                <Input className="mt-2" value={customCropName} onChange={e => setCustomCropName(e.target.value)} placeholder={bn ? 'ফসলের নাম লিখুন' : 'Type crop name'} />
              )}
           </div>
           <div className="grid grid-cols-2 gap-3">
             <div>
               <Label>{bn ? 'মোট উৎপাদন' : 'Total Production'} *</Label>
               <Input type="number" step="0.1" value={totalProduction} onChange={e => setTotalProduction(e.target.value)} placeholder="0" />
             </div>
             <div>
               <Label>{bn ? 'একক' : 'Unit'}</Label>
               <Select value={productionUnit} onValueChange={setProductionUnit}>
                 <SelectTrigger><SelectValue /></SelectTrigger>
                 <SelectContent>
                   <SelectItem value="kg">{bn ? 'কেজি' : 'kg'}</SelectItem>
                   <SelectItem value="mon">{bn ? 'মন' : 'Mon (40kg)'}</SelectItem>
                   <SelectItem value="ton">{bn ? 'টন' : 'Ton'}</SelectItem>
                 </SelectContent>
               </Select>
             </div>
           </div>
           <div>
             <Label>{bn ? 'প্রতি একক বিক্রয় মূল্য (৳)' : 'Price Per Unit (৳)'} *</Label>
             <Input type="number" value={pricePerUnit} onChange={e => setPricePerUnit(e.target.value)} placeholder="0" />
           </div>

           <button type="submit" disabled={addRecord.isPending || !cropName || !totalProduction || !pricePerUnit}
             className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50">
             {addRecord.isPending ? (bn ? 'সংরক্ষণ হচ্ছে...' : 'Saving...') : (bn ? '🌾 উৎপাদন তথ্য সংরক্ষণ' : '🌾 Save Harvest Record')}
           </button>
         </form>
      </DialogContent>
    </Dialog>
  );
}

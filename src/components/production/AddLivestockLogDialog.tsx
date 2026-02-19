import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAddLivestockLog } from '@/hooks/useLivestockLogs';
import { useLivestock } from '@/hooks/useLivestock';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { triggerInstantAI } from '@/hooks/useInstantAI';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  farmId: string;
}

export function AddLivestockLogDialog({ open, onOpenChange, farmId }: Props) {
  const { language } = useLanguage();
  const bn = language === 'bn';
  const addLog = useAddLivestockLog();
  const { data: livestock = [] } = useLivestock(farmId);

  const [animalType, setAnimalType] = useState('');
  const [livestockId, setLivestockId] = useState('');
  const [productionAmount, setProductionAmount] = useState('');
  const [productionUnit, setProductionUnit] = useState('litre');
  const [pricePerUnit, setPricePerUnit] = useState('');

  const handleLivestockSelect = (value: string) => {
    const item = livestock.find(l => l.id === value);
    if (item) {
      setLivestockId(item.id);
      setAnimalType(item.animal_type);
      if (item.daily_production_unit) setProductionUnit(item.daily_production_unit);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!animalType.trim() || !productionAmount || !pricePerUnit) return;
    const salePrice = parseFloat(productionAmount) * parseFloat(pricePerUnit);
    try {
      await addLog.mutateAsync({
        farm_id: farmId,
        livestock_id: livestockId || null,
        animal_type: animalType,
        log_date: new Date().toISOString().split('T')[0],
        production_amount: parseFloat(productionAmount) || 0,
        production_unit: productionUnit,
        feed_cost: 0,
        medicine_cost: 0,
        sale_price: salePrice,
        animal_count: 1,
        notes: null,
      });
      toast.success(bn ? '✅ পশু উৎপাদন তথ্য সংরক্ষিত!' : '✅ Livestock log saved!');
      onOpenChange(false);
      resetForm();
      triggerInstantAI({ farmId, type: 'livestock_added', language });
    } catch {
      toast.error(bn ? 'ত্রুটি হয়েছে' : 'Error occurred');
    }
  };

  const resetForm = () => {
    setAnimalType('');
    setLivestockId('');
    setProductionAmount('');
    setProductionUnit('litre');
    setPricePerUnit('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">🐄 {bn ? 'পশু উৎপাদন তথ্য' : 'Livestock Production Log'}</DialogTitle>
        </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
             <Label>{bn ? 'পশুর ধরন' : 'Animal Type'} *</Label>
             <Select value={animalType} onValueChange={setAnimalType}>
               <SelectTrigger><SelectValue placeholder={bn ? 'নির্বাচন' : 'Select'} /></SelectTrigger>
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
               <Label>{bn ? 'উৎপাদন পরিমাণ' : 'Production Amount'} *</Label>
               <Input type="number" step="0.1" value={productionAmount} onChange={e => setProductionAmount(e.target.value)} placeholder="0" />
             </div>
             <div>
               <Label>{bn ? 'উৎপাদন একক' : 'Production Unit'}</Label>
               <Select value={productionUnit} onValueChange={setProductionUnit}>
                 <SelectTrigger><SelectValue /></SelectTrigger>
                 <SelectContent>
                   <SelectItem value="litre">{bn ? 'লিটার' : 'Litre'}</SelectItem>
                   <SelectItem value="piece">{bn ? 'পিস' : 'Pieces'}</SelectItem>
                   <SelectItem value="kg">{bn ? 'কেজি' : 'kg'}</SelectItem>
                 </SelectContent>
               </Select>
             </div>
           </div>
           <div>
             <Label>{bn ? 'প্রতি একক বিক্রয় মূল্য (৳)' : 'Price Per Unit (৳)'} *</Label>
             <Input type="number" value={pricePerUnit} onChange={e => setPricePerUnit(e.target.value)} placeholder="0" />
           </div>

           <button type="submit" disabled={addLog.isPending || !animalType || !productionAmount || !pricePerUnit}
             className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50">
             {addLog.isPending ? (bn ? 'সংরক্ষণ হচ্ছে...' : 'Saving...') : (bn ? '🐄 উৎপাদন তথ্য সংরক্ষণ' : '🐄 Save Production Log')}
           </button>
         </form>
      </DialogContent>
    </Dialog>
  );
}

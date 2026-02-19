import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateFarm } from '@/hooks/useFarm';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { DISTRICTS, DISTRICTS_UPAZILAS } from '@/data/bangladeshLocations';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateFarmDialog({ open, onOpenChange }: Props) {
  const { language } = useLanguage();
  const createFarm = useCreateFarm();
  const bn = language === 'bn';
  const [name, setName] = useState('');
  const [type, setType] = useState('mixed');
  const [district, setDistrict] = useState('');
  const [upazila, setUpazila] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await createFarm.mutateAsync({ name, type, district: district || undefined, upazila: upazila || undefined });
      toast.success(bn ? 'খামার তৈরি হয়েছে!' : 'Farm created!');
      onOpenChange(false);
    } catch {
      toast.error(bn ? 'ত্রুটি হয়েছে' : 'Error occurred');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            🏡 {bn ? 'আপনার প্রথম খামার তৈরি করুন' : 'Create Your First Farm'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>{bn ? 'খামারের নাম' : 'Farm Name'}</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder={bn ? 'যেমন: আমার খামার' : 'e.g. My Farm'} required />
          </div>
          <div>
            <Label>{bn ? 'খামারের ধরন' : 'Farm Type'}</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="mixed">{bn ? 'মিশ্র' : 'Mixed'}</SelectItem>
                <SelectItem value="crop">{bn ? 'ফসল' : 'Crop'}</SelectItem>
                <SelectItem value="dairy">{bn ? 'দুগ্ধ' : 'Dairy'}</SelectItem>
                <SelectItem value="poultry">{bn ? 'পোল্ট্রি' : 'Poultry'}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{bn ? 'জেলা *' : 'District *'}</Label>
              <Select value={district} onValueChange={(val) => { setDistrict(val); setUpazila(''); }}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder={bn ? 'জেলা নির্বাচন' : 'Select district'} />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {DISTRICTS.map(d => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{bn ? 'উপজেলা *' : 'Upazila *'}</Label>
              <Select value={upazila} onValueChange={setUpazila} disabled={!district}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder={bn ? 'উপজেলা নির্বাচন' : 'Select upazila'} />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {(DISTRICTS_UPAZILAS[district] || []).map(u => (
                    <SelectItem key={u} value={u}>{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <button type="submit" disabled={createFarm.isPending} className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50">
            {createFarm.isPending ? (bn ? 'তৈরি হচ্ছে...' : 'Creating...') : (bn ? 'খামার তৈরি করুন' : 'Create Farm')}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

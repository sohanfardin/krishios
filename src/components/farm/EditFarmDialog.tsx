import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useUpdateFarm } from '@/hooks/useFarm';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { DISTRICTS, DISTRICTS_UPAZILAS } from '@/data/bangladeshLocations';
import { Loader2, MapPin } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  farm: {
    id: string;
    name: string;
    type: string;
    district: string | null;
    upazila: string | null;
  } | null;
}

export function EditFarmDialog({ open, onOpenChange, farm }: Props) {
  const { language } = useLanguage();
  const updateFarm = useUpdateFarm();
  const bn = language === 'bn';

  const [name, setName] = useState('');
  const [type, setType] = useState('mixed');
  const [district, setDistrict] = useState('');
  const [upazila, setUpazila] = useState('');

  useEffect(() => {
    if (farm) {
      setName(farm.name);
      setType(farm.type);
      setDistrict(farm.district || '');
      setUpazila(farm.upazila || '');
    }
  }, [farm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!farm || !name.trim()) return;
    try {
      await updateFarm.mutateAsync({
        id: farm.id,
        name,
        type,
        district: district || undefined,
        upazila: upazila || undefined,
      });
      toast.success(bn ? 'খামারের তথ্য আপডেট হয়েছে!' : 'Farm updated!');
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
            <MapPin className="w-5 h-5" /> {bn ? 'খামারের তথ্য সম্পাদনা' : 'Edit Farm Details'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>{bn ? 'খামারের নাম' : 'Farm Name'}</Label>
            <Input value={name} onChange={e => setName(e.target.value)} required />
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

          {!district && (
            <p className="text-xs text-destructive bg-destructive/10 rounded-lg p-2">
              ⚠️ {bn ? 'জেলা ও উপজেলা নির্বাচন করুন — এটি আবহাওয়া ও AI পরামর্শের জন্য গুরুত্বপূর্ণ।' : 'Please select district & upazila — important for weather & AI recommendations.'}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={updateFarm.isPending}>
            {updateFarm.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {bn ? 'আপডেট করুন' : 'Update Farm'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

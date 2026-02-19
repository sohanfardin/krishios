import { useState, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Camera, Loader2, Save } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DISTRICTS, DISTRICTS_UPAZILAS } from '@/data/bangladeshLocations';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileDialog({ open, onOpenChange }: Props) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const bn = language === 'bn';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    email: '',
    district: '',
    upazila: '',
  });

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user && open,
  });

  // Sync form when profile loads or dialog opens
  const prevProfileId = useRef<string | null>(null);
  if (profile && profile.id !== prevProfileId.current) {
    prevProfileId.current = profile.id;
    setForm({
      full_name: profile.full_name || '',
      phone: profile.phone || '',
      email: profile.email || user?.email || '',
      district: profile.district || '',
      upazila: profile.upazila || '',
    });
  }

  const avatarUrl = (profile as any)?.avatar_url as string | null;

  const updateProfile = useMutation({
    mutationFn: async (updates: Record<string, any>) => {
      const { error } = await supabase
        .from('profiles')
        .update(updates as any)
        .eq('user_id', user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['farms'] });
      queryClient.invalidateQueries({ queryKey: ['weather'] });
      toast.success(bn ? 'প্রোফাইল আপডেট হয়েছে' : 'Profile updated');
      onOpenChange(false);
    },
    onError: () => {
      toast.error(bn ? 'আপডেট ব্যর্থ' : 'Update failed');
    },
  });

  const handleSave = () => {
    updateProfile.mutate({
      full_name: form.full_name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      district: form.district,
      upazila: form.upazila,
    });
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast.error(bn ? 'শুধুমাত্র ছবি আপলোড করুন' : 'Please upload an image');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error(bn ? 'ছবি ২MB এর কম হতে হবে' : 'Image must be under 2MB');
      return;
    }

    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${user.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('profile-pictures')
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast.error(bn ? 'আপলোড ব্যর্থ' : 'Upload failed');
      setUploading(false);
      return;
    }

    const { data: signedUrlData, error: signedError } = await supabase.storage
      .from('profile-pictures')
      .createSignedUrl(path, 60 * 60 * 24 * 365); // 1 year

    if (signedError || !signedUrlData?.signedUrl) {
      toast.error(bn ? 'আপডেট ব্যর্থ' : 'Update failed');
      setUploading(false);
      return;
    }

    const url = signedUrlData.signedUrl;

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: url } as any)
      .eq('user_id', user.id);

    if (updateError) {
      toast.error(bn ? 'আপডেট ব্যর্থ' : 'Update failed');
    } else {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success(bn ? 'ছবি আপলোড হয়েছে' : 'Photo uploaded');
    }
    setUploading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            👤 {bn ? 'প্রোফাইল' : 'Profile'}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Avatar Section */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative group">
                <div className="w-24 h-24 rounded-full bg-gradient-primary flex items-center justify-center text-3xl text-primary-foreground font-bold shadow-lg overflow-hidden">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    (profile?.full_name || 'U').charAt(0).toUpperCase()
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors"
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {bn ? 'ছবি পরিবর্তন করতে ক্লিক করুন' : 'Click to change photo'}
              </p>
            </div>

            {/* Info Fields */}
            <div className="space-y-4">
              {/* Read-only info */}
              <div className="bg-muted/50 rounded-xl p-3 space-y-1">
                <p className="text-xs text-muted-foreground">{bn ? 'কৃষক ধরন' : 'Farmer Type'}</p>
                <p className="text-sm font-medium text-foreground">
                  {profile?.farmer_type?.join(', ') || (bn ? 'নির্ধারিত নয়' : 'Not set')}
                </p>
              </div>
              <div className="bg-muted/50 rounded-xl p-3 space-y-1">
                <p className="text-xs text-muted-foreground">{bn ? 'জমির আকার' : 'Land Size'}</p>
                <p className="text-sm font-medium text-foreground">
                  {profile?.land_size_category || (bn ? 'নির্ধারিত নয়' : 'Not set')}
                </p>
              </div>

              {/* Editable fields */}
              <div className="space-y-1.5">
                <Label className="text-sm">{bn ? 'পুরো নাম' : 'Full Name'}</Label>
                <Input
                  type="text"
                  value={form.full_name}
                  onChange={e => setForm(prev => ({ ...prev, full_name: e.target.value }))}
                  placeholder={bn ? 'পুরো নাম' : 'Full Name'}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">{bn ? 'ফোন নম্বর' : 'Phone Number'}</Label>
                <Input
                  type="tel"
                  value={form.phone}
                  onChange={e => setForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder={bn ? 'ফোন নম্বর' : 'Phone Number'}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">{bn ? 'ইমেইল' : 'Email'}</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder={bn ? 'ইমেইল' : 'Email'}
                />
              </div>

              {/* District & Upazila Selects */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm">{bn ? 'জেলা' : 'District'}</Label>
                  <Select value={form.district} onValueChange={(val) => setForm(prev => ({ ...prev, district: val, upazila: '' }))}>
                    <SelectTrigger>
                      <SelectValue placeholder={bn ? 'জেলা নির্বাচন' : 'Select district'} />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {DISTRICTS.map(d => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">{bn ? 'উপজেলা' : 'Upazila'}</Label>
                  <Select value={form.upazila} onValueChange={(val) => setForm(prev => ({ ...prev, upazila: val }))} disabled={!form.district}>
                    <SelectTrigger>
                      <SelectValue placeholder={bn ? 'উপজেলা নির্বাচন' : 'Select upazila'} />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {(DISTRICTS_UPAZILAS[form.district] || []).map(u => (
                        <SelectItem key={u} value={u}>{u}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Button onClick={handleSave} className="w-full" disabled={updateProfile.isPending}>
              {updateProfile.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              {bn ? 'সংরক্ষণ করুন' : 'Save Changes'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
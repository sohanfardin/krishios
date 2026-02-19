import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Globe, Bell, User, Lock, HelpCircle, LogOut, ChevronRight, Loader2, KeyRound, MapPin } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ProfileDialog } from '@/components/profile/ProfileDialog';
import { EditFarmDialog } from '@/components/farm/EditFarmDialog';
import { useActiveFarm } from '@/hooks/useFarm';

export function SettingsPage() {
  const { language, setLanguage } = useLanguage();
  const { user, updatePassword } = useAuth();
  const navigate = useNavigate();
  const bn = language === 'bn';

  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [farmDialogOpen, setFarmDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const { farm } = useActiveFarm();

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').eq('user_id', user!.id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success(bn ? 'লগ আউট হয়েছে' : 'Logged out');
    navigate('/auth');
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast.error(bn ? 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে' : 'Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(bn ? 'পাসওয়ার্ড মিলছে না' : 'Passwords do not match');
      return;
    }
    setChangingPassword(true);
    const { error } = await updatePassword(newPassword);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(bn ? 'পাসওয়ার্ড পরিবর্তন হয়েছে' : 'Password changed successfully');
      setPasswordDialogOpen(false);
      setNewPassword('');
      setConfirmPassword('');
    }
    setChangingPassword(false);
  };

  const settingsGroups = [
    {
      titleBn: 'সাধারণ', titleEn: 'General',
      items: [
        { id: 'language', emoji: '🌐', titleBn: 'ভাষা', titleEn: 'Language', descBn: bn ? 'বাংলা নির্বাচিত' : 'Bengali selected', descEn: language === 'en' ? 'English selected' : 'English selected', action: 'toggle' as const, value: language === 'en' },
        { id: 'notifications', emoji: '🔔', titleBn: 'বিজ্ঞপ্তি', titleEn: 'Notifications', descBn: 'সতর্কতা ও আপডেট পান', descEn: 'Receive alerts and updates', action: 'toggle' as const, value: true },
      ],
    },
    {
      titleBn: 'খামার', titleEn: 'Farm',
      items: [
        { id: 'farm-settings', emoji: '📍', titleBn: 'খামারের অবস্থান', titleEn: 'Farm Location', descBn: farm?.district ? `${farm.district}${farm.upazila ? `, ${farm.upazila}` : ''}` : 'জেলা ও উপজেলা নির্বাচন করুন', descEn: farm?.district ? `${farm.district}${farm.upazila ? `, ${farm.upazila}` : ''}` : 'Select district & upazila', action: 'link' as const },
      ],
    },
    {
      titleBn: 'অ্যাকাউন্ট', titleEn: 'Account',
      items: [
        { id: 'profile', emoji: '👤', titleBn: 'প্রোফাইল', titleEn: 'Profile', descBn: 'নাম, ছবি এবং যোগাযোগ', descEn: 'Name, photo and contact', action: 'link' as const },
        { id: 'change-password', emoji: '🔑', titleBn: 'পাসওয়ার্ড পরিবর্তন', titleEn: 'Change Password', descBn: 'আপনার পাসওয়ার্ড আপডেট করুন', descEn: 'Update your password', action: 'link' as const },
        
      ],
    },
  ];

  return (
    <div className="space-y-6 pb-8">
      <div className="animate-fade-in">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">⚙️ {bn ? 'সেটিংস' : 'Settings'}</h1>
        <p className="text-muted-foreground mt-1">{bn ? 'আপনার অ্যাপ কাস্টমাইজ করুন' : 'Customize your app'}</p>
      </div>

      {/* Profile Card */}
      <div className="bg-card rounded-2xl p-5 border border-border animate-fade-in cursor-pointer hover:bg-muted/30 transition-colors" style={{ animationDelay: '100ms' }} onClick={() => setProfileDialogOpen(true)}>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center text-2xl text-primary-foreground font-bold shadow-lg overflow-hidden">
            {(profile as any)?.avatar_url ? (
              <img src={(profile as any).avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              (profile?.full_name || user?.email || 'U').charAt(0).toUpperCase()
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground text-lg">{profile?.full_name || (bn ? 'কৃষক' : 'Farmer')}</h3>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <p className="text-xs text-primary mt-1">{bn ? 'প্রোফাইল দেখুন ও সম্পাদনা করুন' : 'View & edit profile'}</p>
          </div>
        </div>
      </div>

      {settingsGroups.map((group, gi) => (
        <div key={group.titleEn} className="animate-fade-in" style={{ animationDelay: `${(gi + 2) * 100}ms` }}>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 px-1">{bn ? group.titleBn : group.titleEn}</h2>
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            {group.items.map((item, index) => (
              <div key={item.id} className={cn("flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors cursor-pointer", index !== group.items.length - 1 && "border-b border-border")}
                onClick={() => {
                  if (item.id === 'language') setLanguage(language === 'bn' ? 'en' : 'bn');
                  if (item.id === 'change-password') setPasswordDialogOpen(true);
                  if (item.id === 'farm-settings') setFarmDialogOpen(true);
                  if (item.id === 'profile') setProfileDialogOpen(true);
                }}>
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center"><span className="text-xl">{item.emoji}</span></div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-foreground">{bn ? item.titleBn : item.titleEn}</h4>
                  <p className="text-sm text-muted-foreground">{bn ? item.descBn : item.descEn}</p>
                </div>
                {item.action === 'toggle' ? (
                  <Switch checked={item.id === 'language' ? language === 'en' : item.value}
                    onCheckedChange={() => { if (item.id === 'language') setLanguage(language === 'bn' ? 'en' : 'bn'); }}
                    className="data-[state=checked]:bg-primary" />
                ) : <ChevronRight className="w-5 h-5 text-muted-foreground" />}
              </div>
            ))}
          </div>
        </div>
      ))}

      <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 p-4 bg-destructive/10 text-destructive rounded-2xl font-medium hover:bg-destructive/20 transition-colors touch-target animate-fade-in" style={{ animationDelay: '500ms' }}>
        <LogOut className="w-5 h-5" />
        <span>{bn ? 'লগ আউট' : 'Log Out'}</span>
      </button>

      {/* Change Password Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="w-5 h-5" /> {bn ? 'পাসওয়ার্ড পরিবর্তন' : 'Change Password'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{bn ? 'নতুন পাসওয়ার্ড' : 'New Password'}</Label>
              <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••" minLength={6} />
            </div>
            <div className="space-y-2">
              <Label>{bn ? 'পাসওয়ার্ড নিশ্চিত করুন' : 'Confirm Password'}</Label>
              <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" minLength={6} />
            </div>
            <Button onClick={handleChangePassword} className="w-full" disabled={changingPassword || !newPassword || !confirmPassword}>
              {changingPassword ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {bn ? 'পাসওয়ার্ড পরিবর্তন করুন' : 'Change Password'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ProfileDialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen} />
      <EditFarmDialog open={farmDialogOpen} onOpenChange={setFarmDialogOpen} farm={farm} />

      <p className="text-center text-xs text-muted-foreground">KrishiOS v1.0.0 • {bn ? 'বাংলাদেশে তৈরি 🇧🇩' : 'Made in Bangladesh 🇧🇩'}</p>
    </div>
  );
}
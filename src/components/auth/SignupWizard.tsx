import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sprout, User, Phone, ArrowRight, ArrowLeft, Loader2, CheckCircle2, Mail, Lock, Camera, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DISTRICTS, DISTRICTS_UPAZILAS } from '@/data/bangladeshLocations';

const STEPS = [
  { title: 'অ্যাকাউন্ট তৈরি', titleEn: 'Create Account', icon: '👤' },
  { title: 'কৃষকের ধরন', titleEn: 'Farmer Type', icon: '🌾' },
  { title: 'খামারের তথ্য', titleEn: 'Farm Info', icon: '🏡' },
  { title: 'চাষের ধরণ', titleEn: 'Farming Method', icon: '🌿' },
  { title: 'সমস্যা চিহ্নিত', titleEn: 'Challenges', icon: '⚠️' },
];

const FARMER_TYPES = [
  { value: 'crop', label: '🌾 ফসল', labelEn: 'Crops' },
  { value: 'cattle', label: '🐄 গবাদিপশু', labelEn: 'Cattle' },
  { value: 'poultry', label: '🐓 পোল্ট্রি', labelEn: 'Poultry' },
  { value: 'mixed', label: '🌿 মিশ্র', labelEn: 'Mixed' },
];

const LAND_SIZES = [
  { value: 'under_1', label: '১ বিঘার কম' },
  { value: '1_to_5', label: '১–৫ বিঘা' },
  { value: '5_to_20', label: '৫–২০ বিঘা' },
  { value: 'over_20', label: '২০+ বিঘা' },
  { value: 'no_land', label: 'শুধু খামার (জমি নেই)' },
];

const LAND_OWNERSHIP = [
  { value: 'own', label: '🏠 নিজের' },
  { value: 'lease', label: '📝 লিজ' },
  { value: 'mixed', label: '🔀 মিশ্র' },
];

const IRRIGATION_SOURCES = [
  { value: 'tubewell', label: '🚰 টিউবওয়েল' },
  { value: 'pond', label: '🌊 পুকুর/খাল' },
  { value: 'rain', label: '🌧️ বৃষ্টি নির্ভর' },
  { value: 'unknown', label: '❓ জানি না' },
];

const FARMING_METHODS = [
  { value: 'organic', label: '🌿 জৈব', labelEn: 'Organic' },
  { value: 'chemical', label: '🧪 কেমিক্যাল', labelEn: 'Chemical' },
  { value: 'mixed', label: '🔀 মিশ্র', labelEn: 'Mixed' },
];

const CHALLENGES = [
  { value: 'low_yield', label: '📉 কম ফলন' },
  { value: 'disease', label: '🦠 রোগ' },
  { value: 'market_price', label: '💰 বাজার মূল্য' },
  { value: 'high_cost', label: '💸 বেশি খরচ' },
  { value: 'water', label: '💧 পানি সমস্যা' },
  { value: 'livestock_disease', label: '🐄 পশুর অসুখ' },
];

interface SignupWizardProps {
  onOnboardingComplete?: () => void;
  onBackToLogin?: () => void;
}

export function SignupWizard({ onOnboardingComplete, onBackToLogin }: SignupWizardProps) {
  const { user, signUp, signOut } = useAuth();
  const [step, setStep] = useState(user ? 1 : 0);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);

  // Step 1: Account Info
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [district, setDistrict] = useState('');
  const [upazila, setUpazila] = useState('');

  // Step 2
  const [farmerTypes, setFarmerTypes] = useState<string[]>([]);

  // Step 3
  const [landSize, setLandSize] = useState('');
  const [landOwnership, setLandOwnership] = useState('');
  const [irrigationSource, setIrrigationSource] = useState('');

  // Step 4
  const [farmingMethod, setFarmingMethod] = useState('');

  // Step 5
  const [challenges, setChallenges] = useState<string[]>([]);

  // Pre-fill from user metadata if already logged in
  useEffect(() => {
    if (user) {
      setFullName(user.user_metadata?.full_name || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const toggleArrayItem = (arr: string[], setArr: (v: string[]) => void, item: string) => {
    setArr(arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item]);
  };

  const [avatarLoading, setAvatarLoading] = useState(false);

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast({ title: 'ত্রুটি', description: 'শুধুমাত্র ছবি আপলোড করুন', variant: 'destructive' });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'ত্রুটি', description: 'ছবি ২MB এর কম হতে হবে', variant: 'destructive' });
      return;
    }
    setAvatarLoading(true);
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAvatarPreview(ev.target?.result as string);
      setAvatarLoading(false);
    };
    reader.readAsDataURL(file);
  };

  const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const canProceed = () => {
    switch (step) {
      case 0: return fullName.trim() && email.trim() && isValidEmail(email) && password.length >= 6 && password === confirmPassword && phone.trim().length >= 11 && district && upazila;
      case 1: return farmerTypes.length > 0;
      case 2: return landSize && landOwnership && irrigationSource;
      case 3: return !!farmingMethod;
      case 4: return challenges.length > 0;
      default: return false;
    }
  };

  const handleCreateAccount = async () => {
    setLoading(true);
    try {
      const { error } = await signUp(email.trim(), password, fullName);
      if (error) {
        toast({ title: 'ত্রুটি', description: error.message, variant: 'destructive' });
        setLoading(false);
        return;
      }
      toast({ title: '✅ অ্যাকাউন্ট তৈরি হয়েছে!', description: 'এখন আপনার কৃষি প্রোফাইল সম্পন্ন করুন।' });
      setStep(1);
    } catch (err: any) {
      toast({ title: 'ত্রুটি', description: err.message || 'অ্যাকাউন্ট তৈরি করতে সমস্যা হয়েছে', variant: 'destructive' });
    }
    setLoading(false);
  };

  const handleFinishOnboarding = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Upload avatar if selected
        let avatarUrl: string | null = null;
        if (avatarFile) {
          const ext = avatarFile.name.split('.').pop();
          const path = `${session.user.id}/avatar.${ext}`;
          const { error: uploadError } = await supabase.storage
            .from('profile-pictures')
            .upload(path, avatarFile, { upsert: true });
          if (!uploadError) {
            const { data: signedUrlData } = await supabase.storage
              .from('profile-pictures')
              .createSignedUrl(path, 60 * 60 * 24 * 365); // 1 year
            if (signedUrlData?.signedUrl) {
              avatarUrl = signedUrlData.signedUrl;
            }
          }
        }

        const profileData: Record<string, any> = {
          full_name: fullName,
          phone: phone,
          email: email,
          district: district,
          upazila: upazila,
          farmer_type: farmerTypes,
          land_size_category: landSize,
          land_ownership: landOwnership,
          irrigation_source: irrigationSource,
          farming_method: farmingMethod,
          biggest_challenges: challenges,
          onboarding_completed: true,
        };
        if (avatarUrl) profileData.avatar_url = avatarUrl;

        const { error } = await supabase.from('profiles').update(profileData).eq('user_id', session.user.id);

        if (error) {
          await supabase.from('profiles').insert({
            user_id: session.user.id,
            ...profileData,
          });
        }
      }

      // Send magic sign-in link
      await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      // Sign out current session so user must confirm via email
      await signOut();

      toast({
        title: '✅ সব তথ্য সংরক্ষণ হয়েছে!',
        description: 'আপনার ইমেইলে একটি সাইন-ইন লিংক পাঠানো হয়েছে।',
      });
      setShowEmailConfirmation(true);
    } catch {
      toast({ title: 'ত্রুটি', description: 'তথ্য সংরক্ষণে সমস্যা হয়েছে', variant: 'destructive' });
    }
    setLoading(false);
  };

  const handleNext = () => {
    if (step === 0) {
      handleCreateAccount();
    } else if (step === 4) {
      handleFinishOnboarding();
    } else {
      setStep(step + 1);
    }
  };

  if (showEmailConfirmation) {
    return (
      <div className="w-full max-w-lg mx-auto">
        <div className="bg-card rounded-2xl p-6 shadow-sm border border-border text-center space-y-5">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Mail className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground">ইমেইল নিশ্চিত করুন</h2>
          <p className="text-muted-foreground text-sm">
            <span className="font-semibold text-foreground">{email.trim()}</span> ঠিকানায় একটি সাইন-ইন লিংক পাঠানো হয়েছে।
          </p>
          <div className="bg-accent/20 rounded-xl p-4 space-y-2">
            <p className="text-sm font-medium text-foreground">📩 পরবর্তী ধাপ:</p>
            <ol className="text-sm text-muted-foreground text-left space-y-1 list-decimal list-inside">
              <li>আপনার ইমেইল ইনবক্স খুলুন</li>
              <li>"Sign in to KrishiOS" ইমেইলটি খুঁজুন</li>
              <li>ইমেইলের ভিতরে থাকা লিংকে ক্লিক করুন</li>
              <li>স্বয়ংক্রিয়ভাবে লগইন হয়ে যাবেন!</li>
            </ol>
          </div>
          <p className="text-xs text-muted-foreground">ইমেইল না পেলে স্প্যাম/জাংক ফোল্ডার চেক করুন</p>
          <Button
            variant="outline"
            onClick={() => {
              setShowEmailConfirmation(false);
              onBackToLogin?.();
            }}
            className="w-full"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            লগইন পেজে ফিরে যান
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-3 shadow-lg">
          <Sprout className="w-7 h-7 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">কৃষিOS-এ স্বাগতম</h1>
        <p className="text-muted-foreground text-sm mt-1">আপনার কৃষি সহায়ক তৈরি করুন ~১ মিনিটে</p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-1 mb-6 px-2">
        {STEPS.map((s, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className={`h-1.5 w-full rounded-full transition-colors ${i <= step ? 'bg-primary' : 'bg-muted'}`} />
            <span className={`text-[10px] ${i === step ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
              {s.icon}
            </span>
          </div>
        ))}
      </div>

      {/* Card */}
      <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          {STEPS[step].icon} {STEPS[step].title}
        </h2>

        {/* Step 1: Account Creation */}
        {step === 0 && (
          <div className="space-y-3">
            {/* Avatar Upload (Optional) */}
            <div className="flex flex-col items-center gap-2 mb-2">
              <div className="relative group">
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center text-2xl font-bold overflow-hidden border-2 border-border">
                  {avatarLoading ? (
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  ) : avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="w-6 h-6 text-muted-foreground" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={avatarLoading}
                  className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarSelect}
                  className="hidden"
                />
              </div>
              <p className="text-xs text-muted-foreground">প্রোফাইল ছবি যোগ করুন (ঐচ্ছিক)</p>
            </div>
            <div>
              <Label>পুরো নাম *</Label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="আপনার নাম" className="pl-10" required />
              </div>
            </div>
            <div>
              <Label>ইমেইল *</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" className="pl-10" required />
              </div>
            </div>
            <div>
              <Label>মোবাইল নম্বর *</Label>
              <div className="relative mt-1">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="০১XXXXXXXXX" className="pl-10" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>পাসওয়ার্ড *</Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="pl-10 pr-10" required minLength={6} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <div>
                <Label>পুনরায় পাসওয়ার্ড *</Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" className="pl-10 pr-10" required minLength={6} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
            {password && confirmPassword && password !== confirmPassword && (
              <p className="text-xs text-destructive">পাসওয়ার্ড মিলছে না</p>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>জেলা *</Label>
                <Select value={district} onValueChange={(val) => { setDistrict(val); setUpazila(''); }}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="জেলা নির্বাচন করুন" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {DISTRICTS.map(d => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>উপজেলা *</Label>
                <Select value={upazila} onValueChange={setUpazila} disabled={!district}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="উপজেলা নির্বাচন করুন" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {(DISTRICTS_UPAZILAS[district] || []).map(u => (
                      <SelectItem key={u} value={u}>{u}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}


        {/* Step 2: Farmer Type */}
        {step === 1 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground mb-2">আপনি কী ধরনের কৃষক? (একাধিক নির্বাচন করা যাবে)</p>
            <div className="grid grid-cols-2 gap-3">
              {FARMER_TYPES.map(ft => (
                <button
                  key={ft.value}
                  type="button"
                  onClick={() => toggleArrayItem(farmerTypes, setFarmerTypes, ft.value)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    farmerTypes.includes(ft.value)
                      ? 'border-primary bg-primary/10 shadow-sm'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <span className="text-xl block mb-1">{ft.label.split(' ')[0]}</span>
                  <span className="text-sm font-medium">{ft.label.split(' ').slice(1).join(' ')}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Farm Info */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">আপনার মোট জমি/খামারের আকার কত? *</Label>
              <div className="grid grid-cols-1 gap-2 mt-2">
                {LAND_SIZES.map(ls => (
                  <button
                    key={ls.value}
                    type="button"
                    onClick={() => setLandSize(ls.value)}
                    className={`p-3 rounded-xl border-2 text-left text-sm transition-all ${
                      landSize === ls.value
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    {ls.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">জমি/খামার আপনার নিজের নাকি লিজ? *</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {LAND_OWNERSHIP.map(lo => (
                  <button
                    key={lo.value}
                    type="button"
                    onClick={() => setLandOwnership(lo.value)}
                    className={`p-3 rounded-xl border-2 text-center text-sm transition-all ${
                      landOwnership === lo.value
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    {lo.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">সেচ বা পানির উৎস কী? *</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {IRRIGATION_SOURCES.map(is_ => (
                  <button
                    key={is_.value}
                    type="button"
                    onClick={() => setIrrigationSource(is_.value)}
                    className={`p-3 rounded-xl border-2 text-center text-sm transition-all ${
                      irrigationSource === is_.value
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    {is_.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Farming Method */}
        {step === 3 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground mb-2">আপনি কোন পদ্ধতিতে চাষ করেন?</p>
            <div className="grid grid-cols-1 gap-3">
              {FARMING_METHODS.map(fm => (
                <button
                  key={fm.value}
                  type="button"
                  onClick={() => setFarmingMethod(fm.value)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    farmingMethod === fm.value
                      ? 'border-primary bg-primary/10 shadow-sm'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <span className="text-lg font-medium">{fm.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 5: Challenges */}
        {step === 4 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground mb-2">আপনার সবচেয়ে বড় সমস্যা কী? (একাধিক নির্বাচন করা যাবে)</p>
            <div className="grid grid-cols-2 gap-3">
              {CHALLENGES.map(ch => (
                <button
                  key={ch.value}
                  type="button"
                  onClick={() => toggleArrayItem(challenges, setChallenges, ch.value)}
                  className={`p-3 rounded-xl border-2 text-left text-sm transition-all ${
                    challenges.includes(ch.value)
                      ? 'border-primary bg-primary/10 shadow-sm'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  {ch.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-3 mt-6">
          {step > 0 && step > (user ? 1 : 0) && (
            <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1">
              <ArrowLeft className="w-4 h-4 mr-1" /> পিছনে
            </Button>
          )}
          {step === 0 && (
            <Button onClick={handleNext} disabled={loading || !canProceed()} className="flex-1">
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
              অ্যাকাউন্ট তৈরি করুন
            </Button>
          )}
          {step > 0 && step < 4 && (
            <Button onClick={handleNext} disabled={!canProceed()} className="flex-1">
              পরবর্তী <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          )}
          {step === 4 && (
            <Button onClick={handleNext} disabled={loading || !canProceed()} className="flex-1">
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
              সম্পন্ন করুন
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

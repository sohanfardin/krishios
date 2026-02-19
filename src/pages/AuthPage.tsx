import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sprout, Lock, Loader2, Mail, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SignupWizard } from '@/components/auth/SignupWizard';
import { supabase } from '@/integrations/supabase/client';

export default function AuthPage() {
  const { user, loading: authLoading, signIn, resetPassword } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const { toast } = useToast();

  // Check if logged-in user has completed onboarding
  useEffect(() => {
    if (!user) {
      setOnboardingChecked(true);
      return;
    }
    const checkOnboarding = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('user_id', user.id)
        .maybeSingle();
      setOnboardingCompleted(data?.onboarding_completed ?? false);
      setOnboardingChecked(true);
      // If user just signed up, show wizard
      if (data && !data.onboarding_completed) {
        setIsSignUp(true);
      }
    };
    checkOnboarding();
  }, [user]);

  if (authLoading || !onboardingChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Only redirect if user exists AND onboarding is completed
  if (user && onboardingCompleted) return <Navigate to="/" replace />;

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      toast({ title: 'ত্রুটি', description: error.message, variant: 'destructive' });
    }
    setLoading(false);
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      toast({ title: 'ত্রুটি', description: 'অনুগ্রহ করে ইমেইল দিন', variant: 'destructive' });
      return;
    }
    setLoading(true);
    const { error } = await resetPassword(email.trim());
    if (error) {
      toast({ title: 'ত্রুটি', description: error.message, variant: 'destructive' });
    } else {
      setResetSent(true);
      toast({ title: '✅ ইমেইল পাঠানো হয়েছে', description: 'পাসওয়ার্ড রিসেট লিংক আপনার ইমেইলে পাঠানো হয়েছে।' });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      {isSignUp ? (
        <div className="w-full">
          <SignupWizard onOnboardingComplete={() => setOnboardingCompleted(true)} onBackToLogin={() => setIsSignUp(false)} />
          <div className="text-center mt-4">
            {!user && (
              <button type="button" onClick={() => setIsSignUp(false)} className="text-sm text-primary hover:underline">
                ইতোমধ্যে অ্যাকাউন্ট আছে? লগইন করুন
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Sprout className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">কৃষিOS</h1>
            <p className="text-muted-foreground mt-1">
              {isForgotPassword ? 'পাসওয়ার্ড রিসেট করুন' : 'আপনার অ্যাকাউন্টে লগইন করুন'}
            </p>
          </div>

          <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
            {isForgotPassword ? (
              <div className="space-y-4">
                {resetSent ? (
                  <div className="text-center space-y-3">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                      <Mail className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground">ইমেইল পাঠানো হয়েছে!</h3>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-semibold text-foreground">{email}</span> ঠিকানায় পাসওয়ার্ড রিসেট লিংক পাঠানো হয়েছে। অনুগ্রহ করে আপনার ইমেইল চেক করুন।
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label>ইমেইল</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" className="pl-10" required />
                      </div>
                    </div>
                    <Button onClick={handleForgotPassword} className="w-full" disabled={loading || !email.trim()}>
                      {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
                      রিসেট লিংক পাঠান
                    </Button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => { setIsForgotPassword(false); setResetSent(false); }}
                  className="w-full flex items-center justify-center gap-1 text-sm text-primary hover:underline mt-2"
                >
                  <ArrowLeft className="w-4 h-4" /> লগইনে ফিরে যান
                </button>
              </div>
            ) : (
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">ইমেইল</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="email" type="email" placeholder="email@example.com" value={email} onChange={e => setEmail(e.target.value)} className="pl-10" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">পাসওয়ার্ড</Label>
                    <button type="button" onClick={() => setIsForgotPassword(true)} className="text-xs text-primary hover:underline">
                      পাসওয়ার্ড ভুলে গেছেন?
                    </button>
                  </div>
                   <div className="relative">
                     <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                     <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className="pl-10 pr-10" required minLength={6} />
                     <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                       {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                     </button>
                   </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  🔑 লগইন করুন
                </Button>
              </form>
            )}

            {!isForgotPassword && (
              <div className="mt-4 text-center">
                <button type="button" onClick={() => setIsSignUp(true)} className="text-sm text-primary hover:underline">
                  নতুন অ্যাকাউন্ট তৈরি করুন
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { ContactDialog } from '@/components/contact/ContactDialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { Crown, Check, Sparkles, BarChart2, Users, Zap, MessageCircle, Shield, Copy, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useSubscriptionStatus } from '@/hooks/useSubscription';

interface Plan {
  id: string;
  nameBn: string;
  nameEn: string;
  priceBn: string;
  priceEn: string;
  periodBn: string;
  periodEn: string;
  amount: number;
  features: { bn: string; en: string }[];
  popular: boolean;
  color: string;
}

const PAYMENT_NUMBER = '01706028192';

const plans: Plan[] = [
  {
    id: 'basic',
    nameBn: 'ফ্রি ট্রায়াল',
    nameEn: 'Free Trial',
    priceBn: '১৫ দিন বিনামূল্যে',
    priceEn: '15 Days Free',
    periodBn: '',
    periodEn: '',
    amount: 0,
    features: [
      { bn: 'সব সুবিধা ১৫ দিন ফ্রি', en: 'All features free for 15 days' },
      { bn: 'তারপর সীমিত ব্যবহার', en: 'Then limited usage' },
      { bn: 'দৈনিক ৫ ভয়েস, ২ ছবি, ৫ প্রশ্ন', en: 'Daily: 5 voice, 2 images, 5 questions' },
      { bn: 'সর্বোচ্চ ৩ ফসল ও ৩ পশু', en: 'Max 3 crops & 3 livestock' },
    ],
    popular: false,
    color: 'border-border',
  },
  {
    id: 'pro',
    nameBn: 'প্রো',
    nameEn: 'Pro',
    priceBn: '৩৯৯',
    priceEn: '399',
    periodBn: '/মাস',
    periodEn: '/month',
    amount: 399,
    features: [
      { bn: 'সব বেসিক সুবিধা', en: 'All Basic features' },
      { bn: 'এআই ফলন পূর্বাভাস', en: 'AI Yield Prediction' },
      { bn: 'রোগ শনাক্তকরণ', en: 'Disease Detection' },
      { bn: 'স্মার্ট পরামর্শ', en: 'Smart Suggestions' },
      { bn: 'মার্কেটপ্লেস অগ্রাধিকার', en: 'Marketplace Priority' },
    ],
    popular: true,
    color: 'border-primary ring-2 ring-primary/20',
  },
  {
    id: 'half_yearly',
    nameBn: '৬ মাস',
    nameEn: '6 Months',
    priceBn: '১,৬৯৯',
    priceEn: '1,699',
    periodBn: '/৬ মাস',
    periodEn: '/6 months',
    amount: 1699,
    features: [
      { bn: 'সব প্রো সুবিধা', en: 'All Pro features' },
      { bn: 'উন্নত বিশ্লেষণ', en: 'Advanced Analytics' },
      { bn: 'বিশেষজ্ঞ পরামর্শ', en: 'Expert Consultation' },
      { bn: '২৪/৭ সহায়তা', en: '24/7 Support' },
      { bn: '২৯% সাশ্রয়', en: 'Save 29%' },
    ],
    popular: false,
    color: 'border-border',
  },
  {
    id: 'yearly',
    nameBn: 'বার্ষিক',
    nameEn: 'Yearly',
    priceBn: '২,৯৯৯',
    priceEn: '2,999',
    periodBn: '/বছর',
    periodEn: '/year',
    amount: 2999,
    features: [
      { bn: 'সব প্রো সুবিধা', en: 'All Pro features' },
      { bn: 'উন্নত বিশ্লেষণ', en: 'Advanced Analytics' },
      { bn: 'বিশেষজ্ঞ পরামর্শ', en: 'Expert Consultation' },
      { bn: '২৪/৭ সহায়তা', en: '24/7 Support' },
      { bn: '৩৮% সাশ্রয়', en: 'Save 38%' },
    ],
    popular: false,
    color: 'border-accent',
  },
];

const benefits = [
  { emoji: '📈', bn: 'উন্নত বিশ্লেষণ', en: 'Advanced Analytics' },
  { emoji: '🤖', bn: 'এআই পরামর্শ', en: 'AI Recommendations' },
  { emoji: '👥', bn: 'সম্প্রদায়', en: 'Community Access' },
  { emoji: '⚡', bn: 'অপটিমাইজেশন', en: 'Optimization' },
  { emoji: '💬', bn: 'বিশেষজ্ঞ পরামর্শ', en: 'Expert Advice' },
  { emoji: '🛡️', bn: 'ঝুঁকি সুরক্ষা', en: 'Risk Protection' },
];

export function PremiumPage() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { data: sub } = useSubscriptionStatus();
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'bkash' | 'nagad'>('bkash');
  const [transactionId, setTransactionId] = useState('');
  const [senderMobile, setSenderMobile] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(PAYMENT_NUMBER);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmitPayment = async () => {
    if (!senderMobile.trim()) {
      toast.error(language === 'bn' ? 'আপনার মোবাইল নম্বর দিন' : 'Enter your mobile number');
      return;
    }
    if (!transactionId.trim()) {
      toast.error(language === 'bn' ? 'ট্রানজেকশন আইডি দিন' : 'Enter transaction ID');
      return;
    }
    if (!user) {
      toast.error(language === 'bn' ? 'প্রথমে লগইন করুন' : 'Please login first');
      return;
    }
    if (!selectedPlan) return;

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('payment-notification', {
        body: {
          plan: selectedPlan.id,
          transaction_id: transactionId.trim(),
          amount: selectedPlan.amount,
          payment_method: paymentMethod,
          sender_mobile: senderMobile.trim(),
        },
      });

      if (error) throw error;

      toast.success(
        language === 'bn'
          ? 'পেমেন্ট রিকোয়েস্ট জমা হয়েছে! অনুমোদনের জন্য অপেক্ষা করুন।'
          : 'Payment request submitted! Please wait for approval.'
      );
      setSelectedPlan(null);
      setTransactionId('');
      setSenderMobile('');
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="text-center animate-fade-in">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/20 rounded-full mb-4">
          <Crown className="w-5 h-5 text-accent-foreground" />
          <span className="text-sm font-medium text-accent-foreground">
            {language === 'bn' ? 'প্রিমিয়াম' : 'Premium'}
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
          {language === 'bn' ? 'আপনার খামার আপগ্রেড করুন' : 'Upgrade Your Farm'}
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          {language === 'bn'
            ? 'এআই-ভিত্তিক পরামর্শ, উন্নত বিশ্লেষণ এবং বিশেষজ্ঞ সহায়তা দিয়ে আপনার কৃষি ব্যবসা বাড়ান'
            : 'Grow your farming business with AI-powered insights, advanced analytics and expert support'}
        </p>
      </div>

      {/* Benefits */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 animate-fade-in" style={{ animationDelay: '100ms' }}>
        {benefits.map((benefit, index) => (
          <div key={index} className="flex flex-col items-center gap-2 p-4 bg-card rounded-xl border border-border text-center">
            <span className="text-2xl">{benefit.emoji}</span>
            <span className="text-xs font-medium text-foreground">
              {language === 'bn' ? benefit.bn : benefit.en}
            </span>
          </div>
        ))}
      </div>

      {/* Pricing Plans */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 animate-fade-in" style={{ animationDelay: '200ms' }}>
        {plans.map((plan, index) => (
          <div
            key={plan.id}
            className={cn(
              "bg-card rounded-xl p-3 sm:p-5 border-2 relative overflow-hidden transition-all hover:shadow-lg",
              plan.color,
              plan.popular && "transform md:-translate-y-2"
            )}
          >
            {plan.popular && (
              <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] sm:text-xs px-2 py-0.5 rounded-bl-lg font-medium">
                {language === 'bn' ? 'জনপ্রিয়' : 'Popular'}
              </div>
            )}
            <div className="mb-3 sm:mb-5">
              <h3 className="text-sm sm:text-lg font-bold text-foreground mb-1">
                {language === 'bn' ? plan.nameBn : plan.nameEn}
              </h3>
              <div className="flex items-baseline gap-0.5">
                {plan.amount > 0 && <span className="text-xs sm:text-base text-muted-foreground">৳</span>}
                <span className="text-xl sm:text-3xl font-bold text-foreground">
                  {language === 'bn' ? plan.priceBn : plan.priceEn}
                </span>
                <span className="text-[10px] sm:text-sm text-muted-foreground">
                  {language === 'bn' ? plan.periodBn : plan.periodEn}
                </span>
              </div>
            </div>
            <ul className="space-y-1.5 sm:space-y-2.5 mb-3 sm:mb-5">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-1.5 sm:gap-2">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-success/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-success" />
                  </div>
                  <span className="text-[11px] sm:text-sm text-foreground leading-tight">
                    {language === 'bn' ? feature.bn : feature.en}
                  </span>
                </li>
              ))}
            </ul>
            {(() => {
              const isCurrentPlan = sub?.plan === plan.id || (plan.id === 'basic' && sub?.isFree);
              return (
                <>
                  <button
                    onClick={() => !isCurrentPlan && plan.id !== 'basic' && setSelectedPlan(plan)}
                    className={cn(
                      "w-full py-2 sm:py-3 rounded-xl font-semibold text-xs sm:text-sm transition-all touch-target",
                      isCurrentPlan
                        ? "bg-muted text-foreground cursor-default opacity-70"
                        : plan.id === 'basic'
                          ? "bg-muted text-foreground cursor-default opacity-70"
                          : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg"
                    )}
                  >
                    {isCurrentPlan
                      ? (language === 'bn' ? '✅ বর্তমান' : '✅ Current')
                      : plan.id === 'basic'
                        ? (language === 'bn' ? 'ফ্রি ট্রায়াল' : 'Free Trial')
                        : (language === 'bn' ? '📱 পেমেন্ট করুন' : '📱 Pay Now')}
                  </button>
                  {!isCurrentPlan && plan.id !== 'basic' && (
                    <p className="text-[10px] text-center text-muted-foreground mt-1.5">
                      {language === 'bn' ? 'বিকাশ / নগদ' : 'bKash / Nagad'}
                    </p>
                  )}
                </>
              );
            })()}
          </div>
        ))}
      </div>

      {/* Payment Dialog */}
      <Dialog open={!!selectedPlan} onOpenChange={(open) => !open && setSelectedPlan(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">
              {language === 'bn' ? '💳 পেমেন্ট করুন' : '💳 Make Payment'}
            </DialogTitle>
          </DialogHeader>

          {selectedPlan && (
            <div className="space-y-5">
              {/* Plan Summary */}
              <div className="bg-muted rounded-xl p-4 text-center">
                <p className="text-sm text-muted-foreground">
                  {language === 'bn' ? 'নির্বাচিত প্ল্যান' : 'Selected Plan'}
                </p>
                <p className="text-lg font-bold text-foreground">
                  {language === 'bn' ? selectedPlan.nameBn : selectedPlan.nameEn} — ৳{selectedPlan.amount}
                </p>
              </div>

              {/* Payment Method Toggle */}
              <div className="flex gap-2">
                <button
                  onClick={() => setPaymentMethod('bkash')}
                  className={cn(
                    "flex-1 py-2.5 rounded-xl font-medium text-sm transition-all border",
                    paymentMethod === 'bkash'
                      ? "bg-pink-600 text-white border-pink-600"
                      : "bg-card text-foreground border-border"
                  )}
                >
                  বিকাশ (bKash)
                </button>
                <button
                  onClick={() => setPaymentMethod('nagad')}
                  className={cn(
                    "flex-1 py-2.5 rounded-xl font-medium text-sm transition-all border",
                    paymentMethod === 'nagad'
                      ? "bg-orange-600 text-white border-orange-600"
                      : "bg-card text-foreground border-border"
                  )}
                >
                  নগদ (Nagad)
                </button>
              </div>

              {/* Instructions */}
              <div className="bg-muted/50 border border-border rounded-xl p-4 space-y-3">
                <p className="text-sm font-medium text-foreground">
                  {language === 'bn' ? '📋 নির্দেশনা:' : '📋 Instructions:'}
                </p>
                <ol className="text-sm text-muted-foreground space-y-1.5 list-decimal list-inside">
                  <li>
                    {language === 'bn'
                      ? `${paymentMethod === 'bkash' ? 'বিকাশ' : 'নগদ'} অ্যাপ থেকে "সেন্ড মানি" করুন`
                      : `Open ${paymentMethod === 'bkash' ? 'bKash' : 'Nagad'} app and "Send Money"`}
                  </li>
                  <li>
                    {language === 'bn' ? 'নিচের নম্বরে টাকা পাঠান' : 'Send money to the number below'}
                  </li>
                  <li>
                    {language === 'bn'
                      ? `পরিমাণ: ৳${selectedPlan.amount}`
                      : `Amount: ৳${selectedPlan.amount}`}
                  </li>
                  <li>
                    {language === 'bn'
                      ? 'ট্রানজেকশন আইডি নিচে দিন'
                      : 'Enter the Transaction ID below'}
                  </li>
                </ol>
              </div>

              {/* Payment Number */}
              <div className="flex items-center gap-2 bg-card border border-border rounded-xl p-3">
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">
                    {language === 'bn' ? 'পেমেন্ট নম্বর' : 'Payment Number'}
                  </p>
                  <p className="text-lg font-bold tracking-wider text-foreground">{PAYMENT_NUMBER}</p>
                </div>
                <button
                  onClick={handleCopyNumber}
                  className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                >
                  {copied ? <CheckCircle2 className="w-5 h-5 text-success" /> : <Copy className="w-5 h-5 text-muted-foreground" />}
                </button>
              </div>

              {/* Sender Mobile Number */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  {language === 'bn' ? 'আপনার মোবাইল নম্বর *' : 'Your Mobile Number *'}
                </label>
                <Input
                  placeholder={language === 'bn' ? 'যেমন: 01XXXXXXXXX' : 'e.g. 01XXXXXXXXX'}
                  value={senderMobile}
                  onChange={(e) => setSenderMobile(e.target.value)}
                  className="text-base"
                  type="tel"
                />
              </div>

              {/* Transaction ID Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  {language === 'bn' ? 'ট্রানজেকশন আইডি *' : 'Transaction ID *'}
                </label>
                <Input
                  placeholder={language === 'bn' ? 'যেমন: TXN123456789' : 'e.g. TXN123456789'}
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  className="text-base"
                />
              </div>

              {/* Submit Button */}
              <Button
                onClick={handleSubmitPayment}
                disabled={isSubmitting || !transactionId.trim() || !senderMobile.trim()}
                className="w-full py-3 rounded-xl font-semibold"
                size="lg"
              >
                {isSubmitting
                  ? (language === 'bn' ? 'জমা হচ্ছে...' : 'Submitting...')
                  : (language === 'bn' ? '✅ পেমেন্ট জমা দিন' : '✅ Submit Payment')}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                {language === 'bn'
                  ? 'পেমেন্ট যাচাই হলে আপনার প্ল্যান সক্রিয় হবে'
                  : 'Your plan will be activated after payment verification'}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* FAQ / Contact */}
      <ContactDialog open={contactOpen} onOpenChange={setContactOpen} />
      <div className="bg-muted rounded-2xl p-6 text-center animate-fade-in" style={{ animationDelay: '400ms' }}>
        <h3 className="font-semibold text-foreground mb-2">
          {language === 'bn' ? 'প্রশ্ন আছে?' : 'Have Questions?'}
        </h3>
        <p className="text-muted-foreground text-sm mb-4">
          {language === 'bn'
            ? 'আমাদের সাথে যোগাযোগ করুন, আমরা সাহায্য করতে প্রস্তুত'
            : 'Contact us, we are ready to help'}
        </p>
        <button
          onClick={() => setContactOpen(true)}
          className="px-6 py-2.5 bg-card border border-border rounded-xl font-medium hover:bg-background transition-colors touch-target"
        >
          {language === 'bn' ? 'যোগাযোগ করুন' : 'Contact Us'}
        </button>
      </div>
    </div>
  );
}

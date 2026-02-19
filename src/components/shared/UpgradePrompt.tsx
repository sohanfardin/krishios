import { Crown } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigation } from '@/contexts/NavigationContext';

interface Props {
  message?: string;
  messageBn?: string;
}

export function UpgradePrompt({ message, messageBn }: Props) {
  const { language } = useLanguage();
  const { navigateTo } = useNavigation();
  const bn = language === 'bn';

  return (
    <div className="bg-accent/10 border border-accent/30 rounded-xl p-4 flex items-center gap-3">
      <Crown className="w-6 h-6 text-accent-foreground flex-shrink-0" />
      <div className="flex-1">
        <p className="text-sm font-medium text-foreground">
          {bn ? (messageBn || 'এই সুবিধা ব্যবহার করতে প্রিমিয়াম সাবস্ক্রিপশন প্রয়োজন') : (message || 'Upgrade to Premium to use this feature')}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {bn ? 'মাত্র ৳৩৯৯/মাস থেকে শুরু' : 'Starting from just ৳399/month'}
        </p>
      </div>
      <button
        onClick={() => navigateTo('premium')}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors whitespace-nowrap"
      >
        {bn ? 'আপগ্রেড' : 'Upgrade'}
      </button>
    </div>
  );
}

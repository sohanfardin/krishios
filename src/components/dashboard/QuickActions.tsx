import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigation } from '@/contexts/NavigationContext';
import { useActiveFarm } from '@/hooks/useFarm';
import { Plus, Camera, Mic, Calendar, FileText, Wallet, BarChart3, Fish } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AddCropDialog } from '@/components/crops/AddCropDialog';
import { AddLivestockDialog } from '@/components/livestock/AddLivestockDialog';
import { AddPondDialog } from '@/components/fish/AddPondDialog';
import { toast } from 'sonner';

interface QuickAction {
  id: string;
  emoji: string;
  labelBn: string;
  labelEn: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  action: () => void;
}

export function QuickActions() {
  const { language } = useLanguage();
  const { navigateTo } = useNavigation();
  const { farm } = useActiveFarm();
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [showLivestockDialog, setShowLivestockDialog] = useState(false);
  const [showFishDialog, setShowFishDialog] = useState(false);

  const requireFarm = (cb: () => void) => {
    if (!farm) {
      toast.error(language === 'bn' ? 'প্রথমে একটি খামার তৈরি করুন' : 'Please create a farm first');
      return;
    }
    cb();
  };

  const actions: QuickAction[] = [
    {
      id: '1',
      emoji: '🌾',
      labelBn: 'ফসল যোগ করুন',
      labelEn: 'Add Crop',
      icon: <Plus className="w-5 h-5" />,
      color: 'text-primary',
      bgColor: 'bg-primary/10 hover:bg-primary/20',
      action: () => requireFarm(() => setShowCropDialog(true)),
    },
    {
      id: '2',
      emoji: '🐔',
      labelBn: 'পশু যোগ করুন',
      labelEn: 'Add Livestock',
      icon: <Plus className="w-5 h-5" />,
      color: 'text-secondary',
      bgColor: 'bg-secondary/10 hover:bg-secondary/20',
      action: () => requireFarm(() => setShowLivestockDialog(true)),
    },
    {
      id: '3',
      emoji: '🐟',
      labelBn: 'মাছ চাষ',
      labelEn: 'Fish Farming',
      icon: <Fish className="w-5 h-5" />,
      color: 'text-info',
      bgColor: 'bg-info/10 hover:bg-info/20',
      action: () => requireFarm(() => setShowFishDialog(true)),
    },
    {
      id: '4',
      emoji: '📷',
      labelBn: 'রোগ শনাক্ত করুন',
      labelEn: 'Detect Disease',
      icon: <Camera className="w-5 h-5" />,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10 hover:bg-destructive/20',
      action: () => navigateTo('ai', { mode: 'camera' }),
    },
    {
      id: '5',
      emoji: '🎙️',
      labelBn: 'ভয়েস ইনপুট',
      labelEn: 'Voice Input',
      icon: <Mic className="w-5 h-5" />,
      color: 'text-accent-foreground',
      bgColor: 'bg-accent/30 hover:bg-accent/50',
      action: () => navigateTo('ai', { mode: 'voice' }),
    },
    {
      id: '6',
      emoji: '💰',
      labelBn: 'হিসাব',
      labelEn: 'Accounts',
      icon: <Wallet className="w-5 h-5" />,
      color: 'text-success',
      bgColor: 'bg-success/10 hover:bg-success/20',
      action: () => navigateTo('finance'),
    },
    {
      id: '7',
      emoji: '📊',
      labelBn: 'উৎপাদন',
      labelEn: 'Production',
      icon: <BarChart3 className="w-5 h-5" />,
      color: 'text-warning',
      bgColor: 'bg-warning/10 hover:bg-warning/20',
      action: () => navigateTo('production'),
    },
  ];

  return (
    <>
      <div className="bg-card rounded-2xl p-4 sm:p-5 shadow-sm border border-border animate-slide-up">
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <span className="text-lg sm:text-xl">⚡</span>
          <h3 className="text-base sm:text-lg font-semibold text-foreground">
            {language === 'bn' ? 'দ্রুত কাজ' : 'Quick Actions'}
          </h3>
        </div>

        {/* Mobile: horizontal scroll strip */}
        <div className="flex gap-2 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide sm:hidden -mx-1 px-1">
          {actions.map((action, index) => (
            <button
              key={action.id}
              data-tutorial-id={`quick-${action.id}`}
              onClick={action.action}
              className={cn(
                "flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all snap-start shrink-0 w-[72px] animate-fade-in",
                action.bgColor
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <span className="text-xl">{action.emoji}</span>
              <span className="text-[10px] font-medium text-foreground text-center leading-tight line-clamp-2">
                {language === 'bn' ? action.labelBn : action.labelEn}
              </span>
            </button>
          ))}
        </div>

        {/* Desktop/Tablet: grid */}
        <div className="hidden sm:grid sm:grid-cols-4 md:grid-cols-7 gap-3">
          {actions.map((action, index) => (
            <button
              key={action.id}
              data-tutorial-id={`quick-${action.id}`}
              onClick={action.action}
              className={cn(
                "flex flex-col items-center gap-2 p-4 rounded-xl transition-all touch-target animate-fade-in",
                action.bgColor
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <span className="text-2xl">{action.emoji}</span>
              <span className="text-xs font-medium text-foreground text-center leading-tight">
                {language === 'bn' ? action.labelBn : action.labelEn}
              </span>
            </button>
          ))}
        </div>
      </div>

      {farm && (
        <>
          <AddCropDialog open={showCropDialog} onOpenChange={setShowCropDialog} farmId={farm.id} />
          <AddLivestockDialog open={showLivestockDialog} onOpenChange={setShowLivestockDialog} farmId={farm.id} />
          <AddPondDialog open={showFishDialog} onOpenChange={setShowFishDialog} farmId={farm.id} existingPondCount={0} />
        </>
      )}
    </>
  );
}

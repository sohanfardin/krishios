import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { X, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TutorialStep {
  emoji: string;
  titleBn: string;
  descBn: string;
  targetId?: string;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    emoji: '👋',
    titleBn: 'কৃষিOS-এ স্বাগতম!',
    descBn: 'এটি আপনার কৃষি ব্যবস্থাপনা অ্যাপ। আসুন জেনে নেই কোন বাটন কী কাজ করে।',
  },
  {
    emoji: '🏠',
    titleBn: 'ড্যাশবোর্ড',
    descBn: 'এটি আপনার হোম পেজ। খামারের সকল সারাংশ — ফসল, পশু, আবহাওয়া, সতর্কতা সব এক জায়গায় দেখুন।',
    targetId: 'nav-dashboard',
  },
  {
    emoji: '🌾',
    titleBn: 'ফসল',
    descBn: 'সকল ফসলের তালিকা দেখুন। নতুন ফসল যোগ করুন — জমির আকার, রোপণের তারিখ, সার ব্যবহার সব তথ্য রাখুন।',
    targetId: 'nav-crops',
  },
  {
    emoji: '🐔',
    titleBn: 'পশুপালন',
    descBn: 'গরু, ছাগল, মুরগি সব পশুর তথ্য রাখুন। খাদ্য খরচ, ওষুধ, টিকার ইতিহাস ট্র্যাক করুন।',
    targetId: 'nav-livestock',
  },
  {
    emoji: '🐟',
    titleBn: 'মাছ চাষ',
    descBn: 'পুকুরের তথ্য, মাছের প্রজাতি, পোনা সংখ্যা, খাবার খরচ পরিচালনা করুন।',
    targetId: 'nav-fish-farming',
  },
  {
    emoji: '🛒',
    titleBn: 'বাজারদর',
    descBn: 'দৈনিক বাজারদর দেখুন। চাল, গম, পেঁয়াজ সব পণ্যের আজকের দাম জানুন।',
    targetId: 'nav-marketplace',
  },
  {
    emoji: '💰',
    titleBn: 'হিসাব',
    descBn: 'আয়-ব্যয়ের হিসাব রাখুন। লাভ-ক্ষতি বিশ্লেষণ দেখুন।',
    targetId: 'nav-finance',
  },
  {
    emoji: '📊',
    titleBn: 'উৎপাদন',
    descBn: 'ফসল কাটার পর উৎপাদন তথ্য লিখুন। মৌসুম অনুযায়ী তুলনা ও AI বিশ্লেষণ পান।',
    targetId: 'nav-production',
  },
  {
    emoji: '📅',
    titleBn: 'সময়সূচী',
    descBn: 'সেচ, সার, ওষুধ দেওয়ার সময়সূচী তৈরি করুন এবং রিমাইন্ডার পান।',
    targetId: 'nav-schedule',
  },
  {
    emoji: '🤖',
    titleBn: 'এআই পরামর্শ',
    descBn: 'ছবি তুলে রোগ শনাক্ত করুন। বাংলায় কথা বলে সমস্যা জানান। AI পরামর্শ দেবে।',
    targetId: 'nav-ai',
  },
  {
    emoji: '📷',
    titleBn: 'রোগ শনাক্ত করুন',
    descBn: 'ফসল বা পশুর ছবি তুলুন — AI স্বয়ংক্রিয়ভাবে রোগ চিনে নেবে এবং চিকিৎসার পরামর্শ দেবে।',
    targetId: 'quick-4',
  },
  {
    emoji: '⚙️',
    titleBn: 'সেটিংস',
    descBn: 'প্রোফাইল আপডেট, ভাষা পরিবর্তন, পাসওয়ার্ড পরিবর্তন করুন।',
    targetId: 'nav-settings',
  },
  {
    emoji: '👑',
    titleBn: 'প্রিমিয়াম',
    descBn: 'আপগ্রেড করলে আনলিমিটেড AI পরামর্শ, ভয়েস ইনপুট, রোগ শনাক্তকরণ পাবেন।',
    targetId: 'nav-premium',
  },
  {
    emoji: '✅',
    titleBn: 'টিউটোরিয়াল শেষ!',
    descBn: 'আপনি এখন সব ফিচার জানেন! যেকোনো সমস্যায় AI পরামর্শ ব্যবহার করুন। শুভকামনা!',
  },
];

interface TutorialOverlayProps {
  open: boolean;
  onClose: () => void;
}

export function TutorialOverlay({ open, onClose }: TutorialOverlayProps) {
  const [step, setStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Find the target element and get its position
  useEffect(() => {
    if (!open) { setTargetRect(null); return; }
    const current = TUTORIAL_STEPS[step];
    if (!current.targetId) { setTargetRect(null); return; }

    const findTarget = () => {
      const el = document.querySelector(`[data-tutorial-id="${current.targetId}"]`);
      if (el) {
        // Check if element is actually visible (not hidden by sidebar collapse on mobile)
        const rect = el.getBoundingClientRect();
        const isVisible = rect.width > 0 && rect.height > 0 && 
          rect.top >= 0 && rect.top < window.innerHeight &&
          rect.left >= 0 && rect.left < window.innerWidth;
        
        if (isVisible) {
          if (!isMobile) {
            el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
          setTimeout(() => {
            setTargetRect(el.getBoundingClientRect());
          }, 100);
        } else {
          setTargetRect(null);
        }
      } else {
        setTargetRect(null);
      }
    };

    const timer = setTimeout(findTarget, 200);
    return () => clearTimeout(timer);
  }, [step, open, isMobile]);

  useEffect(() => {
    if (!open) { setStep(0); setTargetRect(null); }
  }, [open]);

  if (!open) return null;

  const current = TUTORIAL_STEPS[step];
  const isLast = step === TUTORIAL_STEPS.length - 1;
  const isFirst = step === 0;
  const hasTarget = !!targetRect;

  const handleNext = () => { if (isLast) onClose(); else setStep(s => s + 1); };
  const handlePrev = () => { if (!isFirst) setStep(s => s - 1); };
  const handleSkip = () => { onClose(); };

  // Desktop: card positioned next to target
  const getDesktopCardStyle = (): React.CSSProperties => {
    if (!hasTarget || isMobile) return {};
    const cardW = 360;
    const targetCenterY = targetRect!.top + targetRect!.height / 2;
    const cardH = 280;
    let top = targetCenterY - cardH / 2;
    let left = targetRect!.right + 24;
    
    if (top < 10) top = 10;
    if (top + cardH > window.innerHeight - 10) top = window.innerHeight - cardH - 10;
    if (left + cardW > window.innerWidth - 10) left = window.innerWidth - cardW - 10;
    if (left < 10) left = 10;

    return { position: 'fixed', top, left, width: cardW, zIndex: 103 };
  };

  // Mobile: render pulsing circle highlight on visible target
  const renderMobileHighlight = () => {
    if (!isMobile || !hasTarget || !targetRect) return null;
    const cx = targetRect.left + targetRect.width / 2;
    const cy = targetRect.top + targetRect.height / 2;
    
    return (
      <>
        {/* Highlight border around target */}
        <div
          className="fixed z-[101] rounded-xl border-2 border-primary bg-primary/10 transition-all duration-500"
          style={{
            left: targetRect.left - 4,
            top: targetRect.top - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
          }}
        />
        {/* Pulsing circle */}
        <div className="fixed inset-0 pointer-events-none z-[102]">
          <svg className="w-full h-full">
            <circle cx={cx} cy={cy} r="24" fill="none" stroke="hsl(var(--primary))" strokeWidth="3" opacity="0.8">
              <animate attributeName="r" values="20;30;20" dur="1.5s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.8;0.3;0.8" dur="1.5s" repeatCount="indefinite" />
            </circle>
          </svg>
        </div>
      </>
    );
  };

  // Desktop: arrow SVG pointing from card to target
  const renderDesktopArrow = () => {
    if (isMobile || !hasTarget || !targetRect) return null;
    const targetCenterX = targetRect.right + 4;
    const targetCenterY = targetRect.top + targetRect.height / 2;
    
    return (
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 102 }}>
        <svg className="w-full h-full">
          <circle cx={targetRect.left + targetRect.width / 2} cy={targetCenterY} r="24" fill="none" stroke="hsl(var(--primary))" strokeWidth="3" opacity="0.8">
            <animate attributeName="r" values="20;28;20" dur="1.5s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.8;0.3;0.8" dur="1.5s" repeatCount="indefinite" />
          </circle>
          <line
            x1={targetCenterX + 20}
            y1={targetCenterY}
            x2={targetCenterX + 16}
            y2={targetCenterY}
            stroke="hsl(var(--primary))"
            strokeWidth="3"
            strokeDasharray="6,4"
            markerEnd="url(#arrowhead)"
          >
            <animate attributeName="stroke-dashoffset" values="0;-20" dur="1s" repeatCount="indefinite" />
          </line>
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="hsl(var(--primary))" />
            </marker>
          </defs>
        </svg>
      </div>
    );
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[100] bg-black/50" onClick={(e) => e.stopPropagation()} />

      {/* Desktop: target highlight + arrow */}
      {!isMobile && hasTarget && (
        <div
          className="fixed z-[101] rounded-xl border-2 border-primary bg-primary/10 transition-all duration-500"
          style={{
            left: targetRect!.left - 4,
            top: targetRect!.top - 4,
            width: targetRect!.width + 8,
            height: targetRect!.height + 8,
          }}
        />
      )}
      {renderDesktopArrow()}

      {/* Mobile: highlight on visible targets */}
      {renderMobileHighlight()}

      {/* Tutorial Card */}
      <div
        ref={cardRef}
        className={cn(
          "z-[103] bg-card rounded-2xl shadow-2xl border border-border overflow-hidden animate-scale-in",
          // Mobile: bottom sheet
          isMobile && "fixed bottom-0 left-0 right-0 rounded-b-none max-h-[60vh]",
          // Desktop without target: centered modal
          !isMobile && !hasTarget && "fixed inset-0 m-auto w-full max-w-sm h-fit",
        )}
        style={!isMobile && hasTarget ? getDesktopCardStyle() : undefined}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-border bg-primary/5">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" />
            <span className="font-semibold text-foreground text-xs">
              টিউটোরিয়াল ({step + 1}/{TUTORIAL_STEPS.length})
            </span>
          </div>
          <button onClick={handleSkip} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-muted">
          <div className="h-full bg-primary transition-all duration-500 rounded-r-full" style={{ width: `${((step + 1) / TUTORIAL_STEPS.length) * 100}%` }} />
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 text-center space-y-2 sm:space-y-3">
          <div className="text-4xl sm:text-5xl">{current.emoji}</div>
          <h2 className="text-base sm:text-lg font-bold text-foreground">{current.titleBn}</h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{current.descBn}</p>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-border flex items-center justify-between gap-2 pb-safe">
          <Button variant="ghost" size="sm" onClick={handleSkip} className="text-muted-foreground text-xs">স্কিপ করুন</Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePrev} disabled={isFirst} className="h-8 w-8 p-0">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button size="sm" onClick={handleNext} className="px-4 text-xs">
              {isLast ? '✅ শুরু করুন' : 'পরবর্তী'}
              {!isLast && <ChevronRight className="w-3 h-3 ml-1" />}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

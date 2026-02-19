import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { ContactDialog } from '@/components/contact/ContactDialog';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, Wheat, Bird, ShoppingBag, Sparkles, Settings, Crown, Menu, X, ChevronRight, Wallet, MessageSquare
} from 'lucide-react';

interface NavItem {
  key: string;
  icon: React.ReactNode;
  emoji: string;
  href: string;
  labelBn: string;
  labelEn: string;
}

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

export function Sidebar({ currentPage, onPageChange }: SidebarProps) {
  const { t, language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const bn = language === 'bn';

  const navItems: NavItem[] = [
    { key: 'dashboard', icon: <LayoutDashboard className="w-5 h-5" />, emoji: '🏠', href: 'dashboard', labelBn: 'ড্যাশবোর্ড', labelEn: 'Dashboard' },
    { key: 'crops', icon: <Wheat className="w-5 h-5" />, emoji: '🌾', href: 'crops', labelBn: 'ফসল', labelEn: 'Crops' },
    { key: 'livestock', icon: <Bird className="w-5 h-5" />, emoji: '🐔', href: 'livestock', labelBn: 'পশুপালন', labelEn: 'Livestock' },
    { key: 'fish-farming', icon: <Bird className="w-5 h-5" />, emoji: '🐟', href: 'fish-farming', labelBn: 'মাছ চাষ', labelEn: 'Fish Farming' },
    { key: 'marketplace', icon: <ShoppingBag className="w-5 h-5" />, emoji: '🛒', href: 'marketplace', labelBn: 'বাজার দর', labelEn: 'Market Prices' },
    { key: 'finance', icon: <Wallet className="w-5 h-5" />, emoji: '💰', href: 'finance', labelBn: 'হিসাব', labelEn: 'Accounts' },
    { key: 'production', icon: <LayoutDashboard className="w-5 h-5" />, emoji: '📊', href: 'production', labelBn: 'উৎপাদন', labelEn: 'Production' },
    { key: 'schedule', icon: <LayoutDashboard className="w-5 h-5" />, emoji: '📅', href: 'schedule', labelBn: 'সময়সূচী', labelEn: 'Schedule' },
    { key: 'ai', icon: <Sparkles className="w-5 h-5" />, emoji: '🤖', href: 'ai', labelBn: 'এআই পরামর্শ', labelEn: 'AI Advisor' },
  ];

  const bottomItems: NavItem[] = [
    { key: 'settings', icon: <Settings className="w-5 h-5" />, emoji: '⚙️', href: 'settings', labelBn: 'সেটিংস', labelEn: 'Settings' },
  ];

  const NavButton = ({ item, isActive }: { item: NavItem; isActive: boolean }) => (
    <button
      data-tutorial-id={`nav-${item.href}`}
      onClick={() => { onPageChange(item.href); setIsOpen(false); }}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 touch-target",
        "hover:bg-sidebar-accent group",
        isActive && "bg-sidebar-accent shadow-lg"
      )}
    >
      <span className="text-xl">{item.emoji}</span>
      <span className={cn("flex-1 text-left font-medium", isActive ? "text-sidebar-primary" : "text-sidebar-foreground")}>
        {bn ? item.labelBn : item.labelEn}
      </span>
      {isActive && <ChevronRight className="w-4 h-4 text-sidebar-primary" />}
    </button>
  );

  return (
    <>
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-sidebar px-4 py-3 flex items-center justify-between shadow-lg">
        <button onClick={() => { onPageChange('dashboard'); setIsOpen(false); }} className="flex items-center gap-2">
          <span className="text-2xl">🌾</span>
          <span className="text-xl font-bold text-sidebar-foreground">KrishiOS</span>
        </button>
        <button onClick={() => setIsOpen(!isOpen)} className="p-2 rounded-lg bg-sidebar-accent text-sidebar-foreground touch-target">
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {isOpen && <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setIsOpen(false)} />}

      <aside className={cn("fixed lg:static inset-y-0 left-0 z-50 w-72 bg-sidebar flex flex-col transition-transform duration-300", "lg:translate-x-0", isOpen ? "translate-x-0" : "-translate-x-full")}>
        <div className="p-6 border-b border-sidebar-border">
          <button onClick={() => onPageChange('dashboard')} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-12 h-12 rounded-2xl bg-gradient-accent flex items-center justify-center shadow-lg"><span className="text-2xl">🌾</span></div>
            <div className="text-left">
              <h1 className="text-xl font-bold text-sidebar-foreground">KrishiOS</h1>
              <p className="text-xs text-sidebar-foreground/70">কৃষি ব্যবস্থাপনা</p>
            </div>
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map(item => <NavButton key={item.key} item={item} isActive={currentPage === item.href} />)}
        </nav>
        <div className="p-4">
          <button data-tutorial-id="nav-premium" onClick={() => onPageChange('premium')} className="w-full p-4 rounded-2xl bg-gradient-accent text-accent-foreground transition-all hover:shadow-glow-accent">
            <div className="flex items-center gap-3">
              <Crown className="w-6 h-6" />
              <div className="text-left">
                <p className="font-bold">{bn ? 'প্রিমিয়াম' : 'Premium'}</p>
                <p className="text-xs opacity-80">{bn ? 'সম্পূর্ণ এআই পরামর্শ পান' : 'Get full AI insights'}</p>
              </div>
            </div>
          </button>
        </div>
        <div className="p-4 border-t border-sidebar-border space-y-2">
          <button
            onClick={() => { setContactOpen(true); setIsOpen(false); }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 touch-target hover:bg-sidebar-accent group"
          >
            <span className="text-xl">📩</span>
            <span className="flex-1 text-left font-medium text-sidebar-foreground">
              {bn ? 'যোগাযোগ করুন' : 'Contact Us'}
            </span>
          </button>
          {bottomItems.map(item => <NavButton key={item.key} item={item} isActive={currentPage === item.href} />)}
        </div>
        <ContactDialog open={contactOpen} onOpenChange={setContactOpen} />
      </aside>
    </>
  );
}

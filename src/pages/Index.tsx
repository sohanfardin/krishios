import { useState, useEffect } from 'react';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { NavigationContext } from '@/contexts/NavigationContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Dashboard } from './Dashboard';
import { CropsPage } from './CropsPage';
import { LivestockPage } from './LivestockPage';
import { FishFarmingPage } from './FishFarmingPage';
import { MarketplacePage } from './MarketplacePage';
import { AIPage } from './AIPage';
import { PremiumPage } from './PremiumPage';
import { SettingsPage } from './SettingsPage';
import { FinancePage } from './FinancePage';
import { SchedulePage } from './SchedulePage';
import { ProductionPage } from './ProductionPage';
import { TutorialOverlay } from '@/components/tutorial/TutorialOverlay';
import { useActiveFarm, useCreateFarm } from '@/hooks/useFarm';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

function AppContent() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [navParams, setNavParams] = useState<Record<string, any>>({});
  const [pageHistory, setPageHistory] = useState<string[]>([]);
  const { farm, isLoading } = useActiveFarm();
  const { user } = useAuth();
  const createFarm = useCreateFarm();
  const [autoCreating, setAutoCreating] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  // Show tutorial for new users (check localStorage)
  useEffect(() => {
    if (!user) return;
    const key = `tutorial_seen_${user.id}`;
    if (!localStorage.getItem(key)) {
      // Delay slightly so dashboard loads first
      const timer = setTimeout(() => setShowTutorial(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const handleTutorialClose = () => {
    setShowTutorial(false);
    if (user) localStorage.setItem(`tutorial_seen_${user.id}`, 'true');
  };

  const handleOpenTutorial = () => setShowTutorial(true);

  // Auto-create farm from profile data if none exists
  useEffect(() => {
    if (isLoading || farm || autoCreating || !user) return;
    
    const autoCreateFarm = async () => {
      setAutoCreating(true);
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, district, upazila, farmer_type')
          .eq('user_id', user.id)
          .maybeSingle();

        const farmType = profile?.farmer_type?.[0] || 'mixed';
        const farmName = profile?.full_name 
          ? `${profile.full_name}-এর খামার` 
          : 'আমার খামার';

        await createFarm.mutateAsync({
          name: farmName,
          type: farmType,
          district: profile?.district || undefined,
          upazila: profile?.upazila || undefined,
        });
      } catch (err) {
        console.error('Auto farm creation failed:', err);
      }
      setAutoCreating(false);
    };

    autoCreateFarm();
  }, [isLoading, farm, user, autoCreating]);

  const navigateTo = (page: string, params?: Record<string, any>) => {
    if (page !== currentPage) {
      setPageHistory(prev => [...prev, currentPage]);
    }
    setCurrentPage(page);
    setNavParams(params || {});
  };

  const goBack = () => {
    if (pageHistory.length > 0) {
      const prevPage = pageHistory[pageHistory.length - 1];
      setPageHistory(prev => prev.slice(0, -1));
      setCurrentPage(prevPage);
      setNavParams({});
    } else {
      setCurrentPage('dashboard');
      setNavParams({});
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard onOpenTutorial={handleOpenTutorial} />;
      case 'crops': return <CropsPage />;
      case 'livestock': return <LivestockPage />;
      case 'fish-farming': return <FishFarmingPage />;
      case 'marketplace': return <MarketplacePage />;
      case 'finance': return <FinancePage />;
      case 'production': return <ProductionPage />;
      case 'schedule': return <SchedulePage />;
      case 'ai': return <AIPage />;
      case 'premium': return <PremiumPage />;
      case 'settings': return <SettingsPage />;
      default: return <Dashboard />;
    }
  };

  return (
    <NavigationContext.Provider value={{ navigateTo, goBack, currentPage, navParams }}>
      <div className="h-screen bg-background flex overflow-hidden">
        <Sidebar currentPage={currentPage} onPageChange={(p) => navigateTo(p)} />
        <div className="flex-1 flex flex-col min-w-0 h-full">
          <Header />
          <main className="flex-1 p-3 sm:p-4 lg:p-6 overflow-y-auto min-h-0" id="main-scroll-container">
            {renderPage()}
          </main>
        </div>
      </div>
      <TutorialOverlay open={showTutorial} onClose={handleTutorialClose} />
    </NavigationContext.Provider>
  );
}

const Index = () => {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
};

export default Index;

import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'bn' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  bn: {
    // Navigation
    'nav.dashboard': 'ড্যাশবোর্ড',
    'nav.crops': 'ফসল',
    'nav.livestock': 'পশুপালন',
    'nav.marketplace': 'বাজার',
    'nav.ai': 'এআই পরামর্শ',
    'nav.settings': 'সেটিংস',
    'nav.premium': 'প্রিমিয়াম',
    
    // Dashboard
    'dashboard.title': 'স্বাগতম, কৃষক ভাই!',
    'dashboard.subtitle': 'আজকের আপনার খামারের অবস্থা দেখুন',
    'dashboard.totalFarms': 'মোট খামার',
    'dashboard.activeCrops': 'সক্রিয় ফসল',
    'dashboard.livestock': 'পশুসম্পদ',
    'dashboard.alerts': 'সতর্কতা',
    'dashboard.weather': 'আবহাওয়া',
    'dashboard.today': 'আজ',
    'dashboard.thisWeek': 'এই সপ্তাহে',
    'dashboard.thisMonth': 'এই মাসে',
    'dashboard.profit': 'আয়',
    'dashboard.expenses': 'খরচ',
    'dashboard.netProfit': 'নিট লাভ',
    
    // Crops
    'crops.title': 'ফসল ব্যবস্থাপনা',
    'crops.rice': 'ধান',
    'crops.wheat': 'গম',
    'crops.vegetables': 'সবজি',
    'crops.fruits': 'ফল',
    'crops.jute': 'পাট',
    'crops.sugarcane': 'আখ',
    'crops.addNew': 'নতুন ফসল যোগ করুন',
    'crops.health': 'স্বাস্থ্য',
    'crops.yield': 'উৎপাদন',
    'crops.stage': 'পর্যায়',
    
    // Livestock
    'livestock.title': 'পশুপালন ব্যবস্থাপনা',
    'livestock.chicken': 'মুরগি',
    'livestock.cow': 'গরু',
    'livestock.goat': 'ছাগল',
    'livestock.duck': 'হাঁস',
    'livestock.pigeon': 'কবুতর',
    'livestock.eggs': 'ডিম',
    'livestock.milk': 'দুধ',
    'livestock.meat': 'মাংস',
    'livestock.feed': 'খাদ্য',
    'livestock.health': 'স্বাস্থ্য',
    'livestock.vaccination': 'টিকা',
    
    // Alerts
    'alert.disease': 'রোগের সতর্কতা',
    'alert.weather': 'আবহাওয়া সতর্কতা',
    'alert.vaccination': 'টিকা মনে করিয়ে দিন',
    'alert.harvest': 'ফসল তোলার সময়',
    'alert.lowStock': 'খাদ্য স্টক কম',
    
    // AI
    'ai.title': 'এআই পরামর্শ',
    'ai.recommendations': 'সুপারিশ',
    'ai.explainWhy': 'কেন?',
    'ai.predictions': 'পূর্বাভাস',
    'ai.optimization': 'অপটিমাইজেশন',
    
    // Marketplace
    'marketplace.title': 'বাজার',
    'marketplace.seeds': 'বীজ',
    'marketplace.fertilizers': 'সার',
    'marketplace.pesticides': 'কীটনাশক',
    'marketplace.feed': 'পশু খাদ্য',
    'marketplace.medicine': 'ওষুধ',
    'marketplace.trusted': 'বিশ্বস্ত বিক্রেতা',
    'marketplace.nearby': 'কাছাকাছি',
    
    // Common
    'common.add': 'যোগ করুন',
    'common.edit': 'সম্পাদনা',
    'common.delete': 'মুছুন',
    'common.save': 'সংরক্ষণ',
    'common.cancel': 'বাতিল',
    'common.search': 'অনুসন্ধান',
    'common.filter': 'ফিল্টার',
    'common.viewAll': 'সব দেখুন',
    'common.loading': 'লোড হচ্ছে...',
    'common.noData': 'কোনো তথ্য নেই',
    'common.success': 'সফল',
    'common.error': 'ত্রুটি',
    'common.taka': '৳',
    'common.kg': 'কেজি',
    'common.liter': 'লিটার',
    'common.piece': 'টি',
    
    // Premium
    'premium.title': 'প্রিমিয়াম সদস্যতা',
    'premium.subtitle': 'সম্পূর্ণ এআই পরামর্শ পান',
    'premium.features': 'সুবিধাসমূহ',
    'premium.subscribe': 'সাবস্ক্রাইব করুন',
    
    // Weather
    'weather.sunny': 'রোদ',
    'weather.cloudy': 'মেঘলা',
    'weather.rainy': 'বৃষ্টি',
    'weather.humidity': 'আর্দ্রতা',
    'weather.wind': 'বাতাস',
    
    // Stats
    'stats.totalProduction': 'মোট উৎপাদন',
    'stats.estimatedRevenue': 'আনুমানিক আয়',
    'stats.healthyAnimals': 'সুস্থ পশু',
    'stats.pendingTasks': 'বাকি কাজ',
  },
  en: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.crops': 'Crops',
    'nav.livestock': 'Livestock',
    'nav.marketplace': 'Marketplace',
    'nav.ai': 'AI Insights',
    'nav.settings': 'Settings',
    'nav.premium': 'Premium',
    
    // Dashboard
    'dashboard.title': 'Welcome, Farmer!',
    'dashboard.subtitle': 'View your farm status today',
    'dashboard.totalFarms': 'Total Farms',
    'dashboard.activeCrops': 'Active Crops',
    'dashboard.livestock': 'Livestock',
    'dashboard.alerts': 'Alerts',
    'dashboard.weather': 'Weather',
    'dashboard.today': 'Today',
    'dashboard.thisWeek': 'This Week',
    'dashboard.thisMonth': 'This Month',
    'dashboard.profit': 'Revenue',
    'dashboard.expenses': 'Expenses',
    'dashboard.netProfit': 'Net Profit',
    
    // Crops
    'crops.title': 'Crop Management',
    'crops.rice': 'Rice',
    'crops.wheat': 'Wheat',
    'crops.vegetables': 'Vegetables',
    'crops.fruits': 'Fruits',
    'crops.jute': 'Jute',
    'crops.sugarcane': 'Sugarcane',
    'crops.addNew': 'Add New Crop',
    'crops.health': 'Health',
    'crops.yield': 'Yield',
    'crops.stage': 'Stage',
    
    // Livestock
    'livestock.title': 'Livestock Management',
    'livestock.chicken': 'Chicken',
    'livestock.cow': 'Cow',
    'livestock.goat': 'Goat',
    'livestock.duck': 'Duck',
    'livestock.pigeon': 'Pigeon',
    'livestock.eggs': 'Eggs',
    'livestock.milk': 'Milk',
    'livestock.meat': 'Meat',
    'livestock.feed': 'Feed',
    'livestock.health': 'Health',
    'livestock.vaccination': 'Vaccination',
    
    // Alerts
    'alert.disease': 'Disease Alert',
    'alert.weather': 'Weather Alert',
    'alert.vaccination': 'Vaccination Reminder',
    'alert.harvest': 'Harvest Time',
    'alert.lowStock': 'Low Feed Stock',
    
    // AI
    'ai.title': 'AI Insights',
    'ai.recommendations': 'Recommendations',
    'ai.explainWhy': 'Why?',
    'ai.predictions': 'Predictions',
    'ai.optimization': 'Optimization',
    
    // Marketplace
    'marketplace.title': 'Marketplace',
    'marketplace.seeds': 'Seeds',
    'marketplace.fertilizers': 'Fertilizers',
    'marketplace.pesticides': 'Pesticides',
    'marketplace.feed': 'Animal Feed',
    'marketplace.medicine': 'Medicine',
    'marketplace.trusted': 'Trusted Sellers',
    'marketplace.nearby': 'Nearby',
    
    // Common
    'common.add': 'Add',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.viewAll': 'View All',
    'common.loading': 'Loading...',
    'common.noData': 'No data',
    'common.success': 'Success',
    'common.error': 'Error',
    'common.taka': '৳',
    'common.kg': 'kg',
    'common.liter': 'L',
    'common.piece': 'pcs',
    
    // Premium
    'premium.title': 'Premium Membership',
    'premium.subtitle': 'Get full AI insights',
    'premium.features': 'Features',
    'premium.subscribe': 'Subscribe',
    
    // Weather
    'weather.sunny': 'Sunny',
    'weather.cloudy': 'Cloudy',
    'weather.rainy': 'Rainy',
    'weather.humidity': 'Humidity',
    'weather.wind': 'Wind',
    
    // Stats
    'stats.totalProduction': 'Total Production',
    'stats.estimatedRevenue': 'Estimated Revenue',
    'stats.healthyAnimals': 'Healthy Animals',
    'stats.pendingTasks': 'Pending Tasks',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('bn');

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

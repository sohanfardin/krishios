import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useActiveFarm } from '@/hooks/useFarm';

export interface SearchResult {
  id: string;
  type: 'crop' | 'livestock' | 'task' | 'page';
  title: string;
  titleBn?: string;
  subtitle?: string;
  icon: string;
  page: string;
}

const pageLinks: SearchResult[] = [
  { id: 'page-crops', type: 'page', title: 'Crops', titleBn: 'ফসল', icon: '🌾', page: 'crops', subtitle: 'Manage your crops' },
  { id: 'page-livestock', type: 'page', title: 'Livestock', titleBn: 'পশুপালন', icon: '🐄', page: 'livestock', subtitle: 'Manage livestock' },
  { id: 'page-market', type: 'page', title: 'Market Prices', titleBn: 'বাজার দর', icon: '📊', page: 'marketplace', subtitle: 'View market prices' },
  { id: 'page-finance', type: 'page', title: 'Finance', titleBn: 'আর্থিক', icon: '💰', page: 'finance', subtitle: 'Financial reports' },
  { id: 'page-schedule', type: 'page', title: 'Schedule', titleBn: 'সময়সূচী', icon: '📅', page: 'schedule', subtitle: 'Task scheduling' },
  { id: 'page-ai', type: 'page', title: 'AI Advisory', titleBn: 'এআই পরামর্শ', icon: '🤖', page: 'ai', subtitle: 'Smart recommendations' },
  { id: 'page-settings', type: 'page', title: 'Settings', titleBn: 'সেটিংস', icon: '⚙️', page: 'settings', subtitle: 'Profile & settings' },
  { id: 'page-dashboard', type: 'page', title: 'Dashboard', titleBn: 'ড্যাশবোর্ড', icon: '🏠', page: 'dashboard', subtitle: 'Overview' },
  { id: 'page-premium', type: 'page', title: 'Premium', titleBn: 'প্রিমিয়াম', icon: '⭐', page: 'premium', subtitle: 'Upgrade plan' },
];

// Banglish aliases for fuzzy matching
const banglishMap: Record<string, string[]> = {
  crops: ['fosol', 'fasal', 'shosho', 'crop', 'ফসল'],
  livestock: ['poshu', 'pashu', 'poshupalon', 'গরু', 'ছাগল', 'মুরগি', 'হাঁস', 'মহিষ', 'কবুতর', 'cow', 'goat', 'chicken', 'duck', 'buffalo', 'pigeon', 'পশুপালন', 'পশু'],
  marketplace: ['bazar', 'bazaar', 'market', 'dam', 'dor', 'বাজার', 'দর', 'বাজার দর', 'bajar'],
  finance: ['taka', 'arthik', 'artha', 'money', 'hisab', 'income', 'expense', 'আর্থিক', 'টাকা', 'হিসাব', 'আয়', 'ব্যয়'],
  schedule: ['somoy', 'somoysuchi', 'tafsil', 'calendar', 'সময়সূচী', 'সময়', 'তাফসিল', 'kaj', 'কাজ', 'task'],
  ai: ['ai', 'poramorsho', 'suggestion', 'poramersh', 'এআই', 'পরামর্শ', 'এআই পরামর্শ', 'smart', 'bujhdhar'],
  settings: ['settings', 'profile', 'সেটিংস', 'প্রোফাইল'],
  dashboard: ['dashboard', 'home', 'ড্যাশবোর্ড', 'হোম'],
  premium: ['premium', 'pro', 'upgrade', 'প্রিমিয়াম'],
};

function matchesTerm(text: string, query: string): boolean {
  return text.toLowerCase().includes(query);
}

export function useGlobalSearch(query: string) {
  const { farm } = useActiveFarm();
  const farmId = farm?.id;
  const trimmed = query.trim().toLowerCase();

  const { data: crops } = useQuery({
    queryKey: ['search-crops', farmId],
    queryFn: async () => {
      const { data } = await supabase.from('crops').select('id, name, variety, growth_stage').eq('farm_id', farmId!);
      return data ?? [];
    },
    enabled: !!farmId,
    staleTime: 30000,
  });

  const { data: livestock } = useQuery({
    queryKey: ['search-livestock', farmId],
    queryFn: async () => {
      const { data } = await supabase.from('livestock').select('id, animal_type, breed, count').eq('farm_id', farmId!);
      return data ?? [];
    },
    enabled: !!farmId,
    staleTime: 30000,
  });

  const { data: tasks } = useQuery({
    queryKey: ['search-tasks', farmId],
    queryFn: async () => {
      const { data } = await supabase.from('farm_tasks').select('id, title, title_bn, task_type, is_completed').eq('farm_id', farmId!);
      return data ?? [];
    },
    enabled: !!farmId,
    staleTime: 30000,
  });

  const results = useMemo<SearchResult[]>(() => {
    if (trimmed.length === 0) return [];

    const out: SearchResult[] = [];

    // 1. Match page links via title, titleBn, and banglish aliases
    pageLinks.forEach(p => {
      const directMatch = matchesTerm(p.title, trimmed) || matchesTerm(p.titleBn || '', trimmed);
      const aliasMatch = banglishMap[p.page]?.some(alias => matchesTerm(alias, trimmed) || matchesTerm(trimmed, alias));
      if (directMatch || aliasMatch) {
        out.push(p);
      }
    });

    // 2. Match crops
    crops?.forEach(c => {
      const fields = [c.name, c.variety, c.growth_stage].filter(Boolean).join(' ').toLowerCase();
      if (fields.includes(trimmed) || trimmed.includes('crop') || trimmed.includes('fosol') || trimmed.includes('ফসল')) {
        if (!out.find(r => r.id === c.id)) {
          out.push({ id: c.id, type: 'crop', title: c.name, subtitle: c.variety || c.growth_stage || undefined, icon: '🌾', page: 'crops' });
        }
      }
    });

    // 3. Match livestock
    const livestockKeywords = ['poshu', 'pashu', 'cow', 'goat', 'chicken', 'duck', 'buffalo', 'pigeon', 'গরু', 'ছাগল', 'মুরগি', 'হাঁস', 'পশু'];
    livestock?.forEach(l => {
      const fields = [l.animal_type, l.breed].filter(Boolean).join(' ').toLowerCase();
      const keywordMatch = livestockKeywords.some(k => trimmed.includes(k));
      if (fields.includes(trimmed) || keywordMatch) {
        if (!out.find(r => r.id === l.id)) {
          out.push({ id: l.id, type: 'livestock', title: l.animal_type, subtitle: l.breed ? `${l.breed} (${l.count})` : `${l.count}`, icon: '🐄', page: 'livestock' });
        }
      }
    });

    // 4. Match tasks
    tasks?.forEach(t => {
      const fields = [t.title, t.title_bn, t.task_type].filter(Boolean).join(' ').toLowerCase();
      if (fields.includes(trimmed) || trimmed.includes('task') || trimmed.includes('kaj') || trimmed.includes('কাজ')) {
        if (!out.find(r => r.id === t.id)) {
          out.push({ id: t.id, type: 'task', title: t.title_bn || t.title, subtitle: t.is_completed ? '✅' : '⏳', icon: '📋', page: 'schedule' });
        }
      }
    });

    return out;
  }, [trimmed, crops, livestock, tasks]);

  return { results, hasQuery: trimmed.length > 0 };
}

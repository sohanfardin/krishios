import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Sparkles, Leaf, PawPrint, Syringe, Bug, Droplets, Heart, Lightbulb, Loader2 } from 'lucide-react';

interface Suggestion {
  emoji: string;
  title: string;
  description: string;
  category: string;
}

interface Props {
  itemType: 'crop' | 'livestock';
  itemName: string;
  growthStage?: string;
  soilType?: string;
  breed?: string;
  animalType?: string;
  visible: boolean;
  onClose: () => void;
}

const categoryIcon = (cat: string) => {
  switch (cat) {
    case 'fertilizer': return <Leaf className="w-4 h-4 text-green-500" />;
    case 'feed': return <PawPrint className="w-4 h-4 text-amber-500" />;
    case 'vaccine': return <Syringe className="w-4 h-4 text-blue-500" />;
    case 'pesticide': return <Bug className="w-4 h-4 text-red-500" />;
    case 'irrigation': return <Droplets className="w-4 h-4 text-cyan-500" />;
    case 'health': return <Heart className="w-4 h-4 text-pink-500" />;
    default: return <Lightbulb className="w-4 h-4 text-yellow-500" />;
  }
};

export function AISuggestionsPanel({ itemType, itemName, growthStage, soilType, breed, animalType, visible, onClose }: Props) {
  const { language } = useLanguage();
  const bn = language === 'bn';
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!visible || !itemName) return;
    
    let cancelled = false;
    setLoading(true);
    setError(false);
    setSuggestions([]);

    (async () => {
      try {
        const { data, error: fnError } = await supabase.functions.invoke('farm-item-suggestions', {
          body: { itemType, itemName, growthStage, soilType, breed, animalType, language },
        });

        if (cancelled) return;
        if (fnError) throw fnError;
        setSuggestions(data?.suggestions || []);
      } catch (e) {
        console.error('AI suggestions error:', e);
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [visible, itemName, itemType]);

  if (!visible) return null;

  return (
    <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3 animate-fade-in">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-foreground flex items-center gap-2 text-sm">
          <Sparkles className="w-4 h-4 text-primary" />
          {bn ? '🧠 AI পরামর্শ' : '🧠 AI Suggestions'}
        </h4>
        <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground">
          {bn ? 'বন্ধ করুন' : 'Dismiss'}
        </button>
      </div>

      {loading && (
        <div className="flex items-center gap-2 py-4 justify-center text-muted-foreground text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          {bn ? 'পরামর্শ তৈরি হচ্ছে...' : 'Generating suggestions...'}
        </div>
      )}

      {error && (
        <p className="text-xs text-muted-foreground text-center py-2">
          {bn ? 'পরামর্শ লোড করা যায়নি' : 'Could not load suggestions'}
        </p>
      )}

      {!loading && suggestions.length > 0 && (
        <div className="space-y-2">
          {suggestions.map((s, i) => (
            <div key={i} className="bg-card rounded-lg p-3 border border-border flex gap-3 items-start">
              <div className="mt-0.5">{categoryIcon(s.category)}</div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground">
                  {s.emoji} {s.title}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  {s.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import { useNavigation } from '@/contexts/NavigationContext';
import { SearchResult } from '@/hooks/useGlobalSearch';

interface Props {
  results: SearchResult[];
  hasQuery: boolean;
  onSelect: () => void;
  language: string;
}

const typeLabels: Record<string, { bn: string; en: string }> = {
  crop: { bn: 'ফসল', en: 'Crop' },
  livestock: { bn: 'পশু', en: 'Livestock' },
  task: { bn: 'কাজ', en: 'Task' },
};

export function SearchDropdown({ results, hasQuery, onSelect, language }: Props) {
  const { navigateTo } = useNavigation();
  const bn = language === 'bn';

  if (!hasQuery) return null;

  const handleClick = (r: SearchResult) => {
    navigateTo(r.page);
    onSelect();
  };

  return (
    <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-xl shadow-xl z-50 max-h-80 overflow-y-auto">
      {results.length === 0 ? (
        <div className="p-4 text-center text-muted-foreground text-sm">
          {bn ? 'কোনো ফলাফল পাওয়া যায়নি' : 'No results found'}
        </div>
      ) : (
        <div className="py-1">
          {results.map((r) => (
            <button
              key={`${r.type}-${r.id}`}
              onClick={() => handleClick(r)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/60 transition-colors text-left"
            >
              <span className="text-xl">{r.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground text-sm truncate">
                  {bn && r.titleBn ? r.titleBn : r.title}
                </p>
                {r.subtitle && <p className="text-xs text-muted-foreground truncate">{r.subtitle}</p>}
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground shrink-0">
                {bn ? typeLabels[r.type]?.bn : typeLabels[r.type]?.en}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

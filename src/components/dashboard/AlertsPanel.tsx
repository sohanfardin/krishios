import { useLanguage } from '@/contexts/LanguageContext';
import { AlertTriangle, CloudRain, Syringe, Clock, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAlerts, useDeleteAlert } from '@/hooks/useAlerts';
import { useWeather } from '@/hooks/useWeather';

export function AlertsPanel() {
  const { t, language } = useLanguage();
  const bn = language === 'bn';
  const { data: dbAlerts, isLoading: alertsLoading } = useAlerts();
  const { data: weatherData } = useWeather();
  const deleteAlert = useDeleteAlert();

  // Combine weather-generated alerts + DB alerts
  const weatherAlerts = (weatherData?.alerts || []).map((a, i) => ({
    id: `weather-${i}`,
    type: a.type as 'disease' | 'weather' | 'vaccination' | 'harvest',
    title: a.title_bn,
    description: a.message_bn,
    severity: a.severity as 'high' | 'medium' | 'low',
    time: bn ? 'এইমাত্র' : 'Just now',
    source: 'weather' as const,
  }));

  // Deduplicate DB alerts by title+description, keeping only the latest
  const uniqueDbAlerts = (dbAlerts || []).reduce((acc, a) => {
    const key = `${a.title_bn}-${a.message_bn}`;
    if (!acc.has(key) || new Date(a.created_at) > new Date(acc.get(key)!.created_at)) {
      acc.set(key, a);
    }
    return acc;
  }, new Map<string, typeof dbAlerts[0]>());

  const formattedDbAlerts = Array.from(uniqueDbAlerts.values()).map(a => ({
    id: a.id,
    type: a.alert_type as 'disease' | 'weather' | 'vaccination' | 'harvest',
    title: a.title_bn || a.alert_type,
    description: a.message_bn || '',
    severity: a.severity as 'high' | 'medium' | 'low',
    time: getRelativeTime(a.created_at, bn),
    source: 'db' as const,
  }));

  // Also deduplicate weather alerts against DB alerts
  const dbAlertKeys = new Set(Array.from(uniqueDbAlerts.values()).map(a => `${a.title_bn}-${a.message_bn}`));
  const filteredWeatherAlerts = weatherAlerts.filter(a => !dbAlertKeys.has(`${a.title}-${a.description}`));

  const allAlerts = [...filteredWeatherAlerts, ...formattedDbAlerts].slice(0, 5);

  const getAlertStyles = (severity: string) => {
    const base = 'rounded-xl p-4 border-l-4 transition-all hover:shadow-md cursor-pointer';
    switch (severity) {
      case 'high': return cn(base, 'bg-destructive/5 border-destructive');
      case 'medium': return cn(base, 'bg-warning/5 border-warning');
      case 'low': return cn(base, 'bg-info/5 border-info');
      default: return cn(base, 'bg-muted border-muted-foreground');
    }
  };

  const getAlertEmoji = (type: string) => {
    switch (type) {
      case 'disease': return '🦠';
      case 'weather': return '🌧️';
      case 'vaccination': return '💉';
      case 'harvest': return '🌾';
      default: return '⚠️';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'disease': return <AlertTriangle className="w-5 h-5 text-destructive" />;
      case 'weather': return <CloudRain className="w-5 h-5 text-warning" />;
      case 'vaccination': return <Syringe className="w-5 h-5 text-info" />;
      case 'harvest': return <Clock className="w-5 h-5 text-success" />;
      default: return <AlertTriangle className="w-5 h-5" />;
    }
  };

  // Fallback alerts when no data
  const fallbackAlerts = [
    {
      id: 'fb1', type: 'weather' as const,
      title: bn ? 'আবহাওয়া পর্যবেক্ষণ সক্রিয়' : 'Weather Monitoring Active',
      description: bn ? 'আপনার এলাকার আবহাওয়া পর্যবেক্ষণ চলছে। কোনো সতর্কতা নেই।' : 'Weather monitoring is active. No alerts at this time.',
      severity: 'low' as const, time: bn ? 'এইমাত্র' : 'Just now', source: 'system' as const,
    },
  ];

  const displayAlerts = allAlerts.length > 0 ? allAlerts : fallbackAlerts;

  return (
    <div className="bg-card rounded-2xl p-5 shadow-sm border border-border animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">⚠️</span>
          <h3 className="text-lg font-semibold text-foreground">
            {t('dashboard.alerts')}
          </h3>
        </div>
        {alertsLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        ) : (
          <span className="text-xs px-2 py-1 rounded-full bg-destructive/10 text-destructive font-medium">
            {bn ? `${displayAlerts.length}টি` : `${displayAlerts.length}`}
          </span>
        )}
      </div>

      <div className="space-y-3">
        {displayAlerts.map((alert, index) => (
          <div
            key={alert.id}
            className={cn(getAlertStyles(alert.severity), "animate-fade-in")}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <span className="text-lg">{getAlertEmoji(alert.type)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {getAlertIcon(alert.type)}
                  <h4 className="font-medium text-foreground text-sm">{alert.title}</h4>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{alert.description}</p>
                <p className="text-[10px] text-muted-foreground mt-2">{alert.time}</p>
              </div>
              {alert.severity === 'high' && (
                <span className="flex-shrink-0 w-2 h-2 rounded-full bg-destructive animate-pulse" />
              )}
              {alert.source === 'db' && (
                <button
                  onClick={(e) => { e.stopPropagation(); deleteAlert.mutate(alert.id); }}
                  className="flex-shrink-0 p-1 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                  title={bn ? 'মুছুন' : 'Delete'}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function getRelativeTime(dateStr: string, bn: boolean): string {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 5) return bn ? 'এইমাত্র' : 'Just now';
  if (mins < 60) return bn ? `${mins} মিনিট আগে` : `${mins}m ago`;
  if (hours < 24) return bn ? `${hours} ঘণ্টা আগে` : `${hours}h ago`;
  return bn ? `${days} দিন আগে` : `${days}d ago`;
}

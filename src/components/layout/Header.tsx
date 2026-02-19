import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Bell, Search, Mic, Globe, User, LogOut, X, Trash2, ArrowLeft } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigation } from '@/contexts/NavigationContext';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';
import { useGlobalSearch } from '@/hooks/useGlobalSearch';
import { SearchDropdown } from '@/components/layout/SearchDropdown';

export function Header() {
  const queryClient = useQueryClient();
  const { language, setLanguage, t } = useLanguage();
  const { user } = useAuth();
  const { navigateTo, goBack, currentPage } = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const { results, hasQuery } = useGlobalSearch(searchQuery);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  const { data: alerts = [] } = useQuery({
    queryKey: ['alerts', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setShowResults(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success(language === 'bn' ? 'লগ আউট হয়েছে' : 'Logged out');
    window.location.href = '/auth';
  };

  const unreadAlerts = alerts.filter((a) => !a.is_read).length;

  const markAllRead = async () => {
    const unread = alerts.filter((a) => !a.is_read);
    if (unread.length === 0) return;
    const ids = unread.map((a) => a.id);
    await supabase.from('alerts').update({ is_read: true }).in('id', ids);
    queryClient.invalidateQueries({ queryKey: ['alerts'] });
  };

  const deleteNotification = async (id: string) => {
    await supabase.from('alerts').delete().eq('id', id);
    queryClient.invalidateQueries({ queryKey: ['alerts'] });
  };

  const deleteAllNotifications = async () => {
    if (!user || alerts.length === 0) return;
    const ids = alerts.map((a) => a.id);
    await supabase.from('alerts').delete().in('id', ids);
    queryClient.invalidateQueries({ queryKey: ['alerts'] });
  };

  return (
    <header className="bg-card border-b border-border px-4 lg:px-6 py-4 sticky top-0 lg:top-0 mt-14 lg:mt-0 z-30">
      <div className="flex items-center justify-between gap-4">
        {/* Back Button */}
        {currentPage !== 'dashboard' && (
          <button
            onClick={goBack}
            className="p-2.5 rounded-xl bg-muted hover:bg-muted/80 transition-colors touch-target flex-shrink-0"
            title={language === 'bn' ? 'পিছনে যান' : 'Go back'}
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
        )}
        <div className="flex-1 max-w-xl relative" ref={searchRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder={t('common.search')}
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setShowResults(true); }}
              onFocus={() => setShowResults(true)}
              onKeyDown={handleSearch}
              className="w-full pl-10 pr-12 py-3 rounded-xl bg-muted border-0 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
              <Mic className="w-4 h-4" />
            </button>
          </div>
          {showResults && <SearchDropdown results={results} hasQuery={hasQuery} language={language} onSelect={() => { setShowResults(false); setSearchQuery(''); }} />}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Language Toggle */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-muted">
            <Globe className="w-4 h-4 text-muted-foreground" />
            <span className={cn(
              "text-sm font-medium transition-colors",
              language === 'bn' ? 'text-primary' : 'text-muted-foreground'
            )}>
              বাং
            </span>
            <Switch
              checked={language === 'en'}
              onCheckedChange={(checked) => setLanguage(checked ? 'en' : 'bn')}
              className="data-[state=checked]:bg-primary"
            />
            <span className={cn(
              "text-sm font-medium transition-colors",
              language === 'en' ? 'text-primary' : 'text-muted-foreground'
            )}>
              EN
            </span>
          </div>

          {/* Notifications */}
          <Popover onOpenChange={(open) => { if (open) markAllRead(); }}>
            <PopoverTrigger asChild>
              <button className="relative p-3 rounded-xl bg-muted hover:bg-muted/80 transition-colors touch-target">
                <Bell className="w-5 h-5 text-foreground" />
                {unreadAlerts > 0 && (
                  <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-destructive text-white text-xs flex items-center justify-center font-bold animate-pulse">
                    {unreadAlerts}
                  </span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <div className="max-h-96 overflow-y-auto">
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">
                    {language === 'bn' ? 'সতর্কতা' : 'Alerts'}
                  </h3>
                  {alerts.length > 0 && (
                    <button
                      onClick={deleteAllNotifications}
                      className="text-xs flex items-center gap-1 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      {language === 'bn' ? 'সব মুছুন' : 'Clear all'}
                    </button>
                  )}
                </div>
                {alerts.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground text-sm">
                    {language === 'bn' ? 'কোনো সতর্কতা নেই' : 'No alerts'}
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {alerts.map((alert) => (
                      <div key={alert.id} className="p-4 hover:bg-muted/50 transition-colors flex items-start gap-2 group">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-foreground">
                            {alert.title_bn || alert.alert_type}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {alert.message_bn || alert.alert_type}
                          </p>
                        </div>
                        <button
                          onClick={() => deleteNotification(alert.id)}
                          className="flex-shrink-0 p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                          title={language === 'bn' ? 'মুছুন' : 'Delete'}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center text-primary-foreground font-bold shadow-lg hover:shadow-glow-primary transition-shadow touch-target overflow-hidden">
                {(profile as any)?.avatar_url ? (
                  <img src={(profile as any).avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  (profile?.full_name || user?.email || 'U').charAt(0).toUpperCase()
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-4 py-2 border-b border-border">
                <p className="font-medium text-sm text-foreground">
                  {profile?.full_name || (language === 'bn' ? 'কৃষক' : 'Farmer')}
                </p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <DropdownMenuItem
                onClick={() => navigateTo('settings')}
                className="flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                <span>{language === 'bn' ? 'প্রোফাইল সেটিংস' : 'Profile Settings'}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="flex items-center gap-2 text-destructive focus:text-destructive"
              >
                <LogOut className="w-4 h-4" />
                <span>{language === 'bn' ? 'লগ আউট' : 'Log Out'}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

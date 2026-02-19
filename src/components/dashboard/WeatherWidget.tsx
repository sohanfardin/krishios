import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useWeather } from '@/hooks/useWeather';
import { Droplets, Wind, Sun, Cloud, CloudRain, CloudSnow, Loader2, ChevronRight, Thermometer, Eye, Gauge } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

const weatherEmoji: Record<string, string> = {
  Clear: '☀️', Clouds: '⛅', Rain: '🌧️', Drizzle: '🌦️',
  Thunderstorm: '⛈️', Snow: '❄️', Mist: '🌫️', Haze: '🌫️', Fog: '🌫️',
};

const dayNamesBn = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহ', 'শুক্র', 'শনি'];
const dayNamesEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const dayNamesFullBn = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];

function toBanglaNum(n: number | string): string {
  const banglaDigits = ['০','১','২','৩','৪','৫','৬','৭','৮','৯'];
  return String(n).replace(/\d/g, d => banglaDigits[parseInt(d)]);
}

function formatDate(date: Date, bn: boolean): string {
  return bn
    ? `${toBanglaNum(date.getDate())}/${toBanglaNum(date.getMonth() + 1)}/${toBanglaNum(date.getFullYear())} ${toBanglaNum(date.getHours().toString().padStart(2, '0'))}:${toBanglaNum(date.getMinutes().toString().padStart(2, '0'))}`
    : date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function getWeatherLabelBn(key: string, desc?: string): string {
  const map: Record<string, string> = {
    Clear: 'রোদ', Clouds: 'মেঘলা', Rain: 'বৃষ্টি', Drizzle: 'গুঁড়ি বৃষ্টি',
    Thunderstorm: 'ঝড়', Snow: 'তুষারপাত', Mist: 'কুয়াশা', Haze: 'ধোঁয়াশা', Fog: 'কুয়াশা',
  };
  return map[key] || desc || 'রোদ';
}

function getFarmingTips(weatherKey: string, temp: number, humidity: number, bn: boolean): string[] {
  const tips: string[] = [];
  if (bn) {
    if (temp > 35) tips.push('🌡️ তাপমাত্রা বেশি — গরু/ছাগলকে ছায়ায় রাখুন এবং পর্যাপ্ত পানি দিন');
    if (temp > 33) tips.push('🐟 পুকুরের পানিতে অক্সিজেন কমে যেতে পারে — এয়ারেশন চালু রাখুন');
    if (humidity > 80) tips.push('🍄 আর্দ্রতা বেশি — ফসলে ছত্রাক রোগের ঝুঁকি আছে');
    if (humidity > 70) tips.push('💧 আর্দ্রতা ভালো — সেচ কমিয়ে দিতে পারেন');
    if (weatherKey === 'Rain' || weatherKey === 'Drizzle') tips.push('🌧️ বৃষ্টি হচ্ছে — সার/কীটনাশক প্রয়োগ থেকে বিরত থাকুন');
    if (weatherKey === 'Clear' && temp < 30) tips.push('☀️ আবহাওয়া অনুকূল — সার প্রয়োগ ও রোপণের জন্য ভালো সময়');
    if (tips.length === 0) tips.push('✅ আবহাওয়া স্বাভাবিক — স্বাভাবিক কৃষি কার্যক্রম চালিয়ে যান');
  } else {
    if (temp > 35) tips.push('🌡️ High temperature — keep livestock in shade with plenty of water');
    if (temp > 33) tips.push('🐟 Pond oxygen may drop — keep aeration running');
    if (humidity > 80) tips.push('🍄 High humidity — risk of fungal disease on crops');
    if (humidity > 70) tips.push('💧 Good moisture — consider reducing irrigation');
    if (weatherKey === 'Rain' || weatherKey === 'Drizzle') tips.push('🌧️ Raining — avoid applying fertilizer or pesticide');
    if (weatherKey === 'Clear' && temp < 30) tips.push('☀️ Favorable weather — good time for planting and fertilizing');
    if (tips.length === 0) tips.push('✅ Normal weather — continue regular farming activities');
  }
  return tips;
}

export function WeatherWidget() {
  const { t, language } = useLanguage();
  const { data, isLoading, isError } = useWeather();
  const bn = language === 'bn';
  const [detailOpen, setDetailOpen] = useState(false);

  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const todayStr = formatDate(now, bn);

  if (isLoading) {
    return (
      <div className="bg-gradient-sky rounded-2xl p-5 text-info-foreground animate-slide-up flex items-center justify-center min-h-[200px]">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  const current = data?.current;
  const forecast = data?.forecast ?? [];
  const alerts = data?.alerts ?? [];

  const temp = current?.temp ?? 32;
  const feelsLike = current?.feels_like ?? temp;
  const humidity = current?.humidity ?? 65;
  const wind = current?.wind ?? 12;
  const weatherKey = current?.weather ?? 'Clear';
  const city = current?.city ?? (bn ? 'ঢাকা' : 'Dhaka');
  const emoji = weatherEmoji[weatherKey] || '🌤️';
  const weatherLabel = bn ? getWeatherLabelBn(weatherKey, current?.description) : (current?.description || 'Sunny');
  const farmingTips = getFarmingTips(weatherKey, temp, humidity, bn);

  return (
    <>
      <div
        className="bg-gradient-sky rounded-2xl p-5 text-info-foreground animate-slide-up cursor-pointer hover:shadow-lg transition-shadow group"
        onClick={() => setDetailOpen(true)}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🌤️</span>
            <h3 className="text-lg font-semibold">{t('dashboard.weather')}</h3>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-sm opacity-80">{city} • {todayStr}</span>
            <ChevronRight className="w-4 h-4 opacity-60 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Current Weather */}
        <div className="flex items-center gap-6 mb-6">
          <div className="text-center">
            <span className="text-5xl">{emoji}</span>
            <p className="text-4xl font-bold mt-2">
              {bn ? toBanglaNum(temp) : temp}°C
            </p>
            <p className="text-sm opacity-80">{weatherLabel}</p>
          </div>
          <div className="flex-1 grid grid-cols-2 gap-3">
            <div className="bg-white/20 rounded-xl p-3 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-1">
                <Droplets className="w-4 h-4" />
                <span className="text-xs opacity-80">{t('weather.humidity')}</span>
              </div>
              <p className="text-lg font-semibold">
                {bn ? toBanglaNum(humidity) : humidity}%
              </p>
            </div>
            <div className="bg-white/20 rounded-xl p-3 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-1">
                <Wind className="w-4 h-4" />
                <span className="text-xs opacity-80">{t('weather.wind')}</span>
              </div>
              <p className="text-lg font-semibold">
                {bn ? toBanglaNum(wind) : wind} km/h
              </p>
            </div>
          </div>
        </div>

        {/* 5-Day Forecast */}
        {forecast.length > 0 && (
          <div className="grid grid-cols-5 gap-2">
            {forecast.slice(0, 5).map((day, index) => {
              const d = new Date(day.date);
              const dayName = bn ? dayNamesBn[d.getDay()] : dayNamesEn[d.getDay()];
              const dayEmoji = weatherEmoji[day.weather] || '🌤️';
              return (
                <div
                  key={index}
                  className="bg-white/10 rounded-xl p-2 text-center backdrop-blur-sm hover:bg-white/20 transition-colors"
                >
                  <p className="text-xs opacity-80 mb-1">{dayName}</p>
                  <span className="text-lg">{dayEmoji}</span>
                  <p className="text-sm font-medium mt-1">
                    {bn ? toBanglaNum(day.temp) : day.temp}°
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* Tap hint */}
        <p className="text-xs text-center opacity-50 mt-3 group-hover:opacity-80 transition-opacity">
          {bn ? '👆 বিস্তারিত দেখতে ট্যাপ করুন' : '👆 Tap for details'}
        </p>
      </div>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto bg-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <span className="text-2xl">{emoji}</span>
              {bn ? 'বিস্তারিত আবহাওয়া' : 'Detailed Weather'}
              <span className="text-sm font-normal text-muted-foreground ml-auto">{city}</span>
            </DialogTitle>
          </DialogHeader>

          {/* Current conditions detail */}
          <div className="bg-gradient-sky rounded-xl p-5 text-info-foreground">
            <div className="flex items-center gap-4 mb-4">
              <span className="text-6xl">{emoji}</span>
              <div>
                <p className="text-5xl font-bold">{bn ? toBanglaNum(temp) : temp}°C</p>
                <p className="text-sm opacity-80 capitalize">{weatherLabel}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white/20 rounded-lg p-3 text-center backdrop-blur-sm">
                <Thermometer className="w-4 h-4 mx-auto mb-1 opacity-80" />
                <p className="text-xs opacity-70">{bn ? 'অনুভূতি' : 'Feels Like'}</p>
                <p className="font-semibold">{bn ? toBanglaNum(feelsLike) : feelsLike}°C</p>
              </div>
              <div className="bg-white/20 rounded-lg p-3 text-center backdrop-blur-sm">
                <Droplets className="w-4 h-4 mx-auto mb-1 opacity-80" />
                <p className="text-xs opacity-70">{bn ? 'আর্দ্রতা' : 'Humidity'}</p>
                <p className="font-semibold">{bn ? toBanglaNum(humidity) : humidity}%</p>
              </div>
              <div className="bg-white/20 rounded-lg p-3 text-center backdrop-blur-sm">
                <Wind className="w-4 h-4 mx-auto mb-1 opacity-80" />
                <p className="text-xs opacity-70">{bn ? 'বাতাস' : 'Wind'}</p>
                <p className="font-semibold">{bn ? toBanglaNum(wind) : wind} km/h</p>
              </div>
            </div>
          </div>

          {/* Weather Alerts */}
          {alerts.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <span>⚠️</span> {bn ? 'আবহাওয়া সতর্কতা' : 'Weather Alerts'}
              </h4>
              {alerts.map((alert, i) => (
                <div key={i} className={cn(
                  "rounded-lg p-3 text-sm",
                  alert.severity === 'high' ? 'bg-destructive/10 text-destructive' :
                  alert.severity === 'medium' ? 'bg-warning/10 text-warning' :
                  'bg-info/10 text-info'
                )}>
                  <p className="font-medium">{alert.title_bn}</p>
                  <p className="text-xs mt-1 opacity-80">{alert.message_bn}</p>
                </div>
              ))}
            </div>
          )}

          {/* Farming Tips based on weather */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <span>🌾</span> {bn ? 'কৃষি পরামর্শ' : 'Farming Tips'}
            </h4>
            <div className="space-y-2">
              {farmingTips.map((tip, i) => (
                <div key={i} className="bg-muted/50 rounded-lg p-3 text-sm text-foreground">
                  {tip}
                </div>
              ))}
            </div>
          </div>

          {/* Extended Forecast */}
          {forecast.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <span>📅</span> {bn ? '৫ দিনের পূর্বাভাস' : '5-Day Forecast'}
              </h4>
              <div className="space-y-2">
                {forecast.slice(0, 5).map((day, i) => {
                  const d = new Date(day.date);
                  const dayName = bn ? dayNamesFullBn[d.getDay()] : d.toLocaleDateString('en-US', { weekday: 'long' });
                  const dayEmoji = weatherEmoji[day.weather] || '🌤️';
                  const dayLabel = bn ? getWeatherLabelBn(day.weather, day.description) : (day.description || day.weather);
                  return (
                    <div key={i} className="flex items-center gap-3 bg-muted/30 rounded-xl p-3">
                      <span className="text-2xl">{dayEmoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{dayName}</p>
                        <p className="text-xs text-muted-foreground capitalize">{dayLabel}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-foreground">{bn ? toBanglaNum(day.temp) : day.temp}°C</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-0.5"><Droplets className="w-3 h-3" />{bn ? toBanglaNum(day.humidity) : day.humidity}%</span>
                          <span className="flex items-center gap-0.5"><Wind className="w-3 h-3" />{bn ? toBanglaNum(day.wind) : day.wind}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

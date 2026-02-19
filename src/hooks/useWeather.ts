import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useActiveFarm } from '@/hooks/useFarm';

export interface WeatherData {
  current: {
    temp: number;
    feels_like: number;
    humidity: number;
    wind: number;
    weather: string;
    description: string;
    icon: string;
    city: string;
  };
  forecast: {
    date: string;
    temp: number;
    humidity: number;
    weather: string;
    icon: string;
    description: string;
    wind: number;
  }[];
  alerts: {
    type: string;
    severity: string;
    title_bn: string;
    message_bn: string;
  }[];
}

export function useWeather() {
  const { user } = useAuth();
  const { farm } = useActiveFarm();

  return useQuery<WeatherData>({
    queryKey: ['weather', farm?.id, farm?.district, farm?.upazila],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('weather-engine', {
        body: {
          district: farm?.district || null,
          upazila: farm?.upazila || null,
          userId: user?.id || null,
          farmId: farm?.id || null,
        },
      });
      if (error) throw error;
      return data as WeatherData;
    },
    staleTime: 30 * 60 * 1000,
    refetchInterval: 30 * 60 * 1000,
  });
}

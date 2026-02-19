import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Input validation
function validateLocationText(text: string | null | undefined): string | null {
  if (!text || typeof text !== 'string') return null;
  const clean = text.trim().substring(0, 100);
  if (!/^[\u0980-\u09FF\sa-zA-Z\-,.]+$/.test(clean)) return null;
  return clean;
}

function isValidUUID(id: string | null | undefined): boolean {
  if (!id || typeof id !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

// Bangladesh district coordinates mapping
const DISTRICT_COORDS: Record<string, { lat: number; lon: number }> = {
  "ঢাকা": { lat: 23.8103, lon: 90.4125 },
  "চট্টগ্রাম": { lat: 22.3569, lon: 91.7832 },
  "রাজশাহী": { lat: 24.3745, lon: 88.6042 },
  "খুলনা": { lat: 22.8456, lon: 89.5403 },
  "বরিশাল": { lat: 22.7010, lon: 90.3535 },
  "সিলেট": { lat: 24.8949, lon: 91.8687 },
  "রংপুর": { lat: 25.7439, lon: 89.2752 },
  "ময়মনসিংহ": { lat: 24.7471, lon: 90.4203 },
  "কুমিল্লা": { lat: 23.4607, lon: 91.1809 },
  "গাজীপুর": { lat: 24.0023, lon: 90.4264 },
  "নারায়ণগঞ্জ": { lat: 23.6238, lon: 90.5000 },
  "টাঙ্গাইল": { lat: 24.2513, lon: 89.9163 },
  "কিশোরগঞ্জ": { lat: 24.4449, lon: 90.7766 },
  "মানিকগঞ্জ": { lat: 23.8644, lon: 90.0047 },
  "মুন্সীগঞ্জ": { lat: 23.5422, lon: 90.5305 },
  "নরসিংদী": { lat: 23.9322, lon: 90.7151 },
  "ফরিদপুর": { lat: 23.6070, lon: 89.8429 },
  "গোপালগঞ্জ": { lat: 23.0050, lon: 89.8266 },
  "মাদারীপুর": { lat: 23.1641, lon: 90.1978 },
  "রাজবাড়ী": { lat: 23.7574, lon: 89.6445 },
  "শরীয়তপুর": { lat: 23.2423, lon: 90.4348 },
  "ব্রাহ্মণবাড়িয়া": { lat: 23.9608, lon: 91.1115 },
  "চাঁদপুর": { lat: 23.2332, lon: 90.6712 },
  "ফেনী": { lat: 23.0159, lon: 91.3976 },
  "লক্ষ্মীপুর": { lat: 22.9447, lon: 90.8282 },
  "নোয়াখালী": { lat: 22.8724, lon: 91.0973 },
  "কক্সবাজার": { lat: 21.4272, lon: 92.0058 },
  "রাঙ্গামাটি": { lat: 22.6372, lon: 92.1840 },
  "বান্দরবান": { lat: 22.1953, lon: 92.2184 },
  "খাগড়াছড়ি": { lat: 23.1193, lon: 91.9847 },
  "বগুড়া": { lat: 24.8465, lon: 89.3773 },
  "চাঁপাইনবাবগঞ্জ": { lat: 24.5965, lon: 88.2772 },
  "জয়পুরহাট": { lat: 25.0968, lon: 89.0227 },
  "নওগাঁ": { lat: 24.7936, lon: 88.9318 },
  "নাটোর": { lat: 24.4206, lon: 89.0000 },
  "নবাবগঞ্জ": { lat: 24.5965, lon: 88.2772 },
  "পাবনা": { lat: 24.0064, lon: 89.2372 },
  "সিরাজগঞ্জ": { lat: 24.4534, lon: 89.7007 },
  "যশোর": { lat: 23.1634, lon: 89.2182 },
  "ঝিনাইদহ": { lat: 23.5448, lon: 89.1539 },
  "কুষ্টিয়া": { lat: 23.9013, lon: 89.1200 },
  "মাগুরা": { lat: 23.4873, lon: 89.4199 },
  "মেহেরপুর": { lat: 23.7622, lon: 88.6318 },
  "নড়াইল": { lat: 23.1725, lon: 89.5126 },
  "সাতক্ষীরা": { lat: 22.7185, lon: 89.0705 },
  "বাগেরহাট": { lat: 22.6512, lon: 89.7851 },
  "ঝালকাঠি": { lat: 22.6406, lon: 90.1987 },
  "পটুয়াখালী": { lat: 22.3596, lon: 90.3290 },
  "পিরোজপুর": { lat: 22.5841, lon: 89.9720 },
  "ভোলা": { lat: 22.6859, lon: 90.6482 },
  "বরগুনা": { lat: 22.1530, lon: 90.1266 },
  "হবিগঞ্জ": { lat: 24.3740, lon: 91.4163 },
  "মৌলভীবাজার": { lat: 24.4821, lon: 91.7775 },
  "সুনামগঞ্জ": { lat: 25.0657, lon: 91.3950 },
  "দিনাজপুর": { lat: 25.6279, lon: 88.6332 },
  "গাইবান্ধা": { lat: 25.3288, lon: 89.5283 },
  "কুড়িগ্রাম": { lat: 25.8054, lon: 89.6362 },
  "লালমনিরহাট": { lat: 25.9923, lon: 89.2847 },
  "নীলফামারী": { lat: 25.9316, lon: 88.8560 },
  "পঞ্চগড়": { lat: 26.3411, lon: 88.5542 },
  "ঠাকুরগাঁও": { lat: 26.0336, lon: 88.4616 },
  "জামালপুর": { lat: 24.9375, lon: 89.9372 },
  "নেত্রকোণা": { lat: 24.8707, lon: 90.7273 },
  "শেরপুর": { lat: 25.0204, lon: 90.0171 },
  "চুয়াডাঙ্গা": { lat: 23.6401, lon: 88.8420 },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const OPENWEATHER_API_KEY = Deno.env.get("OPENWEATHER_API_KEY");
    if (!OPENWEATHER_API_KEY) throw new Error("OPENWEATHER_API_KEY is not configured");

    const body = await req.json().catch(() => ({}));
    const district = validateLocationText(body.district);
    const upazila = validateLocationText(body.upazila);
    const farmId = isValidUUID(body.farmId) ? body.farmId : null;

    // Resolve coordinates from district or fallback to Dhaka
    let lat = 23.8103;
    let lon = 90.4125;
    let locationName = "ঢাকা";

    if (district && DISTRICT_COORDS[district]) {
      lat = DISTRICT_COORDS[district].lat;
      lon = DISTRICT_COORDS[district].lon;
      locationName = district;
    } else if (district) {
      try {
        const geoRes = await fetch(
          `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(district)},BD&limit=1&appid=${OPENWEATHER_API_KEY}`
        );
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          if (geoData.length > 0) {
            lat = geoData[0].lat;
            lon = geoData[0].lon;
            locationName = district;
          }
        }
      } catch (e) {
        console.error("Geocoding error:", e);
      }
    }

    if (upazila) {
      try {
        const geoRes = await fetch(
          `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(upazila)},${encodeURIComponent(district || "")},BD&limit=1&appid=${OPENWEATHER_API_KEY}`
        );
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          if (geoData.length > 0) {
            lat = geoData[0].lat;
            lon = geoData[0].lon;
            locationName = upazila;
          }
        }
      } catch (e) {
        console.error("Upazila geocoding error:", e);
      }
    }

    const [currentRes, forecastRes] = await Promise.all([
      fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${OPENWEATHER_API_KEY}`),
      fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&cnt=40&appid=${OPENWEATHER_API_KEY}`),
    ]);

    if (!currentRes.ok) {
      const err = await currentRes.text();
      console.error("OpenWeather current error:", currentRes.status, err);
      throw new Error(`Weather API error: ${currentRes.status}`);
    }

    const current = await currentRes.json();
    const forecast = forecastRes.ok ? await forecastRes.json() : null;

    const dailyForecast: any[] = [];
    if (forecast?.list) {
      const seen = new Set<string>();
      for (const item of forecast.list) {
        const date = item.dt_txt.split(" ")[0];
        if (!seen.has(date) && dailyForecast.length < 5) {
          seen.add(date);
          dailyForecast.push({
            date,
            temp: Math.round(item.main.temp),
            humidity: item.main.humidity,
            weather: item.weather[0]?.main,
            icon: item.weather[0]?.icon,
            description: item.weather[0]?.description,
            wind: Math.round(item.wind.speed * 3.6),
          });
        }
      }
    }

    const alerts: any[] = [];
    const temp = current.main.temp;
    const humidity = current.main.humidity;
    const windSpeed = current.wind.speed * 3.6;

    if (humidity > 85) {
      alerts.push({ type: "disease", severity: "high", title_bn: "ছত্রাক রোগের ঝুঁকি", message_bn: `আর্দ্রতা ${Math.round(humidity)}% - ধান ও সবজিতে ছত্রাক রোগের ঝুঁকি বেশি। ছত্রাকনাশক স্প্রে করুন।` });
    }
    if (temp > 38) {
      alerts.push({ type: "weather", severity: "high", title_bn: "তীব্র গরম সতর্কতা", message_bn: `তাপমাত্রা ${Math.round(temp)}°C - পশুদের ছায়ায় রাখুন, পর্যাপ্ত পানি দিন।` });
    }
    if (windSpeed > 40) {
      alerts.push({ type: "weather", severity: "medium", title_bn: "ঝড়ের সতর্কতা", message_bn: `বাতাসের গতি ${Math.round(windSpeed)} km/h - ফসল ও পশুর আশ্রয়ের ব্যবস্থা করুন।` });
    }

    const rainDays = dailyForecast.filter(d => ["Rain", "Thunderstorm"].includes(d.weather));
    if (rainDays.length >= 3) {
      alerts.push({ type: "weather", severity: "medium", title_bn: "দীর্ঘ বৃষ্টির পূর্বাভাস", message_bn: `আগামী ${rainDays.length} দিন বৃষ্টি হতে পারে। সেচ বন্ধ রাখুন, পানি নিষ্কাশনের ব্যবস্থা করুন।` });
    }
    if (temp < 10) {
      alerts.push({ type: "weather", severity: "medium", title_bn: "শীতের সতর্কতা", message_bn: `তাপমাত্রা ${Math.round(temp)}°C - পশুদের শীতের জন্য বিশেষ ব্যবস্থা নিন।` });
    }
    if (rainDays.length === 0 && humidity < 50) {
      alerts.push({ type: "weather", severity: "low", title_bn: "সেচ পরামর্শ", message_bn: `আর্দ্রতা ${Math.round(humidity)}% এবং আগামী দিনে বৃষ্টির সম্ভাবনা কম। ফসলে সেচ দিন।` });
    }

    // Save to DB - validate user owns the farm before creating alerts
    if (farmId && alerts.length > 0) {
      try {
        const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

        // Verify the user owns the farm
        const { data: farmData } = await supabase
          .from("farms")
          .select("id")
          .eq("id", farmId)
          .eq("user_id", user.id)
          .maybeSingle();

        if (farmData) {
          const todayStart = new Date();
          todayStart.setHours(0, 0, 0, 0);
          const { data: existingAlerts } = await supabase
            .from("alerts")
            .select("title_bn, message_bn")
            .eq("user_id", user.id)
            .eq("farm_id", farmId)
            .gte("created_at", todayStart.toISOString());

          const titleCounts = new Map<string, number>();
          (existingAlerts || []).forEach(a => {
            const key = a.title_bn || "";
            titleCounts.set(key, (titleCounts.get(key) || 0) + 1);
          });

          const existingKeys = new Set(
            (existingAlerts || []).map(a => `${a.title_bn}|${a.message_bn}`)
          );

          const newAlerts = alerts
            .filter(a => {
              if (existingKeys.has(`${a.title_bn}|${a.message_bn}`)) return false;
              if ((titleCounts.get(a.title_bn) || 0) >= 2) return false;
              return true;
            })
            .map(a => ({
              user_id: user.id,
              farm_id: farmId,
              alert_type: a.type,
              severity: a.severity,
              title_bn: a.title_bn,
              message_bn: a.message_bn,
            }));

          if (newAlerts.length > 0) {
            await supabase.from("alerts").insert(newAlerts);
          }

          const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
          const { data: recentLogs } = await supabase
            .from("weather_logs")
            .select("id")
            .eq("farm_id", farmId)
            .gte("fetched_at", oneHourAgo)
            .limit(1);

          if (!recentLogs || recentLogs.length === 0) {
            await supabase.from("weather_logs").insert({
              farm_id: farmId,
              temperature: Math.round(temp),
              humidity: Math.round(humidity),
              wind: Math.round(windSpeed),
              rain_forecast: rainDays.length > 0 ? `${rainDays.length} days` : "none",
              raw_data: { current: current.main, forecast: dailyForecast },
            });
          }
        }
      } catch (e) {
        console.error("DB save error:", e);
      }
    }

    const seenTitles = new Set<string>();
    const uniqueAlerts = alerts.filter(a => {
      if (seenTitles.has(a.title_bn)) return false;
      seenTitles.add(a.title_bn);
      return true;
    });

    const result = {
      current: {
        temp: Math.round(current.main.temp),
        feels_like: Math.round(current.main.feels_like),
        humidity: current.main.humidity,
        wind: Math.round(current.wind.speed * 3.6),
        weather: current.weather[0]?.main,
        description: current.weather[0]?.description,
        icon: current.weather[0]?.icon,
        city: locationName || current.name,
      },
      forecast: dailyForecast,
      alerts: uniqueAlerts,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("weather-engine error:", e);
    return new Response(JSON.stringify({ error: "Something went wrong" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

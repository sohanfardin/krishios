import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

// Language normalization helpers
function normalizeInput(input: string | null | undefined): string {
  if (!input) return "";
  const lower = input.toLowerCase().trim();
  
  // Banglish to Bangla mappings (common variations)
  const banglishMap: { [key: string]: string } = {
    "rice": "ধান", "ris": "ধান", "dhan": "ধান",
    "wheat": "গম", "gom": "গম",
    "corn": "ভুট্টা", "maize": "ভুট্টা", "bhutta": "ভুট্টা",
    "potato": "আলু", "alu": "আলু", "aloo": "আলু",
    "vegetable": "সবজি", "sabzi": "সবজি", "shaak": "শাক",
    "jute": "পাট", "pat": "পাট",
    "mustard": "সরিষা", "sarisha": "সরিষা", "sorisha": "সরিষা",
    "urea": "ইউরিয়া", "yuria": "ইউরিয়া",
    "tsp": "টিএসপি", "dap": "ডিএপি", "mop": "এমওপি",
    "fertilizer": "সার", "saar": "সার",
    "loamy": "দোঁআশ", "doash": "দোঁআশ",
    "clay": "এঁটেল", "etel": "এঁটেল",
    "sandy": "বেলে", "bele": "বেলে"
  };
  
  return banglishMap[lower] || input;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are KrishiOS AI Decision Engine — বাংলাদেশের কৃষকদের জন্য একটি বুদ্ধিমান কৃষি সিদ্ধান্ত সিস্টেম।

আপনাকে ৫ ধরনের ডেটা দেওয়া হবে:
1. User Profile (জেলা, কৃষক টাইপ, জমির আকার, সেচ উৎস)
2. Weather Data (তাপমাত্রা, আর্দ্রতা, বৃষ্টি, বাতাস)
3. Crop Data (ফসলের নাম, রোপণ তারিখ, বৃদ্ধির ধাপ, সার, সেচ) — কৃষক বাংলা, ইংরেজি বা বাঙ্গিশ যেকোনো ভাষায় লেখেন
4. Livestock Data (পশুর ধরন, সংখ্যা, উৎপাদন, টিকাদান)
5. Financial Data (আয়, ব্যয়, লাভ/ক্ষতি)

আপনার কাজ:
- Rule-based smart logic ব্যবহার করে নির্ভুল পরামর্শ দিন
- সেচ সিদ্ধান্ত, সার প্রয়োগ সময়, রোগ ঝুঁকি, পশু স্বাস্থ্য, লাভ/ক্ষতি বিশ্লেষণ
- বাংলায় উত্তর দিন
- প্রতিটি পরামর্শে কেন এটা গুরুত্বপূর্ণ তার ব্যাখ্যা দিন
- Confidence percentage দিন`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const authHeader = req.headers.get("Authorization");
    const { type, farmId } = await req.json();

    // Create supabase client to fetch all farm data
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Extract user from auth header
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    let userId: string | null = null;
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await anonClient.auth.getUser(token);
      userId = user?.id || null;
    }

    if (!userId || !farmId) {
      return new Response(JSON.stringify({ error: "Unauthorized or missing farmId" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch all 5 data streams in parallel
    const [profileRes, farmRes, cropsRes, livestockRes, financeRes, fishPondsRes, weatherRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", userId).single(),
      supabase.from("farms").select("*").eq("id", farmId).single(),
      supabase.from("crops").select("*").eq("farm_id", farmId),
      supabase.from("livestock").select("*").eq("farm_id", farmId),
      supabase.from("finance_transactions").select("*").eq("farm_id", farmId).order("transaction_date", { ascending: false }).limit(50),
      supabase.from("fish_ponds").select("*").eq("farm_id", farmId),
      // Get latest weather
      fetchWeather(),
    ]);

    const profile = profileRes.data;
    const farm = farmRes.data;
    const crops = cropsRes.data || [];
    const livestock = livestockRes.data || [];
    const finance = financeRes.data || [];
    const fishPonds = fishPondsRes.data || [];

    // Calculate finance summary
    const revenue = finance.filter((t: any) => t.type === "revenue").reduce((s: number, t: any) => s + Number(t.amount), 0);
    const expenses = finance.filter((t: any) => t.type === "expense").reduce((s: number, t: any) => s + Number(t.amount), 0);

    // Build context prompt
    const contextPrompt = `
## বর্তমান ডেটা:

### প্রোফাইল:
- জেলা: ${profile?.district || "অজানা"}
- উপজেলা: ${profile?.upazila || "অজানা"}
- কৃষক টাইপ: ${(profile?.farmer_type || []).join(", ") || "মিশ্র"}
- জমির আকার: ${profile?.land_size_category || "অজানা"}
- সেচ উৎস: ${profile?.irrigation_source || "অজানা"}
- পদ্ধতি: ${profile?.farming_method || "অজানা"}

### আবহাওয়া (এখন):
- তাপমাত্রা: ${weatherRes?.current?.temp || "N/A"}°C
- আর্দ্রতা: ${weatherRes?.current?.humidity || "N/A"}%
- বাতাস: ${weatherRes?.current?.wind || "N/A"} km/h
- অবস্থা: ${weatherRes?.current?.description || "N/A"}
- পূর্বাভাস: ${weatherRes?.forecast?.map((f: any) => `${f.date}: ${f.weather} ${f.temp}°C`).join(", ") || "N/A"}

### ফসল (${crops.length}টি):
${crops.map((c: any) => `- ${normalizeInput(c.name)} (${normalizeInput(c.variety) || ""}) | ধাপ: ${c.growth_stage || "অজানা"} | স্বাস্থ্য: ${c.health_status || "সুস্থ"} | রোপণ: ${c.planting_date || "N/A"} | শেষ সার: ${c.last_fertilizer_date || "N/A"} | সার: ${normalizeInput(c.fertilizer_usage) || "অনির্দিষ্ট"} | শেষ সেচ: ${c.last_irrigation_date || "N/A"} | মাটি: ${normalizeInput(c.soil_type) || "N/A"}`).join("\n") || "কোনো ফসল নেই"}

### পশু (${livestock.length}টি):
${livestock.map((l: any) => `- ${normalizeInput(l.animal_type)} (${normalizeInput(l.breed) || ""}) | সংখ্যা: ${l.count} | বয়স: ${l.age_group || "N/A"} | দৈনিক উৎপাদন: ${l.daily_production_amount || 0} ${l.daily_production_unit || ""} | খাদ্য খরচ: ৳${l.feed_cost || 0}/দিন`).join("\n") || "কোনো পশু নেই"}

### মাছ চাষ (${fishPonds.length}টি পুকুর):
${fishPonds.map((p: any) => `- পুকুর #${p.pond_number} | আয়তন: ${p.area_decimal} শতাংশ | গভীরতা: ${p.depth_feet || "N/A"} ফুট | পানির উৎস: ${p.water_source || "N/A"} | প্রজাতি: ${(p.fish_species || []).join(", ")} | পোনা: ${p.fingerling_count} | গড় ওজন: ${p.current_avg_weight_g || 0}g | খাদ্য: ${p.daily_feed_amount || 0}kg/দিন | খাদ্য খরচ: ৳${p.feed_cost || 0}/দিন | বিক্রয় তারিখ: ${p.expected_sale_date || "N/A"}`).join("\n") || "কোনো পুকুর নেই"}

### আর্থিক সারসংক্ষেপ:
- মোট আয়: ৳${revenue}
- মোট ব্যয়: ৳${expenses}
- লাভ/ক্ষতি: ৳${revenue - expenses}
`;

    if (type === "recommendations") {
      // Use tool calling for structured recommendations
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: `${contextPrompt}\n\nউপরের সব ডেটা বিশ্লেষণ করে ৪-৬টি সবচেয়ে গুরুত্বপূর্ণ পরামর্শ দিন। সেচ, সার, রোগ ঝুঁকি, পশু স্বাস্থ্য, মাছ চাষ (পানির তাপমাত্রা, অক্সিজেন, খাদ্য দক্ষতা, বৃদ্ধি পূর্বাভাস, লাভ অনুমান), এবং আর্থিক বিষয় কভার করুন।` },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "generate_recommendations",
                description: "Generate structured farming recommendations based on all data streams",
                parameters: {
                  type: "object",
                  properties: {
                    recommendations: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          type: { type: "string", enum: ["irrigation", "fertilizer", "disease_risk", "animal_health", "financial", "harvest", "weather_alert", "fish_temperature", "fish_feeding", "fish_growth", "fish_profit"] },
                          emoji: { type: "string", description: "Relevant emoji" },
                          title_bn: { type: "string", description: "Title in Bangla" },
                          title_en: { type: "string", description: "Title in English" },
                          description_bn: { type: "string", description: "Short description in Bangla" },
                          description_en: { type: "string", description: "Short description in English" },
                          explanation_bn: { type: "string", description: "Detailed explanation of why this recommendation, in Bangla" },
                          explanation_en: { type: "string", description: "Detailed explanation in English" },
                          action_steps_bn: { type: "array", items: { type: "string" }, description: "Action steps in Bangla" },
                          urgency: { type: "string", enum: ["জরুরি", "মাঝারি", "তথ্যমূলক"] },
                          confidence: { type: "number", description: "Confidence percentage 0-100" },
                          priority: { type: "string", enum: ["high", "medium", "low"] },
                        },
                        required: ["type", "emoji", "title_bn", "title_en", "description_bn", "description_en", "explanation_bn", "action_steps_bn", "urgency", "confidence", "priority"],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["recommendations"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "generate_recommendations" } },
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: "Credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        const text = await response.text();
        console.error("AI error:", response.status, text);
        throw new Error("AI gateway error");
      }

      const aiResult = await response.json();
      const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
      let recommendations = [];

      if (toolCall?.function?.arguments) {
        try {
          const parsed = JSON.parse(toolCall.function.arguments);
          recommendations = parsed.recommendations || [];
        } catch (e) {
          console.error("Failed to parse tool call:", e);
        }
      }

      // Store in ai_reports
      if (recommendations.length > 0) {
        await supabase.from("ai_reports").insert({
          user_id: userId,
          farm_id: farmId,
          report_type: "smart_advisory",
          title: "Smart Advisory Report",
          explanation_bn: JSON.stringify(recommendations),
          action_steps: recommendations.map((r: any) => ({ title: r.title_bn, steps: r.action_steps_bn })),
          urgency: recommendations[0]?.urgency || "মাঝারি",
          confidence: recommendations[0]?.confidence || 75,
        });
      }

      return new Response(JSON.stringify({ recommendations, weather: weatherRes }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else if (type === "finance_analysis") {
      // Financial analysis
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: `${contextPrompt}\n\nবিস্তারিত আর্থিক বিশ্লেষণ দিন: লাভ/ক্ষতি, খরচ অপ্টিমাইজেশন, কোন ফসল/পশু বেশি লাভজনক।` },
          ],
          stream: true,
        }),
      });

      if (!response.ok) {
        const t = await response.text();
        console.error("AI error:", response.status, t);
        throw new Error("AI error");
      }

      return new Response(response.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });

    } else if (type === "smart_schedule") {
      // Generate smart schedule
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: `${contextPrompt}\n\nআগামী ৭ দিনের জন্য কাজের তালিকা তৈরি করুন। সার প্রয়োগ, টিকা, সেচ, ফসল কাটা — সব কিছু কভার করুন।` },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "generate_schedule",
                description: "Generate a 7-day smart schedule for the farm",
                parameters: {
                  type: "object",
                  properties: {
                    tasks: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          title: { type: "string" },
                          title_bn: { type: "string" },
                          due_date: { type: "string", description: "ISO date YYYY-MM-DD" },
                          priority: { type: "string", enum: ["high", "medium", "low"] },
                          task_type: { type: "string", enum: ["irrigation", "fertilizer", "vaccination", "harvest", "pest_control", "feeding", "general"] },
                          description: { type: "string", description: "Brief description in Bangla" },
                        },
                        required: ["title", "title_bn", "due_date", "priority", "task_type"],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["tasks"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "generate_schedule" } },
        }),
      });

      if (!response.ok) throw new Error("AI error");
      const aiResult = await response.json();
      const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
      let tasks: any[] = [];

      if (toolCall?.function?.arguments) {
        try {
          tasks = JSON.parse(toolCall.function.arguments).tasks || [];
        } catch {}
      }

      // Save tasks to farm_tasks
      let savedCount = 0;
      for (const task of tasks) {
        const { error } = await supabase.from("farm_tasks").insert({
          farm_id: farmId,
          title: task.title,
          title_bn: task.title_bn,
          due_date: task.due_date,
          priority: task.priority,
          task_type: task.task_type,
          description: task.description || null,
          source: "ai",
        });
        if (!error) savedCount++;
      }

      return new Response(JSON.stringify({ tasks, saved: savedCount }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else {
      return new Response(JSON.stringify({ error: "Unknown type. Use: recommendations, finance_analysis, smart_schedule" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

  } catch (e) {
    console.error("smart-advisory error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function fetchWeather() {
  try {
    const OPENWEATHER_API_KEY = Deno.env.get("OPENWEATHER_API_KEY");
    if (!OPENWEATHER_API_KEY) return null;

    const [currentRes, forecastRes] = await Promise.all([
      fetch(`https://api.openweathermap.org/data/2.5/weather?lat=23.8103&lon=90.4125&units=metric&appid=${OPENWEATHER_API_KEY}`),
      fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=23.8103&lon=90.4125&units=metric&cnt=16&appid=${OPENWEATHER_API_KEY}`),
    ]);

    if (!currentRes.ok) return null;
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
            description: item.weather[0]?.description,
            wind: Math.round(item.wind.speed * 3.6),
          });
        }
      }
    }

    return {
      current: {
        temp: Math.round(current.main.temp),
        feels_like: Math.round(current.main.feels_like),
        humidity: current.main.humidity,
        wind: Math.round(current.wind.speed * 3.6),
        weather: current.weather[0]?.main,
        description: current.weather[0]?.description,
      },
      forecast: dailyForecast,
    };
  } catch (e) {
    console.error("Weather fetch error:", e);
    return null;
  }
}

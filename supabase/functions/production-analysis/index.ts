import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

function normalizeInput(input: string | null | undefined): string {
  if (!input) return "";
  const lower = input.toLowerCase().trim();
  const banglishMap: { [key: string]: string } = {
    "rice": "ধান", "ris": "ধান", "dhan": "ধান",
    "wheat": "গম", "gom": "গম",
    "corn": "ভুট্টা", "maize": "ভুট্টা", "bhutta": "ভুট্টা",
    "potato": "আলু", "alu": "আলু", "aloo": "আলু",
    "vegetable": "সবজি", "sabzi": "সবজি",
    "jute": "পাট", "pat": "পাট",
    "urea": "ইউরিয়া", "yuria": "ইউরিয়া",
    "tsp": "টিএসপি", "dap": "ডিএপি", "mop": "এমওপি",
  };
  return banglishMap[lower] || input;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

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

    const { harvestRecords, livestockLogs, language } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const bn = language === "bn";

    const systemPrompt = bn
      ? `তুমি একজন বাংলাদেশি কৃষি বিশ্লেষক। কৃষকের উৎপাদন ডেটা বিশ্লেষণ করো এবং JSON ফরম্যাটে উত্তর দাও।
তোমার বিশ্লেষণে থাকবে:
1. yield_analysis: প্রতি বিঘায় উৎপাদন হার ও জাতীয় গড়ের সাথে তুলনা
2. profit_analysis: মোট আয়, মোট খরচ, নিট লাভ, লাভের শতাংশ
3. cost_optimization: কোন খরচ বেশি এবং কীভাবে কমানো যায়
4. trend_alerts: উৎপাদন কমেছে বা খরচ বেড়েছে কিনা
5. recommendations: ৩-৫টি সুপারিশ

JSON format:
{
  "yield_per_unit": number,
  "yield_comparison": "above_average" | "average" | "below_average",
  "total_revenue": number,
  "total_cost": number,
  "net_profit": number,
  "profit_margin_percent": number,
  "cost_breakdown": { "fertilizer": number, "labor": number, "irrigation": number, "medicine": number },
  "alerts": [{ "type": "warning" | "info" | "success", "message": string }],
  "recommendations": [string],
  "summary_bn": string
}`
      : `You are an agricultural analyst. Analyze the farmer's production data and respond in JSON.
Include:
1. yield_analysis: production rate per unit land vs national average
2. profit_analysis: revenue, cost, net profit, margin %
3. cost_optimization: which costs are high
4. trend_alerts: production drops or cost increases
5. recommendations: 3-5 actionable tips

JSON format:
{
  "yield_per_unit": number,
  "yield_comparison": "above_average" | "average" | "below_average",
  "total_revenue": number,
  "total_cost": number,
  "net_profit": number,
  "profit_margin_percent": number,
  "cost_breakdown": { "fertilizer": number, "labor": number, "irrigation": number, "medicine": number },
  "alerts": [{ "type": "warning" | "info" | "success", "message": string }],
  "recommendations": [string],
  "summary_bn": string
}`;

    // Limit input size to prevent abuse
    const limitedHarvest = Array.isArray(harvestRecords) ? harvestRecords.slice(0, 100) : [];
    const limitedLivestock = Array.isArray(livestockLogs) ? livestockLogs.slice(0, 100) : [];
    const userContent = JSON.stringify({ harvestRecords: limitedHarvest, livestockLogs: limitedLivestock }).substring(0, 50000);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "production_analysis",
              description: "Return structured production analysis",
              parameters: {
                type: "object",
                properties: {
                  yield_per_unit: { type: "number" },
                  yield_comparison: { type: "string", enum: ["above_average", "average", "below_average"] },
                  total_revenue: { type: "number" },
                  total_cost: { type: "number" },
                  net_profit: { type: "number" },
                  profit_margin_percent: { type: "number" },
                  cost_breakdown: {
                    type: "object",
                    properties: { fertilizer: { type: "number" }, labor: { type: "number" }, irrigation: { type: "number" }, medicine: { type: "number" } },
                    required: ["fertilizer", "labor", "irrigation", "medicine"],
                  },
                  alerts: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: { type: { type: "string", enum: ["warning", "info", "success"] }, message: { type: "string" } },
                      required: ["type", "message"],
                    },
                  },
                  recommendations: { type: "array", items: { type: "string" } },
                  summary_bn: { type: "string" },
                },
                required: ["yield_per_unit", "total_revenue", "total_cost", "net_profit", "profit_margin_percent", "alerts", "recommendations", "summary_bn"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "production_analysis" } },
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Payment required." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI error:", status, text);
      throw new Error("AI gateway error");
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    let analysis;
    if (toolCall?.function?.arguments) {
      analysis = typeof toolCall.function.arguments === "string"
        ? JSON.parse(toolCall.function.arguments)
        : toolCall.function.arguments;
    } else {
      const content = result.choices?.[0]?.message?.content || "{}";
      analysis = JSON.parse(content);
    }

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("production-analysis error:", e);
    return new Response(JSON.stringify({ error: "Something went wrong" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
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

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if we already have today's prices
    const today = new Date().toISOString().split("T")[0];
    const { data: existingPrices } = await supabase
      .from("market_prices")
      .select("id")
      .gte("recorded_at", `${today}T00:00:00`)
      .limit(1);

    if (existingPrices && existingPrices.length > 0) {
      const { data: prices } = await supabase
        .from("market_prices")
        .select("*")
        .gte("recorded_at", `${today}T00:00:00`)
        .order("recorded_at", { ascending: false });

      return new Response(JSON.stringify({ prices, source: "cache" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a Bangladesh agricultural market price expert. Generate realistic current wholesale market prices for common agricultural products sold in Bangladesh bazaars. 
Use realistic prices in BDT (৳) based on current Bangladesh market trends for February 2026. Prices should reflect seasonal variations and recent trends.
Products MUST be in Bangla. Include the source bazaar name.`,
          },
          {
            role: "user",
            content: `আজকের তারিখ: ${today}। বাংলাদেশের প্রধান বাজারের পাইকারি দর দিন। নিচের পণ্যগুলোর দাম দিন:

ধান (মোটা), ধান (চিকন), চাল (মিনিকেট), গম, ভুট্টা, পেঁয়াজ, আলু, টমেটো, বেগুন, মরিচ (কাঁচা), রসুন, আদা, হলুদ, ডাল (মসুর), সরিষার তেল, দুধ, ডিম (হালি), মুরগি (ব্রয়লার), গরুর মাংস, মাছ (রুই), মাছ (পাঙ্গাস), পাট

প্রতিটি পণ্যের জন্য বাস্তবসম্মত দাম দিন যা বর্তমান বাজারের কাছাকাছি।`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "save_market_prices",
              description: "Save today's market prices for Bangladesh agricultural products",
              parameters: {
                type: "object",
                properties: {
                  prices: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        product: { type: "string", description: "Product name in Bangla" },
                        price: { type: "number", description: "Price in BDT" },
                        unit: { type: "string", description: "Unit in Bangla (e.g., কেজি, মণ, হালি, লিটার)" },
                        source: { type: "string", description: "Market source name in Bangla" },
                      },
                      required: ["product", "price", "unit", "source"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["prices"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "save_market_prices" } },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("AI error:", response.status, text);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResult = await response.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    let prices: any[] = [];

    if (toolCall?.function?.arguments) {
      try {
        prices = JSON.parse(toolCall.function.arguments).prices || [];
      } catch (e) {
        console.error("Failed to parse prices:", e);
        throw new Error("Failed to parse AI response");
      }
    }

    // Delete old prices (keep last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    await supabase
      .from("market_prices")
      .delete()
      .lt("recorded_at", weekAgo.toISOString());

    const now = new Date().toISOString();
    const inserts = prices.map((p: any) => ({
      product: p.product,
      price: p.price,
      unit: p.unit,
      source: p.source,
      recorded_at: now,
    }));

    if (inserts.length > 0) {
      const { error } = await supabase.from("market_prices").insert(inserts);
      if (error) {
        console.error("Insert error:", error);
        throw new Error("Failed to save prices");
      }
    }

    return new Response(JSON.stringify({ prices: inserts, source: "fresh" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("market-prices error:", e);
    return new Response(
      JSON.stringify({ error: "Something went wrong" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

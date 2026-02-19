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

    const today = new Date().toISOString().split("T")[0];

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
            content: "You are a Bangladesh agricultural market expert. Return realistic average retail prices in BDT for farming essentials in Bangladesh for the current date.",
          },
          {
            role: "user",
            content: `Date: ${today}. Give me average prices in BDT for these items in Bangladesh market:
urea_50kg, tsp_50kg, mop_50kg, dap_50kg, organic_compost_50kg, gypsum_50kg,
cattle_feed_50kg, layer_feed_50kg, broiler_feed_50kg, goat_feed_25kg, fish_feed_25kg, duck_feed_25kg,
pesticide_1l, fungicide_500ml, animal_vitamin_pack, herbicide_1l`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_prices",
              description: "Return item prices as key-value pairs",
              parameters: {
                type: "object",
                properties: {
                  prices: {
                    type: "object",
                    description: "Map of item key to price in BDT",
                    additionalProperties: { type: "number" },
                  },
                },
                required: ["prices"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_prices" } },
      }),
    });

    if (!response.ok) throw new Error(`AI error: ${response.status}`);

    const aiResult = await response.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    let prices: Record<string, number> = {};

    if (toolCall?.function?.arguments) {
      prices = JSON.parse(toolCall.function.arguments).prices || {};
    }

    return new Response(JSON.stringify({ prices }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("essential-prices error:", e);
    return new Response(
      JSON.stringify({ error: "Something went wrong" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function sanitizeText(input: string | null | undefined, maxLength = 200): string {
  if (!input || typeof input !== 'string') return '';
  return input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '').substring(0, maxLength).trim();
}

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

    const { itemType, itemName, growthStage, soilType, breed, animalType, language } = await req.json();
    const bn = language === "bn";

    // Sanitize all text inputs
    const cleanItemName = sanitizeText(itemName, 100);
    const cleanGrowthStage = sanitizeText(growthStage, 50);
    const cleanSoilType = sanitizeText(soilType, 50);
    const cleanBreed = sanitizeText(breed, 100);
    const cleanAnimalType = sanitizeText(animalType, 100);

    if (!cleanItemName && !cleanAnimalType) {
      return new Response(JSON.stringify({ error: "Item name is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let prompt = "";
    if (itemType === "crop") {
      prompt = `A Bangladeshi farmer just added a new crop: "${cleanItemName}"${cleanGrowthStage ? `, growth stage: ${cleanGrowthStage}` : ""}${cleanSoilType ? `, soil type: ${cleanSoilType}` : ""}.
Give exactly 4-5 specific, practical suggestions for this crop in Bangladesh context. Include:
- Which specific fertilizers to use and when (e.g., Urea, TSP, MOP, DAP)
- Which pesticides/fungicides may be needed
- Irrigation tips specific to this crop
- Any disease prevention measures
Each suggestion should be actionable and specific to this crop.`;
    } else {
      prompt = `A Bangladeshi farmer just added livestock: "${cleanAnimalType || cleanItemName}"${cleanBreed ? `, breed: ${cleanBreed}` : ""}.
Give exactly 4-5 specific, practical suggestions for this animal in Bangladesh context. Include:
- What feed to provide and daily quantity
- Which vaccines are essential and their schedule
- Common diseases to watch for and prevention
- Vitamins or supplements needed
Each suggestion should be actionable and specific to this animal type.`;
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
            content: `You are a Bangladesh agricultural expert. Provide practical farming suggestions. Always respond in ${bn ? "Bangla" : "English"}.`,
          },
          { role: "user", content: prompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_suggestions",
              description: "Return farming suggestions as structured data",
              parameters: {
                type: "object",
                properties: {
                  suggestions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        emoji: { type: "string", description: "A relevant emoji" },
                        title: { type: "string", description: "Short title (max 8 words)" },
                        description: { type: "string", description: "Detailed actionable advice (2-3 sentences)" },
                        category: { type: "string", enum: ["fertilizer", "feed", "vaccine", "pesticide", "irrigation", "health", "general"] },
                      },
                      required: ["emoji", "title", "description", "category"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["suggestions"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_suggestions" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI error: ${response.status}`);
    }

    const aiResult = await response.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    let suggestions: any[] = [];

    if (toolCall?.function?.arguments) {
      suggestions = JSON.parse(toolCall.function.arguments).suggestions || [];
    }

    return new Response(JSON.stringify({ suggestions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("farm-item-suggestions error:", e);
    return new Response(
      JSON.stringify({ error: "Something went wrong" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

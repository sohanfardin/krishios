import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Authenticate user - REQUIRED
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
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

    const { image, type, farmId, storagePath, language } = await req.json();
    if (!image || typeof image !== 'string') throw new Error("No image provided");

    // Validate image URL format
    if (!image.startsWith('data:image/') && !image.startsWith('https://')) {
      return new Response(JSON.stringify({ error: "Invalid image format" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate type parameter
    const validTypes = ["crop", "livestock"];
    const cleanType = validTypes.includes(type) ? type : "crop";

    const bn = language === "bn";

    const systemPrompt = bn
      ? `তুমি একজন বাংলাদেশি কৃষি বিশেষজ্ঞ AI। কৃষকের দেওয়া ছবি বিশ্লেষণ করো। 
${cleanType === "crop" ? "ফসল/পাতা/মাটির ছবি দেখে রোগ, পোকামাকড়, পুষ্টির ঘাটতি, বৃদ্ধির অবস্থা চিহ্নিত করো।" : "পশুর ছবি দেখে স্বাস্থ্য, রোগের লক্ষণ, পুষ্টি অবস্থা চিহ্নিত করো।"}
বাংলায় সহজ ভাষায় উত্তর দাও।`
      : `You are an agricultural expert AI for Bangladesh. Analyze the farmer's uploaded image.
${cleanType === "crop" ? "Identify diseases, pests, nutrient deficiencies, and growth status from crop/leaf/soil images." : "Identify health issues, disease symptoms, and nutrition status from livestock images."}
Respond clearly.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: bn ? "এই ছবিটি বিশ্লেষণ করো এবং সমস্যা ও সমাধান বলো।" : "Analyze this image and identify issues and solutions." },
              { type: "image_url", image_url: { url: image } },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "image_diagnosis",
              description: "Return structured diagnosis from the image",
              parameters: {
                type: "object",
                properties: {
                  emoji: { type: "string" },
                  title_bn: { type: "string", description: "Diagnosis title in Bangla" },
                  title_en: { type: "string", description: "Diagnosis title in English" },
                  diagnosis: { type: "string", description: "What was identified" },
                  diagnosis_bn: { type: "string", description: "Detailed diagnosis in Bangla" },
                  diagnosis_en: { type: "string", description: "Detailed diagnosis in English" },
                  risk_level: { type: "string", enum: ["low", "medium", "high"] },
                  confidence: { type: "number", description: "Confidence 0-100" },
                  recommendations_bn: { type: "array", items: { type: "string" }, description: "Action steps in Bangla" },
                  recommendations_en: { type: "array", items: { type: "string" }, description: "Action steps in English" },
                },
                required: ["emoji", "title_bn", "title_en", "diagnosis", "diagnosis_bn", "diagnosis_en", "risk_level", "confidence", "recommendations_bn", "recommendations_en"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "image_diagnosis" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const text = await response.text();
      console.error("AI error:", response.status, text);
      throw new Error("AI gateway error");
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    let diagnosis: any = {};

    if (toolCall?.function?.arguments) {
      diagnosis = typeof toolCall.function.arguments === "string"
        ? JSON.parse(toolCall.function.arguments)
        : toolCall.function.arguments;
    }

    // Save to images table using authenticated user
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (storagePath) {
      await supabase.from("images").insert({
        user_id: user.id,
        farm_id: farmId || null,
        storage_path: storagePath,
        image_type: cleanType === "crop" ? "crop_diagnosis" : "livestock_diagnosis",
        ai_analysis: diagnosis,
      });
    }

    // Save urgent alerts
    if (farmId && diagnosis.risk_level === "high") {
      // Verify farm ownership before creating alert
      const { data: farmData } = await supabase
        .from("farms")
        .select("id")
        .eq("id", farmId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (farmData) {
        await supabase.from("alerts").insert({
          user_id: user.id,
          farm_id: farmId,
          alert_type: cleanType === "crop" ? "crop_disease" : "livestock_health",
          severity: "critical",
          title_bn: diagnosis.title_bn,
          message_bn: diagnosis.diagnosis_bn,
        });
      }
    }

    return new Response(JSON.stringify(diagnosis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("image-diagnosis error:", e);
    return new Response(JSON.stringify({ error: "Something went wrong" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

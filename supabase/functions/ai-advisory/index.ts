import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are KrishiOS AI - একজন বিশেষজ্ঞ কৃষি পরামর্শদাতা (Expert Agricultural Advisor) for Bangladeshi farmers.

RULES:
1. ALWAYS respond in Bangla (বাংলা) first, with English translation if helpful
2. Give practical, actionable farming advice for Bangladesh climate and conditions
3. Consider local crop varieties (BRRI rice, local vegetables), livestock breeds (Black Bengal goat, Sonali chicken), and Bangladeshi seasons
4. Reference local units: bigha, mon, taka (৳)
5. For disease detection: describe symptoms, likely disease, treatment, and prevention
6. For weather advice: consider Bangladesh monsoon patterns
7. Be empathetic and supportive - many farmers have limited resources
8. Include urgency level and confidence when giving advice
9. Structure responses with clear action steps

When analyzing crop/livestock images:
- Identify visible symptoms or conditions
- Suggest likely diagnosis with confidence %
- Provide immediate treatment steps
- Suggest preventive measures
- Recommend when to consult a local agricultural officer`;

function sanitizeText(input: string | null | undefined, maxLength = 2000): string {
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

    const { type, messages, image, farmContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const aiMessages: any[] = [
      { role: "system", content: SYSTEM_PROMPT },
    ];

    // Add farm context if available (sanitize to prevent oversized payloads)
    if (farmContext) {
      const contextStr = JSON.stringify(farmContext).substring(0, 5000);
      aiMessages.push({
        role: "system",
        content: `Current farm context: ${contextStr}`,
      });
    }

    if (type === "disease_detect" && image) {
      // Validate image URL
      if (typeof image !== 'string' || (!image.startsWith('data:image/') && !image.startsWith('https://'))) {
        return new Response(JSON.stringify({ error: "Invalid image format" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      aiMessages.push({
        role: "user",
        content: [
          { type: "text", text: "এই ছবি বিশ্লেষণ করুন এবং রোগ শনাক্ত করুন। বিস্তারিত পরামর্শ দিন। (Analyze this image and detect any disease. Give detailed advice.)" },
          { type: "image_url", image_url: { url: image } },
        ],
      });
    } else if (messages && Array.isArray(messages) && messages.length > 0) {
      // Sanitize user messages - limit length
      const sanitizedMessages = messages.slice(0, 50).map((m: any) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: typeof m.content === 'string' ? sanitizeText(m.content, 3000) : m.content,
      }));
      aiMessages.push(...sanitizedMessages);
    } else {
      return new Response(JSON.stringify({ error: "No messages provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const model = type === "disease_detect" ? "google/gemini-2.5-flash" : "google/gemini-3-flash-preview";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: aiMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন। (Rate limit exceeded)" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI ক্রেডিট শেষ হয়ে গেছে। (Credits exhausted)" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-advisory error:", e);
    return new Response(JSON.stringify({ error: "Something went wrong" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

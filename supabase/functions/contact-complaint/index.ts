import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

function sanitizeText(input: string | null | undefined, maxLength = 5000): string {
  if (!input || typeof input !== 'string') return '';
  return input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '').substring(0, maxLength).trim();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user - extract userId from JWT, not request body
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

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

    const { name, email, phone, message } = await req.json();

    const cleanMessage = sanitizeText(message, 5000);
    const cleanName = sanitizeText(name, 200);
    const cleanEmail = sanitizeText(email, 255);
    const cleanPhone = sanitizeText(phone, 20);

    if (!cleanMessage) {
      return new Response(JSON.stringify({ error: "Message is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Save to DB using validated user.id from JWT
    const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    await supabase.from("complaints").insert({
      user_id: user.id,
      name: cleanName || "",
      email: cleanEmail || null,
      phone: cleanPhone || null,
      message: cleanMessage,
    });

    // Send email notification with HTML-escaped content
    const adminEmail = Deno.env.get("ADMIN_EMAIL") || "admin@krishios.com";
    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "KrishiOS <onboarding@resend.dev>",
        to: [adminEmail],
        subject: `🌾 নতুন অভিযোগ/যোগাযোগ - ${escapeHtml(cleanName || "Unknown")}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #16a34a;">🌾 কৃষিOS - নতুন যোগাযোগ বার্তা</h2>
            <hr style="border: 1px solid #e5e7eb;" />
            <p><strong>নাম:</strong> ${escapeHtml(cleanName || "N/A")}</p>
            <p><strong>ইমেইল:</strong> ${escapeHtml(cleanEmail || "N/A")}</p>
            <p><strong>ফোন:</strong> ${escapeHtml(cleanPhone || "N/A")}</p>
            <hr style="border: 1px solid #e5e7eb;" />
            <h3>বার্তা:</h3>
            <p style="background: #f3f4f6; padding: 16px; border-radius: 8px; white-space: pre-wrap;">${escapeHtml(cleanMessage)}</p>
            <hr style="border: 1px solid #e5e7eb;" />
            <p style="color: #6b7280; font-size: 12px;">এই বার্তাটি কৃষিOS অ্যাপ থেকে পাঠানো হয়েছে।</p>
          </div>
        `,
      }),
    });

    const emailResult = await emailRes.json();
    console.log("Email sent:", emailResult);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("contact-complaint error:", e);
    return new Response(JSON.stringify({ error: "Something went wrong" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

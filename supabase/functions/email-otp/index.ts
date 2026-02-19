import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { action, email, otp_code } = await req.json();

    if (action === "send") {
      if (!email || typeof email !== 'string') {
        return new Response(JSON.stringify({ error: "Email is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email) || email.length > 255) {
        return new Response(JSON.stringify({ error: "Invalid email format" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Rate limiting: max 3 OTPs per email per minute
      const { data: recentOtps } = await supabase
        .from("email_otps")
        .select("created_at")
        .eq("email", email)
        .gte("created_at", new Date(Date.now() - 60 * 1000).toISOString());

      if (recentOtps && recentOtps.length >= 3) {
        return new Response(JSON.stringify({ error: "Too many requests. Please wait a minute." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      // Delete old OTPs for this email
      await supabase.from("email_otps").delete().eq("email", email);

      // Insert new OTP
      const { error: insertError } = await supabase.from("email_otps").insert({
        email,
        otp_code: otp,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      });

      if (insertError) {
        console.error("Insert error:", insertError);
        return new Response(JSON.stringify({ error: "Failed to create OTP" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Try sending email via Resend
      let emailSent = false;
      const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
      
      if (RESEND_API_KEY) {
        try {
          const emailRes = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${RESEND_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "কৃষিOS <onboarding@resend.dev>",
              to: [email],
              subject: `🔐 আপনার OTP কোড: ${otp}`,
              html: `
                <div style="font-family:sans-serif;max-width:400px;margin:0 auto;padding:20px;text-align:center;">
                  <h2 style="color:#16a34a;">🌾 কৃষিOS</h2>
                  <p>আপনার ইমেইল যাচাই করতে নিচের কোডটি ব্যবহার করুন:</p>
                  <div style="background:#f0fdf4;border:2px solid #16a34a;border-radius:12px;padding:20px;margin:20px 0;">
                    <span style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#16a34a;">${otp}</span>
                  </div>
                  <p style="color:#666;font-size:14px;">এই কোডটি ১০ মিনিট পর্যন্ত বৈধ থাকবে।</p>
                </div>
              `,
            }),
          });

          if (emailRes.ok) {
            emailSent = true;
          } else {
            const errText = await emailRes.text();
            console.error("Resend error:", errText);
          }
        } catch (e) {
          console.error("Email send error:", e);
        }
      }

      if (emailSent) {
        return new Response(JSON.stringify({ success: true, email_sent: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } else {
        console.error(`[email-otp] Email delivery failed for ${email}. OTP was stored but not sent.`);
        return new Response(
          JSON.stringify({ error: "Email delivery failed. Please try again later." }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    if (action === "verify") {
      if (!email || !otp_code) {
        return new Response(
          JSON.stringify({ error: "Email and OTP code required" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const { data, error } = await supabase
        .from("email_otps")
        .select("*")
        .eq("email", email)
        .eq("otp_code", otp_code)
        .eq("verified", false)
        .gte("expires_at", new Date().toISOString())
        .maybeSingle();

      if (error || !data) {
        return new Response(
          JSON.stringify({ error: "Invalid or expired OTP code", verified: false }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      await supabase
        .from("email_otps")
        .update({ verified: true })
        .eq("id", data.id);

      return new Response(
        JSON.stringify({ success: true, verified: true }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: "Something went wrong" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

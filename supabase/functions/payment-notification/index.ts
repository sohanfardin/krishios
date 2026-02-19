import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("Authorization")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { plan, transaction_id, amount, payment_method, sender_mobile } = await req.json();

    // Insert payment request
    const { error: insertError } = await supabase
      .from("payment_requests")
      .insert({
        user_id: user.id,
        plan,
        transaction_id,
        amount,
        payment_method: payment_method || "bkash",
        status: "pending",
      });

    if (insertError) throw insertError;

    // Get user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, phone, email")
      .eq("user_id", user.id)
      .single();

    const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL") || "admin@krishios.com";

    const notificationData = {
      user_name: profile?.full_name || "Unknown",
      user_email: profile?.email || user.email || "N/A",
      user_phone: profile?.phone || "N/A",
      sender_mobile: sender_mobile || "N/A",
      plan,
      amount,
      transaction_id,
      payment_method: payment_method || "bkash",
      time: new Date().toISOString(),
      admin_email: ADMIN_EMAIL,
    };

    console.log("NEW PAYMENT REQUEST:", JSON.stringify(notificationData));

    // Send email via Resend
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (resendApiKey) {
      const emailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: "KrishiBot <onboarding@resend.dev>",
          to: [ADMIN_EMAIL],
          subject: `💳 New Payment: ${plan} plan - ৳${amount}`,
          html: `
            <h2>New Payment Request</h2>
            <table style="border-collapse:collapse;width:100%">
              <tr><td style="padding:8px;border:1px solid #ddd"><strong>User</strong></td><td style="padding:8px;border:1px solid #ddd">${notificationData.user_name}</td></tr>
              <tr><td style="padding:8px;border:1px solid #ddd"><strong>Email</strong></td><td style="padding:8px;border:1px solid #ddd">${notificationData.user_email}</td></tr>
              <tr><td style="padding:8px;border:1px solid #ddd"><strong>Sender Mobile</strong></td><td style="padding:8px;border:1px solid #ddd">${notificationData.sender_mobile}</td></tr>
              <tr><td style="padding:8px;border:1px solid #ddd"><strong>Profile Phone</strong></td><td style="padding:8px;border:1px solid #ddd">${notificationData.user_phone}</td></tr>
              <tr><td style="padding:8px;border:1px solid #ddd"><strong>Plan</strong></td><td style="padding:8px;border:1px solid #ddd">${plan}</td></tr>
              <tr><td style="padding:8px;border:1px solid #ddd"><strong>Amount</strong></td><td style="padding:8px;border:1px solid #ddd">৳${amount}</td></tr>
              <tr><td style="padding:8px;border:1px solid #ddd"><strong>Method</strong></td><td style="padding:8px;border:1px solid #ddd">${notificationData.payment_method}</td></tr>
              <tr><td style="padding:8px;border:1px solid #ddd"><strong>Transaction ID</strong></td><td style="padding:8px;border:1px solid #ddd">${transaction_id}</td></tr>
              <tr><td style="padding:8px;border:1px solid #ddd"><strong>Time</strong></td><td style="padding:8px;border:1px solid #ddd">${notificationData.time}</td></tr>
            </table>
          `,
        }),
      });
      const emailResult = await emailRes.json();
      console.log("Resend response:", JSON.stringify(emailResult));
    } else {
      console.warn("RESEND_API_KEY not set, skipping email");
    }

    return new Response(
      JSON.stringify({ success: true, message: "Payment request submitted" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Something went wrong" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

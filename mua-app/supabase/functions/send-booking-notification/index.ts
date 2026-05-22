// @ts-nocheck
// supabase/functions/send-booking-notification/index.ts
// Deploy: npx supabase functions deploy send-booking-notification --project-ref wseaqjhgioldhzqegjjj

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { bookingId, muaId, clientName, date, time } = await req.json();

    if (!muaId || !clientName || !date || !time) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters: muaId, clientName, date, and time are required." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    console.log(`Fetching profile for MUA: ${muaId} to retrieve push token...`);

    // Fetch the MUA's fcm_token securely on the backend (RLS is bypassed via service role key)
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("fcm_token, full_name, business_name")
      .eq("id", muaId)
      .single();

    if (profileError) {
      console.error("Error fetching MUA profile:", profileError);
      throw profileError;
    }

    const fcmToken = profile?.fcm_token;

    if (!fcmToken) {
      console.warn(`MUA ${muaId} has no registered FCM token. Skipping notification.`);
      return new Response(
        JSON.stringify({ success: false, message: "MUA has no registered push token." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    console.log(`Sending Expo push notification to MUA token: ${fcmToken}...`);

    // Send push notification to Expo API
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        to: fcmToken,
        title: "📅 Booking Baru Masuk!",
        body: `${clientName} baru saja booking untuk tanggal ${date} jam ${time}`,
        data: { type: "new_booking", bookingId: bookingId || null },
        sound: "default",
        priority: "high",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Expo Push API error: ${response.status} — ${errorText}`);
    }

    const responseData = await response.json();
    console.log("Expo Push API response:", JSON.stringify(responseData));

    return new Response(
      JSON.stringify({ success: true, expoResponse: responseData }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    console.error("send-booking-notification Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

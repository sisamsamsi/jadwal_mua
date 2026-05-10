// @ts-nocheck
// supabase/functions/parse-booking/index.ts
// Deploy: supabase functions deploy parse-booking
// Set secret: supabase secrets set GROQ_API_KEY=gsk_xxxxx

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");

const corsHeaders = {
  // DEVELOPMENT: '*' diizinkan saat testing
  // PRODUCTION: Ganti ke domain spesifik: 'https://mua-jadwal.web.app'
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle preflight CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { message } = await req.json();

    if (!message) {
      return new Response(
        JSON.stringify({ error: "Field 'message' wajib diisi." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    if (!GROQ_API_KEY) {
      return new Response(
        JSON.stringify({ error: "GROQ_API_KEY belum dikonfigurasi di Supabase Secrets." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const today = new Date().toISOString().split("T")[0];

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: `Anda adalah asisten MUA yang ahli mengekstrak data dari pesan teks WhatsApp.
Tanggal hari ini: ${today}. Gunakan ini sebagai referensi untuk "besok", "lusa", dll.

Ekstrak informasi berikut dalam format JSON:
{
  "clientName": string,
  "bookingDate": string (format YYYY-MM-DD),
  "startTime": string (format HH:mm),
  "endTime": string (format HH:mm),
  "locationName": string,
  "locationAddress": string,
  "numPersons": number,
  "eventType": string (pilih salah satu: Akad, Resepsi, Fitting, Rapat, Siraman, Lamaran, Lainnya),
  "notes": string
}

Jika data tidak ditemukan, gunakan string kosong "" untuk string atau null untuk angka.
HANYA kembalikan JSON murni, tanpa penjelasan lain.`,
          },
          {
            role: "user",
            content: message,
          },
        ],
        temperature: 0.1,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Groq API error: ${response.status} — ${errorText}`);
    }

    const result = await response.json();
    const parsed = JSON.parse(result.choices[0].message.content);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Edge Function Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Terjadi kesalahan internal." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

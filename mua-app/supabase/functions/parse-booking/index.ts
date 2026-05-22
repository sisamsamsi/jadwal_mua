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

    const today = new Date();
    // Sesuaikan ke WIB (UTC+7) untuk referensi tanggal yang akurat bagi MUA di Indonesia
    const wibDate = new Date(today.getTime() + (7 * 60 * 60 * 1000));
    const todayStr = wibDate.toISOString().split("T")[0];

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
            content: `Anda adalah asisten MUA profesional. Tugas Anda adalah mengekstrak data booking dari pesan teks.
            
REFERENSI WAKTU:
- Tanggal HARI INI: ${todayStr}
- Jika user menyebut "besok", maka tanggalnya adalah ${todayStr} + 1 hari.
- Jika user menyebut "lusa", maka tanggalnya adalah ${todayStr} + 2 hari.
- Jika user menyebut hari (misal: "hari Sabtu"), cari tanggal hari Sabtu terdekat SETELAH ${todayStr}.

OUTPUT JSON:
{
  "clientName": string,
  "clientPhone": string (nomor HP/WhatsApp klien jika disebutkan di dalam teks, contoh: "08123456789", kosongkan jika tidak ada),
  "serviceName": string (nama layanan makeup yang disebutkan, misal: "Makeup Pengantin", "Makeup Wisuda". Kosong string jika tidak disebutkan),
  "servicePrice": number (harga/budget layanan yang disebutkan/disepakati jika ada di dalam teks, contoh: 500000, isi 0 jika tidak ada),
  "bookingDate": "YYYY-MM-DD",
  "startTime": "HH:mm",
  "endTime": "HH:mm" (tambah 2-3 jam dari startTime jika tidak disebut),
  "locationName": string,
  "locationAddress": string,
  "numPersons": number,
  "eventType": "Akad" | "Resepsi" | "Fitting" | "Rapat" | "Siraman" | "Lamaran" | "Lainnya",
  "notes": string
}

HANYA kembalikan JSON. Jangan ada teks penjelasan.`,
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

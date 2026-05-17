// @ts-nocheck
// supabase/functions/ai-assistant/index.ts
// Deploy: npx supabase functions deploy ai-assistant --project-ref wseaqjhgioldhzqegjjj
// Set secret: npx supabase secrets set GROQ_API_KEY=gsk_xxxxx --project-ref wseaqjhgioldhzqegjjj

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle preflight CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { task, context } = await req.json();

    if (!task || !context) {
      return new Response(
        JSON.stringify({ error: "Field 'task' dan 'context' wajib diisi." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    if (!GROQ_API_KEY) {
      return new Response(
        JSON.stringify({ error: "GROQ_API_KEY belum dikonfigurasi di Supabase Secrets." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    let systemPrompt = "";
    let userPrompt = "";

    const { clientName, serviceName, date, time, location, notes, totalPrice } = context;

    if (task === "whatsapp") {
      systemPrompt = `Anda adalah asisten MUA (Makeup Artist) profesional di Indonesia. Tugas Anda adalah membuat draf pesan WhatsApp yang ramah, hangat, sopan, dan profesional dalam Bahasa Indonesia untuk dikirimkan kepada klien mengenai jadwal booking mereka. 
Gunakan nada bicara yang manis, anggun, ramah, dan penuh antusiasme khas industri kecantikan. Gunakan sapaan hangat seperti "Kak", "Sist", atau nama klien (misal: "Kak Rina").
Sertakan detail booking secara terstruktur, rapi, dan mudah dibaca:
- Sapaan awal yang manis dan ucapan terima kasih karena mempercayakan riasan kepada MUA.
- Detail booking lengkap (Layanan/Acara, Tanggal, Jam mulai & selesai, serta Lokasi/Venue).
- Catatan atau request khusus (jika ada).
- Total Biaya / Sisa Tagihan (jika ada, tuliskan dengan sopan).
- Kalimat penutup yang manis dan instruksi konfirmasi jika ada perubahan/pertanyaan.
Gunakan emoji yang pas untuk mempercantik draf pesan.`;

      userPrompt = `Buat draf pesan WhatsApp manis untuk detail booking berikut:
- Nama Klien: ${clientName || "-"}
- Layanan/Acara: ${serviceName || "-"}
- Tanggal Acara: ${date || "-"}
- Jam Acara: ${time || "-"}
- Lokasi/Venue: ${location || "-"}
- Catatan tambahan: ${notes || "-"}
- Sisa Tagihan/Total Biaya: Rp ${totalPrice ? totalPrice.toLocaleString('id-ID') : "-"}`;

    } else if (task === "caption") {
      systemPrompt = `Anda adalah asisten MUA dan copywriter Instagram profesional di Indonesia. Buat caption Instagram yang memikat, elegan, estetik, dan interaktif dalam Bahasa Indonesia untuk memposting foto/video hasil makeup klien ini di profil MUA.
Sertakan:
- Hook pembuka yang menarik perhatian, estetik, dan memuji kecantikan klien.
- Cerita singkat atau deskripsi keanggunan look makeup yang diaplikasikan (misal: flawless, bold, natural glam, modern, traditional, dll.) disesuaikan dengan jenis acara (Akad/Resepsi/Wisuda/dll.).
- Kalimat interaktif (Call-to-Action / CTA) yang mengajak audiens berinteraksi, memberi komentar, atau membooking jadwal (misal: "Slot booking untuk bulan depan sudah menipis, yuk amankan tanggal bahagiamu via link di bio!").
- Sekumpulan hashtag MUA yang relevan dan populer (sekitar 10-15 hashtag) dipisahkan rapi di bagian bawah.
Gunakan emoji estetik, gaya bahasa gaul/semi-formal yang chic, serta tata letak spasi paragraf yang rapi dan nyaman dibaca.`;

      userPrompt = `Buat caption Instagram estetik berdasarkan data booking berikut:
- Nama Klien: ${clientName || "-"}
- Jenis Acara/Layanan: ${serviceName || "-"}
- Tanggal Acara: ${date || "-"}
- Lokasi: ${location || "-"}
- Detail/Catatan khusus (misal: request makeup natural): ${notes || "-"}`;

    } else if (task === "summary") {
      systemPrompt = `Anda adalah asisten MUA profesional. Buat ringkasan detail booking internal yang sangat terstruktur, padat, rapi, dan mudah dibaca dalam Bahasa Indonesia untuk panduan persiapan MUA sebelum pergi merias klien.
Tampilkan informasi penting secara efisien menggunakan format markdown dengan poin-poin terstruktur:
1. **INFORMASI UTAMA**: Nama klien, layanan makeup, tanggal, jam, dan alamat/venue pengerjaan.
2. **FINANCIAL CHECK**: Total Biaya.
3. **CATATAN KHUSUS & REKOMENDASI PERSIAPAN**:
   - Analisis dari catatan/request (misal: request look flawless, alergi kosmetik, riasan hijab, dll.).
   - Rekomendasi kosmetik utama atau peralatan khusus yang wajib disiapkan oleh MUA (misal: jika ada request riasan tahan lama/outdoor, ingatkan untuk membawa primer mattifying berkinerja tinggi).
   - Saran estimasi waktu keberangkatan agar MUA tidak terlambat (mengingat jam acara yang telah ditentukan).
Fokus pada aspek fungsional dan operasional kerja MUA secara ringkas dan praktis.`;

      userPrompt = `Buat ringkasan operasional MUA berdasarkan data berikut:
- Nama Klien: ${clientName || "-"}
- Layanan: ${serviceName || "-"}
- Tanggal Acara: ${date || "-"}
- Jam Mulai: ${time || "-"}
- Lokasi: ${location || "-"}
- Catatan/Request: ${notes || "-"}
- Total Biaya: Rp ${totalPrice ? totalPrice.toLocaleString('id-ID') : "-"}`;

    } else {
      return new Response(
        JSON.stringify({ error: `Task '${task}' tidak didukung.` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Groq API error: ${response.status} — ${errorText}`);
    }

    const result = await response.json();
    const content = result.choices[0].message.content;

    return new Response(JSON.stringify({ content }), {
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

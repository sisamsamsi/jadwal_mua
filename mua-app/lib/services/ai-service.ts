const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY;

export const aiService = {
  async parseBookingMessage(message: string) {
    if (!GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY belum dikonfigurasi di .env");
    }

    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content: `Anda adalah asisten MUA yang ahli mengekstrak data dari pesan teks WhatsApp. 
              Ekstrak informasi berikut dalam format JSON:
              {
                "clientName": string,
                "bookingDate": string (YYYY-MM-DD),
                "startTime": string (HH:mm),
                "endTime": string (HH:mm),
                "locationName": string,
                "locationAddress": string,
                "numPersons": number,
                "eventType": string (pilih salah satu: Akad, Resepsi, Fitting, Rapat, Siraman, Lamaran, Lainnya),
                "notes": string
              }
              Gunakan tanggal hari ini (${new Date().toISOString().split('T')[0]}) sebagai referensi jika pesan menyebut 'besok', 'lusa', dll.
              Jika ada data yang tidak ditemukan, beri nilai string kosong atau null untuk angka. 
              HANYA kembalikan JSON, jangan ada teks penjelasan lain.`
            },
            {
              role: "user",
              content: message
            }
          ],
          temperature: 0.1,
          response_format: { type: "json_object" }
        }),
      });

      const result = await response.json();
      return JSON.parse(result.choices[0].message.content);
    } catch (error) {
      console.error("AI Parse Error:", error);
      throw error;
    }
  }
};

// supabase/functions/parse-booking/index.ts
// Deploy this to Supabase using: supabase functions deploy parse-booking

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY")

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { message } = await req.json()
    
    if (!GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY is not set on the server")
    }

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
              "eventType": string,
              "notes": string
            }
            HANYA kembalikan JSON.`
          },
          { role: "user", content: message }
        ],
        temperature: 0.1,
        response_format: { type: "json_object" }
      }),
    })

    const result = await response.json()
    const content = JSON.parse(result.choices[0].message.content)

    return new Response(JSON.stringify(content), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})

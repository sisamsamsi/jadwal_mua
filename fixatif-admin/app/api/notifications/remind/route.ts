import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { userId, title, body } = await req.json();

    if (!userId || !title || !body) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Ambil fcm_token dari profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("fcm_token")
      .eq("id", userId)
      .single();

    if (profileError || !profile?.fcm_token) {
      return NextResponse.json({ error: "Push token tidak ditemukan untuk user ini" }, { status: 404 });
    }

    // Kirim notifikasi via Expo Push API
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Accept-Encoding": "gzip, deflate",
      },
      body: JSON.stringify({
        to: profile.fcm_token,
        title: title,
        body: body,
        data: { type: "trial_reminder" },
        sound: "default",
        priority: "high",
      }),
    });

    const result = await response.json();

    if (result.errors) {
      return NextResponse.json({ error: result.errors[0].message }, { status: 500 });
    }

    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

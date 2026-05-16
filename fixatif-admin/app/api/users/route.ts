import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  // Cek session — hanya admin yang bisa akses
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // Ambil semua user dari auth.users
    const { data: users, error: userError } = await supabaseAdmin.auth.admin.listUsers();
    if (userError) return NextResponse.json({ error: userError.message }, { status: 500 });

    // Ambil semua profiles (termasuk status langganan)
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, business_name, subscription_status, trial_ends_at, subscription_ends_at, notes, fcm_token");

    if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });

    // Gabungkan data
    const merged = users.users.map((u) => {
      const profile = profiles?.find((p) => p.id === u.id);
      return {
        id: u.id,
        email: u.email,
        name: profile?.full_name || u.user_metadata?.full_name || "-",
        businessName: profile?.business_name || "-",
        createdAt: u.created_at,
        lastSignIn: u.last_sign_in_at,
        status: profile?.subscription_status ?? "trial",
        trialEndsAt: profile?.trial_ends_at,
        subscriptionEndsAt: profile?.subscription_ends_at,
        notes: profile?.notes || "",
        fcmToken: profile?.fcm_token,
      };
    });

    return NextResponse.json(merged);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

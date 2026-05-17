import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { status, subscriptionEndsAt, trialEndsAt, notes } = body;

    const updatePayload: any = { updated_at: new Date().toISOString() };
    if (status) updatePayload.subscription_status = status;
    if (subscriptionEndsAt) updatePayload.subscription_ends_at = subscriptionEndsAt;
    if (trialEndsAt !== undefined) updatePayload.trial_ends_at = trialEndsAt;
    if (notes !== undefined) updatePayload.notes = notes;

    const { error } = await supabaseAdmin
      .from("profiles")
      .update(updatePayload)
      .eq("id", params.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const id = params.id;

    // 1. Hapus dari tabel profiles (biasanya cascade, tapi kita lakukan eksplisit demi keamanan)
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .delete()
      .eq("id", id);

    if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });

    // 2. Hapus dari auth.users
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);

    if (authError) return NextResponse.json({ error: authError.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

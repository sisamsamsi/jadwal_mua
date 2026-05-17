import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import UserTable from "@/components/UserTable";
import StatsCard from "@/components/StatsCard";
import { Users, CheckCircle2, Clock, XCircle, Search } from "lucide-react";

async function getStats() {
  const { data: profiles } = await supabaseAdmin.from("profiles").select("subscription_status");
  const total = profiles?.length ?? 0;
  const active = profiles?.filter((s) => s.subscription_status === "active").length ?? 0;
  const trial = profiles?.filter((s) => s.subscription_status === "trial").length ?? 0;
  const expired = profiles?.filter((s) => s.subscription_status === "expired").length ?? 0;
  return { total, active, trial, expired };
}

async function getUsers() {
  const { data: users } = await supabaseAdmin.auth.admin.listUsers();
  const { data: profiles } = await supabaseAdmin
    .from("profiles").select("*");

  return users?.users.map((u) => {
    const profile = profiles?.find((p) => p.id === u.id);
    return {
      id: u.id,
      email: u.email ?? "-",
      name: profile?.full_name ?? u.user_metadata?.full_name ?? "-",
      businessName: profile?.business_name ?? "-",
      createdAt: u.created_at,
      lastSignIn: u.last_sign_in_at ?? null,
      status: (profile?.subscription_status ?? "trial") as string,
      trialEndsAt: profile?.trial_ends_at ?? null,
      subscriptionEndsAt: profile?.subscription_ends_at ?? null,
      notes: profile?.notes || "",
      fcmToken: profile?.fcm_token ?? null,
    };
  }) ?? [];
}

export default async function DashboardPage() {
  const stats = await getStats();
  const users = await getUsers();

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-800 tracking-tight">Dashboard</h1>
          <p className="text-sm font-medium text-gray-400 mt-2">
            Kelola user dan langganan premium Fixatif
          </p>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold text-brand-rose uppercase tracking-[0.2em] bg-brand-rose-light px-4 py-2 rounded-full border border-brand-rose/10">
          <div className="w-2 h-2 rounded-full bg-brand-rose animate-pulse" />
          Real-time Sync Active
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard 
          label="Total User" 
          value={stats.total} 
          icon={Users} 
        />
        <StatsCard 
          label="User Aktif" 
          value={stats.active} 
          icon={CheckCircle2} 
          colorClass="bg-green-50 text-green-600"
        />
        <StatsCard 
          label="Masa Trial" 
          value={stats.trial} 
          icon={Clock} 
          colorClass="bg-amber-50 text-amber-600"
        />
        <StatsCard 
          label="Expired" 
          value={stats.expired} 
          icon={XCircle} 
          colorClass="bg-red-50 text-red-600"
        />
      </div>

      {/* Tabel User Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-brand-cream overflow-hidden">
        <div className="px-6 py-4 border-b border-brand-cream flex items-center justify-between bg-white">
          <div>
            <h2 className="text-sm font-bold text-gray-800 tracking-tight">Daftar User</h2>
          </div>
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            {users.length} Users
          </div>
        </div>
        
        <UserTable initialUsers={users} />
      </div>
    </div>
  );
}

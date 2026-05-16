import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LogOut, User as UserIcon, LayoutDashboard } from "lucide-react";
import Link from "next/link";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/");

  return (
    <div className="min-h-screen bg-[#F9F9F9]">
      {/* Topbar */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 px-6 py-3
                      flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-rose flex items-center
                            justify-center text-white font-bold text-base">
              F
            </div>
            <p className="font-bold text-gray-800 tracking-tight text-sm">Fixatif</p>
          </Link>

          <div className="h-4 w-[1px] bg-gray-200 mx-2" />

          <Link href="/admin/dashboard" className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 text-gray-600 font-bold text-[10px] uppercase tracking-wider">
            <LayoutDashboard size={12} />
            <span>Dashboard</span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 pr-4 border-r border-gray-100">
            <div className="text-right">
              <p className="text-[10px] font-bold text-gray-700 leading-none">{session.user?.name}</p>
              <p className="text-[9px] text-gray-400 font-medium leading-none mt-1">{session.user?.email}</p>
            </div>
          </div>
          
          <Link href="/api/auth/signout"
             className="text-[10px] text-gray-400 hover:text-brand-rose font-bold uppercase tracking-widest transition-colors flex items-center gap-2">
            <LogOut size={12} />
            Logout
          </Link>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}

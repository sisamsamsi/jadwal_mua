"use client";

import { useState } from "react";
import StatusBadge from "./StatusBadge";
import { 
  Search, 
  Calendar, 
  XCircle, 
  Loader2,
  Bell,
  ChevronLeft,
  ChevronRight,
  Clock,
  Trash2
} from "lucide-react";

type User = {
  id: string; 
  email: string; 
  name: string; 
  businessName: string;
  createdAt: string; 
  lastSignIn: string | null;
  status: string; 
  trialEndsAt: string | null;
  subscriptionEndsAt: string | null; 
  notes: string;
  fcmToken?: string;
};

type Props = { initialUsers: User[] };

export default function UserTable({ initialUsers }: Props) {
  const [users, setUsers] = useState(initialUsers.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [notifyingId, setNotifyingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const fmt = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("id-ID", {
      day: "2-digit", month: "short", year: "numeric"
    }) : "-";

  const getTrialDaysLeft = (endsAt: string | null) => {
    if (!endsAt) return null;
    const diff = new Date(endsAt).getTime() - new Date().getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  const updateUser = async (id: string, payload: any) => {
    setLoadingId(id);
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === id ? { ...u, ...payload } : u))
        );
      }
    } catch (error) {
      console.error("Update failed", error);
    } finally {
      setLoadingId(null);
    }
  };

  const deleteUser = async (user: User) => {
    if (!window.confirm(`Hapus user "${user.name}" secara permanen? Tindakan ini tidak dapat dibatalkan.`)) return;
    
    setLoadingId(user.id);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== user.id));
      } else {
        const err = await res.json();
        alert(`Gagal menghapus: ${err.error || "Terjadi kesalahan"}`);
      }
    } catch (error) {
      alert("Gagal menghapus user");
    } finally {
      setLoadingId(null);
    }
  };

  const sendReminder = async (user: User) => {
    if (!user.id) return;
    setNotifyingId(user.id);
    try {
      const res = await fetch(`/api/notifications/remind`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          userId: user.id,
          title: "⚠️ Masa Trial Hampir Habis",
          body: `Halo ${user.name}, masa trial Anda tinggal ${getTrialDaysLeft(user.trialEndsAt)} hari lagi. Hubungi admin untuk aktivasi premium!`
        }),
      });
      if (res.ok) {
        alert(`Notifikasi berhasil dikirim ke ${user.name}`);
      } else {
        const err = await res.json();
        alert(`Gagal: ${err.error || 'Terjadi kesalahan'}`);
      }
    } catch (error) {
      alert("Gagal mengirim notifikasi");
    } finally {
      setNotifyingId(null);
    }
  };

  const activate = (id: string) => {
    const ends = new Date();
    ends.setMonth(ends.getMonth() + 1);
    updateUser(id, {
      status: "active",
      subscriptionEndsAt: ends.toISOString(),
    });
  };

  const deactivate = (id: string) => updateUser(id, { status: "expired" });

  const extend = (id: string, currentEnds: string | null) => {
    const base = currentEnds ? new Date(currentEnds) : new Date();
    const start = base < new Date() ? new Date() : base;
    const ends = new Date(start);
    ends.setMonth(ends.getMonth() + 1);
    updateUser(id, {
      status: "active",
      subscriptionEndsAt: ends.toISOString(),
    });
  };

  const filtered = users.filter((u) => {
    const matchSearch =
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.businessName.toLowerCase().includes(search.toLowerCase()) ||
      u.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || u.status.toLowerCase() === filter.toLowerCase();
    return matchSearch && matchFilter;
  });

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginatedUsers = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="flex flex-col">
      {/* Search & Filter Bar */}
      <div className="px-6 py-4 border-b border-brand-cream flex items-center justify-between bg-white">
        <div className="flex items-center gap-4">
          <div className="relative w-64 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input
              type="text"
              placeholder="Cari user..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-full bg-brand-cream/30 border border-transparent rounded-lg pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:border-brand-rose/30 transition-all placeholder:text-gray-400"
            />
          </div>
          
          <div className="flex items-center gap-1">
            {["all", "trial", "active", "expired"].map((f) => (
              <button 
                key={f} 
                onClick={() => { setFilter(f); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold capitalize transition-all ${
                  filter === f
                    ? "bg-brand-rose text-white shadow-sm"
                    : "text-gray-400 hover:text-brand-rose hover:bg-brand-rose-light/50"
                }`}
              >
                {f === "all" ? "Semua" : f}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => prev - 1)}
            className="p-1.5 rounded-lg hover:bg-brand-cream disabled:opacity-30 transition-all"
          >
            <ChevronLeft size={16} className="text-gray-600" />
          </button>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Page {currentPage} of {totalPages || 1}
          </span>
          <button 
            disabled={currentPage === totalPages || totalPages === 0}
            onClick={() => setCurrentPage(prev => prev + 1)}
            className="p-1.5 rounded-lg hover:bg-brand-cream disabled:opacity-30 transition-all"
          >
            <ChevronRight size={16} className="text-gray-600" />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-brand-cream/10 border-b border-brand-cream">
            <tr>
              {["User", "Bisnis", "Status", "Sisa Trial / Masa Aktif", "Aksi"].map((h) => (
                <th key={h} className="px-6 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-cream/50 bg-white">
            {paginatedUsers.map((u) => {
              const trialDays = getTrialDaysLeft(u.trialEndsAt);
              const isUrgent = u.status === 'trial' && trialDays !== null && trialDays <= 3;
              
              return (
                <tr key={u.id} className="hover:bg-brand-cream/10 transition-colors">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-brand-rose-light flex items-center justify-center text-brand-rose text-[10px] font-bold">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-800 tracking-tight">{u.name}</p>
                        <p className="text-[10px] text-gray-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <p className="text-xs text-gray-600 font-medium">{u.businessName}</p>
                  </td>
                  <td className="px-6 py-3">
                    <StatusBadge status={u.status} />
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-[10px] font-semibold text-gray-500">
                        <Calendar size={10} className="text-brand-rose/50" />
                        {u.status === "trial" ? fmt(u.trialEndsAt) : fmt(u.subscriptionEndsAt)}
                      </div>
                      {u.status === 'trial' && trialDays !== null && (
                        <div className={`flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider ${isUrgent ? 'text-red-500 animate-pulse' : 'text-amber-500'}`}>
                          <Clock size={8} />
                          {trialDays} Hari Tersisa
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      {loadingId === u.id ? (
                        <Loader2 size={12} className="animate-spin text-brand-rose" />
                      ) : (
                        <>
                          {u.status !== "active" ? (
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => activate(u.id)}
                                className="px-3 py-1 bg-brand-rose text-white text-[10px] font-bold rounded-lg hover:bg-brand-rose-dark transition-all"
                              >
                                Aktifkan
                              </button>
                              {isUrgent && (
                                <button 
                                  onClick={() => sendReminder(u)}
                                  disabled={notifyingId === u.id}
                                  className="p-1.5 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-all"
                                  title="Kirim Reminder"
                                >
                                  {notifyingId === u.id ? <Loader2 size={12} className="animate-spin" /> : <Bell size={12} />}
                                </button>
                              )}
                            </div>
                          ) : (
                            <div className="flex gap-1">
                              <button 
                                onClick={() => extend(u.id, u.subscriptionEndsAt)}
                                className="px-3 py-1 bg-white border border-brand-rose-light text-brand-rose text-[10px] font-bold rounded-lg hover:bg-brand-rose-light transition-all"
                              >
                                +1 Bln
                              </button>
                              <button 
                                onClick={() => deactivate(u.id)}
                                className="p-1.5 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                title="Nonaktifkan"
                              >
                                <XCircle size={14} />
                              </button>
                            </div>
                          )}
                          <div className="h-4 w-[1px] bg-gray-100 mx-1" />
                          <button 
                            onClick={() => deleteUser(u)}
                            className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            title="Hapus User"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <div className="px-6 py-12 text-center">
          <p className="text-xs font-medium text-gray-400">Tidak ada user ditemukan.</p>
        </div>
      )}
    </div>
  );
}

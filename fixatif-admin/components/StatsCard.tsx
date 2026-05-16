import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  description?: string;
  colorClass?: string;
}

export default function StatsCard({ label, value, icon: Icon, colorClass }: StatsCardProps) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-brand-cream group">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-xl ${colorClass || 'bg-brand-rose-light text-brand-rose'}`}>
          <Icon size={18} />
        </div>
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</p>
          <p className="text-xl font-bold text-gray-800">{value}</p>
        </div>
      </div>
    </div>
  );
}

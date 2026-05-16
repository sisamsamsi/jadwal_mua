"use client";

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const CONFIG: Record<string, { label: string; className: string }> = {
  trial: { 
    label: "Trial", 
    className: "bg-amber-50 text-amber-600 border-amber-100" 
  },
  active: { 
    label: "Aktif", 
    className: "bg-green-50 text-green-600 border-green-100" 
  },
  expired: { 
    label: "Expired", 
    className: "bg-red-50 text-red-600 border-red-100" 
  },
  cancelled: { 
    label: "Berhenti", 
    className: "bg-gray-50 text-gray-500 border-gray-100" 
  },
};

export default function StatusBadge({ status }: { status: string }) {
  const c = CONFIG[status.toLowerCase()] ?? CONFIG.trial;
  
  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-bold border",
      c.className
    )}>
      {c.label}
    </span>
  );
}

import React from "react";
import * as Lucide from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: keyof typeof Lucide;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  subtitle: string;
}

export function MetricCard({ title, value, icon, change, changeType = "neutral", subtitle }: MetricCardProps) {
  const IconComponent = Lucide[icon] as React.ComponentType<{ className?: string }>;

  const changeColors = {
    positive: "text-emerald-700 bg-emerald-50 border border-emerald-300",
    negative: "text-red-700 bg-red-50 border border-red-300",
    neutral: "text-[#1A1A1A]/80 bg-[#EAE8E4] border border-[#1A1A1A]/20"
  };

  return (
    <div className="bg-white border-2 border-[#1A1A1A] p-5 hover:bg-[#F9F8F6] transition-all duration-300 shadow-[4px_4px_0px_0px_#1A1A1A] group">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-[10px] text-[#1A1A1A]/60 uppercase font-mono tracking-widest">{title}</p>
          <h3 className="text-4xl font-extrabold mt-2 font-serif tracking-tight text-[#1A1A1A] group-hover:italic transition-all duration-200">
            {value}
          </h3>
        </div>
        <div className="p-2 bg-[#F9F8F6] border border-[#1A1A1A] rounded-none">
          {IconComponent && <IconComponent className="h-4.5 w-4.5 text-[#1A1A1A]" />}
        </div>
      </div>
      
      <div className="flex items-center gap-2 mt-4 font-sans">
        {change && (
          <span className={`text-[10px] px-2 py-0.5 font-mono font-bold uppercase tracking-wider ${changeColors[changeType]}`}>
            {change}
          </span>
        )}
        <span className="text-[11px] text-[#1A1A1A]/60 italic font-serif">{subtitle}</span>
      </div>
    </div>
  );
}


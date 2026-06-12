import React, { useState } from "react";
import { CohortRow } from "../types";
import { Users, HelpCircle } from "lucide-react";

interface CohortHeatmapProps {
  cohorts: CohortRow[];
}

export function CohortHeatmap({ cohorts }: CohortHeatmapProps) {
  const [hoveredCell, setHoveredCell] = useState<{
    rowIdx: number;
    colIdx: number;
    rates: number;
  } | null>(null);

  // Background cell color generator based on retention percentage
  const getCellBgColor = (rate: number) => {
    if (rate === 100) return "bg-[#1A1A1A] text-white border-[#1A1A1A]";
    if (rate >= 90) return "bg-[#2D2D2D] text-white border-[#2D2D2D]";
    if (rate >= 80) return "bg-[#4D4D4D] text-white border-[#4D4D4D]";
    if (rate >= 70) return "bg-[#6E6E6E] text-white border-[#6E6E6E]";
    if (rate >= 60) return "bg-[#8E8E8E] text-[white] border-[#8E8E8E]";
    if (rate >= 50) return "bg-[#B5B2AB] text-[#1A1A1A] border-[#B5B2AB]";
    return "bg-[#EAE8E4] text-[#1A1A1A] border-[#EAE8E4]";
  };

  // Render SVG Retention Curve Chart for the selected or all cohorts
  const months = Array.from({ length: 13 }, (_, i) => i);
  const width = 500;
  const height = 180;
  const padding = 25;

  return (
    <div className="bg-white border-2 border-[#1A1A1A] p-5 shadow-[4px_4px_0px_0px_#1A1A1A] text-[#1A1A1A]">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6 pb-4 border-b border-[#1A1A1A]">
        <div>
          <h2 className="text-xl font-bold font-serif text-[#1A1A1A] flex items-center gap-2">
            <Users className="h-4.5 w-4.5 text-[#1A1A1A]" />
            Cohort Retention Heatmap
          </h2>
          <p className="text-xs text-[#1A1A1A]/70 mt-1 font-sans">
            Tracking customer cohort persistence over consecutive 12 months after first subscription signup.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-[10px] font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-[#1A1A1A]"></span>
            <span className="text-[#1A1A1A]/80 font-bold">90%+</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-[#6E6E6E]"></span>
            <span className="text-[#1A1A1A]/80">70% - 90%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-[#B5B2AB]"></span>
            <span className="text-[#1A1A1A]/80">50% - 70%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-[#EAE8E4]"></span>
            <span className="text-[#1A1A1A]/80">&lt; 50%</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        {/* Heatmap Grid Cell Matrix */}
        <div className="xl:col-span-8 overflow-x-auto">
          <table className="w-full text-left border-collapse select-none">
            <thead>
              <tr className="border-b-2 border-[#1A1A1A]">
                <th className="py-2 px-3 text-[10px] font-mono font-bold text-[#1A1A1A] uppercase tracking-wider">Cohort</th>
                <th className="py-2 px-3 text-[10px] font-mono font-bold text-[#1A1A1A] uppercase tracking-wider text-center border-r border-[#1A1A1A]">Size</th>
                {months.map((m) => (
                  <th key={m} className="py-2 px-1 text-[10px] font-mono font-bold text-[#1A1A1A] text-center min-w-[45px]">
                    M{m}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A1A1A]/20">
              {cohorts.map((cohort, rowIdx) => (
                <tr key={cohort.cohortName} className="hover:bg-[#F9F8F6] transition-colors">
                  <td className="py-2.5 px-3 text-xs font-bold text-[#1A1A1A] font-serif">
                    {cohort.cohortName}
                  </td>
                  <td className="py-2.5 px-3 text-xs font-mono text-[#1A1A1A]/80 text-center border-r border-[#1A1A1A]">
                    {cohort.initialCount}
                  </td>
                  {cohort.retentionRates.map((rate, colIdx) => {
                    const isHovered = hoveredCell?.rowIdx === rowIdx && hoveredCell?.colIdx === colIdx;
                    return (
                      <td
                        key={colIdx}
                        className="p-0.5 text-center relative"
                        onMouseEnter={() => setHoveredCell({ rowIdx, colIdx, rates: rate })}
                        onMouseLeave={() => setHoveredCell(null)}
                      >
                        <div
                          className={`py-1.5 rounded-none font-mono text-[11px] font-semibold border-t border-b transition-all duration-200 ${getCellBgColor(rate)} ${
                            isHovered ? "ring-2 ring-red-600 scale-[1.08] z-10" : ""
                          }`}
                        >
                          {rate.toFixed(0)}%
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Dynamic Detail Panel & Line Graph */}
        <div className="xl:col-span-4 bg-[#F9F8F6] border-2 border-[#1A1A1A] p-4 flex flex-col justify-between min-h-[250px]">
          <div>
            <span className="text-[9px] bg-[#1A1A1A] border border-[#1A1A1A] text-white font-mono font-bold px-2 py-0.5 uppercase tracking-wider">
              Cohort Diagnosis Lens
            </span>

            {hoveredCell ? (
              <div className="mt-4 animate-fadeIn">
                <h4 className="text-sm font-bold text-[#1A1A1A] font-serif">
                  {cohorts[hoveredCell.rowIdx].cohortName} <span className="text-zinc-500 font-sans font-normal">/ Month {hoveredCell.colIdx}</span>
                </h4>
                <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-[#1A1A1A]/35">
                  <div>
                    <p className="text-[10px] font-mono text-[#1A1A1A]/50 uppercase">Survival Rate</p>
                    <p className="text-xl font-mono font-bold text-[#1A1A1A]">{hoveredCell.rates}%</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-mono text-[#1A1A1A]/50 uppercase">Active Accounts</p>
                    <p className="text-xl font-mono font-bold text-[#1A1A1A]">
                      {Math.round((cohorts[hoveredCell.rowIdx].initialCount * hoveredCell.rates) / 100)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-mono text-[#1A1A1A]/50 uppercase">Churned Accounts</p>
                    <p className="text-xl font-mono font-bold text-red-700">
                      {cohorts[hoveredCell.rowIdx].initialCount -
                        Math.round((cohorts[hoveredCell.rowIdx].initialCount * hoveredCell.rates) / 100)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-mono text-[#1A1A1A]/50 uppercase">Churn Cost (Est.)</p>
                    <p className="text-xl font-mono font-bold text-[#1A1A1A]">
                      ${(
                        (cohorts[hoveredCell.rowIdx].initialCount -
                          Math.round((cohorts[hoveredCell.rowIdx].initialCount * hoveredCell.rates) / 100)) *
                        75
                      ).toLocaleString()}
                    </p>
                  </div>
                </div>
                <p className="text-[11px] text-[#1A1A1A]/80 mt-4 leading-relaxed bg-white p-2.5 border border-[#1A1A1A]/20">
                  {hoveredCell.rates > 80
                    ? "Healthy cohort block. Standard onboarding active."
                    : hoveredCell.rates > 60
                    ? "Early symptoms of billing irritation. Standard contract upgrades are recommended."
                    : "Severe decay threshold. Highly sensitive risk tier needing active win-back intervention."}
                </p>
              </div>
            ) : (
              <div className="mt-4 flex-1 flex flex-col justify-between h-full">
                <p className="text-xs font-serif italic text-[#1A1A1A]/80">
                  Hover over cell matrices to retrieve specific active profiles.
                </p>
                
                {/* Embedded SVG Sparkline Plot */}
                <div className="mt-4 bg-white p-2 border border-[#1A1A1A] flex justify-center">
                  <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
                    {/* Grid Lines */}
                    {[25, 50, 75, 100].map((percent) => {
                      const y = height - padding - (percent / 100) * (height - 2 * padding);
                      return (
                        <g key={percent}>
                          <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#EAE8E4" strokeDasharray="2,2" />
                          <text x={padding - 5} y={y + 4} fill="#888888" fontSize="8" textAnchor="end" fontFamily="monospace">
                            {percent}%
                          </text>
                        </g>
                      );
                    })}
                    
                    {/* Month axes ticks */}
                    {months.filter((_, idx) => idx % 2 === 0).map((m) => {
                      const x = padding + (m / 12) * (width - 2 * padding);
                      return (
                        <g key={m}>
                          <line x1={x} y1={height - padding} x2={x} y2={height - padding + 4} stroke="#1A1A1A" />
                          <text x={x} y={height - padding + 12} fill="#888888" fontSize="8" textAnchor="middle" fontFamily="monospace">
                            M{m}
                          </text>
                        </g>
                      );
                    })}

                    {/* Plots for each cohort */}
                    {cohorts.map((cohort, idx) => {
                      const points = cohort.retentionRates
                        .map((rate, mIdx) => {
                          const x = padding + (mIdx / 12) * (width - 2 * padding);
                          const y = height - padding - (rate / 100) * (height - 2 * padding);
                          return `${x},${y}`;
                        })
                        .join(" ");

                      const colorIdx = ["#1A1A1A", "#555555", "#8E8E8E", "#B5B2AB"];
                      const dashIdx = ["", "5,5", "2,2", "1,2"];
                      return (
                        <g key={cohort.cohortName}>
                          <polyline fill="none" stroke={colorIdx[idx % colorIdx.length]} strokeDasharray={dashIdx[idx % dashIdx.length]} strokeWidth="2" points={points} opacity="0.9" />
                          {/* Endpoint text tag */}
                          {(() => {
                            const lastRate = cohort.retentionRates[12];
                            const x = width - padding;
                            const y = height - padding - (lastRate / 100) * (height - 2 * padding);
                            return (
                              <text x={x + 3} y={y + 3} fill={colorIdx[idx % colorIdx.length]} fontSize="8" fontFamily="monospace" fontWeight="bold">
                                {cohort.cohortName.split(" ")[0]}
                              </text>
                            );
                          })()}
                        </g>
                      );
                    })}
                  </svg>
                </div>
                <div className="flex justify-between text-[8px] text-[#1A1A1A]/60 font-mono mt-2">
                  <span>Month 0 Signup</span>
                  <div className="flex gap-2">
                    <span>■ Q1 (Solid)</span>
                    <span>■ Q2 (Dashed)</span>
                    <span>■ Q3 (Fine Dotted)</span>
                  </div>
                  <span>Month 12 Survival</span>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-[#1A1A1A]/25 flex items-center gap-2 text-[10px] text-[#1A1A1A]/60">
            <HelpCircle className="h-3.5 w-3.5 text-[#1A1A1A]/40 shrink-0" />
            <span>M0 reflects initial signup onboarding counts. Rates decrease over quarterly durations.</span>
          </div>
        </div>
      </div>
    </div>
  );
}


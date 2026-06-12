import React, { useState, useEffect } from "react";
import { generateCustomers, COHORT_DATA } from "./data";
import { Customer, MLMetrics, MLConfig } from "./types";
import { MetricCard } from "./components/MetricCard";
import { CohortHeatmap } from "./components/CohortHeatmap";
import { SQLEditor } from "./components/SQLEditor";
import { MLModelLab } from "./components/MLModelLab";
import { AIPaybook } from "./components/AIPaybook";
import { 
  Database, 
  Cpu, 
  Brain, 
  Layers, 
  Gauge, 
  HelpCircle
} from "lucide-react";

export default function App() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [activeTab, setActiveTab] = useState<"dashboard" | "sql" | "ml" | "ai">("dashboard");
  const [selectedScatterCustomer, setSelectedScatterCustomer] = useState<Customer | null>(null);

  // platform diagnostics
  const [dbStatus, setDbStatus] = useState<"checking" | "connected">("checking");
  const [healthInfo, setHealthInfo] = useState<{ hasApiKey: boolean } | null>(null);

  // Metrics computed live from active customer dataset
  const [metrics, setMetrics] = useState({
    activeCount: 120,
    churnRate: "24.1%",
    avgCLV: "$2,850",
    totalMRRAtRisk: "$8,450"
  });

  useEffect(() => {
    // Generate base customer list
    const customerList = generateCustomers();
    setCustomers(customerList);

    // Compute active metrics
    const active = customerList.length;
    const churnCount = customerList.filter(c => c.actualChurn).length;
    const churnRatePercent = ((churnCount / active) * 100).toFixed(1);

    const avgCharge = customerList.reduce((acc, c) => acc + c.monthlyCharges, 0) / active;
    const avgTenure = customerList.reduce((acc, c) => acc + c.tenureMonths, 0) / active;
    const clv = Number((avgCharge * avgTenure).toFixed(0));

    const riskMRR = customerList
      .filter(c => c.predictedChurnProbability > 0.5)
      .reduce((acc, c) => acc + c.monthlyCharges, 0);

    setMetrics({
      activeCount: active,
      churnRate: `${churnRatePercent}%`,
      avgCLV: `$${clv.toLocaleString()}`,
      totalMRRAtRisk: `$${riskMRR.toLocaleString()}`
    });

    // Run health check
    fetch("/api/health")
      .then(r => r.json())
      .then(data => {
        setHealthInfo(data);
        setDbStatus("connected");
      })
      .catch(() => {
        setDbStatus("connected");
      });
  }, []);

  // Scatter plot chart coordinate parameters
  const scatterWidth = 500;
  const scatterHeight = 280;
  const scatterPadding = 40;

  // Render a beautiful interactive bento grid scatter plot representing 
  // K-Means customer segmentation
  const renderCustomerScatter = () => {
    // Filter to a nice representative subset to keep chart clean and high-fidelity
    const chartCustomers = customers.slice(0, 80);

    const getXCoord = (monthlyCharges: number) => {
      // Charges range roughly 20 to 140
      const minVal = 20;
      const maxVal = 140;
      return scatterPadding + ((monthlyCharges - minVal) / (maxVal - minVal)) * (scatterWidth - 2 * scatterPadding);
    };

    const getYCoord = (tenureMonths: number) => {
      // Tenure range roughly 1 to 60
      const minVal = 1;
      const maxVal = 60;
      // SVG 0 is top, so we subtract from height
      return scatterHeight - scatterPadding - ((tenureMonths - minVal) / (maxVal - minVal)) * (scatterHeight - 2 * scatterPadding);
    };

    const getColorClass = (segment: string) => {
      if (segment === "Loyal Enthusiasts") return "fill-[#1A1A1A] hover:opacity-100";
      if (segment === "At-Risk Bargainers") return "fill-red-700 hover:opacity-100";
      if (segment === "Support Heavyweights") return "fill-[#777777] hover:opacity-100";
      return "fill-[#C8C5BD] hover:opacity-100"; // Dormant Accounts
    };

    return (
      <div className="bg-white border-2 border-[#1A1A1A] p-5 shadow-[4px_4px_0px_0px_#1A1A1A]">
        <div className="flex flex-col md:flex-row justify-between items-start border-b-2 border-[#1A1A1A] pb-3 mb-4 gap-4">
          <div>
            <h3 className="text-xs font-mono font-bold text-[#1A1A1A] uppercase tracking-wider flex items-center gap-2">
              <Layers className="h-4 w-4 text-[#1A1A1A]" />
              K-Means Behavioral Clusters
            </h3>
            <p className="text-[11px] text-[#1A1A1A]/70 mt-1 leading-normal font-sans">
              Representing active accounts mapping <strong>Monthly Billing Cost ($)</strong> vs <strong>Tenure Duration (Months)</strong>. Click nodes to retrieve specific profile metrics.
            </p>
          </div>
          <div className="flex gap-2 text-[9px] font-mono leading-none flex-wrap max-w-xs md:justify-end">
            <span className="flex items-center gap-1 text-[#1A1A1A] font-bold"><span className="w-1.5 h-1.5 bg-[#1A1A1A]" /> Enthusiasts</span>
            <span className="flex items-center gap-1 text-red-700 font-bold"><span className="w-1.5 h-1.5 bg-red-700" /> Bargainers</span>
            <span className="flex items-center gap-1 text-[#777777] font-bold"><span className="w-1.5 h-1.5 bg-[#777777]" /> Support Heavy</span>
            <span className="flex items-center gap-1 text-[#C8C5BD] font-bold"><span className="w-1.5 h-1.5 bg-[#C8C5BD]" /> Dormant</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Scatter Chart Space */}
          <div className="lg:col-span-8 bg-[#F9F8F6] border border-[#1A1A1A]/30 p-2.5 flex justify-center items-center">
            <svg width={scatterWidth} height={scatterHeight} className="w-full h-auto max-h-[250px]">
              {/* Grid Lines Horizontal */}
              {[15, 30, 45, 60].map(tenure => {
                const y = getYCoord(tenure);
                return (
                  <g key={tenure}>
                    <line x1={scatterPadding} y1={y} x2={scatterWidth - scatterPadding} y2={y} stroke="#E3E1DA" strokeDasharray="2,2" />
                    <text x={scatterPadding - 8} y={y + 3} fill="#888888" fontSize="8" textAnchor="end" fontFamily="monospace">{tenure}M</text>
                  </g>
                );
              })}

              {/* Grid Lines Vertical */}
              {[40, 80, 120].map(charge => {
                const x = getXCoord(charge);
                return (
                  <g key={charge}>
                    <line x1={x} y1={scatterPadding} x2={x} y2={scatterHeight - scatterPadding} stroke="#E3E1DA" strokeDasharray="2,2" />
                    <text x={x} y={scatterHeight - scatterPadding + 14} fill="#888888" fontSize="8" textAnchor="middle" fontFamily="monospace">${charge}</text>
                  </g>
                );
              })}

              {/* Axes lines */}
              <line x1={scatterPadding} y1={scatterHeight - scatterPadding} x2={scatterWidth - scatterPadding} y2={scatterHeight - scatterPadding} stroke="#1A1A1A" strokeWidth="1" />
              <line x1={scatterPadding} y1={scatterPadding} x2={scatterPadding} y2={scatterHeight - scatterPadding} stroke="#1A1A1A" strokeWidth="1" />

              {/* Scatter Points */}
              {chartCustomers.map((node) => {
                const cx = getXCoord(node.monthlyCharges);
                const cy = getYCoord(node.tenureMonths);
                const isSelected = selectedScatterCustomer?.id === node.id;

                return (
                  <circle
                    key={node.id}
                    cx={cx}
                    cy={cy}
                    r={isSelected ? "6" : "4.5"}
                    id={`scatter-node-${node.id}`}
                    onClick={() => setSelectedScatterCustomer(node)}
                    className={`transition-all duration-300 cursor-pointer stroke-[#1A1A1A] stroke-[0.5] ${getColorClass(node.segment)} ${
                      isSelected ? "stroke-[#1A1A1A] stroke-[2.5] scale-125" : "opacity-85 hover:scale-110"
                    }`}
                  />
                );
              })}
            </svg>
          </div>

          {/* Node Details Panel */}
          <div className="lg:col-span-4 bg-[#F9F8F6] border border-[#1A1A1A]/40 p-3.5 flex flex-col justify-between">
            {selectedScatterCustomer ? (
              <div className="animate-fadeIn">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-mono text-[#1A1A1A]/50 font-semibold">{selectedScatterCustomer.id}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 font-mono font-medium border ${
                    selectedScatterCustomer.actualChurn 
                      ? "bg-red-50 border-red-600 text-red-700" 
                      : "bg-white border-[#1A1A1A]/30 text-emerald-800"
                  }`}>
                    {selectedScatterCustomer.actualChurn ? "CHURNED" : "ACTIVE"}
                  </span>
                </div>
                
                <h4 className="text-sm font-bold font-serif text-[#1A1A1A] mt-2 truncate">{selectedScatterCustomer.name}</h4>
                <p className="text-[10px] text-[#1A1A1A]/60 font-mono truncate">{selectedScatterCustomer.email}</p>

                <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-[#1A1A1A]/10 font-mono text-[10px] text-[#1A1A1A]/80">
                  <div>
                    <span className="text-[9px] text-[#1A1A1A]/55 block uppercase">Monthly Billing</span>
                    <strong>${selectedScatterCustomer.monthlyCharges}</strong>
                  </div>
                  <div>
                    <span className="text-[9px] text-[#1A1A1A]/55 block uppercase">Customer Tenure</span>
                    <strong>{selectedScatterCustomer.tenureMonths} Months</strong>
                  </div>
                  <div>
                    <span className="text-[9px] text-[#1A1A1A]/55 block uppercase">Support Calls</span>
                    <strong className={selectedScatterCustomer.supportCalls30d > 2 ? "text-red-700 underline" : ""}>
                      {selectedScatterCustomer.supportCalls30d} Calls
                    </strong>
                  </div>
                  <div>
                    <span className="text-[9px] text-[#1A1A1A]/55 block uppercase">Risk Probability</span>
                    <strong className={selectedScatterCustomer.predictedChurnProbability > 0.6 ? "text-red-700" : ""}>
                      {(selectedScatterCustomer.predictedChurnProbability * 100).toFixed(0)}%
                    </strong>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#1A1A1A]/10 text-[10px] leading-relaxed text-[#1A1A1A]/80 font-serif">
                  <strong className="text-[#1A1A1A] block font-mono text-[9px] uppercase tracking-wider mb-0.5">Active Segment Profile:</strong>
                  {selectedScatterCustomer.segment === "At-Risk Bargainers" && "High competitor plan awareness; contract upgrades recommended immediately."}
                  {selectedScatterCustomer.segment === "Support Heavyweights" && "Technical integration gaps; suggest technical resolutions sequencing outreach."}
                  {selectedScatterCustomer.segment === "Loyal Enthusiasts" && "Incredibly healthy account profile. High priority target for advocacy program."}
                  {selectedScatterCustomer.segment === "Dormant Accounts" && "Long periods of system silence. Propose immediate customized win-back campaign."}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-6 text-center text-[#1A1A1A]/50">
                <HelpCircle className="h-6 w-6 text-[#1A1A1A]/40 mb-2" />
                <p className="text-[11px] font-serif italic leading-relaxed">Click on any customer Node in the behavior coordinate field to load detailed user ledger metadata.</p>
              </div>
            )}

            <div className="mt-4 pt-2 border-t border-[#1A1A1A]/10 flex justify-between text-[8px] font-mono text-[#1A1A1A]/60 uppercase font-semibold">
              <span>X - Billing amount</span>
              <span>Y - Tenure duration</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F9F8F6] text-[#1A1A1A] font-sans p-4 sm:p-6 lg:p-8 select-none">
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        
        {/* Top Header workspace brand */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white border-2 border-[#1A1A1A] p-5 shadow-[4px_4px_0px_0px_#1A1A1A] gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 bg-red-700"></span>
              <span className="text-[9px] font-mono text-red-700 font-extrabold tracking-widest uppercase">
                PORTFOLIO INSIGHT LAB · JOURNAL EDITION
              </span>
            </div>
            <h1 className="text-2xl font-serif font-black text-[#1A1A1A] mt-1 select-text tracking-tight flex items-center gap-2">
              Customer Analytics &amp; Retention Platform
            </h1>
            <p className="text-xs text-[#1A1A1A]/70 mt-1 leading-normal font-sans">
              SQL database execution, scikit-learn python predictive parameters tuning simulation, and segment retention brief generators over Gemini 3.5 AI.
            </p>
          </div>

          {/* Quick diagnostics tracking */}
          <div className="flex gap-2 font-mono text-[9px]">
            <div className="bg-white border border-[#1A1A1A] px-3.5 py-2 flex flex-col gap-0.5 justify-center">
              <span className="text-[#1A1A1A]/55 uppercase text-[8px] leading-none font-bold">Database Hub</span>
              <span className="text-[#1A1A1A] font-black flex items-center gap-1">
                {dbStatus === "connected" ? "● CONNECTED" : "○ SYNCING..."}
              </span>
            </div>
            
            <div className="bg-white border border-[#1A1A1A] px-3.5 py-2 flex flex-col gap-0.5 justify-center">
              <span className="text-[#1A1A1A]/55 uppercase text-[8px] leading-none font-bold">Gemini 3.5 Core</span>
              <span className={`${healthInfo?.hasApiKey || healthInfo === null ? "text-[#1A1A1A]" : "text-red-700"} font-black`}>
                {healthInfo?.hasApiKey || healthInfo === null ? "● READY" : "⚠ DEMO MODE"}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tab rail */}
        <div className="flex border-b-2 border-[#1A1A1A] pb-px flex-wrap gap-1">
          {[
            { id: "dashboard", label: "Executive Desk & Cohorts", icon: Gauge },
            { id: "sql", label: "Interactive SQL Workspace", icon: Database },
            { id: "ml", label: "Scikit-Learn Python Lab", icon: Cpu },
            { id: "ai", label: "AI Strategic Campaign Planner", icon: Brain }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`nav-tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-5 py-3 text-xs font-mono transition-all duration-300 relative border-t-2 border-x-2 leading-none whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "border-[#1A1A1A] text-black font-black bg-[#EAE8E4] relative -mb-px pb-3.5"
                    : "border-transparent text-[#1A1A1A]/60 hover:text-black hover:bg-[#EAE8E4]/35 pb-3"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-black" : "text-[#1A1A1A]/40"}`} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab content screens */}
        <div className="animate-fadeIn">
          {activeTab === "dashboard" && (
            <div className="flex flex-col gap-6">
              {/* Executive Metrics Cards line */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-slideIn">
                <MetricCard
                  title="Total Monitored Accounts"
                  value={metrics.activeCount}
                  icon="Users"
                  change="+12%"
                  changeType="positive"
                  subtitle="Active account coverage database"
                />
                <MetricCard
                  title="Historical Churn Rate"
                  value={metrics.churnRate}
                  icon="Target"
                  change="-2.4%"
                  changeType="positive"
                  subtitle="Target threshold limit: 25%"
                />
                <MetricCard
                  title="Avg Customer Lifetime Value"
                  value={metrics.avgCLV}
                  icon="Wallet"
                  change="+8.3%"
                  changeType="positive"
                  subtitle="Monthly charges × tenure length"
                />
                <MetricCard
                  title="MRR Risk Volatility"
                  value={metrics.totalMRRAtRisk}
                  icon="PhoneCall"
                  change="High risk"
                  changeType="negative"
                  subtitle="At high risk (prob > 50%)"
                />
              </div>

              {/* Behavior Scatter plots */}
              {renderCustomerScatter()}

              {/* Cohort Heatmap Row */}
              <CohortHeatmap cohorts={COHORT_DATA} />
            </div>
          )}

          {activeTab === "sql" && (
            <SQLEditor customers={customers} cohorts={COHORT_DATA} />
          )}

          {activeTab === "ml" && (
            <MLModelLab customers={customers} />
          )}

          {activeTab === "ai" && (
            <AIPaybook />
          )}
        </div>

        {/* Custom footer branding without clutter, elegant and simple */}
        <div className="flex flex-col sm:flex-row justify-between items-center text-[10px] font-mono text-[#1A1A1A]/60 border-t border-[#1A1A1A]/20 pt-5 mt-4 pb-8">
          <span>Customer Analytics &amp; Retention Platform © 2026</span>
          <div className="flex gap-4 mt-2 sm:mt-0">
            <span>Editorial Edition Workspace</span>
            <span>·</span>
            <span>TypeScript Engine V5.8</span>
          </div>
        </div>

      </div>
    </div>
  );
}

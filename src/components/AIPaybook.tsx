import React, { useState } from "react";
import { Brain, Sparkles, Send, FileText, CheckCircle, Lightbulb, RefreshCw, AlertCircle } from "lucide-react";

interface SegmentPreset {
  name: string;
  count: number;
  avgCharges: string;
  supportCalls: string;
  mainIssue: string;
  stats: Record<string, any>;
}

const SEGMENT_PRESETS: SegmentPreset[] = [
  {
    name: "At-Risk Bargainers",
    count: 30,
    avgCharges: "$85.00 - $115.00/mo",
    supportCalls: "2.8 average calls",
    mainIssue: "Highly price sensitive with month-to-month flexibility. Active search for discount models.",
    stats: {
      "Contract Type": "100% Month-to-month",
      "Average Tenure": "5.5 Months",
      "Portal Activity": "Moderately active (6 days ago)",
      "Customer Satisfaction": "2.4 out of 5"
    }
  },
  {
    name: "Support Heavyweights",
    count: 30,
    avgCharges: "$110.00 - $142.00/mo",
    supportCalls: "5.5 average calls",
    mainIssue: "Substantial onboarding frustration, setup integration failure, or workflow blockage. Needs high priority service.",
    stats: {
      "Contract Type": "70% Monthly, 30% Annual",
      "Average Tenure": "12.2 Months",
      "Portal Activity": "Highly active (1.5 days ago)",
      "Customer Satisfaction": "1.5 out of 5"
    }
  },
  {
    name: "Dormant Accounts",
    count: 30,
    avgCharges: "$25.00 - $50.00/mo",
    supportCalls: "0 calls",
    mainIssue: "No dashboard portal activity for over 25 days. Total product disengagement. High risk of silent churn.",
    stats: {
      "Contract Type": "50% Monthly, 50% Annual",
      "Average Tenure": "15.8 Months",
      "Portal Activity": "Critically low (28 days ago)",
      "Customer Satisfaction": "3.0 out of 5"
    }
  }
];

export function AIPaybook() {
  const [selectedPreset, setSelectedPreset] = useState<SegmentPreset>(SEGMENT_PRESETS[0]);
  const [userPrompt, setUserPrompt] = useState<string>("");
  const [generating, setGenerating] = useState<boolean>(false);
  const [stepText, setStepText] = useState<string>("");
  const [playbookReport, setPlaybookReport] = useState<string>("");
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);

  const handleGeneratePlaybook = async () => {
    setGenerating(true);
    setPlaybookReport("");
    setIsDemoMode(false);

    // Fun loading status checkpoints
    const steps = [
      "Analyzing segment metrics & identifying core correlation risk vectors...",
      "Consulting regional subscription retention playbooks from catalog...",
      "Injecting metrics into Gemini context matrices...",
      "Generating strategic mitigation brief and draft engagement copies..."
    ];

    let stepIdx = 0;
    setStepText(steps[0]);
    const interval = setInterval(() => {
      stepIdx++;
      if (stepIdx < steps.length) {
        setStepText(steps[stepIdx]);
      }
    }, 900);

    try {
      const response = await fetch("/api/generate-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          segmentName: selectedPreset.name,
          segmentMetrics: {
            accountCount: selectedPreset.count,
            billingRange: selectedPreset.avgCharges,
            complaintsRate: selectedPreset.supportCalls,
            majorPaintpoint: selectedPreset.mainIssue,
            correlatedDemographics: selectedPreset.stats
          },
          userPrompt: userPrompt.trim() || undefined
        })
      });

      const data = await response.json();
      clearInterval(interval);

      if (data.report) {
        setPlaybookReport(data.report);
        if (data.warning) {
          setIsDemoMode(true);
        }
      } else {
        throw new Error("No report payload was back-channeled.");
      }
    } catch (err) {
      console.error("Failed to compile Gemini response:", err);
      clearInterval(interval);
      // Safety failback display
      setPlaybookReport(`
### ⚠️ Error Compiling Gemini Report
We were unable to route instructions to the server-side Gemini catalog.

Please verify that:
1. Your application server is online and running successfully.
2. The **GEMINI_API_KEY** is configured correctly in the **Secrets** module (under Settings).

*As a fallback, standard quick-wins outline is provided:*
- **Month-to-month upgrade promotion**: Offer 1 month free if they migrate to annual.
- **Direct Support Callback**: Schedule 1-on-1 solutions reviews with accounts over 4 calls.
      `);
    } finally {
      setGenerating(false);
    }
  };

  // Simple, incredibly robust Markdown renderer component that compiles headers, bullet points,
  // code blocks, and lists into pristine, custom-styled HTML tags safely.
  const renderStyledMarkdown = (text: string) => {
    if (!text) return null;

    const lines = text.split("\n");
    let inCodeBlock = false;
    let codeContent: string[] = [];

    return lines.map((line, idx) => {
      // Toggle Code Blocks
      if (line.trim().startsWith("```")) {
        if (inCodeBlock) {
          inCodeBlock = false;
          const content = codeContent.join("\n");
          codeContent = [];
          return (
            <pre key={idx} className="bg-[#F9F8F6] border-2 border-[#1A1A1A] text-[#1A1A1A] font-mono text-xs p-4 my-3 overflow-x-auto leading-relaxed select-all">
              <code>{content}</code>
            </pre>
          );
        } else {
          inCodeBlock = true;
          return null;
        }
      }

      if (inCodeBlock) {
        codeContent.push(line);
        return null;
      }

      // Headers (H3, H4)
      if (line.trim().startsWith("#### ")) {
        return (
          <h4 key={idx} className="text-xs font-mono font-bold text-[#1A1A1A] mt-4 mb-2 uppercase tracking-wide flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-[#1A1A1A]"></span>
            {line.replace("#### ", "").trim()}
          </h4>
        );
      }
      if (line.trim().startsWith("### ")) {
        return (
          <h3 key={idx} className="text-sm font-sans font-extrabold text-[#1A1A1A] mt-5 mb-3 border-b border-[#1A1A1A]/30 pb-1 flex items-center gap-2">
            <FileText className="h-4 w-4 text-[#1A1A1A]" />
            {line.replace("### ", "").trim()}
          </h3>
        );
      }
      if (line.trim().startsWith("## ")) {
        return (
          <h2 key={idx} className="text-base font-serif font-black text-[#1A1A1A] mt-6 mb-4 flex items-center gap-2 border-b-2 border-[#1A1A1A] pb-2">
            <Brain className="h-5 w-5 text-[#1A1A1A]" />
            {line.replace("## ", "").trim()}
          </h2>
        );
      }

      // Bullet Points
      if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
        return (
          <div key={idx} className="flex items-start gap-2 my-2 pl-2 text-xs leading-relaxed text-[#1A1A1A]/90 font-serif">
            <div className="w-1.5 h-1.5 bg-red-700 mt-1.5 shrink-0"></div>
            <span>{line.replace(/^[-*]\s+/, "").trim()}</span>
          </div>
        );
      }

      // Standard text line
      if (line.trim() === "") return <div key={idx} className="h-2"></div>;

      return (
        <p key={idx} className="text-xs text-[#1A1A1A]/80 leading-relaxed my-2 font-serif">
          {line}
        </p>
      );
    });
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 text-[#1A1A1A]">
      {/* Preset Target Segments Selection Grid */}
      <div className="xl:col-span-4 flex flex-col gap-4 animate-slideIn">
        <div className="bg-white border-2 border-[#1A1A1A] p-5 shadow-[4px_4px_0px_0px_#1A1A1A]">
          <h3 className="text-xs font-mono font-bold text-[#1A1A1A] uppercase tracking-wider mb-4 flex items-center gap-2">
            <Brain className="h-4 w-4 text-[#1A1A1A]" />
            Core Target Segment
          </h3>
          <p className="text-[11px] text-[#1A1A1A]/70 mb-4 leading-normal font-sans">
            Select one of the analytical focus customer cohorts found via current ML clustering algorithms.
          </p>

          <div className="space-y-3">
            {SEGMENT_PRESETS.map((preset) => (
              <button
                key={preset.name}
                id={`target-segment-${preset.name.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => setSelectedPreset(preset)}
                className={`w-full text-left p-4 transition-all duration-300 relative rounded-none cursor-pointer ${
                  selectedPreset.name === preset.name
                    ? "bg-[#EAE8E4] border-2 border-[#1A1A1A] text-black font-semibold"
                    : "bg-white border border-[#1A1A1A]/30 text-[#1A1A1A]/70 hover:bg-[#F9F8F6] hover:border-[#1A1A1A]"
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-xs font-serif">{preset.name}</span>
                  <span className="text-[9px] bg-white border border-[#1A1A1A] px-1.5 py-0.5 text-[#1A1A1A] font-mono">
                    {preset.count} Accounts
                  </span>
                </div>
                <p className="text-[10px] text-[#1A1A1A]/70 mt-2 line-clamp-2 leading-relaxed">
                  {preset.mainIssue}
                </p>

                {/* Mini Stat Badges */}
                <div className="grid grid-cols-2 gap-1.5 mt-3 pt-3 border-t border-[#1A1A1A]/10 text-[9px] font-mono text-[#1A1A1A]/60">
                  <div>
                    <span>Billing: </span>
                    <strong className="text-[#1A1A1A]">{preset.avgCharges.split(" ")[0]}</strong>
                  </div>
                  <div>
                    <span>Call freq: </span>
                    <strong className="text-[#1A1A1A]">{preset.supportCalls.split(" ")[0]} Avg</strong>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Selected Preset Details Panel */}
        <div className="bg-white border-2 border-[#1A1A1A] p-5 shadow-[4px_4px_0px_0px_#1A1A1A]">
          <h4 className="text-xs font-mono font-bold text-[#1A1A1A] uppercase tracking-wider mb-3">
            Segment Demographics Matrix
          </h4>
          <div className="space-y-2 font-mono text-[11px]">
            {Object.entries(selectedPreset.stats).map(([k, v]) => (
              <div key={k} className="flex justify-between items-center py-1.5 border-b border-[#1A1A1A]/10">
                <span className="text-[#1A1A1A]/60">{k}</span>
                <span className="text-[#1A1A1A] font-semibold">{String(v)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Strategic AI Generator Panel */}
      <div className="xl:col-span-8 flex flex-col gap-4">
        {/* Playbook Prompt Panel */}
        <div className="bg-white border-2 border-[#1A1A1A] p-5 shadow-[4px_4px_0px_0px_#1A1A1A]">
          <h3 className="text-xs font-mono font-bold text-[#1A1A1A] uppercase tracking-wider mb-2 flex items-center gap-2">
            <Sparkles className="h-4.5 w-4.5 text-[#1A1A1A]" />
            AI CAMPAIGN BRIEF WRITER
          </h3>
          <p className="text-[11px] text-[#1A1A1A]/70 mb-4 leading-normal font-sans">
            Instruct the server-side Gemini assistant to synthesize a targeted email draft, billing promo structure, or user onboarding script specifically for this segment’s pain points.
          </p>

          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-mono text-[#1A1A1A]/60 block mb-1.5 uppercase font-bold">Custom Directives (Optional)</label>
              <textarea
                id="ai-playbook-prompt-textarea"
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                className="w-full h-24 bg-white border border-[#1A1A1A] p-3 text-xs text-[#1A1A1A] placeholder-[#1A1A1A]/40 font-sans leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-[#1A1A1A]"
                placeholder="Example: Propose an automated email sequencing offer containing a 15% discount for 3 months if they log back into client workspace..."
              />
            </div>

            <button
              id="ai-generate-playbook-btn"
              onClick={handleGeneratePlaybook}
              disabled={generating}
              className="w-full py-3 bg-[#1A1A1A] hover:bg-[#333333] disabled:bg-zinc-200 disabled:text-zinc-400 text-white font-sans font-bold text-xs rounded-none transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {generating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {generating ? "Engineering Strategic Playbooks..." : "Formulate Strategic Actions via Gemini AI"}
            </button>
          </div>
        </div>

        {/* Strategic Output Report viewer */}
        <div className="bg-white border-2 border-[#1A1A1A] p-5 shadow-[4px_4px_0px_0px_#1A1A1A] min-h-[300px] flex flex-col">
          {generating ? (
            <div className="flex-1 flex flex-col items-center justify-center py-16 text-center animate-pulse gap-4">
              <div className="bg-[#EAE8E4] border-2 border-[#1A1A1A] p-4">
                <Brain className="h-8 w-8 text-[#1A1A1A] animate-bounce" />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-mono font-bold text-[#1A1A1A]">Gemini Strategist Active...</p>
                <p className="text-[10px] font-mono text-[#1A1A1A]/60 max-w-sm">{stepText}</p>
              </div>
            </div>
          ) : playbookReport ? (
            <div className="animate-fadeIn relative">
              {isDemoMode && (
                <div className="mb-4 p-3 bg-red-50 border border-red-600 rounded-none flex items-start gap-2.5">
                  <AlertCircle className="h-4 w-4 text-red-700 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-red-700 leading-normal font-mono">
                    <strong>Demo Mode Engaged</strong>: Because process secrets are inactive, we utilized local heuristics catalogs. Populate <code>GEMINI_API_KEY</code> on your settings dashboard to unlock live, customized brainstorm plays.
                  </p>
                </div>
              )}
              
              <div className="flex justify-between items-center pb-3 border-b-2 border-[#1A1A1A] mb-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-[#1A1A1A]" />
                  <span className="text-xs font-mono font-bold text-[#1A1A1A]">STRATEGIC PLAYBOOK CAMPAIGN BRIEF</span>
                </div>
                <span className="text-[10px] font-mono text-[#1A1A1A]/60">
                  Target: {selectedPreset.name}
                </span>
              </div>

              <div id="ai-playbook-brief-output" className="space-y-4 font-serif text-sm select-text text-[#1A1A1A]">
                {renderStyledMarkdown(playbookReport)}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center py-20 text-center text-[#1A1A1A]/60">
              <Lightbulb className="h-10 w-10 text-[#1A1A1A]/40 mb-3" />
              <p className="text-xs font-serif italic text-[#1A1A1A]/80 max-w-sm">
                No active campaign brief exists. Choose a focus preset and click compile to formulate Gemini AI retention plays.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

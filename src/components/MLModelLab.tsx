import React, { useState, useEffect } from "react";
import { MLConfig, MLMetrics, Customer } from "../types";
import { Cpu, Terminal, Sliders, RefreshCw, Layers, TrendingUp, Compass, Info } from "lucide-react";

interface MLModelLabProps {
  customers: Customer[];
  onModelRetrained?: (metrics: MLMetrics, config: MLConfig) => void;
}

export function MLModelLab({ customers, onModelRetrained }: MLModelLabProps) {
  // ML Model Configuration state
  const [config, setConfig] = useState<MLConfig>({
    modelType: "Decision Tree",
    maxDepth: 5,
    l2Penalty: 1.0,
    riskThreshold: 0.45,
    featureWeights: {
      contractType: 2.8,
      supportCalls: 3.4,
      monthlyCharges: 1.5,
      tenure: 2.2,
      lastActive: 1.8
    }
  });

  const [training, setTraining] = useState<boolean>(false);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [metrics, setMetrics] = useState<MLMetrics | null>(null);

  useEffect(() => {
    // Generate initial metric baseline
    retrainModel(config, true);
  }, []);

  const handleUpdateWeight = (feature: keyof typeof config.featureWeights, val: number) => {
    const updated = {
      ...config,
      featureWeights: { ...config.featureWeights, [feature]: parseFloat(val.toFixed(1)) }
    };
    setConfig(updated);
  };

  const handleRetrainTrigger = () => {
    setTraining(true);
    const logs = [
      `>>> import pandas as pd`,
      `>>> import numpy as np`,
      `>>> from sklearn.model_selection import train_test_split`,
      `>>> from sklearn.tree import DecisionTreeClassifier`,
      `>>> from sklearn.ensemble import RandomForestClassifier`,
      `>>> from sklearn.linear_model import LogisticRegression`,
      `>>> from sklearn.metrics import accuracy_score, precision_score, recall_score, roc_auc_score`,
      `>>> `,
      `>>> # Preparing analytical matrices...`,
      `>>> df = pd.DataFrame(customers_data)`,
      `>>> feature_weights = ${JSON.stringify(config.featureWeights)}`,
      `>>> X = df[['contract_val', 'support_calls_30d', 'monthly_charges', 'tenure_months', 'last_active_days']]`,
      `>>> y = df['actual_churn']`,
      `>>> `,
      `>>> # Splitting data into 80% Training and 20% validation...`,
      `>>> X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2, random_state=42)`
    ];
    setTerminalLogs(logs);

    setTimeout(() => {
      // Simulate stepwise training timelines
      const t = new Date().toLocaleTimeString();
      setTerminalLogs(prev => [
        ...prev,
        `[${t}] Constructing classifier with: ${config.modelType}`,
        `[${t}] Max Depth limit: ${config.maxDepth} | L2 penalty coefficient: ${config.l2Penalty}`,
        `[${t}] Training in progress... iterating node constraints`,
        `[${t}] Cross validation complete. Computing predictions matching Risk Threshold: ${config.riskThreshold}`,
        `>>> # Scoring model metrics...Done!`
      ]);
      
      retrainModel(config, false);
      setTraining(false);
    }, 1200);
  };

  // Live calculates classification outcomes based on weights and threshold
  const retrainModel = (currentConfig: MLConfig, immediate = false) => {
    // Math approximation model to simulate real sklearn output relative to current settings
    // Higher depth + moderate weights increases ROC/F1 until too deep (overfitting)
    const factorSupport = currentConfig.featureWeights.supportCalls;
    const factorContract = currentConfig.featureWeights.contractType;
    const factorTenure = currentConfig.featureWeights.tenure;
    const factorActive = currentConfig.featureWeights.lastActive;
    
    // Compute synthetic metrics relative to parameters
    let baseRecall = 0.72 + (factorSupport * 0.03) + (factorContract * 0.02) - (currentConfig.riskThreshold * 0.2);
    let basePrecision = 0.68 + (factorActive * 0.03) + (factorTenure * 0.015) + (currentConfig.riskThreshold * 0.15);
    
    // regularizer penalty dampens score if inappropriate parameters
    const regularizationRatio = currentConfig.l2Penalty < 0.1 || currentConfig.l2Penalty > 8.0 ? 0.06 : 0;
    
    // Max depth sweet spot around 5-8. Too small -> underfit, too deep -> overfit
    let depthPenalty = 0;
    if (currentConfig.maxDepth < 3) depthPenalty = 0.1;
    else if (currentConfig.maxDepth > 9) depthPenalty = (currentConfig.maxDepth - 9) * 0.015;

    let auc = 0.84 + (factorSupport * 0.008) + (factorContract * 0.005) - regularizationRatio - depthPenalty;
    if (currentConfig.modelType === "Random Forest") auc += 0.03;
    if (currentConfig.modelType === "Logistic Regression") auc -= 0.02;

    auc = Math.max(0.62, Math.min(0.96, auc));
    
    // Constrain recall/precision to boundary limits
    let finalRecall = Math.max(0.50, Math.min(0.94, baseRecall - depthPenalty));
    let finalPrecision = Math.max(0.55, Math.min(0.95, basePrecision - regularizationRatio));
    
    // Balanced accuracy mathematically tied to auc, recall, precision
    let accuracy = (finalRecall * 0.4) + (finalPrecision * 0.4) + 0.15;
    accuracy = Math.max(0.68, Math.min(0.92, accuracy));

    // Distribute simulated confusion outcomes mapping to our 120 customers
    const tp = Math.round(35 * finalRecall);
    const fp = Math.round(15 * (1 - finalPrecision));
    const fn = Math.round(35 * (1 - finalRecall));
    const tn = 120 - tp - fp - fn;

    const computedMetrics: MLMetrics = {
      accuracy: Number(accuracy.toFixed(3)),
      precision: Number(finalPrecision.toFixed(3)),
      recall: Number(finalRecall.toFixed(3)),
      aucRoc: Number(auc.toFixed(3)),
      classificationMatrix: {
        truePositive: tp,
        falsePositive: Math.max(0, fp),
        trueNegative: Math.max(0, tn),
        falseNegative: Math.max(0, fn)
      }
    };

    setMetrics(computedMetrics);
    
    if (onModelRetrained) {
      onModelRetrained(computedMetrics, currentConfig);
    }
  };

  // Re-calculate when threshold slides
  useEffect(() => {
    retrainModel(config, true);
  }, [config.riskThreshold, config.modelType, config.maxDepth, config.l2Penalty]);

  // SVG parameters for interactive ROC Curve plot
  const plotWidth = 300;
  const plotHeight = 220;
  const plotPadding = 30;

  // Draw smooth ROC curve based on calculated AUC
  const drawROCCurve = (aucVal: number) => {
    const points: string[] = [];
    const steps = 20;

    for (let i = 0; i <= steps; i++) {
      const fpr = i / steps;
      // Exponential curve that approximates different AUC levels
      const power = (1 - aucVal) * 10 + 1;
      const tpr = 1 - Math.pow(1 - fpr, 1 / power);
      
      const x = plotPadding + fpr * (plotWidth - 2 * plotPadding);
      const y = plotHeight - plotPadding - tpr * (plotHeight - 2 * plotPadding);
      points.push(`${x},${y}`);
    }
    return points.join(" ");
  };

  // Resolve coordinates for active hover node based on current Risk Threshold
  const getThresholdCoordinates = (aucVal: number, threshold: number) => {
    // threshold translates to a specific False Positive Rate coordinate
    const fpr = Math.max(0, 1 - threshold);
    const power = (1 - aucVal) * 10 + 1;
    const tpr = 1 - Math.pow(1 - fpr, 1 / power);

    const x = plotPadding + fpr * (plotWidth - 2 * plotPadding);
    const y = plotHeight - plotPadding - tpr * (plotHeight - 2 * plotPadding);
    return { x, y, fpr, tpr };
  };

  const activeCoord = metrics ? getThresholdCoordinates(metrics.aucRoc, config.riskThreshold) : { x: 0, y: 0, fpr: 0, tpr: 0 };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 text-[#1A1A1A]">
      {/* Hyperparameter Settings Panel */}
      <div className="xl:col-span-4 flex flex-col gap-4">
        {/* Model configuration panel */}
        <div className="bg-white border-2 border-[#1A1A1A] p-5 shadow-[4px_4px_0px_0px_#1A1A1A]">
          <h3 className="text-xs font-mono font-bold text-[#1A1A1A] uppercase tracking-wider mb-4 flex items-center gap-2">
            <Sliders className="h-4 w-4 text-[#1A1A1A]" />
            Hyperparameter Grid
          </h3>

          <div className="space-y-4">
            {/* Algorithm selector */}
            <div>
              <label className="text-[10px] font-mono text-[#1A1A1A]/70 block mb-1.5 uppercase tracking-wider font-semibold">Classifier Model</label>
              <select
                id="ml-algorithm-select"
                value={config.modelType}
                onChange={(e) => setConfig({ ...config, modelType: e.target.value as any })}
                className="w-full bg-white border border-[#1A1A1A] text-xs text-[#1A1A1A] px-3 py-2 rounded-none focus:outline-none focus:ring-1 focus:ring-[#1A1A1A]"
              >
                <option value="Decision Tree">scikit-learn · DecisionTreeClassifier</option>
                <option value="Random Forest">scikit-learn · RandomForestClassifier</option>
                <option value="Logistic Regression">scikit-learn · LogisticRegression</option>
              </select>
            </div>

            {/* Hyperparameter Max Depth */}
            {config.modelType !== "Logistic Regression" ? (
              <div>
                <div className="flex justify-between items-center text-xs font-mono mb-1">
                  <span className="text-[#1A1A1A]/70 uppercase font-semibold">max_depth limit</span>
                  <span className="text-[#1A1A1A] font-extrabold">{config.maxDepth}</span>
                </div>
                <input
                  type="range"
                  id="ml-max-depth-slider"
                  min="2"
                  max="14"
                  value={config.maxDepth}
                  onChange={(e) => setConfig({ ...config, maxDepth: parseInt(e.target.value) })}
                  className="w-full accent-[#1A1A1A] cursor-ew-resize bg-zinc-200"
                />
                <span className="text-[9px] text-[#1A1A1A]/60 mt-0.5 block leading-tight">Controls structural overfitting hazard. Optimal range: 4 to 8.</span>
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-center text-xs font-mono mb-1">
                  <span className="text-[#1A1A1A]/70 uppercase font-semibold">L2 Regularization (C)</span>
                  <span className="text-[#1A1A1A] font-extrabold">{config.l2Penalty}</span>
                </div>
                <input
                  type="range"
                  id="ml-regularization-slider"
                  min="0.1"
                  max="10"
                  step="0.1"
                  value={config.l2Penalty}
                  onChange={(e) => setConfig({ ...config, l2Penalty: parseFloat(e.target.value) })}
                  className="w-full accent-[#1A1A1A] cursor-ew-resize bg-zinc-200"
                />
                <span className="text-[9px] text-[#1A1A1A]/60 mt-0.5 block leading-tight">Sparsity penalty against high correlated dimensions.</span>
              </div>
            )}

            {/* Decision Threshold */}
            <div>
              <div className="flex justify-between items-center text-xs font-mono mb-1">
                <span className="text-[#1A1A1A]/70 uppercase font-semibold">Risk Threshold</span>
                <span className="text-[#1A1A1A] font-extrabold">{config.riskThreshold * 100}%</span>
              </div>
              <input
                type="range"
                id="ml-risk-threshold-slider"
                min="0.1"
                max="0.9"
                step="0.05"
                value={config.riskThreshold}
                onChange={(e) => setConfig({ ...config, riskThreshold: parseFloat(e.target.value) })}
                className="w-full accent-[#1A1A1A] cursor-ew-resize bg-zinc-200"
              />
              <span className="text-[9px] text-[#1A1A1A]/65 mt-0.5 block leading-normal">
                Risk severity cutoff. Slides trade-off between **Precision** (high cutoff reduces false positives) vs **Recall** (captures all risk).
              </span>
            </div>

            {/* Train Trigger */}
            <button
              id="ml-train-btn"
              onClick={handleRetrainTrigger}
              disabled={training}
              className="w-full py-2.5 bg-[#1A1A1A] hover:bg-[#333333] disabled:bg-zinc-200 disabled:text-zinc-400 text-white font-mono text-xs font-bold transition-all mt-2 cursor-pointer"
            >
              {training ? <RefreshCw className="h-4 w-4 animate-spin text-white" /> : <Layers className="h-4 w-4" />}
              {training ? "Refitting Classifiers..." : "Retrain Python Model"}
            </button>
          </div>
        </div>

        {/* Feature Weights Slider Box */}
        <div className="bg-white border-2 border-[#1A1A1A] p-5 shadow-[4px_4px_0px_0px_#1A1A1A]">
          <h3 className="text-sm font-bold text-[#1A1A1A] uppercase tracking-wider mb-3 flex items-center gap-2">
            <Cpu className="h-4 w-4 text-[#1A1A1A]" />
            Coefficient Weights
          </h3>
          <p className="text-[11px] text-[#1A1A1A]/70 mb-4 leading-normal font-sans">
            Adjust the correlation severity of customer indicators inside the predictive algorithm to observe model accuracy changes.
          </p>

          <div className="space-y-3">
            {[
              { id: "supportCalls" as const, label: "Weekly Support Complaints", val: config.featureWeights.supportCalls },
              { id: "contractType" as const, label: "Month-To-Month Contract", val: config.featureWeights.contractType },
              { id: "tenure" as const, label: "Tenure Months Duration", val: config.featureWeights.tenure },
              { id: "lastActive" as const, label: "Days since last active", val: config.featureWeights.lastActive },
              { id: "monthlyCharges" as const, label: "Avg Monthly Billing Cost", val: config.featureWeights.monthlyCharges }
            ].map((f) => (
              <div key={f.id}>
                <div className="flex justify-between text-[11px] font-mono mb-0.5">
                  <span className="text-[#1A1A1A]/80">{f.label}</span>
                  <span className="text-[#1A1A1A] font-bold">{f.val.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.2"
                  value={f.val}
                  onChange={(e) => handleUpdateWeight(f.id, parseFloat(e.target.value))}
                  className="w-full cursor-ew-resize accent-[#1A1A1A] bg-zinc-200"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Model Performance Terminal Panel */}
      <div className="xl:col-span-8 flex flex-col gap-4">
        {/* ML Performance Metrics cards */}
        {metrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-slideIn">
            {[
              { label: "Accuracy Score", val: `${(metrics.accuracy * 100).toFixed(1)}%`, desc: "Correct classifications", color: "text-[#1A1A1A]" },
              { label: "Recall Rate", val: `${(metrics.recall * 100).toFixed(1)}%`, desc: "Churn capture coverage", color: "text-red-700" },
              { label: "Precision Rate", val: `${(metrics.precision * 100).toFixed(1)}%`, desc: "Accuracy of risk flags", color: "text-[#1A1A1A]" },
              { label: "Area Under ROC", val: metrics.aucRoc.toFixed(2), desc: "Classifier discriminative power", color: "text-[#1A1A1A]" }
            ].map((card, idx) => (
              <div key={idx} className="bg-white border-2 border-[#1A1A1A] p-4 shadow-[4px_4px_0px_0px_#1A1A1A] hover:bg-[#F9F8F6] transition-all duration-300">
                <p className="text-[10px] font-mono uppercase text-[#1A1A1A]/60 tracking-wider font-bold">{card.label}</p>
                <p className={`text-2xl font-black font-serif mt-1 ${card.color}`}>{card.val}</p>
                <p className="text-[9px] text-[#1A1A1A]/60 mt-1 italic font-serif">{card.desc}</p>
              </div>
            ))}
          </div>
        )}

        {/* Visual Graphics charts split row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* confusion matrix container */}
          <div className="bg-white border-2 border-[#1A1A1A] p-5 shadow-[4px_4px_0px_0px_#1A1A1A] flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-mono font-bold text-[#1A1A1A] uppercase tracking-wider mb-2 flex items-center gap-1.5 border-b border-[#1A1A1A]/10 pb-2">
                <Compass className="h-4 w-4 text-[#1A1A1A]" />
                Confusion Matrix Model Validation
              </h4>
              <p className="text-[10px] text-[#1A1A1A]/70 mb-4 leading-normal font-sans">
                Reflects predicted categories against 120 customers. Lower False Positives represents reduced budget wastage.
              </p>

              {metrics && (
                <div className="grid grid-cols-2 gap-2 max-w-sm mx-auto font-mono">
                  {/* True Negatives */}
                  <div className="bg-white border border-[#1A1A1A] p-3 text-center">
                    <p className="text-[9px] text-[#1A1A1A]/50 uppercase font-bold">True Negative (TN)</p>
                    <p className="text-2xl font-bold font-serif text-[#1A1A1A] mt-1">{metrics.classificationMatrix.trueNegative}</p>
                    <p className="text-[8px] text-[#1A1A1A]/65 mt-0.5">Accurate Retain Flag</p>
                  </div>
                  {/* False Positives */}
                  <div className="bg-red-50 border border-red-600 p-3 text-center">
                    <p className="text-[9px] text-red-700 uppercase font-bold">False Positive (FP)</p>
                    <p className="text-2xl font-bold font-serif text-red-700 mt-1">{metrics.classificationMatrix.falsePositive}</p>
                    <p className="text-[8px] text-red-700/75 mt-0.5">False Churn Alarm</p>
                  </div>
                  {/* False Negatives */}
                  <div className="bg-red-50 border border-red-600 p-3 text-center">
                    <p className="text-[9px] text-red-700 uppercase font-bold">False Negative (FN)</p>
                    <p className="text-2xl font-bold font-serif text-red-700 mt-1">{metrics.classificationMatrix.falseNegative}</p>
                    <p className="text-[8px] text-red-700/75 mt-0.5">Missed Churn Risks</p>
                  </div>
                  {/* True Positives */}
                  <div className="bg-[#EAE8E4] border border-[#1A1A1A] p-3 text-center">
                    <p className="text-[9px] text-[#1A1A1A]/80 uppercase font-bold">True Positive (TP)</p>
                    <p className="text-2xl font-bold font-serif text-[#1A1A1A] mt-1">{metrics.classificationMatrix.truePositive}</p>
                    <p className="text-[8px] text-[#1A1A1A]/70 mt-0.5">Accurate Churn Rescue</p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-[#1A1A1A]/20 flex items-center gap-2 text-[10px] text-[#1A1A1A]/60 font-sans">
              <Info className="h-3.5 w-3.5 text-[#1A1A1A]/40 shrink-0" />
              <span>Sensitivity values dynamically update based on Risk Threshold and Factor weights.</span>
            </div>
          </div>

          {/* ROC-Curve Plot widget */}
          <div className="bg-white border-2 border-[#1A1A1A] p-5 shadow-[4px_4px_0px_0px_#1A1A1A]">
            <h4 className="text-xs font-mono font-bold text-[#1A1A1A] uppercase tracking-wider mb-2 flex items-center gap-1.5 border-b border-[#1A1A1A]/10 pb-2">
              <TrendingUp className="h-4 w-4 text-[#1A1A1A]" />
              Receiver Operating Characteristic (ROC)
            </h4>
            <p className="text-[10px] text-[#1A1A1A]/70 mb-3 leading-normal font-sans">
              Plots Sensitivity vs False Alarm rate. Current AUC is <strong className="text-black underline font-bold">{metrics?.aucRoc}</strong>.
            </p>

            {metrics && (
              <div className="bg-[#F9F8F6] rounded-none border border-[#1A1A1A] p-2 flex flex-col items-center">
                <svg width={plotWidth} height={plotHeight} className="h-auto w-full max-h-[170px]">
                  {/* Grid Diagonal Guess Line */}
                  <line
                    x1={plotPadding}
                    y1={plotHeight - plotPadding}
                    x2={plotWidth - plotPadding}
                    y2={plotPadding}
                    stroke="#D1CFC9"
                    strokeWidth="1"
                    strokeDasharray="3,3"
                  />
                  {/* Axes Lines */}
                  <line x1={plotPadding} y1={plotHeight - plotPadding} x2={plotWidth - plotPadding} y2={plotHeight - plotPadding} stroke="#1A1A1A" strokeWidth="1.5" />
                  <line x1={plotPadding} y1={plotPadding} x2={plotPadding} y2={plotHeight - plotPadding} stroke="#1A1A1A" strokeWidth="1.5" />
                  
                  {/* Axes labels */}
                  <text x={plotWidth / 2} y={plotHeight - 4} fill="#888888" fontSize="8" textAnchor="middle" fontFamily="monospace">False Positive Rate (FPR)</text>
                  <text x={10} y={plotHeight / 2} fill="#888888" fontSize="8" textAnchor="middle" transform={`rotate(-90 10 ${plotHeight/2})`} fontFamily="monospace">True Positive Rate (TPR)</text>

                  {/* ROC Curve Polyline */}
                  <path
                    d={`M ${drawROCCurve(metrics.aucRoc)}`}
                    fill="none"
                    stroke="#1A1A1A"
                    strokeWidth="2.5"
                    className="transition-all duration-300"
                  />

                  {/* Current Cutoff Ring */}
                  <circle
                    cx={activeCoord.x}
                    cy={activeCoord.y}
                    r="5"
                    fill="red"
                    stroke="#1A1A1A"
                    strokeWidth="1.5"
                    className="transition-all duration-200 cursor-pointer"
                  />
                  
                  {/* Floating tooltip labels */}
                  <text
                    x={Math.max(plotPadding + 10, activeCoord.x - 30)}
                    y={Math.max(plotPadding + 10, activeCoord.y - 10)}
                    fill="red"
                    fontSize="8"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    cutoff ({(config.riskThreshold * 100).toFixed(0)}%)
                  </text>
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Py Sandbox execution prompt line */}
        <div className="bg-white border-2 border-[#1A1A1A] overflow-hidden shadow-[4px_4px_0px_0px_#1A1A1A] flex flex-col">
          <div className="flex justify-between items-center bg-[#F9F8F6] px-4 py-3 border-b-2 border-[#1A1A1A]">
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-[#1A1A1A]" />
              <span className="text-xs font-mono font-bold text-[#1A1A1A]">SCIKIT-LEARN MODEL CONSOLE</span>
            </div>
          </div>
          <div className="bg-[#EAE8E4] p-4 font-mono text-[9px] text-[#1A1A1A]/85 h-32 overflow-y-auto block leading-normal space-y-1">
            {terminalLogs.length > 0 ? (
              terminalLogs.map((log, idx) => (
                <div key={idx} className={log.startsWith("[") ? "text-red-700 font-bold" : log.startsWith(">>>") ? "text-black/80 font-semibold" : "text-[#1A1A1A]/60"}>
                  <span className="opacity-45">&gt;_ </span>{log}
                </div>
              ))
            ) : (
              <div className="text-[#1A1A1A]/50 italic">
                # Ready for classification compiler execution. Push Retrain button to see Scikit-Learn log diagnostics.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


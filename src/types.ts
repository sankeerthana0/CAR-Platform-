export interface Customer {
  id: string;
  name: string;
  email: string;
  segment: "Loyal Enthusiasts" | "At-Risk Bargainers" | "Support Heavyweights" | "Dormant Accounts";
  contract: "Month-to-month" | "One year" | "Two year";
  tenureMonths: number;
  monthlyCharges: number;
  totalCharges: number;
  supportCalls30d: number;
  lastActiveDaysAgo: number;
  satisfactionScore: number; // 1 to 5
  actualChurn: boolean;
  predictedChurnProbability: number; // calculated live or static
  region: "North" | "South" | "East" | "West";
}

export interface SQLTemplate {
  name: string;
  description: string;
  query: string;
  resultHeaders: string[];
}

export interface CohortRow {
  cohortName: string; // e.g., "Jan 2025" or "Q1 2025"
  initialCount: number;
  retentionRates: number[]; // 13 values: Month 0 (100) to Month 12
}

export interface MLConfig {
  modelType: "Logistic Regression" | "Decision Tree" | "Random Forest";
  maxDepth: number;
  l2Penalty: number;
  riskThreshold: number; // 0.1 to 0.9
  featureWeights: {
    contractType: number;
    supportCalls: number;
    monthlyCharges: number;
    tenure: number;
    lastActive: number;
  };
}

export interface MLMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  aucRoc: number;
  classificationMatrix: {
    truePositive: number;
    falsePositive: number;
    trueNegative: number;
    falseNegative: number;
  };
}

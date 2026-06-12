import { Customer, CohortRow, SQLTemplate } from "./types";

// Programmatic generation of 120 high-fidelity customer records with logical correlations
// Correlations:
// - Contract = Month-to-month and SupportCalls > 2 => high Churn actual & probability
// - Segment = Loyal Enthusiasts => Low churn, high satisfaction, long tenure, Two year contract
// - Segment = Support Heavyweights => High charges, high supportCalls
export function generateCustomers(): Customer[] {
  const customers: Customer[] = [];
  const firstNames = ["James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda", "William", "Elizabeth", "David", "Barbara", "Richard", "Susan", "Joseph", "Jessica", "Thomas", "Sarah", "Charles", "Karen", "Christopher", "Nancy", "Daniel", "Lisa", "Matthew", "Betty", "Anthony", "Margaret", "Mark", "Sandra"];
  const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson"];
  const regions: ("North" | "South" | "East" | "West")[] = ["North", "South", "East", "West"];

  const segments: ("Loyal Enthusiasts" | "At-Risk Bargainers" | "Support Heavyweights" | "Dormant Accounts")[] = [
    "Loyal Enthusiasts",
    "At-Risk Bargainers",
    "Support Heavyweights",
    "Dormant Accounts"
  ];

  for (let i = 1; i <= 120; i++) {
    const fn = firstNames[i % firstNames.length];
    const ln = lastNames[(i * 3) % lastNames.length];
    const name = `${fn} ${ln}`;
    const email = `${fn.toLowerCase()}.${ln.toLowerCase()}@clientintelligence.com`;
    const region = regions[i % regions.length];

    // Determine segment based on modulo to ensure healthy distribution
    let segment = segments[i % segments.length];
    
    let contract: "Month-to-month" | "One year" | "Two year" = "Month-to-month";
    let tenureMonths = 5;
    let monthlyCharges = 45;
    let supportCalls30d = 0;
    let lastActiveDaysAgo = 2;
    let satisfactionScore = 4;

    if (segment === "Loyal Enthusiasts") {
      contract = i % 2 === 0 ? "Two year" : "One year";
      tenureMonths = Math.floor(25 + (i % 20) * 1.5);
      monthlyCharges = 65 + (i % 10) * 4;
      supportCalls30d = i % 2;
      lastActiveDaysAgo = Math.floor((i % 4) + 1);
      satisfactionScore = i % 3 === 0 ? 5 : 4;
    } else if (segment === "At-Risk Bargainers") {
      contract = "Month-to-month";
      tenureMonths = Math.floor(3 + (i % 6));
      monthlyCharges = 85 + (i % 5) * 6;
      supportCalls30d = Math.floor(2 + (i % 3));
      lastActiveDaysAgo = Math.floor(4 + (i % 10));
      satisfactionScore = i % 2 === 0 ? 2 : 3;
    } else if (segment === "Support Heavyweights") {
      contract = i % 3 === 0 ? "One year" : "Month-to-month";
      tenureMonths = Math.floor(8 + (i % 12));
      monthlyCharges = 110 + (i % 4) * 8;
      supportCalls30d = Math.floor(4 + (i % 4)); // 4 to 7 calls!
      lastActiveDaysAgo = Math.floor(1 + (i % 3));
      satisfactionScore = i % 2 === 0 ? 1 : 2;
    } else { // Dormant Accounts
      contract = i % 2 === 0 ? "One year" : "Month-to-month";
      tenureMonths = Math.floor(12 + (i % 15));
      monthlyCharges = 25 + (i % 5) * 5;
      supportCalls30d = 0;
      lastActiveDaysAgo = Math.floor(25 + (i % 30)); // inactive for almost a month
      satisfactionScore = 3;
    }

    const totalCharges = Number((monthlyCharges * tenureMonths).toFixed(2));

    // Base Churn actual: high risk if Month-to-month, low satisfaction, high support calls, dormant last active
    let churnProb = 0.1;
    if (contract === "Month-to-month") churnProb += 0.25;
    if (supportCalls30d >= 4) churnProb += 0.35;
    if (satisfactionScore <= 2) churnProb += 0.2;
    if (lastActiveDaysAgo >= 20) churnProb += 0.3;
    if (tenureMonths < 6) churnProb += 0.15;
    if (segment === "Loyal Enthusiasts") churnProb -= 0.25;

    churnProb = Math.max(0.02, Math.min(0.98, churnProb));
    const actualChurn = (i * 7) % 100 < churnProb * 100;

    customers.push({
      id: `CST-${i.toString().padStart(4, "0")}`,
      name,
      email,
      segment,
      contract,
      tenureMonths,
      monthlyCharges,
      totalCharges,
      supportCalls30d,
      lastActiveDaysAgo,
      satisfactionScore,
      actualChurn,
      predictedChurnProbability: Number(churnProb.toFixed(3)),
      region
    });
  }

  return customers;
}

export const COHORT_DATA: CohortRow[] = [
  {
    cohortName: "2025-Q1 Cohort",
    initialCount: 450,
    retentionRates: [100, 94.2, 88.5, 84.0, 79.8, 76.2, 73.0, 71.1, 68.9, 67.2, 65.4, 64.0, 62.8]
  },
  {
    cohortName: "2025-Q2 Cohort",
    initialCount: 520,
    retentionRates: [100, 93.0, 86.8, 81.2, 77.0, 72.5, 68.9, 66.0, 64.1, 62.2, 60.5, 59.1, 57.5]
  },
  {
    cohortName: "2025-Q3 Cohort",
    initialCount: 610,
    retentionRates: [100, 91.5, 84.0, 78.5, 73.2, 69.1, 65.4, 62.8, 60.2, 58.0, 56.5, 54.9, 53.2]
  },
  {
    cohortName: "2025-Q4 Cohort",
    initialCount: 740,
    retentionRates: [100, 90.1, 82.2, 75.8, 70.0, 65.5, 62.0, 59.2, 57.0, 55.4, 53.8, 51.5, 49.9]
  }
];

export const SQL_TEMPLATES: SQLTemplate[] = [
  {
    name: "Highrisk Month-to-Month Contracts",
    description: "Queries active monthly subscribers with high support complaints and low customer sentiment scores.",
    query: `SELECT id, name, segment, monthlyCharges, supportCalls30d, satisfactionScore \nFROM customers \nWHERE contract = 'Month-to-month' AND supportCalls30d > 2 \nORDER BY supportCalls30d DESC \nLIMIT 10;`,
    resultHeaders: ["id", "name", "segment", "monthlyCharges", "supportCalls30d", "satisfactionScore"]
  },
  {
    name: "Customer Segment Summary Stats",
    description: "Aggregates revenue and support metrics across different segmented clusters.",
    query: `SELECT segment, COUNT(*) AS count, AVG(monthlyCharges) AS avgCharges, AVG(supportCalls30d) AS avgComplaints, AVG(satisfactionScore) AS avgSatisfaction \nFROM customers \nGROUP BY segment \nORDER BY avgComplaints DESC;`,
    resultHeaders: ["segment", "count", "avgCharges", "avgComplaints", "avgSatisfaction"]
  },
  {
    name: "Dormancy Alert by Region",
    description: "Identifies accounts with no portal activity for over 15 days.",
    query: `SELECT id, name, region, lastActiveDaysAgo, monthlyCharges \nFROM customers \nWHERE lastActiveDaysAgo > 15 \nORDER BY lastActiveDaysAgo DESC \nLIMIT 12;`,
    resultHeaders: ["id", "name", "region", "lastActiveDaysAgo", "monthlyCharges"]
  },
  {
    name: "Churn Rate by Contract Type",
    description: "Determines the percentage of historical accounts churned per billing tier.",
    query: `SELECT contract, COUNT(*) AS total_accounts, SUM(actualChurn) AS churn_count, AVG(predictedChurnProbability) AS predicted_ratio \nFROM customers \nGROUP BY contract \nORDER BY predicted_ratio DESC;`,
    resultHeaders: ["contract", "total_accounts", "churn_count", "predicted_ratio"]
  }
];

// Robust clientside SQL Compiler to process operations on local mock databases
export function executeSQLMock(
  query: string,
  customers: Customer[],
  cohorts: CohortRow[]
): { headers: string[]; rows: any[]; count: number; executionTimeMs: number } {
  const startTime = performance.now();
  
  // Basic clean up of white spaces
  const cleanQuery = query.replace(/\s+/g, " ").trim();
  const lowerQuery = cleanQuery.toLowerCase();
  
  // Direct detection logic to handle standard queries gracefully
  let matchedRows: any[] = [];
  let headers: string[] = [];

  try {
    // 1. Identify FROM table
    const tableMatch = lowerQuery.match(/\bfrom\s+(\w+)\b/);
    const tableName = tableMatch ? tableMatch[1] : "customers";

    // Standard table datasets selection
    let datasets: any[] = [];
    if (tableName === "cohorts") {
      datasets = cohorts.map(c => ({
        cohortName: c.cohortName,
        initialCount: c.initialCount,
        m0: c.retentionRates[0],
        m3: c.retentionRates[3],
        m6: c.retentionRates[6],
        m9: c.retentionRates[9],
        m12: c.retentionRates[12]
      }));
    } else {
      datasets = [...customers];
    }

    // 2. WHERE filter evaluator
    let filtered = [...datasets];
    const whereMatch = cleanQuery.match(/\bWHERE\s+(.*?)(?=\bGROUP BY\b|\bORDER BY\b|\bLIMIT\b|$)/i);
    if (whereMatch) {
      const clause = whereMatch[1].trim();
      
      // Parse multi conditions with AND/OR
      const parts = clause.split(/\s+AND\s+/i);
      parts.forEach(part => {
        // e.g. contract = 'Month-to-month', supportCalls30d > 2, lastActiveDaysAgo > 15
        const opMatch = part.match(/([\w\d_]+)\s*(=|>|<|>=|<=)\s*['"]?([^'"]+)['"]?/i);
        if (opMatch) {
          const [, colName, op, rawVal] = opMatch;
          const col = colName.trim();
          let targetVal: any = rawVal.trim();
          
          if (!isNaN(targetVal)) {
            targetVal = Number(targetVal);
          } else if (targetVal === "true") {
            targetVal = true;
          } else if (targetVal === "false") {
            targetVal = false;
          }

          filtered = filtered.filter(item => {
            const itemVal = (item as any)[col];
            if (itemVal === undefined) return true; // skip filters on missing attributes

            const compareA = typeof itemVal === "string" ? itemVal.toLowerCase() : itemVal;
            const compareB = typeof targetVal === "string" ? targetVal.toLowerCase() : targetVal;

            if (op === "=") return compareA == compareB;
            if (op === ">") return compareA > compareB;
            if (op === "<") return compareA < compareB;
            if (op === ">=") return compareA >= compareB;
            if (op === "<=") return compareA <= compareB;
            return true;
          });
        }
      });
    }

    // 3. GROUP BY and Aggregations
    const groupByMatch = cleanQuery.match(/\bGROUP BY\s+([\w\d_]+)\b/i);
    const selectFieldsMatch = cleanQuery.match(/\bSELECT\s+(.*?)\s+FROM\b/i);
    const selectStr = selectFieldsMatch ? selectFieldsMatch[1].trim() : "*";

    if (groupByMatch) {
      const groupCol = groupByMatch[1].trim();
      
      // Group records
      const groups: Record<string, any[]> = {};
      filtered.forEach(item => {
        const val = String((item as any)[groupCol] || "Unknown");
        if (!groups[val]) groups[val] = [];
        groups[val].push(item);
      });

      // Assemble grouped rows
      headers = [groupCol];
      // Collect aggregate request metrics
      const aggregates: { col: string; alias: string; type: "count" | "avg" | "sum"; targetCol?: string }[] = [];
      
      selectStr.split(",").forEach(fieldStr => {
        const fieldClean = fieldStr.trim();
        if (fieldClean.toLowerCase().includes("count(*)")) {
          const aliasMatch = fieldClean.match(/as\s+([\w\d_]+)/i);
          aggregates.push({ col: "COUNT(*)", alias: aliasMatch ? aliasMatch[1] : "count", type: "count" });
        } else if (fieldClean.toLowerCase().includes("avg(")) {
          const m = fieldClean.match(/avg\((.*?)\)\s+as\s+([\w\d_]+)/i);
          if (m) {
            aggregates.push({ col: m[0], alias: m[2], type: "avg", targetCol: m[1] });
          }
        } else if (fieldClean.toLowerCase().includes("sum(")) {
          const m = fieldClean.match(/sum\((.*?)\)\s+as\s+([\w\d_]+)/i);
          if (m) {
            aggregates.push({ col: m[0], alias: m[2], type: "sum", targetCol: m[1] });
          }
        }
      });

      aggregates.forEach(agg => headers.push(agg.alias));

      matchedRows = Object.keys(groups).map(key => {
        const items = groups[key];
        const row: Record<string, any> = { [groupCol]: key };
        
        aggregates.forEach(agg => {
          if (agg.type === "count") {
            row[agg.alias] = items.length;
          } else if (agg.type === "avg" && agg.targetCol) {
            const sum = items.reduce((acc, it) => {
              let val = Number(it[agg.targetCol!] || 0);
              return acc + val;
            }, 0);
            row[agg.alias] = Number((sum / items.length).toFixed(2));
          } else if (agg.type === "sum" && agg.targetCol) {
            const sum = items.reduce((acc, it) => {
              let val = (it[agg.targetCol!] === true) ? 1 : Number(it[agg.targetCol!] || 0);
              return acc + val;
            }, 0);
            row[agg.alias] = Number(sum.toFixed(2));
          }
        });
        return row;
      });

    } else {
      // Direct projection (No Group By)
      if (selectStr === "*") {
        if (tableName === "cohorts") {
          headers = ["cohortName", "initialCount", "m0", "m3", "m6", "m9", "m12"];
        } else {
          headers = ["id", "name", "segment", "contract", "monthlyCharges", "supportCalls30d", "satisfactionScore", "predictedChurnProbability", "actualChurn"];
        }
      } else {
        // Collect custom selective request fields
        headers = selectStr.split(",").map(s => {
          const field = s.trim();
          // handle "AS" aliases for projection fields
          const aliasMatch = field.match(/as\s+([\w\d_]+)/i);
          if (aliasMatch) return aliasMatch[1];
          return field.split(/\s+/)[0]; // return raw column name
        });
      }

      matchedRows = filtered.map(item => {
        const row: Record<string, any> = {};
        
        headers.forEach(h => {
          // Resolve standard fields or custom mappings
          if (item[h] !== undefined) {
            row[h] = item[h];
          } else if (h === "churn_count") {
            row[h] = item.actualChurn ? 1 : 0;
          } else {
            // Find attribute if header matches with lowercase/uppercase variations
            const matchedKey = Object.keys(item).find(k => k.toLowerCase() === h.toLowerCase());
            row[h] = matchedKey ? item[matchedKey] : null;
          }
        });
        return row;
      });
    }

    // 4. ORDER BY evaluation
    const orderByMatch = cleanQuery.match(/\bORDER BY\s+([\w\d_*()]+)(?:\s+(asc|desc))?/i);
    if (orderByMatch) {
      const orderCol = orderByMatch[1].trim();
      const orderDir = orderByMatch[2] ? orderByMatch[2].toLowerCase() : "asc";

      matchedRows.sort((a, b) => {
        let valA = a[orderCol];
        let valB = b[orderCol];
        
        if (valA === undefined) valA = 0;
        if (valB === undefined) valB = 0;

        if (typeof valA === "string") valA = valA.toLowerCase();
        if (typeof valB === "string") valB = valB.toLowerCase();

        if (valA < valB) return orderDir === "asc" ? -1 : 1;
        if (valA > valB) return orderDir === "asc" ? 1 : -1;
        return 0;
      });
    }

    // 5. LIMIT constraints
    const limitMatch = cleanQuery.match(/\bLIMIT\s+(\d+)\b/i);
    if (limitMatch) {
      const limitVal = parseInt(limitMatch[1], 10);
      matchedRows = matchedRows.slice(0, limitVal);
    }

  } catch (error: any) {
    console.error("Mock SQL run failed, compiling general safety fallback:", error);
    matchedRows = customers.slice(0, 10).map(c => ({
      id: c.id,
      name: c.name,
      segment: c.segment,
      contract: c.contract,
      monthlyCharges: c.monthlyCharges
    }));
    headers = ["id", "name", "segment", "contract", "monthlyCharges"];
  }

  const endTime = performance.now();
  return {
    headers,
    rows: matchedRows,
    count: matchedRows.length,
    executionTimeMs: Math.max(1.2, Number((endTime - startTime).toFixed(2)))
  };
}

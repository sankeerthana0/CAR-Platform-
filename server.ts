import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Lazy initialize Gemini AI client to prevent crashes if key is initially empty
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (aiClient) return aiClient;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
    throw new Error("GEMINI_API_KEY is not configured in the environment variables. Please check the Secrets panel in the AI Studio UI.");
  }
  aiClient = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
  return aiClient;
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    hasApiKey: !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY"
  });
});

// Churn Insights generation API route proxying Gemini
app.post("/api/generate-insights", async (req, res) => {
  try {
    const { segmentName, segmentMetrics, userPrompt } = req.body;

    const basePrompt = `
You are an expert customer success & data scientist specialized in subscription retention.
You will analyze a specific customer segment and design an actionable retention playbook.

---
CUSTOMER SEGMENT AT HAND:
Name: ${segmentName || "High Risk Churn Segment"}
Representative Metrics: ${JSON.stringify(segmentMetrics || {})}

USER INQUIRY / CONCERN:
"${userPrompt || "Generate a premium structured retention playbook with quick-win marketing strategies."}"
---

Please generate a highly structured, professional, and practical response. Use clean markdown. Include:
1. **Segment Diagnosis & Risk Factors** (Explain why they are likely to churn based on the metrics, such as monthly billing contract style, high support ticket count, lower tenure).
2. **Short-Term Mitigation Actions** (Immediate "quick wins" - e.g. email sequences, discount triggers, executive outreach, support escalation).
3. **Product or Service Improvements** (Longer term strategies like feature adoption triggers, onboarding improvements).
4. **ROI Forecast & Targeted Email Copy** (Draft a high-conversion, empathetic email copy specifically matching this segment's demographics or pain points).

Please write with executive, professional composure, and maintain action-oriented guidelines.
`;

    // Try getting client and generating text
    try {
      const ai = getAiClient();
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: basePrompt,
      });

      return res.json({
        success: true,
        report: response.text,
        model: "gemini-3.5-flash"
      });
    } catch (apiError: any) {
      console.error("Gemini API error:", apiError);
      // Fallback response with a clear guide on how to configure the API Key or a professional fallback report
      const isMissingKey = apiError.message && (apiError.message.includes("is not configured") || apiError.message.includes("API key"));
      
      const fallbackReport = `
### [DEMO MODE] Retention Campaign Playbook for ${segmentName || "High Churn Risks"}

*Note: This is a high-quality simulated playbook because the Gemini API key is either unconfigured or unreachable. Please see the Secrets panel to activate full AI brainstorming.*

#### 1. Segment Diagnosis & Risk Factors
- **Contract Rigidness**: Customers on Month-to-Month plans show 3.5× higher churn volatility compared to Annual subscribers.
- **Support Fatigue**: An average of 3.8 support calls in the last 30 days indicates friction in user onboarding or workflow blockages.
- **Interaction Gaps**: Accounts with 0 dashboard logins over the past 14 days are the prime targets for immediate churn.

#### 2. Immediate Tactical Interventions
- **Empathetic Outreach**: Automate an inquiry sequence emphasizing "We're here to help unlock value."
- **In-App Guide Prompting**: Trigger targeted product tours targeted at high-friction features.
- **Financial Softeners**: Proactively offer a 2-month 20% "loyalty relief" discount in exchange for feedback.

#### 3. Strategic Initiatives
- Add automatic NPS checkpoints after the 2nd completed transaction.
- Create automated account suspension notifications to give managers a 7-day grace period to touch base with billing administrators.

#### 4. Sample Win-back Email Draft
\`\`\`
Subject: Let’s optimize your workspace experience, {{First Name}}

Hey {{First Name}},

We noticed you’ve been running into some complex structures in your recent client imports. Our goal is to make compiling reports seamless.

Let's hop on a 15-minute quick session with one of our lead solution architects to build your templates together—absolutely free. 

Click here to pick a time: [Schedule Free Setup]

Best,
The Retention Success Team
\`\`\`
`;
      return res.json({
        success: false,
        report: fallbackReport,
        warning: isMissingKey ? "GEMINI_API_KEY is not set. Showing realistic simulated playbook." : `API Error: ${apiError.message}`
      });
    }

  } catch (err: any) {
    console.error("Internal Server Error:", err);
    res.status(500).json({ error: "Internal Server Error", detail: err.message });
  }
});

// Vite Middleware & Static Serves
async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

start();

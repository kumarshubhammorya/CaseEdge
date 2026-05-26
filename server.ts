import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { GoogleGenAI, Type } from "@google/genai";
import { SCRStructure } from './src/types';
import rateLimit from 'express-rate-limit';

// Load environment variables based on environment mode
const appEnv = process.env.APP_ENV || process.env.NODE_ENV || 'development';
dotenv.config({ path: `.env.${appEnv}.local` });
dotenv.config({ path: `.env.${appEnv}` });
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });


const app = express();
app.use(express.json({ limit: '50mb' })); // Support base64 file uploads

// Define rate limiting rule for Gemini API proxy to prevent abuse
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 60, // Limit each IP to 60 requests per window
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: { error: 'Too many requests from this IP, please try again after 15 minutes.' }
});

// Apply rate limiter specifically to the API generation route
app.use('/api/gemini/generate', apiLimiter);

const PRIMARY_MODEL = 'gemini-flash-latest';
const FALLBACK_MODELS = ['gemini-3.1-flash-lite'];

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

async function safeGenAI(promptContents: any, schema?: any, ignored1 = 3, ignored2 = 1000): Promise<any> {
  const modelsToTry = [PRIMARY_MODEL, ...FALLBACK_MODELS];
  let lastError: any = null;

  for (let m = 0; m < modelsToTry.length; m++) {
    const currentModel = modelsToTry[m];
    let retries = 4;
    let backoff = 1500;

    while (retries >= 0) {
      try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
          throw new Error("GEMINI_API_KEY environment variable is not defined on the server.");
        }
        const ai = new GoogleGenAI({ apiKey });
        const config: any = {};
        if (schema) {
          config.responseMimeType = "application/json";
          config.responseSchema = schema;
        }

        const response = await ai.models.generateContent({
          model: currentModel,
          contents: promptContents,
          config
        });

        if (!response.text) throw new Error("Empty response from Gemini");

        if (schema) {
          try {
            let parsed = JSON.parse(response.text);
            if (schema?.type === Type.ARRAY && !Array.isArray(parsed) && parsed && typeof parsed === 'object') {
              const keys = Object.keys(parsed);
              if (keys.length === 1 && Array.isArray(parsed[keys[0]])) {
                parsed = parsed[keys[0]];
              }
            }
            return parsed;
          } catch (parseError) {
            console.error("JSON Parse Error:", parseError, "Response Text:", response.text);
            const match = response.text.match(/```(?:json)?\n([\s\S]*?)\n```/);
            if (match) {
              let parsed = JSON.parse(match[1]);
              if (schema?.type === Type.ARRAY && !Array.isArray(parsed) && parsed && typeof parsed === 'object') {
                const keys = Object.keys(parsed);
                if (keys.length === 1 && Array.isArray(parsed[keys[0]])) {
                  parsed = parsed[keys[0]];
                }
              }
              return parsed;
            }
            throw new Error("Failed to parse Gemini response as JSON.");
          }
        } else {
          return response.text;
        }
      } catch (err: any) {
        lastError = err;
        const errString = err ? JSON.stringify(err) : '';
        const errMessage = err?.message || '';
        
        const isRetryable =
          (err?.status === 503 ||
          err?.status === 429 ||
          err?.status === "UNAVAILABLE" ||
          errMessage.includes("503") ||
          errMessage.includes("429") ||
          errMessage.includes("UNAVAILABLE") ||
          errMessage.includes("RESOURCE_EXHAUSTED") ||
          errMessage.includes("resource has been exhausted") ||
          errString.includes("503") ||
          errString.includes("429") ||
          errString.includes("UNAVAILABLE") ||
          errString.includes("RESOURCE_EXHAUSTED") ||
          errString.includes("resource has been exhausted")) && 
          !errString.toLowerCase().includes("spending cap");

        if (isRetryable && retries > 0) {
          const jitter = Math.random() * 1000;
          const waitTime = backoff + jitter;
          console.warn(`Gemini API transient/rate-limit error on model ${currentModel}. Retrying in ${Math.round(waitTime)}ms... (${retries} retries left). Error: ${errMessage || errString}`);
          await delay(waitTime);
          retries--;
          backoff *= 2;
        } else {
          if (m < modelsToTry.length - 1) {
            console.warn(`Model ${currentModel} exhausted or failed non-retryable error. Falling back to ${modelsToTry[m + 1]}...`);
          }
          break;
        }
      }
    }
  }

  console.error("Gemini API Error across all models:", lastError);
  throw new Error(lastError?.message || "Unknown Gemini API error across all tried models.");
}

async function extractCaseFromFile(base64Data: string, mimeType: string) {
  return await safeGenAI(
    [
      {
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      },
      { text: "Extract the full case brief from this document, preserving and enhancing its structure with proper markdown formatting (headings, subheadings, bullet points, and blank lines to separate paragraphs) so it is extremely readable. Respond strictly in JSON format matching the schema." }
    ],
    {
      type: Type.OBJECT,
      properties: {
        extractedText: { type: Type.STRING }
      },
      required: ["extractedText"]
    }
  );
}

async function extractCaseFromText(text: string) {
  return await safeGenAI(
    [
      { text: "Format and clean the following text (which was OCR'd from a document) into a beautiful and readable case brief. Enhance its structure using proper markdown formatting (headings, subheadings, bullet points, and blank lines to separate paragraphs). Respond strictly in JSON format matching the schema.\n\nRaw Text:\n" + text }
    ],
    {
      type: Type.OBJECT,
      properties: {
        extractedText: { type: Type.STRING }
      },
      required: ["extractedText"]
    }
  );
}

async function analyzeCase(caseBrief: string) {
  return await safeGenAI(
    [
      { text: "You are a McKinsey case coach. Analyze this business case brief and extract: (1) Industry, (2) Core Problem in one sentence, (3) Key Stakeholders as a bulleted list, (4) Key Constraints as a bulleted list, (5) Case Type, (6) 3-5 critical clarifying questions to ask the interviewer before beginning the issue tree. Be concise and precise. Respond strictly in English. Respond in structured JSON." },
      { text: `Case Brief:\n${caseBrief}` }
    ],
    {
      type: Type.OBJECT,
      properties: {
        industry: { type: Type.STRING },
        coreProblem: { type: Type.STRING },
        keyStakeholders: { 
          type: Type.ARRAY,
          items: { type: Type.STRING }
        },
        keyConstraints: { 
          type: Type.ARRAY,
          items: { type: Type.STRING }
        },
        clarifyingQuestions: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Top 3-5 clarifying questions to ask the interviewer to uncover missing pieces of information"
        },
        caseType: { type: Type.STRING }
      },
      required: ["industry", "coreProblem", "keyStakeholders", "keyConstraints", "clarifyingQuestions", "caseType"]
    }
  );
}

async function generateHypothesis(caseBrief: string, coreProblem?: string) {
  return await safeGenAI(
    [
      { text: "You are a McKinsey case coach. Based on this business case brief and core problem, formulate a strong, testable 'day-one hypothesis'. This should be a specific, actionable statement that acts as a starting point for the investigation, not just a restatement of the problem. Explain your reasoning briefly. Respond in structured JSON." },
      { text: `Case Brief:\n${caseBrief}\n\nCore Problem:\n${coreProblem || 'Not specified yet'}` }
    ],
    {
      type: Type.OBJECT,
      properties: {
        hypothesis: { type: Type.STRING, description: "The core testable hypothesis statement" },
        reasoning: { type: Type.STRING, description: "Why this is a logical starting point" }
      },
      required: ["hypothesis", "reasoning"]
    }
  );
}

async function buildIssueTree(coreProblem: string) {
  return await safeGenAI(
    [
      { text: "You are a McKinsey consultant. Break down this core problem into a mutually exclusive and collectively exhaustive (MECE) issue tree. Provide a succinct 2 to 3-level deep logic tree (maximum 12-15 nodes total) to ensure fast processing. Keep the labels concise, maximum 10 words each. Do not output overly long labels or exhaustive lists in the labels. Respond strictly in English. Respond in JSON." },
      { text: `Core Problem: ${coreProblem}` }
    ],
    {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          label: { type: Type.STRING },
          children: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                label: { type: Type.STRING },
                children: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      label: { type: Type.STRING }
                    },
                    required: ["id", "label"]
                  }
                }
              },
              required: ["id", "label", "children"]
            }
          }
        },
        required: ["id", "label", "children"]
      }
  );
}

async function recommendFrameworks(caseType: string, coreProblem: string) {
  const result = await safeGenAI(
    [
      { text: "Given this case type and problem, recommend exactly 3 business frameworks. For each, provide: name, one sentence on why it fits, and 3 key diagnostic questions (max 15 words each). Keep answers concise. Respond strictly in English. Respond in JSON." },
      { text: `Case Type: ${caseType}\nCore Problem: ${coreProblem}` }
    ],
    {
      type: Type.OBJECT,
      properties: {
        frameworks: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              whyItFits: { type: Type.STRING },
              diagnosticQuestions: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ["name", "whyItFits", "diagnosticQuestions"]
          }
        }
      },
      required: ["frameworks"]
    }
  );
  return result?.frameworks || [];
}

async function draftRecommendation(coreRecommendation: string) {
  return await safeGenAI(
    [
      { text: "Expand this recommendation into a full SCR (Situation-Complication-Resolution) structure. Be specific, confident, and decisive. Keep it under 200 words. Respond strictly in English. Respond in JSON." },
      { text: `Core Recommendation: ${coreRecommendation}` }
    ],
    {
        type: Type.OBJECT,
        properties: {
          situation: { type: Type.STRING },
          complication: { type: Type.STRING },
          resolution: { type: Type.STRING }
        },
        required: ["situation", "complication", "resolution"]
      }
  );
}

async function simulateQA(recommendation: string) {
  const result = await safeGenAI(
    [
      { text: "You are a tough but fair MBA competition judge. Generate 5 hard questions a judge would ask about this recommendation. " +
              "For each question, provide: (1) the question, (2) a detailed model answer, and (3) a custom self-assessment rubric (an array of exactly 3-4 grading criteria starting with 'Did you...' for the student to rate their own response against). " +
              "Be highly realistic, critical, and challenging. Respond strictly in English. Respond in JSON." },
      { text: `Recommendation:\n${recommendation}` }
    ],
    {
      type: Type.OBJECT,
      properties: {
        questions: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              modelAnswer: { type: Type.STRING },
              rubric: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ["question", "modelAnswer", "rubric"]
          }
        }
      },
      required: ["questions"]
    }
  );
  return result?.questions || [];
}

async function buildQuantitativeEstimate(recommendationText: string) {
  return await safeGenAI(
    [
      { text: "You are a strategy consultant doing a back-of-envelope financial estimate. Given this recommendation, construct a rough quantification including: TAM/SAM, estimated revenue impact, implementation cost range, payback period, and one north-star KPI. State the core assumption behind each number clearly. Be specific — use real-world order-of-magnitude figures. Respond strictly in English. Respond in JSON." },
      { text: `Recommendation:\n${recommendationText}` }
    ],
    {
        type: Type.OBJECT,
        properties: {
          tam: {
            type: Type.OBJECT,
            properties: { value: { type: Type.STRING }, assumption: { type: Type.STRING } },
            required: ["value", "assumption"]
          },
          revenueImpact: {
            type: Type.OBJECT,
            properties: { value: { type: Type.STRING }, assumption: { type: Type.STRING } },
            required: ["value", "assumption"]
          },
          implementationCost: {
            type: Type.OBJECT,
            properties: { value: { type: Type.STRING }, assumption: { type: Type.STRING } },
            required: ["value", "assumption"]
          },
          paybackPeriod: {
            type: Type.OBJECT,
            properties: { value: { type: Type.STRING }, assumption: { type: Type.STRING } },
            required: ["value", "assumption"]
          },
          keyMetric: {
            type: Type.OBJECT,
            properties: { value: { type: Type.STRING }, assumption: { type: Type.STRING } },
            required: ["value", "assumption"]
          }
        },
        required: ["tam", "revenueImpact", "implementationCost", "paybackPeriod", "keyMetric"]
      }
  );
}

async function generateQuantificationPrompt(caseBrief: string, coreRecommendation: string) {
  return await safeGenAI(
    [
      { text: "You are a financial consultant. Based on the case brief and the core recommendation, generate a concise, specific description in plain terms of how this recommendation generates value and what its main cost drivers are. This description will be used as a prompt to build a financial estimate (TAM, Revenue, Costs). Keep it to 1-2 sentences. Respond strictly in English. Return the text only, no explanation." },
      { text: `Case Brief:\n${caseBrief}\n\nRecommendation:\n${coreRecommendation}` }
    ]
  );
}

async function generateStoryHook(recommendationText: string, scr?: SCRStructure | null) {
  const scrText = scr ? `\nSituation: ${scr.situation}\nComplication: ${scr.complication}\nResolution: ${scr.resolution}` : '';
  return await safeGenAI(
    [
      { text: "You are a communication coach for MBA case competitions. Take this recommendation and write the opening 60 seconds of the presentation as a narrative hook. Do NOT start with 'The problem is' or 'Today we will present'. Instead, open with a surprising fact, a vivid scenario, or a provocative question that creates tension — then connect it to the recommendation. Keep it under 120 words. Write it as spoken word, not bullet points. Respond strictly in English." },
      { text: `Recommendation: ${recommendationText}${scrText}` }
    ]
  );
}

async function calibrateLanguage(recommendationText: string, audience: string) {
  return await safeGenAI(
    [
      { text: `You are a communication strategist. Rewrite this business recommendation for a specific audience: ${audience}. Adjust vocabulary, tone, references, and framing to match what this audience values and responds to. A consulting judge values structured logic and frameworks. A finance judge values numbers and ROI. A healthcare executive values patient outcomes and regulatory feasibility. An academic panel values evidence and nuance. Keep the core recommendation identical — only change how it's expressed. Return the rewritten version only, no explanation. Respond strictly in English.` },
      { text: `Recommendation:\n${recommendationText}` }
    ]
  );
}

async function generateRecommendationHints(caseBrief: string, coreProblem?: string) {
  const result = await safeGenAI(
    [
      { text: "You are a McKinsey case coach. Based on this business case brief and core problem, generate 3 distinct, high-level core recommendations. Each recommendation should be just 1-2 sentences and take a different strategic approach (e.g., one aggressive/growth, one defensive/cost-cutting, one innovative/M&A). Respond strictly in English. Respond in JSON." },
      { text: `Case Brief:\n${caseBrief}\n\nCore Problem:\n${coreProblem || 'Not specified yet'}` }
    ],
    {
      type: Type.OBJECT,
      properties: {
        hints: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              approach: { type: Type.STRING, description: "E.g., Aggressive Growth, Cost Reduction, M&A" },
              recommendation: { type: Type.STRING }
            },
            required: ["approach", "recommendation"]
          }
        }
      },
      required: ["hints"]
    }
  );
  return result?.hints || [];
}

async function generateSlideOutline(recommendationText: string, caseBrief: string) {
  const result = await safeGenAI(
    [
      { text: "You are a McKinsey partner designing a competition presentation deck. Based on this recommendation and case brief, create a 7-slide deck outline. For each slide, provide a succinct title, a one-line purpose, and exactly 3 bullet points detailing what content/analysis goes on the slide. Keep bullets highly concise (max 12 words each). Respond strictly in English. Respond in JSON." },
      { text: `Recommendation:\n${recommendationText}\n\nCase Brief:\n${caseBrief}` }
    ],
    {
      type: Type.OBJECT,
      properties: {
        slides: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              purpose: { type: Type.STRING },
              bullets: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ["title", "purpose", "bullets"]
          }
        }
      },
      required: ["slides"]
    }
  );
  return result?.slides || [];
}

async function strengthenRecommendation(scr: SCRStructure) {
  return await safeGenAI(
    [
      { text: "Make this SCR recommendation more professional, quantified, and decisive. Improve the vocabulary and impact but keep the length under 200 words. Respond strictly in English. Respond in JSON with the modified SCR." },
      { text: `Situation: ${scr.situation}\nComplication: ${scr.complication}\nResolution: ${scr.resolution}` }
    ],
    {
        type: Type.OBJECT,
        properties: {
          situation: { type: Type.STRING },
          complication: { type: Type.STRING },
          resolution: { type: Type.STRING }
        },
        required: ["situation", "complication", "resolution"]
      }
  );
}

async function extractAssumptions(recommendationText: string) {
  const result = await safeGenAI(
    [
      { text: "You are a management consultant. Read this recommendation and extract all implicit and explicit assumptions being made. For each assumption, identify: the assumption statement, its category (Market / Financial / Operational / Regulatory), its risk level (High / Medium / Low), and what single event or fact would invalidate it. Respond in JSON as an array of objects." },
      { text: `Recommendation:\n${recommendationText}` }
    ],
    {
      type: Type.OBJECT,
      properties: {
        assumptions: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              statement: { type: Type.STRING },
              category: { 
                type: Type.STRING,
                enum: ["Market", "Financial", "Operational", "Regulatory"]
              },
              riskLevel: { 
                type: Type.STRING,
                enum: ["High", "Medium", "Low"]
              },
              whatBreaksThis: { type: Type.STRING }
            },
            required: ["statement", "category", "riskLevel", "whatBreaksThis"]
          }
        }
      },
      required: ["assumptions"]
    }
  );
  return result?.assumptions || [];
}

async function evaluateIssueTree(issueTreeJson: string, coreProblem: string) {
  return await safeGenAI(
    [
      { text: "You are an elite McKinsey Case Coach auditing a candidate's logic tree for a case interview. " +
              "Review their proposed issue tree below for the given core problem. " +
              "Determine if it is Mutually Exclusive and Collectively Exhaustive (MECE). " +
              "Calculate a MECE score out of 100 based on structure, logical separation, and completeness. " +
              "Provide overall summary feedback, list any major structural gaps (missing branches), and overlaps (redundant or non-mutually exclusive branches). " +
              "Additionally, look closely at individual nodes in the tree. For any node that is poorly defined, duplicate, not MECE, or could be improved, provide specific, concise feedback linked to its nodeId. " +
              "Respond strictly in English. Respond in JSON matching the schema." },
      { text: `Core Problem: ${coreProblem}\n\nProposed Issue Tree (JSON Structure):\n${issueTreeJson}` }
    ],
    {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.INTEGER },
        isMECE: { type: Type.BOOLEAN },
        meceSummary: { type: Type.STRING },
        structuralGaps: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        },
        overlaps: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        },
        nodeFeedback: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              nodeId: { type: Type.STRING },
              feedback: { type: Type.STRING },
              severity: { type: Type.STRING, enum: ["warning", "info"] }
            },
            required: ["nodeId", "feedback", "severity"]
          }
        }
      },
      required: ["score", "isMECE", "meceSummary", "structuralGaps", "overlaps", "nodeFeedback"]
    }
  );
}

async function evaluateIntake(caseBrief: string, userCluesJson: string) {
  return await safeGenAI(
    [
      { text: "You are an expert McKinsey Case Interview Coach. " +
              "A candidate has read the business case brief below and highlighted specific clues, categorizing them into: objective, constraint, stakeholder, or metric. " +
              "Audit their highlighted clues. Calculate a reading comprehension score out of 100. " +
              "Provide a constructive summary. Identify what major elements they successfully highlighted (correctClues) and what critical elements in the case brief they missed or miscategorized (missingClues). " +
              "Be highly precise and pedagogical. Respond strictly in English. Respond in JSON matching the schema." },
      { text: `Case Brief:\n${caseBrief}\n\nCandidate's Highlights (JSON):\n${userCluesJson}` }
    ],
    {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.INTEGER },
        summary: { type: Type.STRING },
        missingClues: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        },
        correctClues: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      },
      required: ["score", "summary", "missingClues", "correctClues"]
    }
  );
}

async function evaluateFrameworks(proposedFrameworks: string, caseBrief: string, caseGlanceJson: string) {
  return await safeGenAI(
    [
      { text: "You are an elite business case coach. " +
              "Based on the case brief and core problem details below, the student has proposed a set of frameworks, hypotheses, or analytical approaches. " +
              "Provide a detailed, professional critique comparing their proposal to the gold-standard frameworks. " +
              "Calculate a score out of 100 for their proposed reasoning. " +
              "Additionally, recommend exactly 3 tailored frameworks that fits this case (each with name, whyItFits, and 3 key diagnostic questions) which will be revealed as the model answer. " +
              "Be constructive but direct. Respond strictly in English. Respond in JSON matching the schema." },
      { text: `Case Brief:\n${caseBrief}\n\nCase Glance Data:\n${caseGlanceJson}\n\nStudent's Proposed Frameworks:\n${proposedFrameworks}` }
    ],
    {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.INTEGER },
        feedback: { type: Type.STRING },
        frameworks: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              whyItFits: { type: Type.STRING },
              diagnosticQuestions: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ["name", "whyItFits", "diagnosticQuestions"]
          }
        }
      },
      required: ["score", "feedback", "frameworks"]
    }
  );
}

async function getFrameworkHint(caseBrief: string, caseGlanceJson: string, proposedFrameworks: string, hintsCount: number) {
  return await safeGenAI(
    [
      { text: "You are a Socratic case coach. " +
              "Given the case brief, core problem, and the proposed frameworks the student has entered so far, provide a subtle, leading hint. " +
              "Do NOT give away the answer or name the recommended frameworks (like Profitability, 3Cs, Porter's 5 Forces) directly. " +
              "Instead, ask a guiding question or point to a specific dimension in the case brief they should think about. " +
              "Keep the hint very concise (under 25 words). This is hint number " + (hintsCount + 1) + ". Respond strictly in plain text in English." },
      { text: `Case Brief:\n${caseBrief}\n\nCase Glance:\n${caseGlanceJson}\n\nProposed Logic So Far:\n${proposedFrameworks || 'None yet'}` }
    ]
  );
}

const actions: Record<string, Function> = {
  extractCaseFromFile,
  extractCaseFromText,
  analyzeCase,
  generateHypothesis,
  buildIssueTree,
  recommendFrameworks,
  draftRecommendation,
  simulateQA,
  buildQuantitativeEstimate,
  generateQuantificationPrompt,
  generateStoryHook,
  calibrateLanguage,
  generateRecommendationHints,
  generateSlideOutline,
  strengthenRecommendation,
  extractAssumptions,
  evaluateIssueTree,
  evaluateIntake,
  evaluateFrameworks,
  getFrameworkHint,
};

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// API proxy endpoint
app.post('/api/gemini/generate', async (req, res) => {
  const { action, args } = req.body;
  if (!action || !actions[action]) {
    return res.status(400).json({ error: `Unknown action: ${action}` });
  }

  try {
    const result = await actions[action](...(args || []));
    res.json({ result });
  } catch (error: any) {
    console.error(`Error in action ${action}:`, error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

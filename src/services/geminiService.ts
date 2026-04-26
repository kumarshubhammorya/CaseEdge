import { GoogleGenAI, Type } from "@google/genai";
import { SCRStructure } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const MODEL = 'gemini-3.1-pro-preview';

export async function analyzeCase(caseBrief: string) {
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [
      { text: "You are a McKinsey case coach. Analyze this business case brief and extract: (1) Industry, (2) Core Problem in one sentence, (3) Key Stakeholders as a bulleted list, (4) Key Constraints as a bulleted list, (5) Case Type. Be concise and precise. Respond in structured JSON." },
      { text: `Case Brief:\n${caseBrief}` }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
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
          caseType: { type: Type.STRING }
        },
        required: ["industry", "coreProblem", "keyStakeholders", "keyConstraints", "caseType"]
      }
    }
  });
  
  if (!response.text) throw new Error("No response from Gemini");
  return JSON.parse(response.text);
}

export async function buildIssueTree(coreProblem: string) {
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [
      { text: "You are a McKinsey consultant. Break down this core problem into a mutually exclusive and collectively exhaustive (MECE) issue tree. Provide a 3-level deep logic tree. Respond in JSON." },
      { text: `Core Problem: ${coreProblem}` }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
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
    }
  });

  if (!response.text) throw new Error("No response from Gemini");
  return JSON.parse(response.text);
}

export async function recommendFrameworks(caseType: string, coreProblem: string) {
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [
      { text: "Given this case type and problem, recommend exactly 3 business frameworks. For each, provide: name, one sentence on why it fits, and 3 key diagnostic questions. Respond in JSON." },
      { text: `Case Type: ${caseType}\nCore Problem: ${coreProblem}` }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
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
    }
  });

  if (!response.text) throw new Error("No response from Gemini");
  return JSON.parse(response.text);
}

export async function draftRecommendation(coreRecommendation: string) {
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [
      { text: "Expand this recommendation into a full SCR (Situation-Complication-Resolution) structure. Be specific, confident, and decisive. Keep it under 200 words. Respond in JSON." },
      { text: `Core Recommendation: ${coreRecommendation}` }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          situation: { type: Type.STRING },
          complication: { type: Type.STRING },
          resolution: { type: Type.STRING }
        },
        required: ["situation", "complication", "resolution"]
      }
    }
  });

  if (!response.text) throw new Error("No response from Gemini");
  return JSON.parse(response.text);
}

export async function simulateQA(recommendation: string) {
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [
      { text: "You are a tough but fair MBA competition judge. Generate 5 hard questions a judge would ask about this recommendation. For each, provide a model answer. Be realistic and challenging. Respond in JSON." },
      { text: `Recommendation:\n${recommendation}` }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            modelAnswer: { type: Type.STRING }
          },
          required: ["question", "modelAnswer"]
        }
      }
    }
  });

  if (!response.text) throw new Error("No response from Gemini");
  return JSON.parse(response.text);
}

export async function buildQuantitativeEstimate(recommendationText: string) {
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [
      { text: "You are a strategy consultant doing a back-of-envelope financial estimate. Given this recommendation, construct a rough quantification including: TAM/SAM, estimated revenue impact, implementation cost range, payback period, and one north-star KPI. State the core assumption behind each number clearly. Be specific — use real-world order-of-magnitude figures. Respond in JSON." },
      { text: `Recommendation:\n${recommendationText}` }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
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
    }
  });

  if (!response.text) throw new Error("No response from Gemini");
  return JSON.parse(response.text);
}

export async function generateStoryHook(recommendationText: string, scr?: SCRStructure | null) {
  const scrText = scr ? `\nSituation: ${scr.situation}\nComplication: ${scr.complication}\nResolution: ${scr.resolution}` : '';
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [
      { text: "You are a communication coach for MBA case competitions. Take this recommendation and write the opening 60 seconds of the presentation as a narrative hook. Do NOT start with 'The problem is' or 'Today we will present'. Instead, open with a surprising fact, a vivid scenario, or a provocative question that creates tension — then connect it to the recommendation. Keep it under 120 words. Write it as spoken word, not bullet points." },
      { text: `Recommendation: ${recommendationText}${scrText}` }
    ]
  });

  if (!response.text) throw new Error("No response from Gemini");
  return response.text;
}

export async function calibrateLanguage(recommendationText: string, audience: string) {
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [
      { text: `You are a communication strategist. Rewrite this business recommendation for a specific audience: ${audience}. Adjust vocabulary, tone, references, and framing to match what this audience values and responds to. A consulting judge values structured logic and frameworks. A finance judge values numbers and ROI. A healthcare executive values patient outcomes and regulatory feasibility. An academic panel values evidence and nuance. Keep the core recommendation identical — only change how it's expressed. Return the rewritten version only, no explanation.` },
      { text: `Recommendation:\n${recommendationText}` }
    ]
  });

  if (!response.text) throw new Error("No response from Gemini");
  return response.text;
}

export async function strengthenRecommendation(scr: SCRStructure) {
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [
      { text: "Make this SCR recommendation more professional, quantified, and decisive. Improve the vocabulary and impact but keep the length under 200 words. Respond in JSON with the modified SCR." },
      { text: `Situation: ${scr.situation}\nComplication: ${scr.complication}\nResolution: ${scr.resolution}` }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          situation: { type: Type.STRING },
          complication: { type: Type.STRING },
          resolution: { type: Type.STRING }
        },
        required: ["situation", "complication", "resolution"]
      }
    }
  });

  if (!response.text) throw new Error("No response from Gemini");
  return JSON.parse(response.text);
}

import { SCRStructure } from "../types";
import { telemetry } from "../lib/telemetry";

async function callProxy(action: string, args: any[]): Promise<any> {
  const startTime = performance.now();
  let success = false;
  try {
    const response = await fetch('/api/gemini/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action, args }),
    });
    
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    success = true;
    return data.result;
  } catch (error: any) {
    telemetry.recordError(error, { action, args });
    throw error;
  } finally {
    const endTime = performance.now();
    const durationMs = Math.round(endTime - startTime);
    telemetry.recordLatency(action, durationMs, success);
  }
}

export async function extractCaseFromFile(base64Data: string, mimeType: string) {
  return callProxy('extractCaseFromFile', [base64Data, mimeType]);
}

export async function extractCaseFromText(text: string) {
  return callProxy('extractCaseFromText', [text]);
}

export async function analyzeCase(caseBrief: string) {
  return callProxy('analyzeCase', [caseBrief]);
}

export async function generateHypothesis(caseBrief: string, coreProblem?: string) {
  return callProxy('generateHypothesis', [caseBrief, coreProblem]);
}

export async function buildIssueTree(coreProblem: string) {
  return callProxy('buildIssueTree', [coreProblem]);
}

export async function recommendFrameworks(caseType: string, coreProblem: string) {
  return callProxy('recommendFrameworks', [caseType, coreProblem]);
}

export async function draftRecommendation(coreRecommendation: string) {
  return callProxy('draftRecommendation', [coreRecommendation]);
}

export async function simulateQA(recommendation: string) {
  return callProxy('simulateQA', [recommendation]);
}

export async function buildQuantitativeEstimate(recommendationText: string) {
  return callProxy('buildQuantitativeEstimate', [recommendationText]);
}

export async function generateQuantificationPrompt(caseBrief: string, coreRecommendation: string) {
  return callProxy('generateQuantificationPrompt', [caseBrief, coreRecommendation]);
}

export async function generateStoryHook(recommendationText: string, scr?: SCRStructure | null) {
  return callProxy('generateStoryHook', [recommendationText, scr]);
}

export async function calibrateLanguage(recommendationText: string, audience: string) {
  return callProxy('calibrateLanguage', [recommendationText, audience]);
}

export async function generateRecommendationHints(caseBrief: string, coreProblem?: string) {
  return callProxy('generateRecommendationHints', [caseBrief, coreProblem]);
}

export async function generateSlideOutline(recommendationText: string, caseBrief: string) {
  return callProxy('generateSlideOutline', [recommendationText, caseBrief]);
}

export async function strengthenRecommendation(scr: SCRStructure) {
  return callProxy('strengthenRecommendation', [scr]);
}

export async function extractAssumptions(recommendationText: string) {
  return callProxy('extractAssumptions', [recommendationText]);
}

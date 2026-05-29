import { SCRStructure } from "../types";
import { telemetry } from "../lib/telemetry";
import { auth } from "../lib/firebase";

async function callProxy(action: string, args: any[]): Promise<any> {
  const startTime = performance.now();
  let success = false;

  // Retrieve active config parameters from localStorage
  const configStr = localStorage.getItem('caseedge-system-config');
  let configPayload = null;
  if (configStr) {
    try {
      const configObj = JSON.parse(configStr);
      configPayload = {
        activeModel: configObj.activeModel,
        apiKeyOverride: configObj.geminiApiKeyOverride
      };
    } catch (e) {
      console.error("Error parsing system config override:", e);
    }
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (auth.currentUser) {
    try {
      const token = await auth.currentUser.getIdToken();
      headers['Authorization'] = `Bearer ${token}`;
    } catch (tokenErr) {
      console.warn("Failed to retrieve auth token:", tokenErr);
    }
  }

  try {
    const response = await fetch('/api/gemini/generate', {
      method: 'POST',
      headers,
      body: JSON.stringify({ action, args, config: configPayload }),
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

export async function evaluateIssueTree(issueTreeJson: string, coreProblem: string) {
  return callProxy('evaluateIssueTree', [issueTreeJson, coreProblem]);
}

export async function evaluateIntake(caseBrief: string, userCluesJson: string) {
  return callProxy('evaluateIntake', [caseBrief, userCluesJson]);
}

export async function evaluateFrameworks(proposedFrameworks: string, caseBrief: string, caseGlanceJson: string) {
  return callProxy('evaluateFrameworks', [proposedFrameworks, caseBrief, caseGlanceJson]);
}

export async function getFrameworkHint(caseBrief: string, caseGlanceJson: string, proposedFrameworks: string, hintsCount: number) {
  return callProxy('getFrameworkHint', [caseBrief, caseGlanceJson, proposedFrameworks, hintsCount]);
}

export async function generateCaseBrief(prompt: string) {
  return callProxy('generateCaseBrief', [prompt]);
}

export async function generateMockInterviewResponse(caseBrief: string, persona: string, focus: string, history: any[], userReply: string) {
  return callProxy('generateMockInterviewResponse', [caseBrief, persona, focus, JSON.stringify(history), userReply]);
}

export async function generateMockInterviewFeedback(caseBrief: string, persona: string, focus: string, history: any[]) {
  return callProxy('generateMockInterviewFeedback', [caseBrief, persona, focus, JSON.stringify(history)]);
}

export async function getMockInterviewHint(caseBrief: string, focus: string, history: any[]) {
  return callProxy('getMockInterviewHint', [caseBrief, focus, JSON.stringify(history)]);
}

export async function suggestSubIssues(parentIssue: string, caseBrief: string): Promise<string[]> {
  return callProxy('suggestSubIssues', [parentIssue, caseBrief]);
}


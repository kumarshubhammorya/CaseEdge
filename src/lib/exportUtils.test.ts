import { describe, it, expect, vi } from 'vitest';
import { generateMarkdownExport, exportSessionToPdf } from './exportUtils';
import { AppState } from '../types';

// Mock html2pdf.js
const mockSave = vi.fn().mockResolvedValue(undefined);
const mockFrom = vi.fn().mockReturnValue({ save: mockSave });
const mockSet = vi.fn().mockReturnValue({ from: mockFrom });
const mockHtml2Pdf = vi.fn().mockReturnValue({ set: mockSet });

vi.mock('html2pdf.js', () => {
  return {
    default: () => mockHtml2Pdf(),
  };
});

// Mock marked
vi.mock('marked', () => {
  return {
    marked: {
      parse: vi.fn().mockImplementation((md) => `Parsed: ${md}`),
    },
  };
});

const mockAppState: AppState = {
  caseBrief: "European profitability decline case study.",
  caseGlance: {
    industry: "Consumer Electronics",
    coreProblem: "Declining profitability in European market.",
    keyStakeholders: ["CEO", "Regional VP"],
    keyConstraints: ["Budget cap", "Timeframe of 3 months"],
    caseType: "Profitability",
    clarifyingQuestions: ["What are competitors doing?", "Has market demand shrunk?"]
  },
  hypothesis: " day-one hypothesis statement",
  issueTree: {
    id: "root",
    label: "Core Problem",
    children: [
      { id: "rev", label: "Revenue issues" },
      { id: "cost", label: "Cost issues" }
    ]
  },
  frameworks: [
    {
      name: "Profitability Framework",
      whyItFits: "This framework separates revenue and cost drivers.",
      diagnosticQuestions: ["What are price trends?", "What are fixed costs?"]
    }
  ],
  coreRecommendation: "Increase price and cut overhead.",
  expandedRecommendation: {
    situation: "Declining profits.",
    complication: "High fixed cost base.",
    resolution: "Consolidate overhead by 15%."
  },
  slideOutline: [
    {
      title: "Executive Summary",
      purpose: "Provide overview.",
      bullets: ["Profit is down", "Recommend overhead cut", "Next steps"]
    }
  ],
  storyHook: "Imagine waking up to a 10% drop in margin...",
  quantificationPrompt: "Compute TAM",
  quantitativeEstimate: {
    tam: { value: "$5B", assumption: "Industry reports" },
    revenueImpact: { value: "+$10M", assumption: "1% market capture" },
    implementationCost: { value: "$1M", assumption: "Consulting fees" },
    paybackPeriod: { value: "1 year", assumption: "ROI analysis" },
    keyMetric: { value: "Operating Margin", assumption: "Financial statements" }
  },
  jargonAudience: "Executive Committee",
  calibratedRecommendation: "Deploy efficiency optimization mechanisms...",
  qas: [
    { question: "What is the biggest risk?", modelAnswer: "Overhead cuts reduce morale.", status: "got-it" }
  ],
  activeFrameworks: [
    {
      name: "Profitability Framework",
      whyItFits: "This framework separates revenue and cost drivers.",
      diagnosticQuestions: ["What are price trends?", "What are fixed costs?"]
    }
  ],
  assumptions: [
    {
      id: "a1",
      statement: "Customers will tolerate the change.",
      category: "Market",
      riskLevel: "Medium",
      whatBreaksThis: "Competitors launch lower pricing."
    }
  ]
};

describe('exportUtils', () => {
  describe('generateMarkdownExport', () => {
    it('generates markdown containing all sections of appState', () => {
      const markdown = generateMarkdownExport(mockAppState);
      
      expect(markdown).toContain('# CaseEdge Session Export');
      expect(markdown).toContain('## Case Brief');
      expect(markdown).toContain('European profitability decline case study.');
      expect(markdown).toContain('## Case at a Glance');
      expect(markdown).toContain('Consumer Electronics');
      expect(markdown).toContain('## Issue Tree');
      expect(markdown).toContain('- Revenue issues');
      expect(markdown).toContain('## Recommended Frameworks');
      expect(markdown).toContain('Profitability Framework');
      expect(markdown).toContain('## Recommendation (SCR)');
      expect(markdown).toContain('**Situation:** Declining profits.');
      expect(markdown).toContain('## Assumption Tracker');
      expect(markdown).toContain('Customers will tolerate the change.');
      expect(markdown).toContain('## 60-Second Hook');
      expect(markdown).toContain('Imagine waking up to a 10% drop in margin...');
      expect(markdown).toContain('## 7-Slide Deck Outline');
      expect(markdown).toContain('Executive Summary');
      expect(markdown).toContain('## Quantitative Estimate');
      expect(markdown).toContain('**TAM/SAM:** $5B (Industry reports)');
      expect(markdown).toContain('## Calibrated Recommendation (Executive Committee)');
      expect(markdown).toContain('Deploy efficiency optimization mechanisms...');
      expect(markdown).toContain('## Judge Q&A');
      expect(markdown).toContain('What is the biggest risk?');
    });
  });

  describe('exportSessionToPdf', () => {
    it('parses markdown and calls html2pdf chain to download file', async () => {
      // Mock global document calls
      const originalCreateElement = document.createElement;
      const mockElement = {
        innerHTML: '',
      };
      
      document.createElement = vi.fn().mockImplementation((tagName) => {
        if (tagName === 'div') {
          return mockElement;
        }
        return originalCreateElement.call(document, tagName);
      }) as any;

      mockSave.mockClear();
      mockFrom.mockClear();
      mockSet.mockClear();
      mockHtml2Pdf.mockClear();

      await exportSessionToPdf(mockAppState);

      expect(document.createElement).toHaveBeenCalledWith('div');
      expect(mockElement.innerHTML).toContain('Parsed:');
      expect(mockElement.innerHTML).toContain('pdf-container');
      expect(mockHtml2Pdf).toHaveBeenCalled();
      expect(mockSet).toHaveBeenCalled();
      expect(mockFrom).toHaveBeenCalledWith(mockElement);
      expect(mockSave).toHaveBeenCalled();

      // Restore document
      document.createElement = originalCreateElement;
    });
  });
});

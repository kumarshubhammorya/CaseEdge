export type CaseGlance = {
  industry: string;
  coreProblem: string;
  keyStakeholders: string[];
  keyConstraints: string[];
  clarifyingQuestions?: string[];
  caseType: string;
};

export type Framework = {
  name: string;
  whyItFits: string;
  diagnosticQuestions: string[];
};

export type SCRStructure = {
  situation: string;
  complication: string;
  resolution: string;
};

export type QA = {
  question: string;
  modelAnswer: string;
  status?: 'got-it' | 'need-practice';
};

export type IssueTreeNode = {
  id: string;
  label: string;
  children?: IssueTreeNode[];
};

export type QuantitativeEstimate = {
  tam: { value: string; assumption: string };
  revenueImpact: { value: string; assumption: string };
  implementationCost: { value: string; assumption: string };
  paybackPeriod: { value: string; assumption: string };
  keyMetric: { value: string; assumption: string };
};

export type SlideInfo = {
  title: string;
  purpose: string;
  bullets: string[];
};

export type Assumption = {
  id: string;
  statement: string;
  category: 'Market' | 'Financial' | 'Operational' | 'Regulatory';
  riskLevel: 'High' | 'Medium' | 'Low';
  whatBreaksThis: string;
};

export type AppState = {
  caseBrief: string;
  caseGlance: CaseGlance | null;
  hypothesis: string;
  issueTree: IssueTreeNode | null;
  frameworks: Framework[] | null;
  coreRecommendation: string;
  expandedRecommendation: SCRStructure | null;
  slideOutline: SlideInfo[] | null;
  storyHook: string | null;
  quantificationPrompt: string;
  quantitativeEstimate: QuantitativeEstimate | null;
  jargonAudience: string;
  calibratedRecommendation: string | null;
  qas: QA[] | null;
  activeFrameworks: Framework[];
  assumptions: Assumption[] | null;
};

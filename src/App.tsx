import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Timer } from './components/Timer';
import { TeamSection } from './components/TeamSection';
import { IntakeSection } from './components/IntakeSection';
import { IssueTreeSection } from './components/IssueTreeSection';
import { FrameworksSection } from './components/FrameworksSection';
import { DrafterSection } from './components/DrafterSection';
import { QASection } from './components/QASection';
import { useLocalStorage } from './hooks/useLocalStorage';
import { AppState, IssueTreeNode } from './types';

const INITIAL_STATE: AppState = {
  teamRoles: {
    caseLead: "",
    dataNumbers: "",
    slideStory: "",
    devilsAdvocate: ""
  },
  caseBrief: "",
  caseGlance: null,
  issueTree: null,
  frameworks: null,
  coreRecommendation: "",
  expandedRecommendation: null,
  storyHook: null,
  quantificationPrompt: "",
  quantitativeEstimate: null,
  jargonAudience: "Consulting Judges",
  calibratedRecommendation: null,
  qas: null,
  activeFrameworks: []
};

export default function App() {
  const [activeSection, setActiveSection] = useState('team');
  const [appState, setAppState] = useLocalStorage<AppState>('caseedge-state', INITIAL_STATE);

  const handleExport = () => {
    let md = `# CaseEdge Session Export\n\n`;
    
    if (appState.caseBrief) {
      md += `## Case Brief\n${appState.caseBrief}\n\n`;
    }
    
    if (appState.caseGlance) {
      md += `## Case at a Glance\n`;
      md += `- **Industry:** ${appState.caseGlance.industry}\n`;
      md += `- **Type:** ${appState.caseGlance.caseType}\n`;
      md += `- **Problem:** ${appState.caseGlance.coreProblem}\n`;
      md += `- **Stakeholders:** ${appState.caseGlance.keyStakeholders.join(', ')}\n`;
      md += `- **Constraints:** ${appState.caseGlance.keyConstraints.join(', ')}\n\n`;
    }

    if (appState.issueTree) {
      md += `## Issue Tree\n`;
      const renderNode = (node: IssueTreeNode, level: number) => {
        const indent = '  '.repeat(level);
        md += `${indent}- ${node.label}\n`;
        if (node.children) {
          node.children.forEach(child => renderNode(child, level + 1));
        }
      };
      renderNode(appState.issueTree, 0);
      md += `\n`;
    }

    if (appState.frameworks) {
      md += `## Recommended Frameworks\n`;
      appState.frameworks.forEach(fw => {
        md += `### ${fw.name}\n`;
        md += `*${fw.whyItFits}*\n`;
        fw.diagnosticQuestions.forEach(q => {
          md += `- ${q}\n`;
        });
        md += `\n`;
      });
    }

    if (appState.expandedRecommendation) {
      md += `## Recommendation (SCR)\n`;
      md += `**Situation:** ${appState.expandedRecommendation.situation}\n\n`;
      md += `**Complication:** ${appState.expandedRecommendation.complication}\n\n`;
      md += `**Resolution:** ${appState.expandedRecommendation.resolution}\n\n`;
    }

    if (appState.storyHook) {
      md += `## 60-Second Hook\n`;
      md += `_${appState.storyHook}_\n\n`;
    }

    if (appState.quantitativeEstimate) {
      md += `## Quantitative Estimate\n`;
      const qe = appState.quantitativeEstimate;
      md += `- **TAM/SAM:** ${qe.tam.value} (${qe.tam.assumption})\n`;
      md += `- **Revenue Impact:** ${qe.revenueImpact.value} (${qe.revenueImpact.assumption})\n`;
      md += `- **Implementation Cost:** ${qe.implementationCost.value} (${qe.implementationCost.assumption})\n`;
      md += `- **Payback Period:** ${qe.paybackPeriod.value} (${qe.paybackPeriod.assumption})\n`;
      md += `- **Key Metric:** ${qe.keyMetric.value} (${qe.keyMetric.assumption})\n\n`;
    }

    if (appState.calibratedRecommendation) {
      md += `## Calibrated Recommendation (${appState.jargonAudience})\n`;
      md += `${appState.calibratedRecommendation}\n\n`;
    }

    if (appState.qas) {
      md += `## Judge Q&A\n`;
      appState.qas.forEach((qa, idx) => {
        md += `**Q${idx + 1}: ${qa.question}**\n`;
        md += `*Model Answer:* ${qa.modelAnswer}\n\n`;
      });
    }

    navigator.clipboard.writeText(md)
      .then(() => alert("Session exported to clipboard as Markdown!"))
      .catch(err => console.error("Export failed", err));
  };

  return (
    <div className="bg-[#0f172a] text-slate-200 font-sans h-screen overflow-hidden flex flex-col">
      <Timer onExport={handleExport} />
      
      <div className="flex flex-1 min-h-0">
        <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} appState={appState} />
        
        <main className="flex-1 overflow-y-auto bg-slate-800/10 min-h-0 flex flex-col">
          <div className="w-full max-w-5xl mx-auto py-8 px-6 lg:px-8 flex-1 flex flex-col min-h-0">
            {activeSection === 'team' && <TeamSection appState={appState} setAppState={setAppState} />}
            {activeSection === 'intake' && <IntakeSection appState={appState} setAppState={setAppState} />}
            {activeSection === 'issueTree' && <IssueTreeSection appState={appState} setAppState={setAppState} />}
            {activeSection === 'frameworks' && <FrameworksSection appState={appState} setAppState={setAppState} />}
            {activeSection === 'drafter' && <DrafterSection appState={appState} setAppState={setAppState} />}
            {activeSection === 'qa' && <QASection appState={appState} setAppState={setAppState} />}
          </div>
        </main>
      </div>

      <footer className="h-8 border-t border-slate-800 bg-slate-900 flex items-center px-6 justify-between shrink-0 font-mono text-[9px] text-slate-500">
        <div className="flex gap-6">
          <span>SESSION_ID: CSR_{Math.random().toString(36).substring(7).toUpperCase()}</span>
          <span>DATA_SAVED: LOCAL_STORAGE</span>
        </div>
        <div className="flex gap-6">
          <span className="text-blue-500">● GEMINI_ONLINE</span>
          <span>LATENCY: &lt;1s</span>
        </div>
      </footer>
    </div>
  );
}

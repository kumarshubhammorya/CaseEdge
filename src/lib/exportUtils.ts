import html2pdf from 'html2pdf.js';
import { marked } from 'marked';
import { AppState, IssueTreeNode } from "../types";

export const getPdfStyles = () => {
  return `
    <style>
      .pdf-container {
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
        color: #1e293b;
        line-height: 1.6;
        font-size: 14px;
      }
      .pdf-container h1 { 
        font-size: 28px; 
        font-weight: 800; 
        color: #0f172a;
        margin-bottom: 32px; 
        padding-bottom: 12px;
        border-bottom: 3px solid #0ea5e9;
        text-align: center;
      }
      .pdf-container h2 { 
        font-size: 18px; 
        font-weight: 700; 
        color: #ffffff;
        background-color: #0ea5e9;
        padding: 8px 16px;
        margin-top: 36px;
        margin-bottom: 16px; 
        border-radius: 6px;
        page-break-after: avoid;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .pdf-container h3 { 
        font-size: 16px; 
        font-weight: 700; 
        color: #0f172a;
        margin-top: 24px;
        margin-bottom: 12px;
        border-bottom: 1px solid #e2e8f0;
        padding-bottom: 6px;
        page-break-after: avoid;
      }
      .pdf-container p { margin-bottom: 14px; color: #334155; }
      .pdf-container ul { list-style-type: disc; padding-left: 28px; margin-bottom: 16px; }
      .pdf-container ol { list-style-type: decimal; padding-left: 28px; margin-bottom: 16px; }
      .pdf-container li { margin-bottom: 8px; color: #334155; }
      .pdf-container li::marker { color: #0ea5e9; }
      .pdf-container strong { font-weight: 700; color: #0f172a; }
      .pdf-container em { font-style: italic; color: #64748b; }
      .pdf-container blockquote {
        border-left: 4px solid #0ea5e9;
        background-color: #f0f9ff;
        padding: 16px 20px;
        margin: 0 0 16px 0;
        border-radius: 0 6px 6px 0;
      }
      .pdf-container hr {
        border: 0;
        height: 1px;
        background: #e2e8f0;
        margin: 32px 0;
      }
    </style>
  `;
};

export const generateMarkdownExport = (appState: AppState): string => {
  let md = `# CaseEdge Session Export\n\n`;

  if (appState.caseBrief) {
    md += `## Case Brief\n${appState.caseBrief}\n\n`;
  }

  if (appState.caseGlance) {
    md += `## Case at a Glance\n`;
    md += `- **Industry:** ${appState.caseGlance.industry}\n`;
    md += `- **Type:** ${appState.caseGlance.caseType}\n`;
    md += `- **Problem:** ${appState.caseGlance.coreProblem}\n`;
    md += `- **Stakeholders:** ${appState.caseGlance.keyStakeholders.join(", ")}\n`;
    md += `- **Constraints:** ${appState.caseGlance.keyConstraints.join(", ")}\n\n`;
  }

  if (appState.issueTree) {
    md += `## Issue Tree\n`;
    const renderNode = (node: IssueTreeNode, level: number) => {
      const indent = "  ".repeat(level);
      md += `${indent}- ${node.label}\n`;
      if (node.children) {
        node.children.forEach((child) => renderNode(child, level + 1));
      }
    };
    renderNode(appState.issueTree, 0);
    md += `\n`;
  }

  const frameworksToExport = appState.activeFrameworks?.length > 0 
    ? appState.activeFrameworks 
    : appState.frameworks;

  if (frameworksToExport && frameworksToExport.length > 0) {
    md += `## Recommended Frameworks\n`;
    frameworksToExport.forEach((fw) => {
      md += `### ${fw.name}\n`;
      md += `*${fw.whyItFits}*\n`;
      fw.diagnosticQuestions.forEach((q) => {
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

  if (appState.assumptions && appState.assumptions.length > 0) {
    md += `## Assumption Tracker\n`;
    appState.assumptions.forEach((a) => {
      md += `### ${a.statement}\n`;
      md += `- **Category:** ${a.category}\n`;
      md += `- **Risk Level:** ${a.riskLevel}\n`;
      md += `- **What breaks this:** ${a.whatBreaksThis}\n\n`;
    });
  }

  if (appState.storyHook) {
    md += `## 60-Second Hook\n`;
    md += `_${appState.storyHook}_\n\n`;
  }

  if (appState.slideOutline) {
    md += `## 7-Slide Deck Outline\n`;
    appState.slideOutline.forEach((slide, idx) => {
      md += `### ${idx + 1}. ${slide.title}\n`;
      md += `*Purpose: ${slide.purpose}*\n`;
      slide.bullets.forEach((b) => {
        md += `- ${b}\n`;
      });
      md += `\n`;
    });
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

  return md;
};

export const exportSessionToPdf = async (appState: AppState) => {
  const md = generateMarkdownExport(appState);
  const htmlContent = await marked.parse(md);
  const container = document.createElement('div');
  
  const style = getPdfStyles();
  container.innerHTML = style + '<div class="pdf-container">' + (htmlContent as string) + '</div>';
  
  const opt = {
    margin:       [15, 15, 15, 15] as [number, number, number, number],
    filename:     'CaseEdge_Session.pdf',
    image:        { type: 'jpeg' as const, quality: 0.98 },
    html2canvas:  { scale: 2 },
    jsPDF:        { unit: 'mm', format: 'letter', orientation: 'portrait' as const }
  };

  await html2pdf().set(opt).from(container).save();
};

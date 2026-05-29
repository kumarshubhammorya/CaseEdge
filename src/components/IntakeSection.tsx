import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { 
  analyzeCase, 
  generateHypothesis, 
  extractCaseFromFile, 
  extractCaseFromText,
  evaluateIntake
} from '../services/geminiService';
import { extractTextFromPdf } from '../lib/pdfUtils';
import { CaseGlance, UserClue } from '../types';
import { CyclingLoadingText, Tooltip } from './MicroInteractions';
import { sounds } from '../lib/sounds';
import { 
  BarChart, 
  ExternalLink, 
  MousePointer, 
  Trash2, 
  X,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { CLASSIC_CASES } from './intake/ClassicCases';
import { IntakeUploader } from './intake/IntakeUploader';
import { IntakeCoachPanel } from './intake/IntakeCoachPanel';
import { CaseGlanceView } from './intake/CaseGlanceView';
import { useAppContext } from '../context/AppContext';

export const formatInlineMarkdown = (text: string): string => {
  if (!text) return "";
  let formatted = text;
  // Bold (**text** or __text__)
  formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-slate-200">$1</strong>');
  formatted = formatted.replace(/__([^_]+)__/g, '<strong class="font-bold text-slate-200">$1</strong>');
  // Italics (*text* or _text_)
  formatted = formatted.replace(/\*([^*]+)\*/g, '<em class="italic text-slate-300">$1</em>');
  formatted = formatted.replace(/_([^_]+)_/g, '<em class="italic text-slate-300">$1</em>');
  return formatted;
};

export const renderHtmlTable = (rows: string[]) => {
  const actualRows = rows.filter(r => !r.includes('---') && r.trim().length > 0);
  if (actualRows.length === 0) return "";
  
  let html = `<div class="overflow-x-auto my-3 border border-slate-800 rounded-xl bg-slate-950/20"><table class="w-full text-left text-xs font-sans border-collapse">`;
  
  actualRows.forEach((row, index) => {
    const cells = row.split('|').map(c => c.trim());
    if (cells.length > 0 && cells[0] === "") cells.shift();
    if (cells.length > 0 && cells[cells.length - 1] === "") cells.pop();

    const tag = index === 0 ? 'th' : 'td';
    const rowClass = index === 0 
      ? 'bg-slate-900/60 text-slate-400 font-bold border-b border-slate-800' 
      : 'border-b border-slate-850 text-slate-355 hover:bg-slate-900/10 transition-colors';
      
    html += `<tr class="${rowClass}">`;
    cells.forEach(cell => {
      html += `<${tag} class="py-2 px-3">${formatInlineMarkdown(cell)}</${tag}>`;
    });
    html += `</tr>`;
  });
  
  html += `</table></div>`;
  return html;
};

export const convertMarkdownToHtml = (markdown: string) => {
  if (!markdown) return "";
  
  const lines = markdown.split('\n');
  let inTable = false;
  let tableRows: string[] = [];
  const processedLines: string[] = [];
  
  for (let line of lines) {
    const trimmed = line.trim();
    
    // 1. Detect and parse table lines
    if (trimmed.includes('|')) {
      inTable = true;
      tableRows.push(line);
      continue;
    } else if (inTable) {
      processedLines.push(renderHtmlTable(tableRows));
      tableRows = [];
      inTable = false;
    }
    
    // 2. Parse headers
    const headerMatch = line.match(/^\s*(#{1,6})\s+(.*?)\s*#*$/);
    if (headerMatch) {
      const level = headerMatch[1].length;
      const text = formatInlineMarkdown(headerMatch[2]);
      const headerClasses: Record<number, string> = {
        1: 'text-base font-extrabold text-white mt-4 mb-2 font-heading tracking-tight block border-b border-slate-850 pb-1',
        2: 'text-xs font-bold text-cyan-400 mt-4 mb-2 font-heading uppercase tracking-wider block',
        3: 'text-[11px] font-bold text-slate-200 mt-3 mb-1 uppercase tracking-wide block'
      };
      const cls = headerClasses[level] || 'font-bold text-slate-200 block';
      processedLines.push(`<span class="${cls}">${text}</span>`);
      continue;
    }
    
    // 3. Parse unordered lists
    const listMatch = line.match(/^\s*(\*|-|\+)\s+(.*)$/);
    if (listMatch) {
      const indent = line.match(/^\s*/)?.[0].length || 0;
      const plClass = indent >= 4 ? 'pl-6' : indent >= 2 ? 'pl-4' : 'pl-2';
      const text = formatInlineMarkdown(listMatch[2]);
      processedLines.push(`<span class="flex items-start gap-2 ${plClass} my-1 text-slate-350 leading-relaxed font-sans text-xs"><span>•</span><span>${text}</span></span>`);
      continue;
    }

    // 4. Parse ordered lists
    const orderedListMatch = line.match(/^\s*(\d+)\.\s+(.*)$/);
    if (orderedListMatch) {
      const indent = line.match(/^\s*/)?.[0].length || 0;
      const plClass = indent >= 4 ? 'pl-6' : indent >= 2 ? 'pl-4' : 'pl-2';
      const num = orderedListMatch[1];
      const text = formatInlineMarkdown(orderedListMatch[2]);
      processedLines.push(`<span class="flex items-start gap-2 ${plClass} my-1 text-slate-350 leading-relaxed font-sans text-xs"><span class="font-mono text-[10px] text-slate-500 min-w-[12px] text-right">${num}.</span><span>${text}</span></span>`);
      continue;
    }
    
    // 5. Default paragraph line
    processedLines.push(formatInlineMarkdown(line));
  }
  
  if (inTable && tableRows.length > 0) {
    processedLines.push(renderHtmlTable(tableRows));
  }
  
  return processedLines.join('\n');
};

export function getHighlightedCaseHtml(caseBrief: string, userClues: UserClue[] = []) {
  if (!caseBrief) return "";
  let htmlContent = convertMarkdownToHtml(caseBrief);
  
  // Sort clues by text length descending so longer matching spans wrap shorter ones correctly
  const sortedClues = [...(userClues || [])].sort((a, b) => b.text.length - a.text.length);
  
  sortedClues.forEach((clue) => {
    const categoryColors: Record<string, string> = {
      objective: 'bg-blue-500/20 text-blue-300 border-blue-500/50',
      constraint: 'bg-red-500/20 text-red-300 border-red-500/50',
      stakeholder: 'bg-green-500/20 text-green-300 border-green-500/50',
      metric: 'bg-amber-500/20 text-amber-300 border-amber-500/50'
    };
    const colorClass = categoryColors[clue.category] || 'bg-slate-700 text-slate-200';
    
    // Safe replacement: split by HTML tags, search only in text nodes
    const parts = htmlContent.split(/(<[^>]+>)/g);
    for (let i = 0; i < parts.length; i++) {
      if (!parts[i].startsWith('<')) {
        // Strip any raw markdown styling characters from the clue text
        const cleanClue = clue.text.replace(/[\*#_~|`]/g, '').trim();
        if (cleanClue.length >= 2) {
          const escapedClue = cleanClue.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
          const regex = new RegExp(`(${escapedClue})`, 'g');
          parts[i] = parts[i].replace(regex, `<span class="px-1.5 py-0.5 rounded border ${colorClass} font-semibold transition-all select-none">$1</span>`);
        }
      }
    }
    htmlContent = parts.join('');
  });

  return htmlContent;
}

type Props = {
  onNext?: () => void;
  onGoToLibrary?: () => void;
};

export const IntakeSection: React.FC<Props> = ({ onNext, onGoToLibrary }) => {
  const { appState, setAppState } = useAppContext();
  const [showBiEdgeBanner, setShowBiEdgeBanner] = useState(() => {
    return localStorage.getItem('hide-biedge-banner') !== 'true';
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isGeneratingHypothesis, setIsGeneratingHypothesis] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<{ hypothesis: string, reasoning: string } | null>(null);

  const [highlightMode, setHighlightMode] = useState(false);
  const [selectionCoords, setSelectionCoords] = useState<{ top: number; left: number; text: string } | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // Toggle highlight mode automatically if case brief contains text
  useEffect(() => {
    if (appState.caseBrief && appState.caseBrief.trim().length > 0) {
      setHighlightMode(true);
    } else {
      setHighlightMode(false);
    }
  }, [appState.caseBrief]);

  // Listen for keydown when a highlight selection is active
  useEffect(() => {
    if (!selectionCoords) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }
      
      const key = e.key.toLowerCase();
      if (key === 'o') {
        e.preventDefault();
        addHighlightClue('objective');
      } else if (key === 'c') {
        e.preventDefault();
        addHighlightClue('constraint');
      } else if (key === 's') {
        e.preventDefault();
        addHighlightClue('stakeholder');
      } else if (key === 'm') {
        e.preventDefault();
        addHighlightClue('metric');
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setSelectionCoords(null);
        window.getSelection()?.removeAllRanges();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectionCoords]);

  const handleGenerateHypothesis = async () => {
    if ((appState.tokens ?? 0) < 5) {
      sounds.playError();
      toast.error("Insufficient credits! You need at least 5 ⚡ to get an AI hypothesis suggestion.");
      return;
    }
    sounds.playClick();
    setIsGeneratingHypothesis(true);
    try {
      const result = await generateHypothesis(appState.caseBrief, appState.caseGlance?.coreProblem);
      setAiSuggestion(result);
      setAppState(prev => ({ ...prev, tokens: Math.max(0, (prev.tokens ?? 50) - 5) }));
      toast.success("Hypothesis generated! (-5 ⚡)");
    } catch (err: any) {
      sounds.playError();
      toast.error("Failed to generate hypothesis: " + (err?.message || "Unknown error"));
    } finally {
      setIsGeneratingHypothesis(false);
    }
  };

  const handleAdoptHypothesis = () => {
    sounds.playAdd();
    if (aiSuggestion) {
      setAppState(prev => ({ ...prev, hypothesis: aiSuggestion.hypothesis }));
      setAiSuggestion(null);
    }
  };

  const doAnalyze = async (textToAnalyze: string) => {
    setIsAnalyzing(true);
    try {
      const result = await analyzeCase(textToAnalyze);
      setAppState(prev => ({ ...prev, caseGlance: result }));
      sounds.playSuccess();
      toast.success("Case analyzed successfully!");
    } catch (err: any) {
      sounds.playError();
      toast.error("Analysis failed: " + (err?.message || "Please check your connectivity."));
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const processFile = async (file: File) => {
    setIsUploading(true);
    
    try {
      if (file.type === "application/pdf") {
        try {
          const pdfText = await extractTextFromPdf(file);
          if (!pdfText.trim()) throw new Error("No text found in PDF. It might be a scanned image.");
          const result = await extractCaseFromText(pdfText);
          setAppState(prev => ({ 
            ...prev, 
            caseBrief: result.extractedText,
            caseGlance: null,
            userClues: [],
            intakeFeedback: null
          }));
          setIsUploading(false);
          sounds.playSuccess();
          toast.success("PDF loaded! Highlight key clues to begin active reading.");
          return;
        } catch (err: any) {
          console.warn("Failed local PDF parsing, trying vision API...", err);
        }
      }

      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Data = (e.target?.result as string).split(',')[1];
        const mimeType = file.type;
        
        try {
           const result = await extractCaseFromFile(base64Data, mimeType);
           setAppState(prev => ({ 
             ...prev, 
             caseBrief: result.extractedText,
             caseGlance: null,
             userClues: [],
             intakeFeedback: null
           }));
           sounds.playSuccess();
           toast.success("File processed! Highlight key clues to begin active reading.");
        } catch (err: any) {
           sounds.playError();
           toast.error("Failed to parse file: " + (err?.message || "Unknown error"));
        } finally {
           setIsUploading(false);
        }
      };
      reader.onerror = () => {
        toast.error("Failed to read file.");
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      toast.error("Failed to process file.");
      setIsUploading(false);
    }
  };

  const handleAnalyze = async () => {
    sounds.playClick();
    if (!appState.caseBrief.trim()) {
      toast.error("Please paste a case brief first.");
      return;
    }
    
    // Bypass costs 10 tokens only if they haven't done the highlight audit
    const isBypass = !appState.caseGlance && !appState.intakeFeedback;
    if (isBypass) {
      if ((appState.tokens ?? 0) < 10) {
        sounds.playError();
        toast.error("Insufficient tokens! Earn tokens by completing active reading highlights or socratic tasks.");
        return;
      }
      
      // Deduct 10 tokens
      setAppState(prev => ({ ...prev, tokens: Math.max(0, (prev.tokens ?? 50) - 10) }));
    }
    
    await doAnalyze(appState.caseBrief);
  };

  const updateGlance = (field: keyof CaseGlance, value: any) => {
    if (!appState.caseGlance) return;
    setAppState(prev => ({
      ...prev,
      caseGlance: { ...prev.caseGlance!, [field]: value }
    }));
  };

  const handleTextSelection = () => {
    if (appState.caseGlance) return;
    const selection = window.getSelection();
    if (!selection) return;
    const selectedText = selection.toString().trim();
    
    if (selectedText.length > 2) {
      try {
        // Find the exact matching substring in appState.caseBrief ignoring whitespace/newline discrepancies
        const words = selectedText.split(/\s+/).filter(Boolean);
        if (words.length === 0) return;
        
        // Escape regex characters in each word
        const regexPattern = words.map(w => w.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')).join('[\\s\\*#|]+');
        const matchRegex = new RegExp(regexPattern);
        const match = appState.caseBrief.match(matchRegex);
        
        if (match) {
          const exactCaseText = match[0];
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          const container = containerRef.current;
          if (container) {
            const containerRect = container.getBoundingClientRect();
            
            // Calculate top position
            // Tooltip height is ~38px. We want 8px spacing.
            const tooltipHeight = 38;
            const spacing = 8;
            let top = rect.top - containerRect.top - tooltipHeight - spacing + container.scrollTop;
            
            // If the tooltip would go above the container's visible area, place it below the selection
            if (top < container.scrollTop + 5) {
              top = rect.bottom - containerRect.top + spacing + container.scrollTop;
            }
            
            // Calculate left position (approx tooltip width is 320px on desktop, 220px on mobile)
            const isMobile = window.innerWidth < 640;
            const tooltipWidth = isMobile ? 220 : 320;
            let left = rect.left - containerRect.left + (rect.width / 2) - (tooltipWidth / 2);
            
            // Clamp left position to stay within container bounds
            left = Math.max(10, Math.min(containerRect.width - tooltipWidth - 10, left));
            
            setSelectionCoords({
              top,
              left,
              text: exactCaseText // Use the EXACT string from appState.caseBrief to ensure regex matches later
            });
          }
        } else {
          setSelectionCoords(null);
        }
      } catch (err) {
        console.warn("Selection placement error", err);
      }
    } else {
      setSelectionCoords(null);
    }
  };

  const addHighlightClue = (category: 'objective' | 'constraint' | 'stakeholder' | 'metric') => {
    if (!selectionCoords) return;
    sounds.playAdd();
    const newClue: UserClue = {
      text: selectionCoords.text,
      category
    };

    // Prevent duplicates
    const clues = appState.userClues || [];
    if (clues.some(c => c.text === newClue.text && c.category === category)) {
      toast.info("This clue is already tagged under this category.");
      setSelectionCoords(null);
      window.getSelection()?.removeAllRanges();
      return;
    }

    setAppState(prev => ({
      ...prev,
      userClues: [...(prev.userClues || []), newClue],
      intakeFeedback: null // Reset audit feedback on edit
    }));

    toast.success(`Tagged clue as ${category}`);
    setSelectionCoords(null);
    window.getSelection()?.removeAllRanges();
  };

  const removeClue = (index: number) => {
    sounds.playRemove();
    setAppState(prev => ({
      ...prev,
      userClues: (prev.userClues || []).filter((_, idx) => idx !== index),
      intakeFeedback: null
    }));
    toast.info("Clue tag removed");
  };

  const handleAuditClues = async () => {
    sounds.playClick();
    const clues = appState.userClues || [];
    if (clues.length === 0) {
      toast.error("Please highlight and tag some clues first!");
      return;
    }
    setIsAuditing(true);
    try {
      // 1. Run evaluation only
      const auditResult = await evaluateIntake(appState.caseBrief, JSON.stringify(clues));
      
      // Calculate token reward based on comprehension score
      const reward = (auditResult.score ?? 0) >= 80 ? 5 : 2;
      
      setAppState(prev => ({ 
        ...prev, 
        intakeFeedback: auditResult,
        tokens: (prev.tokens ?? 50) + reward
      }));
      
      sounds.playSuccess();
      toast.success(`Case intake checked! Earned +${reward} tokens.`);
    } catch (err: any) {
      sounds.playError();
      toast.error("Audit failed: " + (err?.message || ""));
    } finally {
      setIsAuditing(false);
    }
  };

  const renderHighlightedText = () => {
    if (!appState.caseBrief) return null;
    const htmlContent = getHighlightedCaseHtml(appState.caseBrief, appState.userClues);
    
    return (
      <div 
        dangerouslySetInnerHTML={{ __html: htmlContent }} 
        className="whitespace-pre-wrap leading-relaxed text-slate-355 text-xs select-text selection:bg-cyan-500/30 selection:text-white font-sans"
        onMouseUp={handleTextSelection}
        onTouchEnd={handleTextSelection}
      />
    );
  };

  return (
    <section className="bg-[#0f172a] flex flex-col flex-1 min-h-0 border border-slate-800 animate-in fade-in slide-in-from-bottom-4 duration-500 rounded-lg overflow-hidden">
      <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-[#070b14]/50 shrink-0">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">
          {appState.caseGlance ? "Case Brief & Case at a Glance" : "Case Brief & Active Reading"}
        </h2>
        <div className="flex items-center gap-2">
          {isAnalyzing || isUploading || isAuditing ? (
            <>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] text-blue-400 font-medium uppercase min-w-[120px]">
                <CyclingLoadingText messages={[
                  'Scanning case structure...', 
                  'Checking clues selection...', 
                  'Identifying stakeholders...', 
                  'Classifying problem type...'
                ]} />
              </span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-[10px] text-slate-400 font-medium uppercase">Ready</span>
            </>
          )}
        </div>
      </div>
      
      <div className="p-6 space-y-6 flex-1 overflow-y-auto custom-scrollbar flex flex-col min-h-0">
        {/* Promotion Banner */}
        {showBiEdgeBanner && (
          <div className="bg-blue-950/20 border border-blue-500/20 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2 shrink-0 relative pr-10">
            <div className="flex items-start sm:items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded text-blue-400 shrink-0">
                <BarChart className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-blue-100 uppercase tracking-wide">Analyzing numerical data?</h4>
                <p className="text-xs text-blue-300/70 mt-0.5 leading-normal">Use BI Edge to instantly create dashboards and get AI insights from your datasets.</p>
              </div>
            </div>
            <a 
              href="https://biedge.shubhammaurya.online/#/app" 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-blue-600/90 hover:bg-blue-500 text-white rounded text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 shrink-0 shadow-lg shadow-blue-900/20 cursor-pointer mr-2 sm:mr-0"
            >
              Launch BI Edge
              <ExternalLink className="w-3 h-3" />
            </a>
            <button
              onClick={() => {
                sounds.playClick();
                setShowBiEdgeBanner(false);
                localStorage.setItem('hide-biedge-banner', 'true');
              }}
              className="absolute top-2 right-2 p-1 text-slate-500 hover:text-slate-350 hover:bg-slate-800/35 rounded transition-colors cursor-pointer"
              title="Dismiss promotion"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Upload Container */}
        {!appState.caseBrief && (
          <IntakeUploader
            isUploading={isUploading}
            caseBrief={appState.caseBrief}
            onCaseBriefChange={(val) => setAppState(prev => ({ ...prev, caseBrief: val, userClues: [], intakeFeedback: null }))}
            onClassicCaseSelect={(content) => setAppState(prev => ({ ...prev, caseBrief: content, userClues: [], intakeFeedback: null }))}
            onFileSelect={processFile}
            onGoToLibrary={onGoToLibrary}
          />
        )}

        {/* Case brief highlighting & editor panel */}
        {appState.caseBrief && (
          <div className="flex flex-col lg:flex-row gap-6 items-stretch flex-1 min-h-0">
            {/* Highlighter Panel */}
            <div className="flex-1 flex flex-col bg-slate-900/35 border border-slate-800 rounded-xl p-5 relative min-h-0 overflow-hidden">
              <div className="flex justify-between items-center mb-1 pb-1.5 border-b border-slate-800 shrink-0">
                <span className="text-xs text-slate-400 font-extrabold uppercase tracking-widest flex items-center gap-1.5">
                  {!appState.caseGlance && <MousePointer className="w-3.5 h-3.5 text-cyan-400" />}
                  {appState.caseGlance ? "Case Brief" : "Active Reading: Highlight Clues"}
                </span>
                <div className="flex items-center gap-4">
                  {!appState.caseGlance && (
                    <button
                      onClick={() => {
                        sounds.playClick();
                        setIsExpanded(!isExpanded);
                      }}
                      className="text-[10px] uppercase font-bold text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer flex items-center gap-1.5"
                      title={isExpanded ? "Collapse view" : "Expand to fullscreen"}
                    >
                      {isExpanded ? (
                        <>
                          <Minimize2 className="w-3.5 h-3.5" />
                          <span>Split View</span>
                        </>
                      ) : (
                        <>
                          <Maximize2 className="w-3.5 h-3.5" />
                          <span>Focus Mode</span>
                        </>
                      )}
                    </button>
                  )}
                  <button 
                    onClick={() => {
                      sounds.playClick();
                      setAppState(prev => ({ ...prev, caseBrief: "", userClues: [], intakeFeedback: null, caseGlance: null }));
                      setIsExpanded(false);
                    }}
                    className="text-[10px] uppercase font-bold text-red-500 hover:text-red-400 transition-colors cursor-pointer"
                  >
                    Clear Case
                  </button>
                </div>
              </div>
              {!appState.caseGlance && (
                <p className="text-[10px] text-slate-550 mb-2.5 leading-normal">
                  💡 Drag-select any word or sentence in the case brief below to tag it as an Objective, Constraint, Stakeholder, or Metric.
                </p>
              )}

              {/* Text highlighting container */}
              <div 
                ref={containerRef}
                className="flex-1 overflow-y-auto custom-scrollbar pr-2 mb-4 relative"
              >
                {renderHighlightedText()}

                {/* Floating tooltip tag selectors */}
                {selectionCoords && (
                  <div 
                    className="absolute bg-slate-950/95 border border-slate-700/80 p-1.5 rounded-lg shadow-2xl flex flex-row flex-nowrap items-center gap-1.5 z-50 animate-in zoom-in-95 duration-150 w-max max-w-sm backdrop-blur-md"
                    style={{ 
                      top: `${selectionCoords.top}px`, 
                      left: `${selectionCoords.left}px` 
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => addHighlightClue('objective')}
                      className="px-2 py-1 rounded bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white border border-blue-500/30 text-[10px] font-extrabold uppercase tracking-wide cursor-pointer whitespace-nowrap"
                    >
                      🎯 <span className="hidden sm:inline">Objective [O]</span><span className="sm:hidden">Obj</span>
                    </button>
                    <button
                      onClick={() => addHighlightClue('constraint')}
                      className="px-2 py-1 rounded bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white border border-red-500/30 text-[10px] font-extrabold uppercase tracking-wide cursor-pointer whitespace-nowrap"
                    >
                      ⚠️ <span className="hidden sm:inline">Constraint [C]</span><span className="sm:hidden">Con</span>
                    </button>
                    <button
                      onClick={() => addHighlightClue('stakeholder')}
                      className="px-2 py-1 rounded bg-green-600/20 text-green-400 hover:bg-green-600 hover:text-white border border-green-500/30 text-[10px] font-extrabold uppercase tracking-wide cursor-pointer whitespace-nowrap"
                    >
                      👥 <span className="hidden sm:inline">Stakeholder [S]</span><span className="sm:hidden">Stk</span>
                    </button>
                    <button
                      onClick={() => addHighlightClue('metric')}
                      className="px-2 py-1 rounded bg-amber-600/20 text-amber-400 hover:bg-amber-600 hover:text-white border border-amber-500/30 text-[10px] font-extrabold uppercase tracking-wide cursor-pointer whitespace-nowrap"
                    >
                      📊 <span className="hidden sm:inline">Metric [M]</span><span className="sm:hidden">Met</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Tag list summary */}
              {appState.userClues && appState.userClues.length > 0 && (
                <div className="shrink-0 pt-3 border-t border-slate-800">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block mb-2">
                    Tagged Clues ({appState.userClues.length})
                  </span>
                  <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto custom-scrollbar pr-1">
                    {appState.userClues.map((clue, idx) => {
                      const colorClass = 
                        clue.category === 'objective' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                        clue.category === 'constraint' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                        clue.category === 'stakeholder' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                        'bg-amber-500/10 text-amber-400 border-amber-500/20';
                      return (
                        <div key={idx} className={`text-[10px] px-2 py-0.5 rounded border flex items-center gap-1.5 max-w-xs truncate ${colorClass}`}>
                          <span className="truncate">{clue.text}</span>
                          <button 
                            onClick={() => removeClue(idx)}
                            className="text-slate-400 hover:text-red-400 transition-colors flex-shrink-0 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* AI Review Audit Panel */}
            {!appState.caseGlance && !isExpanded && (
              <IntakeCoachPanel
                isAuditing={isAuditing}
                isAnalyzing={isAnalyzing}
                isUploading={isUploading}
                userClues={appState.userClues || []}
                intakeFeedback={appState.intakeFeedback}
                caseGlance={appState.caseGlance}
                tokens={appState.tokens ?? 50}
                onAudit={handleAuditClues}
                onAnalyze={handleAnalyze}
              />
            )}
          </div>
        )}

        {/* Structured Case at a Glance preview */}
        {appState.caseGlance && (
          <CaseGlanceView
            caseGlance={appState.caseGlance}
            hypothesis={appState.hypothesis || ''}
            aiSuggestion={aiSuggestion}
            isGeneratingHypothesis={isGeneratingHypothesis}
            onUpdateGlance={updateGlance}
            onHypothesisChange={(val) => setAppState(prev => ({ ...prev, hypothesis: val }))}
            onGenerateHypothesis={handleGenerateHypothesis}
            onAdoptHypothesis={handleAdoptHypothesis}
            caseBrief={appState.caseBrief}
            tokens={appState.tokens ?? 50}
          />
        )}

        {/* Navigation Actions */}
        {appState.caseGlance && onNext && (
          <div className="flex justify-end pt-4 border-t border-slate-800 mt-6 shrink-0">
            <Tooltip content="Proceed to build an issue tree based on the extracted problem" position="top" className="inline-flex">
              <motion.button 
                onClick={() => {
                  sounds.playTransition();
                  if (onNext) onNext();
                }}
                whileHover={{ scale: 1.025 }}
                whileTap={{ scale: 0.975 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
                className="group bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:outline-none focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
              >
                Continue to Issue Tree
                <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </motion.button>
            </Tooltip>
          </div>
        )}
      </div>
    </section>
  );
};

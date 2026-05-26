import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
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
  X
} from 'lucide-react';
import { CLASSIC_CASES } from './intake/ClassicCases';
import { IntakeUploader } from './intake/IntakeUploader';
import { IntakeCoachPanel } from './intake/IntakeCoachPanel';
import { CaseGlanceView } from './intake/CaseGlanceView';
import { useAppContext } from '../context/AppContext';

type Props = {
  onNext?: () => void;
};

export const IntakeSection: React.FC<Props> = ({ onNext }) => {
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
    sounds.playClick();
    setIsGeneratingHypothesis(true);
    try {
      const result = await generateHypothesis(appState.caseBrief, appState.caseGlance?.coreProblem);
      setAiSuggestion(result);
      toast.success("Hypothesis generated!");
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
        const regexPattern = words.map(w => w.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')).join('\\s+');
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
            
            // Calculate left position (approx tooltip width is 320px)
            const tooltipWidth = 320;
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
    let content = appState.caseBrief;
    
    // Sort clues by text length descending so longer matching spans wrap shorter ones correctly
    const sortedClues = [...(appState.userClues || [])].sort((a, b) => b.text.length - a.text.length);
    
    const tempDiv = document.createElement('div');
    tempDiv.innerText = content;
    let escapedContent = tempDiv.innerHTML;
    
    sortedClues.forEach((clue) => {
      const categoryColors: Record<string, string> = {
        objective: 'bg-blue-500/20 text-blue-300 border-blue-500/50',
        constraint: 'bg-red-500/20 text-red-300 border-red-500/50',
        stakeholder: 'bg-green-500/20 text-green-300 border-green-500/50',
        metric: 'bg-amber-500/20 text-amber-300 border-amber-500/50'
      };
      const colorClass = categoryColors[clue.category] || 'bg-slate-700 text-slate-200';
      
      tempDiv.innerText = clue.text;
      const escapedClue = tempDiv.innerHTML;
      
      const escapedRegex = escapedClue.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(`(${escapedRegex})`, 'g');
      escapedContent = escapedContent.replace(regex, `<span class="px-1.5 py-0.5 rounded border ${colorClass} font-semibold transition-all select-none">${clue.text}</span>`);
    });
    
    return (
      <div 
        dangerouslySetInnerHTML={{ __html: escapedContent }} 
        className="whitespace-pre-wrap leading-relaxed text-slate-300 text-sm select-text selection:bg-cyan-500/30 selection:text-white"
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
                <p className="text-[11px] text-blue-300/70 mt-0.5 leading-normal">Use BI Edge to instantly create dashboards and get AI insights from your datasets.</p>
              </div>
            </div>
            <a 
              href="https://biedge.shubhammaurya.online/#/app" 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-blue-600/90 hover:bg-blue-500 text-white rounded text-[9px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 shrink-0 shadow-lg shadow-blue-900/20 cursor-pointer mr-2 sm:mr-0"
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
          />
        )}

        {/* Case brief highlighting & editor panel */}
        {appState.caseBrief && (
          <div className="flex flex-col lg:flex-row gap-6 items-stretch flex-1 min-h-0">
            {/* Highlighter Panel */}
            <div className="flex-1 flex flex-col bg-slate-900/35 border border-slate-800 rounded-xl p-5 relative min-h-0 overflow-hidden">
              <div className="flex justify-between items-center mb-3 pb-2.5 border-b border-slate-800 shrink-0">
                <span className="text-xs text-slate-400 font-extrabold uppercase tracking-widest flex items-center gap-1.5">
                  {!appState.caseGlance && <MousePointer className="w-3.5 h-3.5 text-cyan-400" />}
                  {appState.caseGlance ? "Case Brief" : "Active Reading: Highlight Clues"}
                </span>
                <button 
                  onClick={() => {
                    sounds.playClick();
                    setAppState(prev => ({ ...prev, caseBrief: "", userClues: [], intakeFeedback: null, caseGlance: null }));
                  }}
                  className="text-[9px] uppercase font-bold text-red-500 hover:text-red-400 transition-colors cursor-pointer"
                >
                  Clear Case
                </button>
              </div>

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
                      className="px-2 py-1 rounded bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white border border-blue-500/30 text-[9px] font-extrabold uppercase tracking-wide cursor-pointer whitespace-nowrap"
                    >
                      🎯 Objective [O]
                    </button>
                    <button
                      onClick={() => addHighlightClue('constraint')}
                      className="px-2 py-1 rounded bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white border border-red-500/30 text-[9px] font-extrabold uppercase tracking-wide cursor-pointer whitespace-nowrap"
                    >
                      ⚠️ Constraint [C]
                    </button>
                    <button
                      onClick={() => addHighlightClue('stakeholder')}
                      className="px-2 py-1 rounded bg-green-600/20 text-green-400 hover:bg-green-600 hover:text-white border border-green-500/30 text-[9px] font-extrabold uppercase tracking-wide cursor-pointer whitespace-nowrap"
                    >
                      👥 Stakeholder [S]
                    </button>
                    <button
                      onClick={() => addHighlightClue('metric')}
                      className="px-2 py-1 rounded bg-amber-600/20 text-amber-400 hover:bg-amber-600 hover:text-white border border-amber-500/30 text-[9px] font-extrabold uppercase tracking-wide cursor-pointer whitespace-nowrap"
                    >
                      📊 Metric [M]
                    </button>
                  </div>
                )}
              </div>

              {/* Tag list summary */}
              {appState.userClues && appState.userClues.length > 0 && (
                <div className="shrink-0 pt-3 border-t border-slate-800">
                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block mb-2">
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
            {!appState.caseGlance && (
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
          />
        )}

        {/* Navigation Actions */}
        {appState.caseGlance && onNext && (
          <div className="flex justify-end pt-4 border-t border-slate-800 mt-6 shrink-0">
            <Tooltip content="Proceed to build an issue tree based on the extracted problem" position="top" className="inline-flex">
              <button 
                onClick={() => {
                  sounds.playTransition();
                  if (onNext) onNext();
                }}
                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2 cursor-pointer"
              >
                Continue to Issue Tree
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </Tooltip>
          </div>
        )}
      </div>
    </section>
  );
};

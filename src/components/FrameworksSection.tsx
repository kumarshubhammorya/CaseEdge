import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { 
  recommendFrameworks, 
  evaluateFrameworks, 
  getFrameworkHint 
} from '../services/geminiService';
import { AppState, Framework } from '../types';
import { EmptyState } from './EmptyState';
import { ShimmerButton, CyclingLoadingText, TypewriterText, Tooltip } from './MicroInteractions';
import { 
  Check, 
  Pin, 
  HelpCircle, 
  Brain, 
  RefreshCw, 
  Send, 
  Sparkles, 
  BookOpen, 
  AlertTriangle,
  Lock,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { sounds } from '../lib/sounds';

import { useAppContext } from '../context/AppContext';

const BORDER_COLORS = [
  'border-l-blue-500',
  'border-l-emerald-500',
  'border-l-purple-500',
  'border-l-amber-500',
  'border-l-rose-500',
  'border-l-cyan-500'
];

export const FrameworksSection: React.FC<{ onNext?: () => void; onGoBack?: () => void }> = ({ onNext, onGoBack }) => {
  const { appState, setAppState } = useAppContext();
  const [isRecommending, setIsRecommending] = useState(false);
  const [isGettingHint, setIsGettingHint] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [hintMessage, setHintMessage] = useState<string | null>(null);
  const [scoreFeedback, setScoreFeedback] = useState<number | null>(null);
  const [isCritiqueCollapsed, setIsCritiqueCollapsed] = useState(false);

  const handleRecommend = async () => {
    sounds.playClick();
    if (!appState.caseGlance) {
      toast.error("Please run Case Intake first to structure the problem.");
      return;
    }
    
    // Bypass costs 15 tokens if called manually from Socratic Guide
    const isBypass = isSocratic && !appState.frameworks;
    if (isBypass) {
      if ((appState.tokens ?? 0) < 15) {
        sounds.playError();
        toast.error("Insufficient tokens! You need at least 15 tokens to bypass this section.");
        return;
      }
      setAppState(prev => ({ ...prev, tokens: Math.max(0, (prev.tokens ?? 50) - 15) }));
    }
    
    setIsRecommending(true);
    try {
      const result = await recommendFrameworks(
        appState.caseGlance.caseType,
        appState.caseGlance.coreProblem
      );
      setAppState(prev => ({ 
        ...prev, 
        frameworks: result 
      }));
      toast.success(isBypass ? "Strategic frameworks recommended! (-15 tokens)" : "Strategic frameworks recommended!");
    } catch (err: any) {
      toast.error("Failed to generate frameworks: " + (err?.message || ""));
    } finally {
      setIsRecommending(false);
    }
  };

  const handleUnlockRecommendations = async () => {
    sounds.playClick();
    if (!appState.caseGlance) {
      toast.error("Please run Case Intake first to structure the problem.");
      return;
    }
    const hasSocraticCritique = !!appState.socraticFeedback;
    const isBypass = !appState.frameworks && !hasSocraticCritique;
    if (isBypass) {
      if ((appState.tokens ?? 0) < 15) {
        sounds.playError();
        toast.error("Insufficient tokens! Design a framework in the Socratic Guide, or earn more tokens.");
        return;
      }
      setAppState(prev => ({ ...prev, tokens: Math.max(0, (prev.tokens ?? 50) - 15) }));
    }
    setIsRecommending(true);
    try {
      const result = await recommendFrameworks(
        appState.caseGlance.caseType,
        appState.caseGlance.coreProblem
      );
      setAppState(prev => ({ 
        ...prev, 
        frameworks: result 
      }));
      sounds.playSuccess();
      toast.success(isBypass ? "Strategic frameworks recommended! (-15 tokens)" : "Strategic frameworks recommended!");
    } catch (err: any) {
      sounds.playError();
      toast.error("Failed to generate frameworks: " + (err?.message || ""));
    } finally {
      setIsRecommending(false);
    }
  };

  const handleGetHint = async () => {
    sounds.playClick();
    if (!appState.caseGlance) return;
    setIsGettingHint(true);
    try {
      const hintCount = appState.frameworksHintsCount || 0;
      if (hintCount >= 3) {
        toast.info("You've used all 3 Socratic hints. Try submitting your proposal!");
        setIsGettingHint(false);
        return;
      }
      
      // Enforce 2 tokens cost
      if ((appState.tokens ?? 0) < 2) {
        sounds.playError();
        toast.error("Insufficient tokens! You need at least 2 tokens to request a hint.");
        setIsGettingHint(false);
        return;
      }
      
      const result = await getFrameworkHint(
        appState.caseBrief,
        JSON.stringify(appState.caseGlance),
        appState.userFrameworksInput || "",
        hintCount
      );
      setHintMessage(result);
      setAppState(prev => ({ 
        ...prev, 
        frameworksHintsCount: hintCount + 1,
        tokens: Math.max(0, (prev.tokens ?? 50) - 2)
      }));
      sounds.playSuccess();
      toast.info("Hint received! (-2 tokens)");
    } catch (err: any) {
      sounds.playError();
      toast.error("Failed to get hint: " + (err?.message || ""));
    } finally {
      setIsGettingHint(false);
    }
  };

  const handleSubmitProposal = async () => {
    sounds.playClick();
    const input = appState.userFrameworksInput || "";
    if (input.trim().length < 5) {
      toast.error("Please enter a proposed hypothesis or framework first!");
      return;
    }
    setIsEvaluating(true);
    try {
      const result = await evaluateFrameworks(
        input,
        appState.caseBrief,
        JSON.stringify(appState.caseGlance!)
      );
      setAppState(prev => ({ 
        ...prev, 
        socraticFeedback: result.feedback,
        frameworks: result.frameworks,
        tokens: (prev.tokens ?? 50) + 5 // Reward +5 tokens
      }));
      setScoreFeedback(result.score);
      sounds.playSuccess();
      toast.success("Proposed logic evaluated! Earned +5 tokens.");
    } catch (err: any) {
      sounds.playError();
      toast.error("Failed to evaluate logic: " + (err?.message || ""));
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleResetSocratic = () => {
    sounds.playClick();
    setAppState(prev => ({
      ...prev,
      userFrameworksInput: "",
      socraticFeedback: null,
      frameworks: null,
      frameworksHintsCount: 0,
      activeFrameworks: []
    }));
    setHintMessage(null);
    setScoreFeedback(null);
    toast.info("Proposed logic reset");
  };

  const togglePin = (fw: Framework) => {
    setAppState(prev => {
      const active = prev.activeFrameworks || [];
      const isCurrentlyPinned = active.some(a => a.name === fw.name);
      
      if (isCurrentlyPinned) {
        sounds.playRemove();
        return { ...prev, activeFrameworks: active.filter(a => a.name !== fw.name) };
      }
      
      sounds.playAdd();
      if (active.length >= 2) {
        return { ...prev, activeFrameworks: [...active.slice(1), fw] };
      }
      return { ...prev, activeFrameworks: [...active, fw] };
    });
  };

  const isPinned = (fwName: string) => {
    return (appState.activeFrameworks || []).some(a => a.name === fwName);
  };

  const isSocratic = appState.frameworksMode === 'socratic';

  const loadingMessages = [
    "Analyzing industry context...",
    "Matching strategic models...",
    "Adapting frameworks to case...",
    "Generating structured approaches..."
  ];

  return (
    <section className="bg-[#0f172a] flex flex-col flex-1 min-h-0 border border-slate-800 animate-in fade-in slide-in-from-bottom-4 duration-500 rounded-lg overflow-hidden">
      {/* Top Header */}
      <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-[#070b14]/50 shrink-0">
        <div className="flex items-center gap-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">Framework Selection</h2>
          {!isSocratic && (
            <ShimmerButton
              onClick={handleUnlockRecommendations}
              disabled={isRecommending || !appState.caseGlance || (!appState.frameworks && !appState.socraticFeedback && (appState.tokens ?? 0) < 15)}
              isLoading={isRecommending}
              className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-[10px] uppercase font-bold text-white px-3 py-1.5 rounded transition-colors cursor-pointer"
            >
              {isRecommending 
                ? 'Generating...' 
                : appState.frameworks 
                ? 'Re-recommend Frameworks' 
                : appState.socraticFeedback 
                ? 'Unlock Recommendations (Free)' 
                : 'Unlock Recommendations (15 🪙)'}
            </ShimmerButton>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isRecommending || isEvaluating ? (
            <>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] text-blue-400 font-medium uppercase min-w-[120px]">
                <CyclingLoadingText messages={isEvaluating ? ["Auditing logic...", "Formulating critique..."] : loadingMessages} />
              </span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-[10px] text-slate-400 font-medium uppercase">Model Ready</span>
            </>
          )}
        </div>
      </div>

      {/* Mode Selector Tabs */}
      {appState.caseGlance && (
        <div className="flex border-b border-slate-850 bg-[#070b14]/20 px-6 py-2.5 shrink-0 gap-4">
          <button
            onClick={() => {
              sounds.playClick();
              setAppState(prev => ({ ...prev, frameworksMode: 'socratic' }));
            }}
            className={`text-[10px] uppercase font-bold tracking-wider py-1.5 px-3 rounded-md transition-all cursor-pointer border ${
              isSocratic
                ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 font-extrabold'
                : 'text-slate-500 hover:text-slate-400 border-transparent'
            }`}
          >
            Socratic Guide (Active)
          </button>
          <button
            onClick={() => {
              sounds.playClick();
              setAppState(prev => ({ ...prev, frameworksMode: 'generate' }));
            }}
            className={`text-[10px] uppercase font-bold tracking-wider py-1.5 px-3 rounded-md transition-all cursor-pointer border flex items-center gap-1.5 ${
              !isSocratic
                ? 'bg-blue-500/10 text-blue-400 border-blue-500/30 font-extrabold'
                : 'text-slate-500 hover:text-slate-400 border-transparent'
            }`}
          >
            {appState.frameworks ? '✨' : '🔒'} Auto-Generate Recommendations
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <div className="p-6 space-y-6 flex-1 overflow-y-auto custom-scrollbar flex flex-col min-h-0">
        {/* Active Frameworks bar */}
        {appState.activeFrameworks && appState.activeFrameworks.length > 0 && (
          <div className="space-y-3 mb-2 relative shrink-0">
            <p className="text-[10px] uppercase text-amber-500 font-bold tracking-widest flex items-center gap-1.5">
              <Check className="w-3 h-3" /> Active Frameworks ({appState.activeFrameworks.length}/2)
            </p>
            <div className="flex flex-wrap gap-3">
               {appState.activeFrameworks.map((fw, idx) => (
                  <div key={idx} className="bg-amber-500/10 border border-amber-500/30 rounded-full pl-3 pr-2 py-1 flex items-center gap-2">
                     <span className="text-xs font-bold text-amber-400">{fw.name}</span>
                     <button onClick={() => togglePin(fw)} className="text-amber-500/60 hover:text-amber-400 transition-colors cursor-pointer">
                       <Check className="w-3.5 h-3.5" />
                     </button>
                  </div>
               ))}
            </div>
            <div className="absolute -bottom-4 left-0 right-0 h-px bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800" />
          </div>
        )}

        {/* Content body split based on Socratic vs Auto-generate */}
        {isSocratic && !appState.frameworks ? (
          <div className="flex-1 flex flex-col lg:flex-row gap-6 items-stretch min-h-0">
            {/* Input logic panel */}
            <div className="flex-1 bg-slate-900/35 border border-slate-850 rounded-xl p-5 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="text-xs text-cyan-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-cyan-400" />
                  Socratic Framework Design
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Before the AI reveals standard consulting frameworks, formulate your own hypothesis. What categories, metrics, or drivers would you prioritize to solve this case?
                </p>

                <textarea
                  className="w-full h-40 bg-slate-900 border border-slate-700 rounded-md p-3 text-sm text-slate-350 focus:outline-none focus:border-cyan-500/50 resize-none font-sans"
                  placeholder="e.g. I will analyze Revenues (by segment, ticket price, volumes) and Costs (fixed crew costs vs variable fuel costs) to find the driver of the 15% decline..."
                  value={appState.userFrameworksInput || ''}
                  onChange={(e) => setAppState(prev => ({ ...prev, userFrameworksInput: e.target.value }))}
                />
              </div>

              <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-800/60">
                <div className="flex items-center gap-2">
                  <ShimmerButton
                    onClick={handleGetHint}
                    disabled={isGettingHint || isEvaluating || !appState.caseGlance || (appState.frameworksHintsCount || 0) >= 3 || (appState.tokens ?? 0) < 2}
                    isLoading={isGettingHint}
                    className="bg-amber-500/10 hover:bg-amber-500/20 disabled:bg-slate-800 text-amber-500 border border-amber-500/30 text-[10px] uppercase font-bold px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    Get Hint (Costs 2 🪙) ({(appState.frameworksHintsCount || 0)}/3)
                  </ShimmerButton>
                </div>
                <ShimmerButton
                  onClick={handleSubmitProposal}
                  disabled={isEvaluating || isGettingHint || !(appState.userFrameworksInput || '').trim()}
                  isLoading={isEvaluating}
                  className="bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 text-white border border-cyan-500/30 text-[10px] uppercase font-bold px-4 py-2 rounded transition-colors flex items-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(8,145,178,0.15)]"
                >
                  <Send className="w-3.5 h-3.5" />
                  Submit Logic Proposal
                </ShimmerButton>
              </div>
            </div>

            {/* Socratic Hint Sidebar */}
            <div className="w-full lg:w-80 shrink-0">
              <div className="flex flex-col bg-slate-900/60 border border-slate-800 rounded-xl p-5 h-full justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5 mb-3 pb-2 border-b border-slate-800">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    Socratic Guidance
                  </h3>
                  {hintMessage ? (
                    <div className="bg-slate-950/40 p-3 border border-slate-800 rounded-lg text-xs leading-relaxed text-slate-350 italic animate-in fade-in">
                      "{hintMessage}"
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-600 text-xs">
                      Awaiting hints. Click the hint button to get guiding clues without giving away the logic.
                    </div>
                  )}
                </div>
                <button
                  onClick={handleRecommend}
                  disabled={isRecommending || isEvaluating || isGettingHint || (appState.tokens ?? 0) < 15}
                  className="text-[9px] uppercase font-bold text-slate-500 disabled:text-slate-700 hover:text-slate-400 transition-colors mt-4 text-center cursor-pointer block w-full border border-dashed border-slate-800 disabled:border-slate-900 p-2 rounded"
                >
                  Bypass & Auto-Generate (Costs 15 🪙)
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Socratic Feedback Panel (if critique exists) */}
            {isSocratic && appState.socraticFeedback && (
              <div className="bg-slate-900/35 border border-slate-850 rounded-xl p-5 mb-6 animate-in fade-in duration-300">
                <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-800 shrink-0">
                  <h3 
                    onClick={() => setIsCritiqueCollapsed(!isCritiqueCollapsed)}
                    className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5 cursor-pointer select-none"
                  >
                    <Brain className="w-4 h-4 text-cyan-400" />
                    AI Socratic Critique
                    {isCritiqueCollapsed ? <ChevronDown className="w-3.5 h-3.5 text-slate-500" /> : <ChevronUp className="w-3.5 h-3.5 text-slate-500" />}
                  </h3>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setIsCritiqueCollapsed(!isCritiqueCollapsed)}
                      className="text-[9px] uppercase font-bold text-slate-500 hover:text-slate-400 transition-colors cursor-pointer"
                    >
                      {isCritiqueCollapsed ? 'Expand' : 'Collapse'}
                    </button>
                    <button
                      onClick={handleResetSocratic}
                      className="text-[9px] uppercase font-extrabold text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                    >
                      Reset Socratic logic
                    </button>
                  </div>
                </div>
                
                {!isCritiqueCollapsed && (
                  <div className="flex flex-col md:flex-row gap-4 items-stretch animate-in fade-in duration-200">
                    {scoreFeedback !== null && (
                      <div className="flex flex-col items-center justify-center p-4 bg-slate-950/40 border border-slate-800 rounded-lg min-w-[100px] shrink-0">
                        <span className="text-[8px] uppercase font-bold text-slate-500 mb-1">Logic Score</span>
                        <div className="text-2xl font-bold font-mono text-cyan-400">{scoreFeedback}</div>
                      </div>
                    )}
                    <p className="text-xs leading-relaxed text-slate-300 italic flex-1">
                      "{appState.socraticFeedback}"
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Recommendations grid */}
            {appState.frameworks ? (
              <div className="space-y-4 pt-2 flex-1 overflow-y-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 mb-2 shrink-0">
                  <p className="text-[10px] md:text-[11px] uppercase text-slate-500 font-bold tracking-widest">
                    Recommended Frameworks
                  </p>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#00d4ff]/5 border border-[#00d4ff]/20 text-[#00d4ff]/70 text-[9px] font-bold uppercase tracking-widest animate-[pulse_3s_ease-in-out_infinite]">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg>
                    Hover cards to expand & select
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                  {appState.frameworks.map((fw, idx) => {
                    const pinned = isPinned(fw.name);
                    const borderColor = BORDER_COLORS[idx % BORDER_COLORS.length];
                    
                    return (
                      <div 
                        key={idx} 
                        className={`group relative flex flex-col border-y border-r border-l-4 rounded-r-xl transition-all duration-300 overflow-hidden bg-slate-900/30 hover:bg-slate-900/50 ${
                          pinned ? 'border-r-amber-400 border-y-amber-400 border-l-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.15)] bg-amber-900/10' : `border-r-slate-800 border-y-slate-800 hover:border-r-slate-700 hover:border-y-slate-700 ${borderColor}`
                        }`}
                      >
                        {pinned && (
                          <div className="absolute top-0 right-0 bg-amber-400 text-amber-950 w-6 h-6 flex items-center justify-center rounded-bl-lg z-10 shadow-sm transition-transform">
                            <Check className="w-3.5 h-3.5 font-bold" />
                          </div>
                        )}
                        
                        <div className="p-5 flex flex-col gap-2 relative z-0">
                          <div className="pr-4">
                            <h3 className={`text-sm leading-tight font-bold ${pinned ? 'text-amber-400' : 'text-slate-200 group-hover:text-white transition-colors'}`}>
                              <TypewriterText text={fw.name} />
                            </h3>
                          </div>
                          <div className="mt-1">
                            <p className="text-[11px] leading-relaxed text-slate-400">
                              <TypewriterText text={fw.whyItFits} />
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-[grid-template-rows] duration-200">
                          <div className="overflow-hidden">
                            <div className="px-5 pb-5 pt-2 border-t border-slate-800/50 bg-slate-950/20">
                              <p className="text-[9px] uppercase text-slate-500 font-bold tracking-wider mb-3">Diagnostic Questions</p>
                              <ul className="space-y-3">
                                {fw.diagnosticQuestions.map((q, qIdx) => (
                                  <li key={qIdx} className="flex gap-2 items-start opacity-90">
                                    <span className="text-[10px] font-mono text-blue-500 font-bold mt-0.5">{qIdx + 1}.</span>
                                    <div className="flex-1">
                                      <p className="text-[10px] text-slate-300 leading-relaxed">
                                        <TypewriterText text={q} />
                                      </p>
                                    </div>
                                  </li>
                                ))}
                              </ul>
                              
                              <button 
                                onClick={() => togglePin(fw)}
                                className={`w-full mt-5 py-2 px-3 rounded text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                                  pinned 
                                    ? 'bg-amber-500/20 text-amber-500 hover:bg-amber-500/30' 
                                    : 'bg-slate-800 text-slate-300 hover:bg-blue-600 hover:text-white border border-slate-700 hover:border-transparent'
                                }`}
                              >
                                <Pin className="w-3.5 h-3.5" />
                                {pinned ? 'Unpin Framework' : 'Use This Framework'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : appState.issueTree ? (
              <div className="h-64 border border-dashed border-slate-800 rounded-xl bg-slate-900/20 flex flex-col items-center justify-center text-slate-400 gap-4 p-8 text-center max-w-lg mx-auto">
                <div className="p-3 bg-slate-850 rounded-full border border-slate-700 text-cyan-400 shrink-0">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">AI Strategic Frameworks Locked</h3>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed max-w-sm">
                    Design your own logic proposal in the Socratic Guide to unlock the AI recommended strategic frameworks for free, or bypass active learning using tokens.
                  </p>
                </div>
                <Tooltip content={appState.socraticFeedback ? "Unlock the frameworks for free" : "Deduct 15 tokens to auto-recommend frameworks"} position="bottom" className="inline-flex">
                  <ShimmerButton
                    onClick={handleUnlockRecommendations}
                    disabled={isRecommending || (!appState.socraticFeedback && (appState.tokens ?? 0) < 15)}
                    isLoading={isRecommending}
                    className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-xs uppercase font-bold text-white px-6 py-2.5 rounded-md transition-colors cursor-pointer"
                  >
                    {isRecommending 
                      ? 'Generating...' 
                      : appState.socraticFeedback 
                      ? 'Unlock Recommendations (Free)' 
                      : 'Bypass & Unlock (Costs 15 🪙)'}
                  </ShimmerButton>
                </Tooltip>
              </div>
            ) : (
              <EmptyState 
                title="Awaiting Logic Tree"
                description="You need to build the issue tree first before selecting frameworks."
                actionLabel="Go to Structure"
                onAction={onGoBack}
              />
            )}
          </div>
        )}

        {/* Navigation Actions */}
        {appState.activeFrameworks?.length > 0 && onNext && (
          <div className="flex justify-end pt-4 border-t border-slate-800 mt-6 shrink-0">
            <button 
              onClick={() => {
                sounds.playTransition();
                if (onNext) onNext();
              }}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2 cursor-pointer"
            >
              Draft Recommendation
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { simulateQA } from '../services/geminiService';
import { AppState, QA } from '../types';
import { EmptyState } from './EmptyState';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, Check, X, RotateCcw, HelpCircle, Trophy, Lock } from 'lucide-react';
import { ShimmerButton, CyclingLoadingText, EditableField } from './MicroInteractions';
import { sounds } from '../lib/sounds';

import { useAppContext } from '../context/AppContext';

const DEFAULT_RUBRIC = [
  "Did your response state a clear top-down action first?",
  "Did you quantify the expected business or financial impact?",
  "Did you mention at least one key risk or operational constraint?"
];

const Flashcard: React.FC<{
  qa: QA;
  index: number;
  onStatusChange: (status: 'got-it' | 'need-practice') => void;
  onUpdateText: (field: keyof QA, val: string) => void;
}> = ({ qa, index, onStatusChange, onUpdateText }) => {
  const { appState, setAppState } = useAppContext();
  const [isFlipped, setIsFlipped] = useState(false);
  
  const rubricList = qa.rubric || DEFAULT_RUBRIC;
  const [checkedItems, setCheckedItems] = useState<boolean[]>(new Array(rubricList.length).fill(false));
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (!isFlipped) {
      setCheckedItems(new Array(rubricList.length).fill(false));
      setRevealed(false);
    }
  }, [isFlipped, rubricList.length]);

  return (
    <div className="perspective-1000 h-80 lg:h-96 w-full cursor-pointer group" onClick={() => {
      sounds.playHover();
      setIsFlipped(!isFlipped);
    }}>
      <motion.div
        className="w-full h-full relative transition-all duration-500 preserve-3d"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      >
        {/* Front: Question */}
        <div className="absolute inset-0 backface-hidden bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-between shadow-xl group-hover:border-slate-700 transition-colors">
          <div className="space-y-4 overflow-y-auto pr-2 mb-2 custom-scrollbar flex-1">
            <div className="flex justify-between items-center shrink-0">
              <span className="text-[10px] font-mono text-amber-500 font-bold uppercase tracking-widest">Question {index + 1}</span>
              {qa.status === 'got-it' && <Check className="w-4 h-4 text-green-500 shrink-0" />}
              {qa.status === 'need-practice' && <RotateCcw className="w-4 h-4 text-red-500 shrink-0" />}
            </div>
            <div className="-m-2 p-2" onClick={(e) => e.stopPropagation()}>
              <EditableField
                value={qa.question}
                onChange={(val) => onUpdateText('question', val)}
                multiline
                className="hover:bg-slate-800/30 w-full"
                textClassName="text-slate-200 text-sm font-semibold leading-relaxed"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 text-slate-500 text-[10px] uppercase font-bold shrink-0 pt-2 border-t border-slate-800/50">
            <HelpCircle className="w-3 h-3" />
            <span>Click to reveal answer</span>
          </div>
        </div>

        {/* Back: Model Answer with Rubric Checklist */}
        <div 
          className="absolute inset-0 backface-hidden bg-slate-800 border border-blue-900/50 rounded-xl p-5 flex flex-col justify-between shadow-xl"
          style={{ transform: 'rotateY(180deg)' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex-1 overflow-y-auto pr-1 mb-2 custom-scrollbar flex flex-col gap-3">
            {/* Self-Assessment Rubric */}
            <div className="space-y-2 shrink-0">
              <span className="text-[10px] font-mono text-cyan-400 font-extrabold uppercase tracking-widest block">
                Self-Assessment Rubric
              </span>
              <div className="space-y-1.5">
                {rubricList.map((item, idx) => (
                  <label 
                    key={idx}
                    className="flex items-start gap-2 p-1.5 rounded bg-slate-900/30 hover:bg-slate-900/50 transition-colors border border-slate-700/30 cursor-pointer text-left select-none"
                  >
                    <input 
                      type="checkbox"
                      checked={checkedItems[idx] || false}
                      onChange={() => {
                        sounds.playClick();
                        const updated = [...checkedItems];
                        updated[idx] = !updated[idx];
                        setCheckedItems(updated);
                        
                        // Automatically reveal when all items are checked
                        if (updated.every(v => v)) {
                          setRevealed(true);
                        }
                      }}
                      className="mt-0.5 rounded border-slate-700 text-blue-500 focus:ring-blue-500/20 shrink-0"
                    />
                    <span className="text-[10px] text-slate-300 leading-tight">
                      {item}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-slate-700/60 shrink-0 my-1"></div>

            {/* Model Answer Section */}
            <div className="flex-1 min-h-[80px] relative flex flex-col">
              <span className="text-[10px] font-mono text-blue-400 font-extrabold uppercase tracking-widest block shrink-0 mb-1.5">
                Model Answer
              </span>
              
              <div className="flex-1 relative rounded overflow-hidden">
                <div className={`transition-all duration-300 flex-1 h-full overflow-y-auto custom-scrollbar text-left ${
                  revealed ? 'blur-0 opacity-100' : 'blur-md opacity-25 pointer-events-none select-none'
                }`}>
                  <div className="-m-2 p-2 block">
                    <EditableField
                      value={qa.modelAnswer}
                      onChange={(val) => onUpdateText('modelAnswer', val)}
                      multiline
                      className="hover:bg-slate-700 w-full"
                      textClassName="text-slate-300 text-xs leading-relaxed italic"
                    />
                  </div>
                </div>

                {/* Lock Overlay */}
                {!revealed && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800/40 p-4 gap-2 text-center select-none">
                    <div className="p-1.5 rounded bg-slate-900/60 border border-slate-700 flex items-center text-slate-400">
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Answer Locked
                    </span>
                    <button
                      onClick={() => {
                        if ((appState.tokens ?? 0) < 5) {
                          sounds.playError();
                          toast.error("Insufficient tokens! You need at least 5 tokens to skip this checklist.");
                          return;
                        }
                        setAppState(prev => ({ ...prev, tokens: Math.max(0, (prev.tokens ?? 50) - 5) }));
                        sounds.playSuccess();
                        setRevealed(true);
                        toast.info("Answer revealed! (-5 tokens)");
                      }}
                      disabled={(appState.tokens ?? 0) < 5}
                      className="text-[10px] uppercase font-extrabold bg-blue-600 hover:bg-blue-500 disabled:bg-slate-900 disabled:text-slate-600 disabled:border-slate-800 border border-transparent text-white py-1 px-3.5 rounded transition-all cursor-pointer shadow-md hover:shadow-lg"
                    >
                      Skip & Reveal Answer (Costs 5 ⚡)
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="pt-3 border-t border-slate-700 flex justify-between items-center bg-slate-800/50 -mx-5 -mb-5 p-3.5 rounded-b-xl shrink-0">
            <p className="text-[10px] text-slate-500 uppercase font-bold">How did you do?</p>
            <div className="flex gap-2">
              <button
                disabled={!revealed}
                onClick={(e) => {
                  e.stopPropagation();
                  sounds.playRemove();
                  onStatusChange('need-practice');
                  setIsFlipped(false);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] uppercase font-bold transition-all border cursor-pointer ${
                  !revealed
                    ? 'opacity-30 border-slate-750 text-slate-500 cursor-not-allowed'
                    : qa.status === 'need-practice' 
                    ? 'bg-red-500/20 border-red-500 text-red-400' 
                    : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:border-red-500/50'
                }`}
              >
                <X className="w-3.5 h-3.5" />
                Practice
              </button>
              <button
                disabled={!revealed}
                onClick={(e) => {
                  e.stopPropagation();
                  sounds.playSuccess();
                  onStatusChange('got-it');
                  setIsFlipped(false);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] uppercase font-bold transition-all border cursor-pointer ${
                  !revealed
                    ? 'opacity-30 border-slate-750 text-slate-500 cursor-not-allowed'
                    : qa.status === 'got-it' 
                    ? 'bg-green-500/20 border-green-500 text-green-400' 
                    : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:border-green-500/50'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                Got this
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export const QASection: React.FC<{ onGoBack?: () => void }> = ({ onGoBack }) => {
  const { appState, setAppState } = useAppContext();
  const [isSimulating, setIsSimulating] = useState(false);

  const handleSimulate = async () => {
    sounds.playClick();
    if (!appState.expandedRecommendation) {
      toast.error("Please generate an SCR recommendation first.");
      return;
    }
    setIsSimulating(true);
    try {
      const recText = `Situation: ${appState.expandedRecommendation.situation}\nComplication: ${appState.expandedRecommendation.complication}\nResolution: ${appState.expandedRecommendation.resolution}`;
      const result = await simulateQA(recText);
      setAppState(prev => ({ ...prev, qas: result }));
      toast.success("Simulation drills generated!");
    } catch (err: any) {
      toast.error("Failed to simulate questions: " + (err?.message || ""));
    } finally {
      setIsSimulating(false);
    }
  };

  const updateQAStatus = (index: number, status: 'got-it' | 'need-practice') => {
    if (!appState.qas) return;
    const newQAs = [...appState.qas];
    newQAs[index] = { ...newQAs[index], status };
    setAppState(prev => ({ ...prev, qas: newQAs }));
  };

  const updateQAText = (index: number, field: keyof QA, value: string) => {
    if (!appState.qas) return;
    const newQAs = [...appState.qas];
    newQAs[index] = { ...newQAs[index], [field]: value as any };
    setAppState(prev => ({ ...prev, qas: newQAs }));
  };

  const gotItCount = appState.qas?.filter(q => q.status === 'got-it').length || 0;
  const totalCount = appState.qas?.length || 0;
  const progressPercent = totalCount > 0 ? (gotItCount / totalCount) * 100 : 0;

  useEffect(() => {
    if (progressPercent === 100 && totalCount > 0 && !appState.isSessionCompleted) {
      setAppState(prev => ({ ...prev, isSessionCompleted: true }));
      const count = parseInt(localStorage.getItem('caseedge_completed_sessions_count') || '0', 10);
      localStorage.setItem('caseedge_completed_sessions_count', (count + 1).toString());
      toast.success("Congratulations! Case session completed!");
    }
  }, [progressPercent, totalCount, appState.isSessionCompleted, setAppState]);

  const loadingMessages = [
    "Adopting judge persona...",
    "Formulating hard questions...",
    "Generating self-calibration rubrics...",
    "Drafting model answers..."
  ];

  return (
    <section className="bg-[#0f172a] flex flex-col flex-1 min-h-0 border border-slate-800 animate-in fade-in slide-in-from-bottom-4 duration-500 rounded-lg overflow-hidden">
      <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-[#070b14]/50 shrink-0">
        <div className="flex items-center gap-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">Practice Simulator</h2>
          <ShimmerButton
            onClick={handleSimulate}
            disabled={isSimulating || !appState.expandedRecommendation}
            isLoading={isSimulating}
            className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-[10px] uppercase font-bold text-white px-3 py-1.5 rounded transition-colors cursor-pointer"
          >
            {isSimulating ? 'Simulating...' : 'Generate New Drill'}
          </ShimmerButton>
        </div>
        <div className="flex items-center gap-4">
          {totalCount > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                <motion.div 
                  className="h-full bg-green-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-400 font-bold uppercase">{gotItCount}/{totalCount} Mastered</span>
            </div>
          )}
          <div className="flex items-center gap-2 border-l border-slate-800 pl-4">
            {isSimulating ? (
               <>
                 <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                 <span className="text-[10px] text-blue-400 font-medium uppercase min-w-[120px]">
                    <CyclingLoadingText messages={loadingMessages} />
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
      </div>

      <div className="p-6 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
        {!appState.slideOutline ? (
          <EmptyState 
            title="Awaiting Slide Outline"
            description="You need to generate a slide outline first before anticipating Judge Q&A."
            actionLabel="Go to Slide Outline"
            onAction={onGoBack}
          />
        ) : appState.qas ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase text-slate-500 font-bold">Prep Session: Judge Q&A</p>
              {progressPercent === 100 && (
                <div className="flex items-center gap-2 text-green-500 animate-bounce">
                  <Trophy className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Deployment Ready</span>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {appState.qas.map((qa, idx) => (
                <Flashcard 
                  key={idx} 
                  qa={qa} 
                  index={idx} 
                  onStatusChange={(status) => updateQAStatus(idx, status)} 
                  onUpdateText={(field, val) => updateQAText(idx, field, val)}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="h-48 border border-dashed border-slate-800 rounded bg-slate-900/20 flex flex-col items-center justify-center text-slate-400 gap-4">
            <Brain className="w-8 h-8 opacity-45 text-cyan-400" />
            <div className="text-center">
              <span className="text-xs uppercase font-bold tracking-widest text-slate-200 block mb-1">
                Awaiting Simulation Drills
              </span>
              <p className="text-[10px] text-slate-500 max-w-xs leading-normal">
                Prepare for the Q&A segment of your case interview by simulating tough questions from the judges.
              </p>
            </div>
            <ShimmerButton
              onClick={handleSimulate}
              disabled={isSimulating || !appState.expandedRecommendation}
              isLoading={isSimulating}
              className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-750 text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded transition-colors cursor-pointer"
            >
              {isSimulating ? "Simulating drills..." : "Start Q&A Simulator Drill"}
            </ShimmerButton>
          </div>
        )}

        {progressPercent === 100 && (
          <div className="flex flex-col items-center justify-center pt-8 border-t border-slate-800 mt-6 pb-4 space-y-4">
             <div className="text-center font-bold text-green-400 uppercase tracking-widest text-sm">
                Case Competition Prep Complete!
             </div>
             <p className="text-xs text-slate-500">
                You can now export your session from the top navigation bar.
             </p>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .perspective-1000 {
          perspective: 1000px;
        }
        .preserve-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
      `}} />
    </section>
  );
};

import React, { useState, useRef } from 'react';
import { toast } from 'sonner';
import { analyzeCase, generateHypothesis, extractCaseFromFile, extractCaseFromText } from '../services/geminiService';
import { extractTextFromPdf } from '../lib/pdfUtils';
import { AppState, CaseGlance } from '../types';
import { ShimmerButton, CyclingLoadingText, EditableField, EditableListField, TypewriterText, Tooltip } from './MicroInteractions';
import { sounds } from '../lib/sounds';
import { Lightbulb, Zap, Upload, BarChart, ExternalLink } from 'lucide-react';

const CLASSIC_CASES = [
  {
    title: "Airline Profitability",
    content: "Our client is a major US airline. Despite relatively stable revenue and passenger volumes over the last two years, their overall profitability has declined by 15%. The CEO hired us to determine the root cause of this decline and to recommend strategies to return to historical profit margins."
  },
  {
    title: "Tech M&A Evaluation",
    content: "A large legacy enterprise software company is considering acquiring a fast-growing cloud security startup for $2B. The startup has innovative AI cybersecurity technology and 100% year-over-year revenue growth but is burning cash. The board wants to know if they should proceed with the acquisition and how to value the synergies."
  },
  {
    title: "New Market Entry",
    content: "A successful European premium athletic shoe brand is considering entering the US market. They currently have zero footprint in North America. They want our recommendation on whether they should enter the US, and if so, whether they should launch primarily through D2C e-commerce, wholesale partners, or owned retail stores."
  },
  {
    title: "Private Equity Roll-up",
    content: "Our private equity client is looking at the veterinary clinic market in the UK, which is highly fragmented. They are evaluating a 'roll-up' strategy. The partner wants to know if this industry is an attractive target for a roll-up, what they should look for in their initial platform acquisition, and the major risks."
  },
  {
    title: "Retail Pricing Strategy",
    content: "A national mid-tier grocery store chain is losing market share to hard discounters like Aldi. The VP of Pricing is considering instituting an across-the-board 5% price cut to regain customer traffic. They need to know the financial implications of this move and whether there are better alternatives to combat the discounters."
  }
];

import { useAppContext } from '../context/AppContext';

type Props = {
  onNext?: () => void;
};

export const IntakeSection: React.FC<Props> = ({ onNext }) => {
  const { appState, setAppState } = useAppContext();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isGeneratingHypothesis, setIsGeneratingHypothesis] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<{ hypothesis: string, reasoning: string } | null>(null);

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
            caseGlance: result
          }));
          setIsUploading(false);
          sounds.playSuccess();
          toast.success("PDF analyzed successfully!");
          if (fileInputRef.current) fileInputRef.current.value = '';
          return;
        } catch (err: any) {
          console.warn("Failed local PDF parsing, trying vision API...", err);
          // Fallback to visual parsing if it's a scanned PDF or local parse fails
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
             caseGlance: result
           }));
           sounds.playSuccess();
           toast.success("File processed successfully!");
        } catch (err: any) {
           sounds.playError();
           toast.error("Failed to parse file: " + (err?.message || "Unknown error"));
        } finally {
           setIsUploading(false);
           if (fileInputRef.current) fileInputRef.current.value = '';
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && (file.type === "application/pdf" || file.type.startsWith("image/"))) {
      processFile(file);
    } else {
      toast.error("Please upload a PDF or image file (JPG, PNG).");
    }
  };

  const handleAnalyze = async () => {
    sounds.playClick();
    if (!appState.caseBrief.trim()) {
      toast.error("Please paste a case brief first.");
      return;
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

  return (
    <section className="bg-[#0f172a] flex flex-col flex-1 min-h-0 border border-slate-800 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="p-4 border-b border-slate-800 flex justify-between items-center">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">Case Brief & Extraction</h2>
        <div className="flex items-center gap-2">
          {isAnalyzing || isUploading ? (
            <>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] text-blue-400 font-medium uppercase min-w-[120px]">
                <CyclingLoadingText messages={['Scanning case structure...', 'Identifying stakeholders...', 'Classifying problem type...']} />
              </span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-[10px] text-slate-400 font-medium uppercase">
                Ready
              </span>
            </>
          )}
        </div>
      </div>
      
      <div className="p-6 space-y-6 flex-1 overflow-y-auto">
        <div className="bg-blue-950/30 border border-blue-500/30 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded text-blue-400 shrink-0">
              <BarChart className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-blue-100">Analyzing numerical data or spreadsheets?</h4>
              <p className="text-xs text-blue-300/70 mt-0.5">Use BI Edge to instantly create dashboards and get AI insights from your datasets.</p>
            </div>
          </div>
          <a 
            href="https://biedge.shubhammaurya.online/#/app" 
            target="_blank" 
            rel="noopener noreferrer"
            className="px-4 py-2 bg-blue-600/90 hover:bg-blue-500 text-white rounded text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shrink-0 shadow-lg shadow-blue-900/20"
          >
            Launch BI Edge
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div className="space-y-4 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Upload Case Brief</span>
            <select 
              className="bg-slate-800 border border-slate-700 text-slate-300 text-[10px] rounded px-2 py-1 uppercase tracking-wider font-bold outline-none focus:border-blue-500 cursor-pointer"
              onChange={(e) => {
                if (e.target.value) {
                  const selectedCase = CLASSIC_CASES.find(c => c.title === e.target.value);
                  if (selectedCase) {
                    sounds.playClick();
                    setAppState(prev => ({ ...prev, caseBrief: selectedCase.content }));
                  }
                }
              }}
              value=""
            >
              <option value="" disabled>Quick Start: Classic Cases</option>
              {CLASSIC_CASES.map(c => (
                <option key={c.title} value={c.title}>{c.title}</option>
              ))}
            </select>
          </div>
          
          <div
            onClick={() => !isUploading && fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`border-2 border-dashed border-cyan-500/50 hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(34,211,238,0.2)] bg-cyan-950/20 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <input 
              type="file" 
              className="hidden" 
              ref={fileInputRef} 
              accept="application/pdf,image/jpeg,image/png"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) processFile(file);
              }}
            />
            <Upload className={`w-8 h-8 text-cyan-400 mb-3 ${isUploading ? 'animate-bounce' : ''}`} />
            <p className="text-sm text-cyan-300 font-medium">
              {isUploading ? 'Reading case brief...' : 'Drop your case PDF or photo here'}
            </p>
            {!isUploading && <p className="text-xs text-slate-500 mt-1">or click to browse (PDF, JPG, PNG)</p>}
          </div>
        </div>

        <div className="relative">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-slate-400">Review & Edit Case Prompt</span>
          </div>
          <textarea
            className="w-full h-40 bg-slate-900 border border-slate-700 rounded-md p-3 text-sm text-slate-300 focus:outline-none focus:border-blue-500 resize-none font-sans"
            placeholder="Paste case prompt, company background, exhibit notes..."
            value={appState.caseBrief}
            onChange={(e) => setAppState(prev => ({ ...prev, caseBrief: e.target.value }))}
          />
          <div className="absolute bottom-3 right-3">
            <Tooltip content="Extract key elements from the case brief" position="left" className="inline-flex">
              <ShimmerButton
                onClick={handleAnalyze}
                disabled={isAnalyzing || isUploading || !!appState.caseGlance}
                isLoading={isAnalyzing || isUploading}
                className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:opacity-50 text-[10px] uppercase font-bold text-white px-3 py-1.5 rounded transition-colors"
              >
                {isAnalyzing || isUploading ? 'Analyzing...' : appState.caseGlance ? 'Case Analyzed' : 'Analyze Case'}
              </ShimmerButton>
            </Tooltip>
          </div>
        </div>

        {appState.caseGlance ? (
          <div className="space-y-4 animate-in fade-in">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              Case at a Glance
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 border border-slate-800 rounded bg-slate-900/30">
                <p className="text-[10px] uppercase text-slate-500 font-bold mb-1">Industry</p>
                <EditableField
                  value={appState.caseGlance.industry}
                  onChange={(val) => updateGlance('industry', val)}
                  textClassName="text-sm font-medium text-slate-200 w-full"
                />
              </div>
              <div className="p-3 border border-slate-800 rounded bg-slate-900/30">
                <p className="text-[10px] uppercase text-slate-500 font-bold mb-1">Case Type</p>
                <EditableField
                  value={appState.caseGlance.caseType}
                  onChange={(val) => updateGlance('caseType', val)}
                  textClassName="text-sm font-medium text-slate-200 w-full"
                />
              </div>
              <div className="p-3 border border-slate-800 rounded bg-slate-900/30 col-span-2">
                <p className="text-[10px] uppercase text-slate-500 font-bold mb-1">Core Problem</p>
                <EditableField
                  value={appState.caseGlance.coreProblem}
                  onChange={(val) => updateGlance('coreProblem', val)}
                  multiline
                  textClassName="text-sm text-slate-200 w-full pt-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-[10px] uppercase text-slate-500 font-bold">Key Stakeholders</p>
                <EditableListField
                  items={appState.caseGlance.keyStakeholders}
                  onChange={(val) => updateGlance('keyStakeholders', val)}
                  className="bg-slate-900/30 border border-slate-800 rounded"
                  textClassName="text-xs text-slate-300"
                />
              </div>
              <div className="space-y-2">
                <p className="text-[10px] uppercase text-slate-500 font-bold">Key Constraints</p>
                <EditableListField
                  items={appState.caseGlance.keyConstraints}
                  onChange={(val) => updateGlance('keyConstraints', val)}
                  className="bg-slate-900/30 border border-slate-800 rounded"
                  textClassName="text-xs text-slate-300"
                />
              </div>
            </div>
            {appState.caseGlance.clarifyingQuestions && appState.caseGlance.clarifyingQuestions.length > 0 && (
              <div className="space-y-2 mt-4">
                <p className="text-[10px] uppercase text-purple-400 font-bold flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Clarifying Questions to Ask
                </p>
                <EditableListField
                  items={appState.caseGlance.clarifyingQuestions}
                  onChange={(val) => updateGlance('clarifyingQuestions', val)}
                  className="bg-purple-900/10 border border-purple-900/30 rounded"
                  textClassName="text-xs text-slate-300"
                />
              </div>
            )}

            {/* Hypothesis Section (Optional) */}
            <div className="mt-8 pt-6 border-t border-slate-800 space-y-4">
              <div className="flex justify-between items-center mt-2">
                <div>
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Zap className="w-4 h-4 text-purple-400" />
                    Day-One Hypothesis <span className="text-[10px] text-slate-500 font-normal uppercase tracking-widest">(Optional)</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">Formulate a testable hypothesis to guide your issue tree.</p>
                </div>
                <ShimmerButton
                  onClick={handleGenerateHypothesis}
                  disabled={isGeneratingHypothesis || !appState.caseBrief}
                  isLoading={isGeneratingHypothesis}
                  className="bg-purple-500/10 hover:bg-purple-500/20 disabled:bg-slate-800 text-purple-400 border border-purple-500/30 text-[10px] uppercase font-bold px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 shrink-0 ml-4"
                >
                  <Lightbulb className="w-3 h-3" />
                  {isGeneratingHypothesis ? "Analyzing..." : "AI Suggestion"}
                </ShimmerButton>
              </div>

              <textarea
                className="w-full h-24 bg-slate-900 border border-slate-700 rounded-md p-3 text-sm text-slate-300 focus:outline-none focus:border-purple-500/50 resize-none font-sans"
                placeholder="e.g. The decline in profitability is driven by a recent drop in passenger volume..."
                value={appState.hypothesis || ''}
                onChange={(e) => setAppState(prev => ({ ...prev, hypothesis: e.target.value }))}
              />

              {aiSuggestion && (
                <div className="p-4 border border-purple-500/30 bg-purple-900/10 rounded-lg space-y-3 animate-in fade-in">
                  <div>
                    <span className="text-[10px] text-purple-400 font-bold uppercase tracking-widest mb-1 block">Suggested Hypothesis</span>
                    <p className="text-sm text-slate-200">{aiSuggestion.hypothesis}</p>
                  </div>
                  <div className="pt-2 border-t border-purple-500/20">
                    <span className="text-[10px] text-purple-400/70 font-bold uppercase tracking-widest mb-1 block">Reasoning</span>
                    <p className="text-xs text-slate-400 italic">{aiSuggestion.reasoning}</p>
                  </div>
                  <button 
                    onClick={handleAdoptHypothesis}
                    className="mt-3 w-full text-xs bg-purple-500/20 hover:bg-purple-500/40 text-purple-300 px-3 py-2 rounded transition-colors font-bold uppercase tracking-wider"
                  >
                    Adopt this hypothesis
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-600 flex items-center gap-2">
              <span className="w-2 h-2 bg-slate-700 rounded-full"></span>
              Case at a Glance
            </h3>
            <div className="h-48 border border-dashed border-slate-800 rounded bg-slate-900/20 flex flex-col items-center justify-center text-slate-600">
               <span className="text-xs uppercase font-bold tracking-widest">Awaiting Case Extract</span>
            </div>
          </div>
        )}

        {appState.caseGlance && onNext && (
          <div className="flex justify-end pt-4 border-t border-slate-800 mt-6">
            <Tooltip content="Proceed to build an issue tree based on the extracted problem" position="top" className="inline-flex">
              <button 
                onClick={() => {
                  sounds.playTransition();
                  if (onNext) onNext();
                }}
                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2"
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

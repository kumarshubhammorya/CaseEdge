import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { generateSlideOutline } from '../services/geminiService';
import { AppState } from '../types';
import { EmptyState } from './EmptyState';
import { ShimmerButton } from './MicroInteractions';
import { sounds } from '../lib/sounds';
import { Presentation, Save, LayoutTemplate, LogIn, ExternalLink } from 'lucide-react';

import { useAppContext } from '../context/AppContext';
import { useAuth } from '../lib/AuthContext';
import { exportToGoogleSlides } from '../lib/slidesUtils';

type Props = {
  onNext: () => void;
  onGoBack?: () => void;
};

export const SlideOutlineSection = ({ onNext, onGoBack }: Props) => {
  const { appState, setAppState } = useAppContext();
  const { accessToken, signIn, user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportUrl, setExportUrl] = useState<string | null>(null);

  const handleGenerate = async () => {
    sounds.playClick();
    if (!appState.coreRecommendation && !appState.expandedRecommendation?.resolution) {
      toast.error("Please generate a recommendation first.");
      return;
    }
    
    setIsGenerating(true);
    try {
      const recText = appState.expandedRecommendation 
        ? `${appState.expandedRecommendation.situation} ${appState.expandedRecommendation.complication} ${appState.expandedRecommendation.resolution}`
        : appState.coreRecommendation;
        
      const result = await generateSlideOutline(recText, appState.caseBrief);
      setAppState(prev => ({ ...prev, slideOutline: result }));
      toast.success("Slide outline generated!");
    } catch (err: any) {
      toast.error("Failed to generate slide outline: " + (err?.message || "Unknown error"));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExport = async () => {
    sounds.playClick();
    if (!accessToken) {
      await signIn();
      return;
    }

    if (!appState.slideOutline) return;

    const confirmed = window.confirm("Are you sure you want to create a new presentation in your Google Drive?");
    if (!confirmed) return;

    setIsExporting(true);
    try {
      const url = await exportToGoogleSlides(accessToken, appState.slideOutline);
      setExportUrl(url);
      sounds.playSuccess();
      toast.success("Presentation exported to Google Slides!");
    } catch (err: any) {
      toast.error("Failed to export to Google Slides: " + (err?.message || "Unknown error"));
      sounds.playError();
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="h-full flex flex-col pt-4 sm:pt-0 animate-in fade-in slide-in-from-bottom-4">
      <div className="px-6 pb-4 border-b border-slate-800 shrink-0">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <Presentation className="w-5 h-5 text-indigo-400" />
          Slide Outline Generator
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Map your recommendation to a structured 7-slide competition deck.
        </p>
      </div>

      <div className="p-6 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
        {!appState.expandedRecommendation ? (
          <EmptyState 
            title="Awaiting Draft Recommendation"
            description="You need to draft a recommendation first before creating a slide outline."
            actionLabel="Go to Draft"
            onAction={onGoBack}
          />
        ) : !appState.slideOutline ? (
          <div className="flex flex-col items-center justify-center h-48 space-y-4">
            <LayoutTemplate className="w-12 h-12 text-slate-700" />
            <p className="text-slate-400 text-sm text-center max-w-sm">
              Generate a 7-slide presentation structure based on your recommendation and case brief.
            </p>
            <ShimmerButton
              onClick={handleGenerate}
              disabled={isGenerating || (!appState.coreRecommendation && !appState.expandedRecommendation)}
              isLoading={isGenerating}
              className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white font-medium py-2 px-4 rounded transition-colors"
            >
              {isGenerating ? "Generating Deck Structure..." : "Generate Deck Structure"}
            </ShimmerButton>
            {(!appState.coreRecommendation && !appState.expandedRecommendation) && (
              <p className="text-amber-400 text-xs mt-2">You need a recommendation before generating an outline.</p>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
               <span className="text-xs text-slate-400 uppercase tracking-widest font-bold">7-Slide Structure</span>
               <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1 bg-blue-500/10 px-2 py-1 rounded"
                >
                  <Presentation className="w-3 h-3" />
                  {isGenerating ? "Regenerating..." : "Regenerate"}
               </button>
            </div>
            
            <div className="space-y-4">
              {appState.slideOutline.map((slide, index) => (
                <div key={index} className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1 space-y-2">
                       <h3 className="text-base font-medium text-white">{slide.title}</h3>
                       <p className="text-sm text-blue-300 italic">{slide.purpose}</p>
                       <ul className="list-disc pl-5 mt-3 space-y-1">
                         {slide.bullets.map((bullet, idx) => (
                           <li key={idx} className="text-sm text-slate-300 pl-1">{bullet}</li>
                         ))}
                       </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-8 p-4 bg-slate-800/30 border border-slate-700/50 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Export to Google Slides
                </h4>
                <p className="text-xs text-slate-400 mt-1">Generate a real presentation file in your Google Drive.</p>
              </div>
              
              {exportUrl ? (
                <a 
                  href={exportUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border border-blue-500/30 px-4 py-2 rounded flex items-center gap-2 text-sm font-medium transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open Presentation
                </a>
              ) : (
                <ShimmerButton
                  onClick={handleExport}
                  disabled={isExporting}
                  isLoading={isExporting}
                  className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-400 text-white px-4 py-2 rounded flex items-center gap-2 text-sm font-medium transition-colors whitespace-nowrap"
                >
                  {!accessToken ? (
                    <>
                      <LogIn className="w-4 h-4" />
                      Sign in to Export
                    </>
                  ) : isExporting ? (
                    'Exporting...'
                  ) : (
                    <>
                      <Presentation className="w-4 h-4" />
                      Export Slides
                    </>
                  )}
                </ShimmerButton>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="p-6 border-t border-slate-800 shrink-0 bg-[#0f172a] sm:bg-transparent flex justify-end">
        <button
          onClick={() => {
            sounds.playTransition();
            onNext();
          }}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium py-2.5 rounded-md transition-colors shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
          style={{ width: '300px', height: '30px', marginLeft: 'auto' }}
        >
          <span>Continue to Judge Q&A</span>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>
    </div>
  );
};

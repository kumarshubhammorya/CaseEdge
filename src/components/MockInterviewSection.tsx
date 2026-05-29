import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, 
  Send, 
  HelpCircle, 
  Settings, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  ArrowLeft, 
  Zap, 
  Volume2, 
  Trophy, 
  RefreshCw, 
  Bookmark, 
  UserCheck 
} from 'lucide-react';
import { sounds } from '../lib/sounds';
import { useAppContext } from '../context/AppContext';
import { 
  generateMockInterviewResponse, 
  generateMockInterviewFeedback, 
  getMockInterviewHint 
} from '../services/geminiService';
import { EmptyState } from './EmptyState';
import { MockInterviewMessage, MockInterviewFeedback } from '../types';

type MockInterviewSectionProps = {
  onGoBack?: () => void;
};

export const MockInterviewSection: React.FC<MockInterviewSectionProps> = ({ onGoBack }) => {
  const { appState, setAppState } = useAppContext();
  
  // Extract state variables
  const session = appState.mockInterview || {
    config: null,
    messages: [],
    feedback: null,
    status: 'not_started'
  };

  // Local state
  const [selectedPersona, setSelectedPersona] = useState<'supportive' | 'mbb_partner' | 'skeptical'>('mbb_partner');
  const [selectedFocus, setSelectedFocus] = useState<'structuring' | 'math' | 'synthesis' | 'all'>('all');
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRequestingHint, setIsRequestingHint] = useState(false);
  const [isRequestingScorecard, setIsRequestingScorecard] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session.messages, isLoading]);

  // Read config settings for token costs
  const configStr = localStorage.getItem('caseedge-system-config');
  const hintCost = configStr ? JSON.parse(configStr).hintCost ?? 2 : 2;

  const handleStartInterview = async () => {
    sounds.playLaunch();
    setIsLoading(true);
    
    const initialInterviewerPrompt = `Hello, I'm your interviewer today. I've reviewed your active recommendation for the case study. Let's begin the interview. Can you walk me through your overall approach and highlight why you prioritized these specific pillars in your recommendation?`;

    const initialMessage: MockInterviewMessage = {
      id: `msg_init_${Date.now()}`,
      sender: 'interviewer',
      text: initialInterviewerPrompt,
      timestamp: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    };

    setAppState(prev => ({
      ...prev,
      mockInterview: {
        config: {
          persona: selectedPersona,
          focus: selectedFocus
        },
        messages: [initialMessage],
        feedback: null,
        status: 'active'
      }
    }));
    
    setIsLoading(false);
    toast.success("Mock Interview Started! Focus, think structured, and type your responses.");
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isLoading) return;

    sounds.playClick();
    const userMessageText = userInput.trim();
    setUserInput('');

    const userMessage: MockInterviewMessage = {
      id: `msg_user_${Date.now()}`,
      sender: 'user',
      text: userMessageText,
      timestamp: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    };

    // Update session locally to show user's reply immediately
    const updatedMessages = [...session.messages, userMessage];
    setAppState(prev => ({
      ...prev,
      mockInterview: {
        ...prev.mockInterview!,
        messages: updatedMessages
      }
    }));

    setIsLoading(true);

    try {
      // Call Gemini API to generate response
      const response = await generateMockInterviewResponse(
        appState.caseBrief,
        session.config?.persona || 'mbb_partner',
        session.config?.focus || 'all',
        updatedMessages,
        userMessageText
      );

      const interviewerMessage: MockInterviewMessage = {
        id: `msg_interviewer_${Date.now()}`,
        sender: 'interviewer',
        text: response || "I see. Let's dig deeper into that logic. How do you quantify the operational feasibility of this approach?",
        timestamp: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
      };

      setAppState(prev => ({
        ...prev,
        mockInterview: {
          ...prev.mockInterview!,
          messages: [...updatedMessages, interviewerMessage]
        }
      }));
      sounds.playSuccess();
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to connect with interviewer: " + (err?.message || "Check your internet connection."));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestHint = async () => {
    if (isLoading || isRequestingHint) return;
    
    if ((appState.tokens ?? 0) < hintCost) {
      sounds.playError();
      toast.error(`Insufficient tokens! You need at least ${hintCost} ⚡ to request a hint.`);
      return;
    }

    sounds.playClick();
    setIsRequestingHint(true);

    try {
      const hint = await getMockInterviewHint(
        appState.caseBrief,
        session.config?.focus || 'all',
        session.messages
      );

      const hintMessage: MockInterviewMessage = {
        id: `msg_hint_${Date.now()}`,
        sender: 'system',
        text: `Coach Hint: ${hint}`,
        timestamp: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
        isHint: true
      };

      setAppState(prev => ({
        ...prev,
        tokens: Math.max(0, (prev.tokens ?? 50) - hintCost),
        mockInterview: {
          ...prev.mockInterview!,
          messages: [...prev.mockInterview!.messages, hintMessage]
        }
      }));

      sounds.playSuccess();
      toast.success(`Socratic Coach hint unlocked! (-${hintCost} ⚡)`);
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to generate coach hint: " + (err?.message || ""));
    } finally {
      setIsRequestingHint(false);
    }
  };

  const handleRequestScorecard = async () => {
    if (session.messages.length < 2) {
      toast.error("Please answer at least one question before requesting a scorecard.");
      return;
    }

    sounds.playClick();
    setIsRequestingScorecard(true);

    try {
      const scorecard: MockInterviewFeedback = await generateMockInterviewFeedback(
        appState.caseBrief,
        session.config?.persona || 'mbb_partner',
        session.config?.focus || 'all',
        session.messages
      );

      setAppState(prev => ({
        ...prev,
        isSessionCompleted: true,
        mockInterview: {
          ...prev.mockInterview!,
          feedback: scorecard,
          status: 'completed'
        }
      }));

      sounds.playSuccess();
      toast.success("Mock Interview completed! Check your Socratic scorecard below.");
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to compile evaluation scorecard: " + (err?.message || ""));
    } finally {
      setIsRequestingScorecard(false);
    }
  };

  const handleRestart = () => {
    sounds.playClick();
    setAppState(prev => ({
      ...prev,
      mockInterview: null
    }));
  };

  const getPersonaBadgeColor = (p: string) => {
    switch (p) {
      case 'supportive': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'mbb_partner': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'skeptical': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const getPersonaLabel = (p: string) => {
    switch (p) {
      case 'supportive': return 'Supportive Coach';
      case 'mbb_partner': return 'MBB Partner';
      case 'skeptical': return 'Skeptical Client';
      default: return 'Interviewer';
    }
  };

  const getFocusLabel = (f: string) => {
    switch (f) {
      case 'structuring': return 'Structuring Logic';
      case 'math': return 'Case Math / Quant';
      case 'synthesis': return 'Synthesis & Delivery';
      default: return 'General Case flow';
    }
  };

  // Rendering setup screen
  if (session.status === 'not_started') {
    return (
      <section className="bg-[#0f172a] flex flex-col flex-1 min-h-0 border border-slate-800 rounded-lg overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-[#070b14]/50 shrink-0">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-cyan-400" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Conversational Mock Partner
            </h2>
          </div>
          <button 
            onClick={onGoBack}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-850 hover:bg-slate-800 border border-slate-700/50 text-[10px] uppercase font-bold text-slate-400 hover:text-slate-200 transition cursor-pointer"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>Go Back</span>
          </button>
        </div>

        <div className="p-6 space-y-6 flex-1 overflow-y-auto custom-scrollbar flex flex-col justify-center max-w-2xl mx-auto w-full">
          {!appState.expandedRecommendation ? (
            <EmptyState 
              title="Awaiting Core Recommendation"
              description="You need to write and calibrate a recommendation first in the Recommendation section before starting a mock interview."
              actionLabel="Go to Recommendation"
              onAction={onGoBack}
            />
          ) : (
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 md:p-8 space-y-6 shadow-2xl relative overflow-hidden backdrop-blur-md">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-500 to-indigo-500" />
              
              <div className="text-center space-y-2">
                <h3 className="text-xl font-bold font-heading text-white">Socratic Mock Partner</h3>
                <p className="text-xs text-slate-400 leading-relaxed font-sans">
                  Simulate a conversational case interview with a dedicated mock interviewer persona. Practice logic structuring, case math questions, and recommendation delivery.
                </p>
              </div>

              {/* Persona Selector */}
              <div className="space-y-3">
                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Choose Interviewer Persona
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'supportive', title: 'Supportive Coach', desc: 'Encouraging, patient, gives Socratic prompts to fill logic gaps.', emoji: '🤝' },
                    { id: 'mbb_partner', title: 'MBB Partner', desc: 'Direct, rapid-fire, highly analytical, focuses on quantitative feasibility.', emoji: '👔' },
                    { id: 'skeptical', title: 'Skeptical Client', desc: 'Risk-averse, doubts implementation, demands robust evidence.', emoji: '🧐' }
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        sounds.playClick();
                        setSelectedPersona(p.id as any);
                      }}
                      className={`text-left p-4 rounded-xl border transition-all flex flex-col justify-between hover:scale-[1.01] cursor-pointer ${
                        selectedPersona === p.id 
                          ? 'bg-blue-600/10 border-blue-500/70 shadow-lg shadow-blue-900/15'
                          : 'bg-slate-950/20 border-slate-850 hover:border-slate-750 text-slate-400 hover:text-slate-350'
                      }`}
                    >
                      <div className="flex justify-between items-center w-full mb-1">
                        <span className="text-xs font-bold text-white leading-none">{p.title}</span>
                        <span className="text-base select-none">{p.emoji}</span>
                      </div>
                      <p className="text-[10px] text-slate-450 mt-1 leading-normal font-sans">{p.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Case Focus Selector */}
              <div className="space-y-3">
                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Select Case Focus Area
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { id: 'all', title: 'Full Case Flow' },
                    { id: 'structuring', title: 'Structuring Logic' },
                    { id: 'math', title: 'Case Math' },
                    { id: 'synthesis', title: 'Synthesis' }
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => {
                        sounds.playClick();
                        setSelectedFocus(f.id as any);
                      }}
                      className={`py-2.5 px-3 rounded-lg border text-[10px] font-extrabold uppercase tracking-wide text-center transition-all cursor-pointer ${
                        selectedFocus === f.id
                          ? 'bg-cyan-500/15 border-cyan-500/70 text-cyan-400'
                          : 'bg-slate-950/20 border-slate-850 hover:border-slate-750 text-slate-400 hover:text-slate-350'
                      }`}
                    >
                      {f.title}
                    </button>
                  ))}
                </div>
              </div>

              {/* Start CTA */}
              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                  <Zap className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400/20 shrink-0" />
                  <span>Hints cost: <strong>{hintCost} ⚡</strong></span>
                </div>
                
                <button
                  onClick={handleStartInterview}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase tracking-widest text-xs px-6 py-3 rounded-xl transition-all shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                >
                  Start Mock Interview
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    );
  }

  // Rendering active chat interface
  if (session.status === 'active') {
    return (
      <section className="bg-[#0f172a] flex flex-col flex-1 min-h-0 border border-slate-800 rounded-lg overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Chat Header */}
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-[#070b14]/50 shrink-0">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-4 h-4 text-cyan-400" />
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs font-bold text-white font-heading">
                Mock Case Interview
              </span>
              <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${getPersonaBadgeColor(session.config?.persona || 'mbb_partner')}`}>
                {getPersonaLabel(session.config?.persona || 'mbb_partner')}
              </span>
              <span className="px-2 py-0.5 rounded text-[9px] font-bold border border-slate-700 bg-slate-800/50 text-slate-400 uppercase tracking-wider font-mono">
                Focus: {getFocusLabel(session.config?.focus || 'all')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRequestScorecard}
              disabled={isLoading || isRequestingScorecard || session.messages.length < 2}
              className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-650 to-teal-650 hover:from-emerald-600 hover:to-teal-600 disabled:from-slate-800 disabled:to-slate-800 border border-emerald-500/20 disabled:border-transparent text-white disabled:text-slate-500 rounded text-[10px] font-extrabold uppercase tracking-widest transition-all cursor-pointer hover:shadow-lg hover:shadow-emerald-950/20 disabled:cursor-not-allowed"
            >
              {isRequestingScorecard ? 'Compiling Score...' : 'Request Scorecard'}
            </button>
            <button
              onClick={handleRestart}
              className="p-1.5 hover:bg-slate-850 text-slate-400 hover:text-white rounded border border-slate-700/50 transition cursor-pointer"
              title="Restart session"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Conversation Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4 bg-slate-950/5 select-text">
          {session.messages.map((msg, idx) => {
            const isInterviewer = msg.sender === 'interviewer';
            const isSystem = msg.sender === 'system';
            
            if (isSystem) {
              return (
                <div key={msg.id || idx} className="flex justify-center py-2 animate-in fade-in zoom-in-95 duration-200">
                  <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs px-4 py-2.5 rounded-xl max-w-md font-sans italic leading-relaxed shadow-sm">
                    {msg.text}
                  </div>
                </div>
              );
            }

            return (
              <div
                key={msg.id || idx}
                className={`flex w-full gap-3 ${isInterviewer ? 'justify-start' : 'justify-end'} animate-in fade-in duration-300`}
              >
                {isInterviewer && (
                  <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold text-xs select-none shrink-0">
                    👔
                  </div>
                )}

                <div className="flex flex-col max-w-[75%] space-y-1.5">
                  <div className={`p-4 rounded-2xl text-xs leading-relaxed border ${
                    isInterviewer 
                      ? 'bg-slate-900 border-slate-800 text-slate-200 rounded-tl-none font-sans'
                      : 'bg-blue-600 border-blue-500 text-white rounded-tr-none font-sans font-medium'
                  }`}>
                    {msg.text}
                  </div>
                  <span className={`text-[9px] font-mono text-slate-650 ${isInterviewer ? 'text-left' : 'text-right'}`}>
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isLoading && (
            <div className="flex w-full gap-3 justify-start items-center">
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold text-xs select-none shrink-0">
                👔
              </div>
              <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl rounded-tl-none flex items-center gap-1 animate-pulse">
                <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-800 bg-[#070b14]/50 shrink-0">
          <form onSubmit={handleSendMessage} className="flex gap-3 items-center">
            
            {/* Hint Button */}
            <button
              type="button"
              onClick={handleRequestHint}
              disabled={isLoading || isRequestingHint}
              className="px-3 py-3 bg-slate-900 hover:bg-slate-850 disabled:bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-amber-400 disabled:text-slate-600 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 focus:outline-none shrink-0"
              title={`Request a socratic coach hint (costs ${hintCost} tokens)`}
            >
              {isRequestingHint ? (
                <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
              ) : (
                <HelpCircle className="w-4 h-4" />
              )}
              <span className="hidden sm:inline text-[10px] font-extrabold uppercase tracking-wider">
                Hint ({hintCost}⚡)
              </span>
            </button>

            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder={isLoading ? 'Interviewer is thinking...' : 'Structure your response...'}
              disabled={isLoading}
              className="flex-1 bg-slate-950/60 border border-slate-850 focus:border-blue-500/80 rounded-xl py-3 px-4 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-sans"
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={isLoading || !userInput.trim()}
              className="p-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-900 border border-transparent disabled:border-slate-800 text-white disabled:text-slate-600 rounded-xl transition-all cursor-pointer flex items-center justify-center shrink-0 shadow-lg shadow-blue-900/10 focus:outline-none"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </section>
    );
  }

  // Rendering final scorecard / completed screen
  if (session.status === 'completed' && session.feedback) {
    const fb = session.feedback;
    const scoreColorClass = 
      fb.score >= 80 ? 'text-emerald-400 border-emerald-500/25 bg-emerald-500/10' :
      fb.score >= 60 ? 'text-amber-400 border-amber-500/25 bg-amber-500/10' :
      'text-rose-400 border-rose-500/25 bg-rose-500/10';

    return (
      <section className="bg-[#0f172a] flex flex-col flex-1 min-h-0 border border-slate-800 rounded-lg overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-[#070b14]/50 shrink-0">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-500 animate-bounce" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Evaluation Scorecard
            </h2>
          </div>
          <button 
            onClick={handleRestart}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-[10px] font-bold uppercase tracking-widest transition cursor-pointer shadow-md"
          >
            <span>Restart Mock</span>
          </button>
        </div>

        <div className="p-6 space-y-6 flex-1 overflow-y-auto custom-scrollbar select-text max-w-4xl mx-auto w-full">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            
            {/* Score Ring / Summary */}
            <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-between text-center space-y-4">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">
                Overall Grade
              </span>

              {/* Large Score Indicator */}
              <div className={`w-28 h-28 rounded-full border-2 flex flex-col items-center justify-center ${scoreColorClass} shadow-xl animate-pulse`}>
                <span className="text-3xl font-extrabold font-heading leading-none">{fb.score}</span>
                <span className="text-[10px] uppercase font-bold tracking-wider mt-1 text-slate-400">/ 100</span>
              </div>

              <div className="space-y-1.5 w-full">
                <span className="text-[10px] font-mono text-cyan-400 font-extrabold uppercase tracking-widest block">
                  Coach Summary
                </span>
                <p className="text-xs text-slate-350 leading-relaxed font-sans text-left bg-slate-950/40 border border-slate-850 p-4 rounded-xl max-h-60 overflow-y-auto custom-scrollbar">
                  {fb.overallSummary}
                </p>
              </div>
            </div>

            {/* Strengths & Weaknesses checklists */}
            <div className="lg:col-span-2 space-y-6 flex flex-col justify-between">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Strengths */}
                <div className="bg-slate-900/20 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-400 border-b border-slate-850 pb-2">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-[10px] uppercase font-bold tracking-wider">Key Strengths</span>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-300 font-sans list-none pl-0">
                    {fb.strengths.map((str, i) => (
                      <li key={i} className="flex items-start gap-2 leading-relaxed">
                        <span className="text-emerald-500 text-sm mt-0.5 shrink-0">✓</span>
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Weaknesses */}
                <div className="bg-slate-900/20 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center gap-2 text-amber-400 border-b border-slate-850 pb-2">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-[10px] uppercase font-bold tracking-wider">Logic Gaps</span>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-300 font-sans list-none pl-0">
                    {fb.weaknesses.map((weak, i) => (
                      <li key={i} className="flex items-start gap-2 leading-relaxed">
                        <span className="text-rose-500 text-sm mt-0.5 shrink-0">✗</span>
                        <span>{weak}</span>
                      </li>
                    ))}
                  </ul>
                </div>

              </div>

              {/* Actionable Tips */}
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-3 flex-1 flex flex-col justify-between">
                <div className="flex items-center gap-2 text-cyan-400 border-b border-slate-850 pb-2 shrink-0">
                  <Bookmark className="w-4 h-4" />
                  <span className="text-[10px] uppercase font-bold tracking-wider">Actionable Improvement Tips</span>
                </div>
                <div className="space-y-2.5 text-xs text-slate-300 font-sans pl-1 pt-1.5 flex-1">
                  {fb.actionableTips.map((tip, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-mono font-bold text-[10px] shrink-0 border border-cyan-500/20">
                        {i + 1}
                      </span>
                      <p className="leading-relaxed">{tip}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>

          {/* Bottom Complete CTA */}
          <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-slate-500 font-mono">
              Session completed. Practice analytics saved to your dashboard.
            </span>
            <div className="flex gap-3">
              <button
                onClick={handleRestart}
                className="px-5 py-2.5 bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer hover:scale-[1.01]"
              >
                Practice Again
              </button>
              <button
                onClick={onGoBack}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer hover:scale-[1.01] shadow-lg shadow-blue-500/15"
              >
                Return to Recommendation
              </button>
            </div>
          </div>

        </div>
      </section>
    );
  }

  return null;
};

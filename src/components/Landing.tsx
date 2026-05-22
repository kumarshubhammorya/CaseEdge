import React, { useEffect, useState, useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { 
  FileText, Network, CheckCircle, Presentation,
  HelpCircle, Database, Calculator, AlertTriangle,
  ArrowRight, ShieldCheck, Zap, Bot, BrainCircuit, ExternalLink, Grid,
  Clock, Sparkles, AlertCircle, X
} from 'lucide-react';
import { sounds } from '../lib/sounds';

interface LandingProps {
  onLaunch: () => void;
}

const FadeInView: React.FC<{ children: React.ReactNode, delay?: number, className?: string }> = ({ children, delay = 0, className = '' }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.6, ease: "easeOut", delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const Landing: React.FC<LandingProps> = ({ onLaunch }) => {
  const [scrolled, setScrolled] = useState(false);
  const [typedText, setTypedText] = useState("");
  const [mockTab, setMockTab] = useState<'intake' | 'tree' | 'scr'>('intake');
  const problemText = "Declining profitability in European market despite growing revenue numbers. Need to identify root cause and propose turnaround strategy.";
  
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    let i = 0;
    const typingInterval = setInterval(() => {
      if (i < problemText.length) {
        setTypedText(problemText.substring(0, i + 1));
        i++;
      } else {
        clearInterval(typingInterval);
      }
    }, 30);
    return () => clearInterval(typingInterval);
  }, []);

  const scrollToFeatures = () => {
    sounds.playClick();
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToHowItWorks = () => {
    sounds.playClick();
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToAbout = () => {
    sounds.playClick();
    document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-bg-dark text-slate-200 selection:bg-[#00d4ff] selection:text-black font-sans relative overflow-x-hidden pb-12">
      {/* Animated Background Grid */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.12] pointer-events-none fixed [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />
      
      {/* Ambient Decorative Lighting */}
      <div className="absolute top-[-10%] left-[-10%] w-[45vw] h-[45vw] rounded-full bg-blue-600/10 blur-[130px] pointer-events-none animate-float-1" />
      <div className="absolute top-[30%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-cyan-500/10 blur-[160px] pointer-events-none animate-float-2" />
      <div className="absolute bottom-[10%] left-[10%] w-[45vw] h-[45vw] rounded-full bg-purple-600/10 blur-[140px] pointer-events-none animate-float-1" />

      {/* Pill Navbar */}
      <div className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4">
        <nav className={`w-full max-w-7xl rounded-full border transition-all duration-300 backdrop-blur-lg ${
          scrolled 
            ? "bg-[#111318]/80 border-white/10 py-3 px-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)]" 
            : "bg-white/[0.02] border-white/5 py-4 px-8 shadow-none"
        }`}>
          <div className="flex justify-between items-center w-full">
            <div className="flex items-center gap-1 sm:gap-2">
              <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" className="w-[32px] h-[32px] md:w-[38px] md:h-[38px]">
                <rect x="0" y="0" width="48" height="48" rx="12" fill="#0b0f17" />
                <g transform="translate(6, 6)">
                  <defs>
                    <linearGradient id="hexGrad1" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#2563eb" />
                      <stop offset="100%" stopColor="#1d4ed8" />
                    </linearGradient>
                    <linearGradient id="hexGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#00d4ff" />
                      <stop offset="100%" stopColor="#0891b2" />
                    </linearGradient>
                  </defs>
                  <path d="M18 2 L6 9 L6 27 L18 34" stroke="url(#hexGrad1)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  <path d="M18 2 L30 9 L30 27 L18 34" stroke="url(#hexGrad2)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  
                  {/* Bars */}
                  <rect x="10" y="16" width="6" height="14" fill="#2563eb" />
                  <rect x="18" y="12" width="6" height="18" fill="#00d4ff" />

                  {/* Line chart */}
                  <polyline points="4,22 12,16 20,17 32,8" stroke="#ffffff" strokeWidth="2" fill="none" />
                  <circle cx="4" cy="22" r="2" fill="#00d4ff" />
                  <circle cx="12" cy="16" r="2" fill="#00d4ff" />
                  <circle cx="20" cy="17" r="2" fill="#00d4ff" />
                  <circle cx="32" cy="8" r="2" fill="#00d4ff" />
                </g>
              </svg>
              <span className="font-heading font-bold text-lg md:text-xl tracking-tight">
                <span className="text-white">Case</span><span className="text-[#3b82f6]">Edge</span>
              </span>
            </div>
            
            <div className="hidden md:flex items-center gap-8 text-xs font-semibold uppercase tracking-wider text-white/50">
              <button onClick={scrollToFeatures} className="hover:text-white transition-colors cursor-pointer">Features</button>
              <button onClick={scrollToHowItWorks} className="hover:text-white transition-colors cursor-pointer">How It Works</button>
              <button onClick={scrollToAbout} className="hover:text-white transition-colors cursor-pointer">About</button>
            </div>
            
            <button 
              onClick={() => {
                sounds.playLaunch();
                onLaunch();
              }}
              className="text-xs md:text-sm font-semibold bg-white text-black hover:bg-slate-200 px-4 py-2 rounded-full transition-all flex items-center gap-1.5 cursor-pointer shadow-[0_4px_12px_rgba(255,255,255,0.15)] hover:shadow-[0_4px_20px_rgba(255,255,255,0.25)] hover:scale-102"
            >
              Launch App <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </nav>
      </div>

      {/* Hero Section */}
      <section className="relative pt-36 pb-16 md:pt-48 md:pb-24 lg:pt-56 lg:pb-36 px-4 md:px-6 flex flex-col items-center text-center">
        {/* Glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] md:w-[700px] md:h-[700px] bg-cyan-glow blur-[120px] rounded-full pointer-events-none" />
        
        <FadeInView className="max-w-5xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/[0.04] border border-white/10 rounded-full text-xs font-semibold text-blue-300 mb-6 backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-[#00d4ff]" />
            <span>Structured AI Suite for Consultative Case Prep</span>
          </div>

          <h1 className="font-heading text-4xl sm:text-6xl md:text-8xl font-black tracking-tight mb-6 md:mb-8 leading-none">
            <span className="bg-gradient-to-b from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">Your Unfair Advantage</span> <br className="hidden md:block"/> 
            <span className="bg-gradient-to-r from-[#00d4ff] via-blue-400 to-[#b55fe6] bg-clip-text text-transparent">in the Case Room.</span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-white/50 max-w-3xl mx-auto mb-8 md:mb-12 leading-relaxed font-sans">
            CaseEdge delivers a structured, MECE-guided workflow that empowers MBA teams to frame cases, quantify options, model recommendations, and rehearse judge question drills.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-5 w-full px-4 sm:px-0 max-w-lg mx-auto">
            <button 
              onClick={() => {
                sounds.playLaunch();
                onLaunch();
              }}
              className="w-full sm:w-auto px-8 py-4 bg-[#00d4ff] hover:bg-[#00b0d4] text-black font-bold text-sm md:text-base rounded-full flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 shadow-[0_0_30px_rgba(0,212,255,0.4)] hover:shadow-[0_0_40px_rgba(0,212,255,0.6)] cursor-pointer"
            >
               Launch CaseEdge <ArrowRight className="w-4 h-4" />
            </button>
            <button 
              onClick={scrollToFeatures}
              className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-semibold text-sm md:text-base rounded-full border border-white/10 transition-all hover:border-white/20 cursor-pointer"
            >
               See How It Works
            </button>
          </div>
        </FadeInView>

        {/* Interactive Hero App Mockup */}
        <FadeInView delay={0.2} className="w-full max-w-5xl mt-16 md:mt-24 relative z-10 group perspective-[1000px]">
          <div className="rounded-2xl border border-white/10 bg-[#0f1115]/90 shadow-2xl overflow-hidden backdrop-blur-sm transform transition-all duration-700 ease-out hover:rotate-x-[1deg] hover:shadow-[0_20px_50px_rgba(0,212,255,0.18)] ring-1 ring-white/5">
            {/* Header bar */}
            <div className="h-12 md:h-14 bg-[#15181e] border-b border-white/5 flex items-center px-4 justify-between relative">
              <div className="flex gap-1.5 items-center">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              
              {/* Interactive Tabs */}
              <div className="flex bg-slate-900/60 p-1 rounded-full border border-white/5">
                {[
                  { id: 'intake', label: '1. Case Intake', icon: FileText },
                  { id: 'tree', label: '2. MECE Tree', icon: Network },
                  { id: 'scr', label: '3. SCR Narrative', icon: CheckCircle }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      sounds.playClick();
                      setMockTab(tab.id as any);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-xs font-semibold font-mono transition-all uppercase tracking-tight cursor-pointer ${
                      mockTab === tab.id
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    <tab.icon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">{tab.label.split(' ')[1]}</span>
                  </button>
                ))}
              </div>
              <div className="text-[10px] font-mono text-white/20 hidden md:block">case_edge_suite.sh</div>
            </div>

            {/* Mockup content */}
            <div className="min-h-[220px] md:min-h-[280px] p-6 md:p-10 text-left bg-gradient-to-br from-[#0f1115] to-[#121620]">
              {mockTab === 'intake' && (
                <div className="animate-in fade-in duration-300 space-y-4">
                  {/* File Upload Box */}
                  <div className="flex items-center gap-3 p-3 bg-white/[0.03] border border-white/10 rounded-xl mb-4">
                    <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 font-bold text-xs font-mono">PDF</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-white truncate">retail_profitability_brief.pdf</div>
                      <div className="text-[10px] text-white/40">642 KB • Fully Analyzed</div>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/25">
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                      <span>EXTRACTED</span>
                    </div>
                  </div>

                  <div className="border-l-[3px] border-cyan-400 bg-cyan-950/5 p-4 rounded-r-xl space-y-3">
                    <div className="text-[10px] md:text-xs font-bold text-cyan-400 uppercase tracking-wider font-mono flex items-center gap-2">
                      <BrainCircuit className="w-4 h-4 animate-pulse" /> Case Profile Extracted
                    </div>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-[9px] font-mono text-white/35 uppercase tracking-wider">Industry</h4>
                        <div className="text-white font-sans text-sm md:text-base font-semibold">Consumer Electronics</div>
                      </div>
                      <div>
                        <h4 className="text-[9px] font-mono text-white/35 uppercase tracking-wider">Core Problem Statement</h4>
                        <div className="text-white font-sans text-sm md:text-lg leading-relaxed font-medium">
                          {typedText}
                          <span className="animate-pulse inline-block w-1.5 h-4 bg-cyan-400 ml-1 align-baseline"/>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {mockTab === 'tree' && (
                <div className="animate-in fade-in duration-300 space-y-6">
                  <div className="text-[10px] md:text-xs font-bold text-blue-400 uppercase tracking-wider font-mono flex items-center gap-2">
                    <Network className="w-4 h-4" /> MECE Framework Branching
                  </div>
                  <div className="flex flex-col md:flex-row items-center gap-4 justify-between relative min-h-[180px] p-2">
                    {/* Root Node */}
                    <div className="w-full md:w-1/4 p-3 bg-blue-600/10 border border-blue-500/30 rounded-xl text-center shadow-[0_0_15px_rgba(59,130,246,0.1)] relative z-10">
                      <div className="text-[10px] text-blue-400 font-mono font-bold uppercase tracking-wider">ROOT CASE</div>
                      <div className="text-xs font-semibold text-white mt-1">European Profit Decline</div>
                      <div className="text-[10px] text-blue-300/80 font-mono mt-0.5 font-bold">-15% Margin</div>
                    </div>

                    {/* Connecting line helper (Desktop) */}
                    <div className="hidden md:block absolute left-[25%] right-[25%] top-1/2 h-[1px] bg-slate-800 z-0" />

                    {/* Branches */}
                    <div className="w-full md:w-3/4 flex flex-col sm:flex-row gap-4 relative z-10">
                      {/* Branch 1 */}
                      <div className="flex-1 p-3 bg-white/[0.02] border border-white/10 hover:border-blue-500/30 rounded-xl transition-all shadow-md group/node">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] text-white/40 font-mono font-bold">BRANCH A</span>
                          <span className="text-[9px] font-mono text-[#00d4ff] bg-[#00d4ff]/10 px-1.5 py-0.5 rounded">REVENUE</span>
                        </div>
                        <div className="text-xs font-semibold text-white mb-2">Revenue Streams</div>
                        <ul className="text-[10px] text-white/50 space-y-1 font-mono list-none">
                          <li className="flex items-start gap-1">
                            <span className="text-[#00d4ff] font-bold">•</span>
                            <span>Shift to entry-level models</span>
                          </li>
                          <li className="flex items-start gap-1">
                            <span className="text-[#00d4ff] font-bold">•</span>
                            <span>Local e-commerce channels</span>
                          </li>
                        </ul>
                      </div>

                      {/* Branch 2 */}
                      <div className="flex-1 p-3 bg-white/[0.02] border border-white/10 hover:border-[#b55fe6]/30 rounded-xl transition-all shadow-md group/node">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] text-white/40 font-mono font-bold">BRANCH B</span>
                          <span className="text-[9px] font-mono text-[#b55fe6] bg-[#b55fe6]/10 px-1.5 py-0.5 rounded">COSTS</span>
                        </div>
                        <div className="text-xs font-semibold text-white mb-2">Cost Structure</div>
                        <ul className="text-[10px] text-white/50 space-y-1 font-mono list-none">
                          <li className="flex items-start gap-1">
                            <span className="text-[#b55fe6] font-bold">•</span>
                            <span>Logistics scaling costs (+35%)</span>
                          </li>
                          <li className="flex items-start gap-1">
                            <span className="text-[#b55fe6] font-bold">•</span>
                            <span>Reliance on premium air freight</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {mockTab === 'scr' && (
                <div className="animate-in fade-in duration-300 space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="text-[10px] md:text-xs font-bold text-purple-400 uppercase tracking-wider font-mono flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" /> Structured SCR Narrative
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-mono text-white/40">
                      <span>SLIDE 4 OF 8</span>
                      <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                        <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                        <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                        <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-slate-950/50 border border-white/5 rounded-xl p-4 md:p-6 shadow-[inset_0_1px_3px_rgba(0,0,0,0.4)]">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Situation */}
                      <div className="p-4 bg-white/[0.02] rounded-xl border border-white/5 hover:border-purple-500/30 transition-all flex flex-col justify-between">
                        <div>
                          <span className="text-[9px] font-mono text-purple-400 font-bold uppercase tracking-wider px-2 py-0.5 bg-purple-500/10 rounded">Situation</span>
                          <p className="text-[11px] sm:text-xs text-white/80 mt-3 leading-relaxed">
                            European market revenues continue to grow at 12% YoY, but overall operating profit margin has compressed by 15% due to rising fulfillment overheads.
                          </p>
                        </div>
                      </div>
                      {/* Complication */}
                      <div className="p-4 bg-white/[0.02] rounded-xl border border-white/5 hover:border-purple-500/30 transition-all flex flex-col justify-between">
                        <div>
                          <span className="text-[9px] font-mono text-purple-400 font-bold uppercase tracking-wider px-2 py-0.5 bg-purple-500/10 rounded">Complication</span>
                          <p className="text-[11px] sm:text-xs text-white/80 mt-3 leading-relaxed">
                            Shipping costs have risen due to reliance on air freight, and competitive local players are offering free same-day delivery, forcing price matching.
                          </p>
                        </div>
                      </div>
                      {/* Resolution */}
                      <div className="p-4 bg-white/[0.02] rounded-xl border border-white/5 hover:border-purple-500/30 transition-all flex flex-col justify-between">
                        <div>
                          <span className="text-[9px] font-mono text-purple-400 font-bold uppercase tracking-wider px-2 py-0.5 bg-purple-500/10 rounded">Resolution</span>
                          <p className="text-[11px] sm:text-xs text-white/80 mt-3 leading-relaxed">
                            Establish regional 3PL hubs in Western Europe, migrate 60% of shipments to sea-freight, and launch a VIP subscription to cover logistics costs.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </FadeInView>
      </section>

      {/* Social Proof Bar */}
      <div className="border-y border-white/10 bg-[#111318]/50 py-5 relative z-10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 text-center font-mono text-[10px] sm:text-xs text-white/40 flex flex-col md:flex-row justify-center items-center gap-2 md:gap-4 flex-wrap uppercase tracking-wider font-semibold">
          <span>Built for MBA case competitions</span>
          <span className="hidden md:inline text-blue-500/50">·</span>
          <span>Free & open to use</span>
          <span className="hidden md:inline text-blue-500/50">·</span>
          <span>No account required</span>
        </div>
      </div>

      {/* Problem Section */}
      <section className="py-20 md:py-28 relative z-10 px-4 md:px-6 max-w-7xl mx-auto">
        <FadeInView>
          <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-black text-center mb-12 md:mb-20">
            Case competitions are won <br className="hidden sm:block"/> in the preparation room.
          </h2>
        </FadeInView>
        <div className="grid md:grid-cols-3 gap-6">
          <FadeInView delay={0.1} className="bg-gradient-to-br from-slate-900/60 to-slate-950/80 p-6 md:p-8 border border-white/5 hover:border-orange-500/20 shadow-[0_8px_32px_rgba(0,0,0,0.4)] rounded-2xl transition-all duration-300 hover:-translate-y-1.5 backdrop-blur-md group/card cursor-pointer">
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center mb-6 text-orange-400 border border-orange-500/15 group-hover/card:scale-110 transition-transform shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg mb-2 text-white group-hover/card:text-orange-400 transition-colors">The 30-Minute Squeeze</h3>
            <p className="text-white/60 leading-relaxed text-sm">
              You have 30 minutes to crack a complex case. Most of that time gets wasted on organizing raw notes, debating frameworks, and designing layout structures.
            </p>
          </FadeInView>
          <FadeInView delay={0.2} className="bg-gradient-to-br from-slate-900/60 to-slate-950/80 p-6 md:p-8 border border-white/5 hover:border-orange-500/20 shadow-[0_8px_32px_rgba(0,0,0,0.4)] rounded-2xl transition-all duration-300 hover:-translate-y-1.5 backdrop-blur-md group/card cursor-pointer">
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center mb-6 text-orange-400 border border-orange-500/15 group-hover/card:scale-110 transition-transform shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg mb-2 text-white group-hover/card:text-orange-400 transition-colors">Generic AI Output Falls Flat</h3>
            <p className="text-white/60 leading-relaxed text-sm">
              Standard chatbots output wordy, unstructured summaries. They fail to build MECE-compliant logic trees or deliver structured SCR narratives suited for consulting slide formats.
            </p>
          </FadeInView>
          <FadeInView delay={0.3} className="bg-gradient-to-br from-slate-900/60 to-slate-950/80 p-6 md:p-8 border border-white/5 hover:border-orange-500/20 shadow-[0_8px_32px_rgba(0,0,0,0.4)] rounded-2xl transition-all duration-300 hover:-translate-y-1.5 backdrop-blur-md group/card cursor-pointer">
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center mb-6 text-orange-400 border border-orange-500/15 group-hover/card:scale-110 transition-transform shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
              <AlertCircle className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg mb-2 text-white group-hover/card:text-orange-400 transition-colors">The Cold-Call Freeze</h3>
            <p className="text-white/60 leading-relaxed text-sm">
              Judges quickly poke holes in untested numbers. Most teams stumble because they haven't explicitly logged their assumptions or simulated aggressive cross-examination.
            </p>
          </FadeInView>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 md:py-28 relative z-10 px-4 md:px-6 bg-[#0f1115]/80">
        <div className="max-w-7xl mx-auto">
          <FadeInView className="text-center mb-16 md:mb-24">
            <h2 className="font-heading text-3xl sm:text-5xl font-black mb-4">
              Everything you need. <br className="sm:hidden"/> In one workflow.
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-white/50 max-w-2xl mx-auto">
              CaseEdge mirrors the professional consult-style workflow — from intake to recommendation drafting to Q&A drills.
            </p>
          </FadeInView>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: FileText, title: "Case Intake", desc: "Upload a PDF or paste your brief. CaseEdge extracts stakeholders, constraints, and core problems in seconds.", tag: "First 5 minutes" },
              { icon: Network, title: "MECE Issue Tree", desc: "Break your core problem into structured sub-issues to make sure your approach covers all logical options.", tag: "Minutes 5–15" },
              { icon: Grid, title: "Framework Recommender", desc: "Get three custom analysis frameworks with diagnostic questions tailored to your case type.", tag: "Minutes 5–15" },
              { icon: CheckCircle, title: "Recommendation Drafter", desc: "Turn raw ideas into a professional consulting SCR narrative — Situation, Complication, Resolution.", tag: "Minutes 15–22" },
              { icon: ShieldCheck, title: "Assumption Tracker", desc: "Explicitly list and evaluate the core assumptions underlying your recommendations before judges do.", tag: "Minutes 15–22" },
              { icon: Calculator, title: "Quantification Assistant", desc: "Build directional, back-of-the-envelope financial and market sizing estimates using quick math.", tag: "Minutes 20–25" },
              { icon: HelpCircle, title: "Judge Q&A Simulator", desc: "Drill five tough judge questions with structured model answers, using your recommendations.", tag: "Final 15 minutes" },
              { icon: AlertTriangle, title: "Panic Mode", desc: "Running out of time? Automatically generate an emergency executive summary, outline, and script.", tag: "When time runs out" }
            ].map((f, i) => (
              <FadeInView key={i} delay={i * 0.05} className="group relative">
                <div 
                  onMouseEnter={() => sounds.playHover()}
                  className="bg-white/[0.01] border border-white/5 hover:border-cyan-400/30 hover:bg-white/[0.03] p-6 rounded-2xl h-full transition-all duration-300 hover:-translate-y-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.3)] flex flex-col backdrop-blur-md group/feature cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/5 flex items-center justify-center mb-4 text-[#00d4ff] border border-cyan-500/10 group-hover/feature:bg-cyan-500/15 group-hover/feature:border-[#00d4ff]/30 transition-all">
                    <f.icon className="w-5 h-5 group-hover/feature:scale-110 transition-transform" />
                  </div>
                  <h3 className="font-bold text-base md:text-lg mb-2 text-white group-hover/feature:text-[#00d4ff] transition-colors">{f.title}</h3>
                  <p className="text-xs text-white/55 mb-6 leading-relaxed flex-grow">{f.desc}</p>
                  <div className="text-[9px] font-mono font-bold text-amber-500/70 uppercase tracking-widest mt-auto border-t border-white/5 pt-3">
                    {f.tag}
                  </div>
                </div>
              </FadeInView>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 md:py-28 relative z-10 px-4 md:px-6 max-w-7xl mx-auto overflow-hidden">
        <FadeInView className="text-center mb-16 md:mb-24">
          <h2 className="font-heading text-3xl sm:text-5xl font-black mb-4">
            Brief to presentation-ready. <br className="hidden md:block"/>In under 30 minutes.
          </h2>
        </FadeInView>

        <div className="relative">
          {/* Animated line (Desktop) */}
          <div className="hidden md:block absolute top-[28px] left-[10%] right-[10%] h-[2px] border-t-2 border-dashed border-white/10 z-0" />
          <motion.div 
             initial={{ width: "0%" }}
             whileInView={{ width: "80%" }}
             transition={{ duration: 1.5, ease: "easeInOut" }}
             className="hidden md:block absolute top-[28px] left-[10%] h-[2px] border-t-2 border-dashed border-[#00d4ff] z-0" 
             viewport={{ once: true, margin: "-100px" }}
          />

          <div className="flex flex-col md:flex-row justify-between gap-8 md:gap-4 relative z-10 px-2 sm:px-0">
            {[
              "Upload your case brief & parameters",
              "AI extracts core problem & constraints",
              "Select frameworks & build MECE issue tree",
              "Draft SCR recommendation & estimate metrics",
              "Rehearse judge questions & export PDF report"
            ].map((step, i) => (
              <FadeInView key={i} delay={i * 0.1} className="flex flex-row md:flex-col items-center md:text-center gap-4 md:gap-4 flex-1 group/step">
                <div 
                  onClick={() => sounds.playClick()}
                  onMouseEnter={() => sounds.playHover()}
                  className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-[#111318] border-2 border-[#00d4ff]/60 group-hover/step:border-[#00d4ff] text-[#00d4ff] flex items-center justify-center font-heading font-bold text-sm md:text-base shadow-[0_0_15px_rgba(0,212,255,0.15)] group-hover/step:shadow-[0_0_25px_rgba(0,212,255,0.35)] transition-all flex-shrink-0 z-10 cursor-pointer"
                >
                  {i + 1}
                </div>
                <p className="text-xs sm:text-sm font-semibold text-white/70 group-hover/step:text-white transition-colors md:px-2 leading-snug">
                  {step}
                </p>
              </FadeInView>
            ))}
          </div>
        </div>
      </section>

      {/* Competitive Edge / Comparison Table */}
      <section className="py-20 md:py-28 relative z-10 px-4 md:px-6 bg-[#0f1115]/80">
        <div className="max-w-4xl mx-auto">
          <FadeInView className="text-center mb-12 md:mb-16">
            <h2 className="font-heading text-3xl sm:text-4xl font-black mb-4">
              A structured case workflow, <br className="sm:hidden"/>not just a chatbot.
            </h2>
          </FadeInView>

          <FadeInView className="overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="bg-white/[0.01] backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative">
              {/* Highlight Overlay Border for the CaseEdge column */}
              <div className="absolute top-0 bottom-0 right-0 w-1/4 border-l-2 border-[#00d4ff]/30 pointer-events-none bg-[#00d4ff]/2" />
              
              <table className="w-full min-w-[500px] border-collapse relative z-10 font-sans">
                <thead>
                  <tr className="bg-slate-900/80 border-b border-white/10">
                    <th className="py-5 px-6 text-left font-mono text-[10px] sm:text-xs text-white/40 uppercase tracking-widest w-1/2">
                      Platform Capabilities
                    </th>
                    <th className="py-5 px-6 text-center font-mono text-[10px] sm:text-xs text-white/30 uppercase tracking-widest w-1/4">
                      Standard LLM Chat
                    </th>
                    <th className="py-5 px-6 text-center bg-[#00d4ff]/5 font-mono text-[10px] sm:text-xs text-[#00d4ff] font-bold uppercase tracking-widest w-1/4 relative">
                      <div className="absolute top-1 left-1/2 -translate-x-1/2 text-[8px] bg-[#00d4ff] text-black px-1.5 py-0.2 rounded font-sans tracking-wide">BEST CHOICE</div>
                      <div className="mt-2">CaseEdge Suite</div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    "Bespoke, situation-aware framework questions",
                    "MECE issue tree branching layout",
                    "Situation-Complication-Resolution narratives",
                    "Directional quantification calculators",
                    "Interactive Judge Q&A simulation drills",
                    "Competition session timer & status nudges",
                    "PDF reporting exports & cloud synchronization"
                  ].map((row, i) => (
                    <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group/row">
                      <td className="py-4.5 px-6 text-xs sm:text-sm text-white/70 group-hover/row:text-white font-medium transition-colors">{row}</td>
                      <td className="py-4.5 px-6 text-center">
                        <div className="flex justify-center">
                          <X className="w-4 h-4 text-white/20" />
                        </div>
                      </td>
                      <td className="py-4.5 px-6 text-center bg-[#00d4ff]/5 border-l border-white/5">
                        <div className="flex justify-center">
                          <CheckCircle className="w-4.5 h-4.5 text-[#00d4ff] drop-shadow-[0_0_8px_rgba(0,212,255,0.4)]" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </FadeInView>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 md:py-28 relative z-10 px-4 md:px-6 max-w-3xl mx-auto text-center">
        <FadeInView className="bg-gradient-to-br from-slate-900 to-slate-950 p-8 md:p-12 border border-white/5 rounded-3xl shadow-xl">
          <h2 className="font-heading text-2xl sm:text-3xl font-black mb-6">
            Built by an MBA, for MBAs.
          </h2>
          <p className="text-white/60 text-xs sm:text-sm leading-relaxed mb-8">
            CaseEdge was built by Shubham Maurya, a PGDM-HCM student at the Goa Institute of Management, to solve case competition prep friction. Existing LLMs were too unstructured and fragmented. CaseEdge bundles the workflow into a single, cohesive, timed workspace powered by specialized Gemini reasoning templates.
          </p>
          <a 
            href="https://www.linkedin.com/in/shubham-kumar-b79969232/" 
            target="_blank" 
            rel="noopener noreferrer" 
            onMouseEnter={() => sounds.playHover()}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-full font-semibold transition-all text-xs border border-white/10 hover:border-white/20 cursor-pointer"
          >
            Connect on LinkedIn <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </FadeInView>
      </section>

      {/* Final CTA */}
      <section className="py-24 md:py-36 relative text-center px-4 md:px-6 overflow-hidden">
        <div className="absolute inset-0 bg-[#00d4ff]/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[300px] md:w-[800px] md:h-[500px] bg-cyan-glow blur-[110px] md:blur-[130px] rounded-[100%] pointer-events-none" />
        
        <FadeInView className="relative z-10 max-w-4xl mx-auto">
          <h2 className="font-heading text-3xl sm:text-5xl md:text-7xl font-black mb-6 text-white tracking-tight leading-none">
            Your next case competition <br className="hidden sm:block"/> starts here.
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-[#00d4ff] font-mono font-bold uppercase tracking-widest mb-10 max-w-sm mx-auto sm:max-w-none">
            Free to use. No sign-up required. Paste a brief & begin.
          </p>
          <button 
            onClick={() => {
              sounds.playLaunch();
              onLaunch();
            }}
            className="w-full sm:w-auto px-10 py-5 bg-[#00d4ff] hover:bg-[#00b0d4] text-black font-bold text-sm md:text-base rounded-full inline-flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] shadow-[0_0_30px_rgba(0,212,255,0.4)] cursor-pointer"
          >
            Launch CaseEdge <ArrowRight className="w-5 h-5" />
          </button>
        </FadeInView>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-10 px-4 md:px-6 bg-[#090b0e] relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 md:gap-4 text-xs font-mono text-white/35">
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 opacity-40 grayscale">
              <path d="M16 2 L4 9 L4 23 L16 30" stroke="#2563eb" strokeWidth="2.5" fill="none" />
              <path d="M16 2 L28 9 L28 23 L16 30" stroke="#00d4ff" strokeWidth="2.5" fill="none" />
              <rect x="8" y="16" width="6" height="14" fill="#2563eb" />
              <rect x="15" y="12" width="6" height="20" fill="#00d4ff" />
              <polyline points="4,19 11,15 18,11 28,7" stroke="#00d4ff" strokeWidth="1.5" fill="none" />
            </svg>
            <span className="font-semibold">CaseEdge · Built by Shubham Maurya</span>
          </div>
          <div className="flex flex-wrap justify-center gap-6">
            <button onClick={() => {
              sounds.playLaunch();
              onLaunch();
            }} className="hover:text-[#00d4ff] transition-colors cursor-pointer">Launch App</button>
            <a href="https://www.linkedin.com/in/shubham-kumar-b79969232/" target="_blank" rel="noopener noreferrer" className="hover:text-[#00d4ff] transition-colors">LinkedIn</a>
          </div>
          <div className="opacity-50">Powered by Gemini & AI Studio</div>
        </div>
      </footer>
    </div>
  );
};

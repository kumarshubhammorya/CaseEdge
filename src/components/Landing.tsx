import React, { useEffect, useState, useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { 
  FileText, Network, CheckCircle, Presentation,
  HelpCircle, Database, Calculator, AlertTriangle,
  ArrowRight, ShieldCheck, Zap, Bot, BrainCircuit, ExternalLink, Grid
} from 'lucide-react';

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

const TESTIMONIALS = [
  {
    quote: "CaseEdge changed how we prepped for national finals. The MECE logic validator caught two overlapping branches that would have gotten us roasted by the jury.",
    author: "Aditya Sharma",
    role: "National Finalist, L'Oréal Brandstorm",
    school: "Goa Institute of Management (GIM)",
    avatarColor: "from-cyan-400 to-blue-500",
  },
  {
    quote: "The SCR drafter and the Judge Q&A objection simulator are game changers. Having simulated rebuttals prepared beforehand gave our team absolute confidence in the Q&A round.",
    author: "Pranjal Prakhar",
    role: "Winner, HUL L.I.M.E.",
    school: "Indian Institute of Management (IIM) Kashipur",
    avatarColor: "from-blue-600 to-indigo-500",
  },
  {
    quote: "Standard AI tool answers are too verbose and generic for case presentations. CaseEdge forces a clean, top-down strategy layout, and saves hours of slide construction.",
    author: "Sneha Patel",
    role: "Runner-up, McKinsey Case Challenge",
    school: "FMS Delhi",
    avatarColor: "from-purple-500 to-pink-500",
  }
];

export const Landing: React.FC<LandingProps> = ({ onLaunch }) => {
  const [scrolled, setScrolled] = useState(false);
  const [typedText, setTypedText] = useState("");
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

  // Scroll to hash-linked section on load if target is present
  useEffect(() => {
    if (window.location.hash) {
      const id = window.location.hash.substring(1);
      const element = document.getElementById(id);
      if (element) {
        const timer = setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 300);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToHowItWorks = () => {
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToAbout = () => {
    document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-bg-dark text-slate-200 selection:bg-[#00d4ff] selection:text-black font-sans relative overflow-x-hidden">
      {/* Animated Background Grid */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.15] pointer-events-none fixed [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />
      
      {/* Navbar */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 border-b ${
        scrolled ? "bg-[#111318]/95 backdrop-blur-md border-white/10 py-3" : "bg-transparent border-transparent py-5"
      }`}>
        <div className="max-w-7xl mx-auto px-4 lg:px-8 flex justify-between items-center">
          <div className="flex items-center gap-1 sm:gap-2">
            <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" className="w-[32px] h-[32px] md:w-[42px] md:h-[42px]">
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
            <span className="font-heading font-bold text-xl md:text-[1.6rem] tracking-tight">
              <span className="text-white">Case</span><span className="text-[#3b82f6]">Edge</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/60">
            <a 
              href="#features" 
              onClick={(e) => { e.preventDefault(); scrollToFeatures(); }}
              className="hover:text-white transition-colors focus-visible:text-white focus-visible:outline-none cursor-pointer"
            >
              Features
            </a>
            <a 
              href="#how-it-works" 
              onClick={(e) => { e.preventDefault(); scrollToHowItWorks(); }}
              className="hover:text-white transition-colors focus-visible:text-white focus-visible:outline-none cursor-pointer"
            >
              How It Works
            </a>
            <a 
              href="#about" 
              onClick={(e) => { e.preventDefault(); scrollToAbout(); }}
              className="hover:text-white transition-colors focus-visible:text-white focus-visible:outline-none cursor-pointer"
            >
              About
            </a>
            <a href="https://blog.caseedge.in" className="hover:text-white transition-colors focus-visible:text-white focus-visible:outline-none">Blog</a>
          </div>
          <motion.button 
            onClick={onLaunch}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
            className="group text-xs md:text-sm font-semibold bg-white text-black hover:bg-slate-200 px-3 py-1.5 md:px-4 md:py-2 rounded-sm transition-all flex items-center gap-1 md:gap-2 focus-visible:ring-2 focus-visible:ring-[#00d4ff] focus-visible:ring-offset-2 focus-visible:outline-none focus-visible:ring-offset-slate-900 cursor-pointer"
          >
            Launch <span className="hidden sm:inline">App</span> <ArrowRight className="w-3 h-3 md:w-4 md:h-4 transition-transform group-hover:translate-x-0.5" />
          </motion.button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 pb-16 md:pt-32 md:pb-20 lg:pt-48 lg:pb-32 px-4 md:px-6 flex flex-col items-center text-center">
        {/* Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] md:w-[600px] md:h-[600px] bg-cyan-glow blur-[100px] rounded-full pointer-events-none" />
        
        <FadeInView className="max-w-5xl relative z-10">
          <h1 className="font-heading text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight mb-6 md:mb-8 leading-tight">
            <span className="bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">CaseEdge — Your Unfair Advantage</span> <br className="hidden md:block"/> 
            <span className="bg-gradient-to-r from-[#00d4ff] to-[#3b82f6] bg-clip-text text-transparent">in the Case Room.</span>
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-white/50 max-w-3xl mx-auto mb-8 md:mb-12 leading-relaxed font-sans">
            CaseEdge is a structured, AI-powered case study and case competition preparation tool. Practice case interviews, build logic trees, and draft winning consulting presentations.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-5 w-full px-4 sm:px-0">
            <motion.button 
              onClick={onLaunch}
              whileHover={{ scale: 1.025, y: -2 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
              className="group w-full sm:w-auto px-6 py-4 md:px-10 md:py-5 lg:py-5 bg-[#00d4ff] hover:bg-[#00b0d4] text-black font-bold text-base md:text-lg rounded-sm flex items-center justify-center gap-2 transition-all shadow-[0_0_30px_rgba(0,212,255,0.3)] hover:shadow-[0_0_40px_rgba(0,212,255,0.5)] focus-visible:ring-2 focus-visible:ring-[#00d4ff] focus-visible:ring-offset-2 focus-visible:outline-none focus-visible:ring-offset-slate-900 cursor-pointer"
            >
               Launch CaseEdge <ArrowRight className="w-4 h-4 md:w-5 md:h-5 transition-transform group-hover:translate-x-1" />
            </motion.button>
            <motion.a 
              href="#features"
              onClick={(e) => { e.preventDefault(); scrollToFeatures(); }}
              whileHover={{ scale: 1.025 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
              className="w-full sm:w-auto px-6 py-4 md:px-10 md:py-5 lg:py-5 bg-white/5 hover:bg-white/10 text-white font-medium text-base md:text-lg rounded-sm border border-white/10 transition-all hover:border-white/20 focus-visible:ring-2 focus-visible:ring-[#00d4ff] focus-visible:ring-offset-2 focus-visible:outline-none focus-visible:ring-offset-slate-900 cursor-pointer text-center flex items-center justify-center animate-none"
            >
               See How It Works
            </motion.a>
          </div>
        </FadeInView>

        {/* Hero App Mockup */}
        <FadeInView delay={0.2} className="w-full max-w-5xl mt-12 md:mt-20 relative z-10 group perspective-[1000px]">
          <div className="rounded-sm border border-white/10 bg-[#0f1115] shadow-2xl overflow-hidden backdrop-blur-sm transform transition-all duration-700 ease-out hover:rotate-x-[2deg] hover:rotate-y-[-2deg] hover:shadow-[0_20px_50px_rgba(0,212,255,0.15)] ring-1 ring-white/5">
            {/* Header bar */}
            <div className="h-8 md:h-10 bg-[#15181e] border-b border-white/5 flex items-center px-4 gap-2 relative">
              <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
                <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
                <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
              </div>
              <div className="mx-auto text-xs font-mono text-white/30 truncate max-w-[150px] md:max-w-[200px]">case-at-a-glance</div>
            </div>
            {/* Mockup content */}
            <div className="p-5 md:p-10 text-left w-auto border-l-[3px] border-[#00d4ff] bg-gradient-to-r from-[#00d4ff]/5 to-transparent mx-4 my-6 md:mx-12 md:my-10">
              <div className="mb-3 md:mb-4 text-[10px] md:text-xs font-bold text-[#00d4ff] uppercase tracking-wider font-mono flex items-center gap-1 md:gap-2">
                <BrainCircuit className="w-3 h-3 md:w-4 md:h-4" /> Case Profile Extracted
              </div>
              <div className="space-y-4 md:space-y-6">
                <div>
                  <h3 className="text-xs md:text-sm font-medium text-white/50 mb-1">Industry</h3>
                  <div className="text-white font-sans text-base md:text-lg">Consumer Electronics</div>
                </div>
                <div>
                  <h3 className="text-xs md:text-sm font-medium text-white/50 mb-1">Core Problem</h3>
                  <div className="text-white font-sans text-base md:text-xl leading-relaxed">
                    {typedText}
                    <span className="animate-pulse inline-block w-1.5 h-4 md:h-5 bg-[#00d4ff] ml-1 align-baseline"/>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </FadeInView>
      </section>

      {/* Social Proof Bar */}
      <div className="border-y border-white/10 bg-[#111318]/50 py-4 relative z-10">
        <div className="max-w-7xl mx-auto px-6 text-center font-mono text-xs text-white/40 flex flex-col md:flex-row justify-center items-center gap-2 md:gap-4 flex-wrap">
          <span>Built for MBA case competitions and consulting preparation</span>
          <span className="hidden md:inline">·</span>
          <span>Free to use</span>
        </div>
      </div>

      {/* Problem Section */}
      <section className="py-16 md:py-24 relative z-10 px-4 md:px-6 max-w-7xl mx-auto">
        <FadeInView>
          <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-10 md:mb-16">
            Case competitions and consulting case studies <br className="hidden sm:block"/> are won in the preparation room.
          </h2>
        </FadeInView>
        <div className="grid md:grid-cols-3 gap-4 md:gap-6">
          <FadeInView delay={0.1} className="bg-[#15181e] p-5 md:p-6 border-l-[3px] border-[#f97316] rounded-sm">
            <div className="w-10 h-10 rounded-full bg-[#f97316]/10 flex items-center justify-center mb-4">
              <span className="text-xl">⏱</span>
            </div>
            <p className="text-white/80 leading-relaxed font-medium text-sm md:text-base">
              You have 30 minutes to crack a case. Most of that time gets lost to re-reading, debating frameworks, and formatting notes.
            </p>
          </FadeInView>
          <FadeInView delay={0.2} className="bg-[#15181e] p-5 md:p-6 border-l-[3px] border-[#f97316] rounded-sm">
            <div className="w-10 h-10 rounded-full bg-[#f97316]/10 flex items-center justify-center mb-4">
              <span className="text-xl">🧠</span>
            </div>
            <p className="text-white/80 leading-relaxed font-medium text-sm md:text-base">
              Generic AI tools give you broad answers. They don't give you structure, bespoke frameworks, or judge-ready recommendations.
            </p>
          </FadeInView>
          <FadeInView delay={0.3} className="bg-[#15181e] p-5 md:p-6 border-l-[3px] border-[#f97316] rounded-sm">
            <div className="w-10 h-10 rounded-full bg-[#f97316]/10 flex items-center justify-center mb-4">
              <span className="text-xl">😰</span>
            </div>
            <p className="text-white/80 leading-relaxed font-medium text-sm md:text-base">
              Judges ask questions you didn't prepare for. Most teams freeze because they never stress-tested their own assumptions.
            </p>
          </FadeInView>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 md:py-24 relative z-10 px-4 md:px-6 bg-[#0f1115]">
        <div className="max-w-7xl mx-auto">
          <FadeInView className="text-center mb-12 md:mb-16">
            <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold mb-3 md:mb-4">
              Everything you need. <br className="sm:hidden"/> In one workflow.
            </h2>
            <p className="text-base md:text-lg text-white/60 max-w-2xl mx-auto">
              CaseEdge mirrors how top consulting firms actually structure problem-solving — from intake to recommendation to Q&A.
            </p>
          </FadeInView>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {[
              { icon: FileText, title: "Case Study Clue Highlighter", desc: "Upload a PDF or paste case brief. Highlighting and tagging key details rewards you with token incentives.", tag: "First 5 minutes" },
              { icon: Network, title: "MECE Issue Tree Builder", desc: "Build issue trees manually in the sandboxed playground, or audit your logic structure for MECE validation.", tag: "Minutes 5–15" },
              { icon: Grid, title: "Strategic Consulting Frameworks", desc: "Design strategic frameworks with hints and logic critique, or unlock recommended standard templates.", tag: "Minutes 5–15" },
              { icon: CheckCircle, title: "Consulting Recommendation Drafter", desc: "Formulate your recommendation using top-down SCR scaffolding (Situation, Complication, Resolution).", tag: "Minutes 15–22" },
              { icon: ShieldCheck, title: "Case Study Risk Tracker", desc: "Track operational, financial, market, and regulatory assumptions to isolate weaknesses.", tag: "Minutes 15–22" },
              { icon: Calculator, title: "Consulting Financial Math", desc: "Compute quick back-of-the-envelope size, payback, and revenue estimates with explicit assumptions.", tag: "Minutes 20–25" },
              { icon: HelpCircle, title: "Consulting Q&A & Interview Prep", desc: "Unlock model responses by grading your draft answers against structured checklists.", tag: "Final 15 minutes" },
              { icon: AlertTriangle, title: "AI Token Budget Economy", desc: "Earn tokens by completing active socratic work and spend them to bypass steps when pressed for time.", tag: "Enforced continuously" }
            ].map((f, i) => (
              <FadeInView key={i} delay={i * 0.05} className="group relative">
                <div className="bg-[#15181e] border border-white/5 p-5 md:p-6 rounded-sm h-full transition-all duration-300 group-hover:-translate-y-1.5 group-hover:border-[#00d4ff] group-hover:shadow-[0_0_25px_rgba(0,212,255,0.18)] group-hover:bg-[#15181e]/90">
                  <div className="inline-block transition-transform duration-500 ease-out group-hover:scale-115 group-hover:rotate-6 group-hover:filter group-hover:drop-shadow-[0_0_8px_rgba(0,212,255,0.45)]">
                    <f.icon className="w-6 h-6 md:w-8 md:h-8 text-[#00d4ff] mb-3 md:mb-4" />
                  </div>
                  <h3 className="font-bold text-base md:text-lg mb-2 text-white transition-colors duration-300 group-hover:text-[#00d4ff]">{f.title}</h3>
                  <p className="text-sm text-white/60 mb-4 md:mb-6 leading-relaxed flex-grow">{f.desc}</p>
                  <div className="text-[10px] md:text-xs font-mono font-semibold text-[#c9a84c] uppercase tracking-wide">
                    {f.tag}
                  </div>
                </div>
              </FadeInView>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 md:py-24 relative z-10 px-4 md:px-6 max-w-7xl mx-auto overflow-hidden">
        <FadeInView className="text-center mb-12 md:mb-16">
          <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            From case brief to presentation-ready. <br className="hidden md:block"/>In under 30 minutes.
          </h2>
        </FadeInView>

        <div className="relative">
          {/* Animated line (Desktop) */}
          <div className="hidden md:block absolute top-[28px] left-[10%] right-[10%] h-[2px] border-t-2 border-dashed border-white/20 z-0" />
          <motion.div 
             initial={{ width: "0%" }}
             whileInView={{ width: "80%" }}
             transition={{ duration: 1.5, ease: "easeInOut" }}
             className="hidden md:block absolute top-[28px] left-[10%] h-[2px] border-t-2 border-dashed border-[#00d4ff] z-0" 
             viewport={{ once: true, margin: "-100px" }}
          />

          <div className="flex flex-col md:flex-row justify-between gap-6 md:gap-4 relative z-10 px-2 sm:px-0">
            {[
              "Upload and actively highlight case clues",
              "Map out problem structure in Playground",
              "Critique strategic frameworks in Socratic Guide",
              "Draft recommendation with SCR scaffolding",
              "Calibrate response against Judge Q&A checklists"
            ].map((step, i) => (
              <FadeInView key={i} delay={i * 0.1} className="flex flex-row md:flex-col items-center md:text-center gap-4 md:gap-4 flex-1">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-[#111318] border-2 border-[#00d4ff] text-[#00d4ff] flex items-center justify-center font-heading font-bold text-lg md:text-xl shadow-[0_0_15px_rgba(0,212,255,0.2)] flex-shrink-0 z-10">
                  {i + 1}
                </div>
                <p className="text-sm md:text-base font-medium text-white/80 md:px-2 leading-tight">
                  {step}
                </p>
              </FadeInView>
            ))}
          </div>
        </div>
      </section>

      {/* Competitive Edge / Comparison Table */}
      <section className="py-16 md:py-24 relative z-10 px-4 md:px-6 bg-[#0f1115]">
        <div className="max-w-4xl mx-auto">
          <FadeInView className="text-center mb-10 md:mb-12">
            <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-4">
              Not just another AI chat. <br className="sm:hidden"/>A structured workflow for consulting case studies.
            </h2>
          </FadeInView>

          <FadeInView className="overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
            <table className="w-full min-w-[600px] border-collapse bg-[#15181e] rounded-sm overflow-hidden">
              <thead>
                <tr>
                  <th className="py-4 md:py-5 px-4 md:px-6 text-left border-b border-white/10 font-mono text-xs md:text-sm text-white/50 w-5/12">
                    What Matters in the Case Room
                  </th>
                  <th className="py-4 md:py-5 px-4 md:px-6 text-left border-b border-white/10 font-mono text-xs md:text-sm text-white/50 w-3/12">
                    Standard AI (ChatGPT / Claude)
                  </th>
                  <th className="py-4 md:py-5 px-4 md:px-6 text-left border-b-2 border-[#00d4ff] bg-[#00d4ff]/10 font-mono text-xs md:text-sm text-[#00d4ff] font-bold w-4/12">
                    CaseEdge
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    need: "Consultant-Grade Recommendation Structure",
                    desc: "Forces top-down SCR (Situation, Complication, Resolution) hierarchy.",
                    ai: "Generates generic text essays",
                    edge: "SCR recommendation scaffolding"
                  },
                  {
                    need: "Logical Integrity (MECE verification)",
                    desc: "Audits your custom issue tree for overlaps and causal gaps.",
                    ai: "No verification of logic splits",
                    edge: "MECE logic audit checks & rewards"
                  },
                  {
                    need: "Judge Q&A Objection Prep",
                    desc: "Generates custom objections & grading rubrics to test your reasoning.",
                    ai: "Fails to critique or stress-test answers",
                    edge: "Dynamic self-grading Q&A drills"
                  },
                  {
                    need: "Reliable Financial Math",
                    desc: "Calculations derived from explicit variables and formulaic assumptions.",
                    ai: "Prone to mathematical hallucinations",
                    edge: "Assumption-gated financial models"
                  },
                  {
                    need: "Active Casing Practice",
                    desc: "Token budgets prevent copy-pasting; rewards you for active logic audits.",
                    ai: "Spoon-feeding leads to mental laziness",
                    edge: "Gamified token economy"
                  },
                  {
                    need: "Case-Specific Frameworks",
                    desc: "Guides strategic formulation with bespoke hints and logic critiques.",
                    ai: "Dumps standard textbook templates",
                    edge: "Socratic guide hints & critiques"
                  },
                  {
                    need: "Presentation Readiness",
                    desc: "Formats and exports your complete structured slide deck draft to PDF.",
                    ai: "Unstructured raw markdown outline",
                    edge: "Structured PDF deck export"
                  }
                ].map((row, i) => (
                  <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-4 px-4 md:px-6 text-left">
                      <div className="text-xs md:text-sm text-white font-semibold">{row.need}</div>
                      <div className="text-[10px] md:text-xs text-white/45 mt-0.5 leading-normal">{row.desc}</div>
                    </td>
                    <td className="py-4 px-4 md:px-6 text-left text-xs md:text-sm text-red-400/80 font-medium">
                      <span className="mr-1.5 text-red-500">✗</span> {row.ai}
                    </td>
                    <td className="py-4 px-4 md:px-6 text-left text-xs md:text-sm text-[#00d4ff] bg-[#00d4ff]/5 font-bold">
                      <span className="mr-1.5 text-[#00d4ff]">✓</span> {row.edge}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </FadeInView>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 md:py-24 relative z-10 px-4 md:px-6 max-w-7xl mx-auto">
        <FadeInView className="text-center mb-12 md:mb-16">
          <span className="text-[10px] md:text-xs font-mono font-bold text-[#00d4ff] uppercase tracking-widest bg-[#00d4ff]/10 px-3 py-1 rounded-full">Testimonials</span>
          <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold mt-4 mb-3 md:mb-4">
            Trusted by Future Leaders
          </h2>
          <p className="text-base md:text-lg text-white/60 max-w-2xl mx-auto">
            See how top business school students are using CaseEdge to stand out in high-stakes case competitions.
          </p>
        </FadeInView>

        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          {TESTIMONIALS.map((t, i) => (
            <FadeInView key={i} delay={i * 0.1} className="group relative">
              <div className="bg-[#15181e] border border-white/5 p-6 md:p-8 rounded-sm h-full flex flex-col justify-between transition-all duration-300 group-hover:-translate-y-1.5 group-hover:border-[#00d4ff] group-hover:shadow-[0_0_25px_rgba(0,212,255,0.15)]">
                <div>
                  <div className="text-4xl font-serif text-[#00d4ff]/20 group-hover:text-[#00d4ff]/40 transition-colors duration-300 mb-2 leading-none">“</div>
                  <p className="text-slate-300 text-xs md:text-sm leading-relaxed italic mb-6">
                    {t.quote}
                  </p>
                </div>
                
                <div className="flex items-center gap-3.5 pt-4 border-t border-white/5">
                  <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${t.avatarColor} flex items-center justify-center font-bold text-black text-xs shrink-0 shadow-inner`}>
                    {t.author.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-xs md:text-sm text-white group-hover:text-[#00d4ff] transition-colors duration-300">{t.author}</h4>
                    <p className="text-[10px] text-white/50 font-medium mt-0.5">{t.role}</p>
                    <p className="text-[9px] text-[#00d4ff] font-mono mt-0.5">{t.school}</p>
                  </div>
                </div>
              </div>
            </FadeInView>
          ))}
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-16 md:py-24 relative z-10 px-4 md:px-6 max-w-3xl mx-auto text-center">
        <FadeInView>
          <h2 className="font-heading text-2xl sm:text-3xl font-bold mb-4 md:mb-6">
            Built by an MBA student, for MBA students.
          </h2>
          <p className="text-white/70 text-sm md:text-base leading-relaxed mb-6 md:mb-8">
            CaseEdge was created by Shubham Maurya, a PGDM-HCM student at Goa Institute of Management. It was built to solve a real problem — existing tools were either too generic or too fragmented. CaseEdge puts the entire case workflow in one place, powered by AI that understands competition structure.
          </p>
          <a href="https://www.linkedin.com/in/shubham-kumar-b79969232/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/15 text-white rounded-sm font-medium transition-colors text-sm border border-white/10">
            Connect on LinkedIn <ExternalLink className="w-4 h-4" />
          </a>
        </FadeInView>
      </section>

      {/* Final CTA */}
      <section className="py-24 md:py-32 relative text-center px-4 md:px-6 overflow-hidden">
        <div className="absolute inset-0 bg-[#00d4ff]/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[300px] md:w-[800px] md:h-[500px] bg-cyan-glow blur-[100px] md:blur-[120px] rounded-[100%] pointer-events-none" />
        
        <FadeInView className="relative z-10">
          <h2 className="font-heading text-3xl sm:text-4xl md:text-6xl font-bold mb-4 md:mb-6 text-white tracking-tight">
            Your next case competition <br className="hidden sm:block"/> starts here.
          </h2>
          <p className="text-sm sm:text-lg text-[#00d4ff] font-mono mb-8 md:mb-10 max-w-sm mx-auto sm:max-w-none">
            Free to use. No account needed. Just paste your case and go.
          </p>
          <motion.button 
            onClick={onLaunch}
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
            className="group w-full sm:w-auto px-8 md:px-10 py-4 md:py-5 bg-[#00d4ff] hover:bg-[#00b0d4] text-black font-bold text-base md:text-lg rounded-sm inline-flex items-center justify-center gap-2 md:gap-3 transition-all shadow-[0_0_30px_rgba(0,212,255,0.3)] focus-visible:ring-2 focus-visible:ring-[#00d4ff] focus-visible:ring-offset-2 focus-visible:outline-none focus-visible:ring-offset-slate-900 cursor-pointer"
          >
            Launch CaseEdge <ArrowRight className="w-5 h-5 md:w-6 md:h-6 transition-transform group-hover:translate-x-1.5" />
          </motion.button>
        </FadeInView>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-4 md:px-6 bg-[#0f1115] relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 md:gap-4 text-xs font-mono text-white/40">
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 opacity-50 grayscale">
              <path d="M16 2 L4 9 L4 23 L16 30" stroke="#2563eb" strokeWidth="2.5" fill="none" />
              <path d="M16 2 L28 9 L28 23 L16 30" stroke="#00d4ff" strokeWidth="2.5" fill="none" />
              <rect x="8" y="16" width="6" height="14" fill="#2563eb" />
              <rect x="15" y="12" width="6" height="20" fill="#00d4ff" />
              <polyline points="4,19 11,15 18,11 28,7" stroke="#00d4ff" strokeWidth="1.5" fill="none" />
            </svg>
            <span>CaseEdge · Built by Shubham Maurya</span>
          </div>
          <div className="flex flex-wrap justify-center gap-4 md:gap-6">
            <button onClick={onLaunch} className="hover:text-[#00d4ff] transition-colors focus-visible:text-[#00d4ff] focus-visible:outline-none">Launch App</button>
            <a href="https://blog.caseedge.in" className="hover:text-[#00d4ff] transition-colors focus-visible:text-[#00d4ff] focus-visible:outline-none">Blog</a>
            <a href="https://www.linkedin.com/in/shubham-kumar-b79969232/" target="_blank" rel="noopener noreferrer" className="hover:text-[#00d4ff] transition-colors focus-visible:text-[#00d4ff] focus-visible:outline-none">LinkedIn</a>
          </div>
          <div className="opacity-60">Powered by AI</div>
        </div>
      </footer>
    </div>
  );
};

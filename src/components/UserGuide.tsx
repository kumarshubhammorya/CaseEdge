import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, BrainCircuit, Network, CheckCircle, Presentation, 
  HelpCircle, AlertTriangle, ArrowRight, X, ChevronRight, ChevronLeft,
  Grid, Zap
} from 'lucide-react';
import { sounds } from '../lib/sounds';

interface UserGuideProps {
  onClose: () => void;
}

export const UserGuide: React.FC<UserGuideProps> = ({ onClose }) => {
  const [step, setStep] = useState(0);

  const guideSteps = [
    {
      title: "Welcome to CaseEdge!",
      desc: "This app helps you crack business cases (like fixing a struggling company) in just 30 minutes. It's built for MBA students, but it's simple enough for anyone to use. Let's see how it works!",
      icon: BookOpen,
      color: "text-blue-400"
    },
    {
      title: "Step 1: The Intake",
      desc: "Paste the text or upload a document describing the business problem. Our AI reads it and extracts the Core Problem, Industry, and Key Stakeholders, giving you a quick summary.",
      icon: BrainCircuit,
      color: "text-cyan-400"
    },
    {
      title: "Step 2: Issue Tree & MECE",
      desc: "We break the big problem into smaller, easy-to-solve pieces (like branches on a tree). We use \"MECE\" (Mutually Exclusive, Collectively Exhaustive) — meaning the pieces don't overlap, and together they cover everything.",
      icon: Network,
      color: "text-emerald-400"
    },
    {
      title: "Step 3: Frameworks",
      desc: "We give you famous business \"Frameworks\" — these are tried-and-tested standard models (like the 4 Ps or Porter's Five Forces) to help you analyze the problem from the right angles.",
      icon: Grid,
      color: "text-teal-400"
    },
    {
      title: "Step 4: The SCR Drafter",
      desc: "Write your solution like a story using the \"SCR\" method: Situation (what is happening), Complication (what went wrong), and Resolution (how we fix it). It structures your recommendation clearly.",
      icon: CheckCircle,
      color: "text-orange-400"
    },
    {
      title: "Step 5: Quantify",
      desc: "Back up your idea with numbers. We estimate \"TAM\" (Total Addressable Market - how big the opportunity is), \"Payback Period\" (how long to make the money back), and \"KPIs\" (Key Performance Indicators - metrics to track success).",
      icon: Zap,
      color: "text-amber-400"
    },
    {
      title: "Step 6: Pitch & Judge Q&A",
      desc: "Finally, prepare your presentation. We give you a slide-by-slide Outline and simulate \"Judge Q&A\" to help you practice answering tough questions a jury might ask you.",
      icon: Presentation,
      color: "text-purple-400"
    },
    {
      title: "Bonus: Assumptions Tracker",
      desc: "Whenever you make a guess or rely on unproven data, track it! Use the Assumptions feature to manage risks like market shifts or high costs, so you're not caught off guard.",
      icon: AlertTriangle,
      color: "text-rose-400"
    }
  ];

  const handleNext = () => {
    sounds.playTransition();
    if (step < guideSteps.length - 1) {
      setStep(step + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    sounds.playClick();
    if (step > 0) {
      setStep(step - 1);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-[#0b0f17]/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-[#15181e] border border-white/10 rounded-lg shadow-2xl overflow-hidden w-full max-w-lg flex flex-col"
        >
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <h2 className="text-sm font-bold text-white/80 uppercase tracking-wider font-mono">
              Quick Guide
            </h2>
            <button 
              onClick={() => { sounds.playClick(); onClose(); }}
              onMouseEnter={() => sounds.playHover()}
              className="p-1 hover:bg-white/10 rounded-sm transition-colors text-white/60 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 md:p-10 flex-1 min-h-[300px] flex flex-col justify-center items-center text-center relative overflow-hidden">
            
            {/* Dynamic Background Glow */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`glow-${step}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.15 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className={`absolute inset-0 bg-gradient-to-b from-transparent to-current opacity-10 ${guideSteps[step].color.replace('text-', '')}`}
                style={{
                  background: `radial-gradient(circle at center, currentColor 0%, transparent 70%)`
                }}
              />
            </AnimatePresence>

            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -20 }}
                transition={{ duration: 0.3, type: "spring", bounce: 0.4 }}
                className="w-full max-w-sm mx-auto relative z-10"
              >
                <div className={`w-20 h-20 md:w-24 md:h-24 mx-auto mb-8 rounded-2xl flex items-center justify-center bg-white/5 border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.3)] relative group`}>
                  <div className={`absolute inset-0 rounded-2xl bg-current opacity-20 blur-xl transition-all duration-500 group-hover:opacity-40 group-hover:blur-2xl ${guideSteps[step].color}`} />
                  {React.createElement(guideSteps[step].icon, { 
                    className: `w-10 h-10 md:w-12 md:h-12 relative z-10 drop-shadow-[0_0_10px_currentColor] ${guideSteps[step].color}` 
                  })}
                </div>
                
                <div className="inline-block px-3 py-1 bg-white/10 rounded-full text-xs font-bold text-white/70 mb-4 border border-white/10 tracking-widest uppercase">
                  {step === 0 ? 'Introduction' : `Feature ${step} of ${guideSteps.length - 1}`}
                </div>

                <h3 className="text-2xl md:text-3xl font-bold text-white mb-4 tracking-tight">
                  {guideSteps[step].title}
                </h3>
                <p className="text-slate-300 text-sm md:text-base leading-relaxed max-w-[280px] md:max-w-none mx-auto">
                  {guideSteps[step].desc}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="p-4 md:p-6 bg-[#090b10] border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* Dots */}
            <div className="flex gap-2 w-full md:w-auto justify-center md:justify-start order-2 md:order-1">
              {guideSteps.map((_, i) => (
                <div 
                  key={i} 
                  className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'bg-[#00d4ff] w-6 shadow-[0_0_8px_#00d4ff]' : 'bg-white/20 w-1.5 hover:bg-white/40'}`}
                />
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-3 w-full md:w-auto justify-between md:justify-end order-1 md:order-2 items-center">
              {step < guideSteps.length - 1 ? (
                <button 
                  onClick={() => { sounds.playClick(); onClose(); }}
                  onMouseEnter={() => sounds.playHover()}
                  className="px-4 py-2 text-xs font-medium text-white/40 hover:text-white/80 transition-colors hidden md:block"
                >
                  Skip guide
                </button>
              ) : <div className="hidden md:block w-[78px]"></div>}

              <div className="flex gap-2 w-full justify-between md:justify-end">
                {step > 0 ? (
                  <button 
                    onClick={handlePrev}
                    onMouseEnter={() => sounds.playHover()}
                    className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 rounded-md transition-colors flex items-center gap-2 border border-white/10"
                  >
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>
                ) : (
                   step < guideSteps.length - 1 && (
                    <button 
                      onClick={() => { sounds.playClick(); onClose(); }}
                      onMouseEnter={() => sounds.playHover()}
                      className="px-4 py-2 text-sm font-medium text-white/40 hover:text-white/80 transition-colors md:hidden"
                    >
                      Skip
                    </button>
                   )
                )}
                
                <button 
                  onClick={handleNext}
                  onMouseEnter={() => sounds.playHover()}
                  className="px-6 py-2.5 text-sm font-bold bg-white text-black hover:bg-slate-200 rounded-md transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_25px_rgba(255,255,255,0.5)] transform hover:-translate-y-0.5"
                >
                  {step === guideSteps.length - 1 ? 'Get Started' : 'Next'}
                  {step < guideSteps.length - 1 && <ChevronRight className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

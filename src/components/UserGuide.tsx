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
      desc: "This app helps you crack business cases in just 30 minutes. Earn 🪙 tokens by completing active learning tasks, and spend them to bypass steps when pressed for time. Let's see how it works!",
      icon: BookOpen,
      color: "text-blue-400"
    },
    {
      title: "Step 1: Active Reading & Intake",
      desc: "Highlight case text to tag key details under Objectives, Constraints, Stakeholders, or Metrics. Run a Highlight Audit to earn tokens and unlock Case at a Glance.",
      icon: BrainCircuit,
      color: "text-cyan-400"
    },
    {
      title: "Step 2: Issue Tree Playground",
      desc: "Construct problem causal trees manually in the sandboxed playground. Run MECE logic audits to check for overlaps/gaps and unlock the AI-suggested Issue Tree for free.",
      icon: Network,
      color: "text-emerald-400"
    },
    {
      title: "Step 3: Socratic Frameworks",
      desc: "Submit your strategic logic proposals in the Socratic Critique Guide to get hints and unlock the AI Recommended Frameworks for free.",
      icon: Grid,
      color: "text-teal-400"
    },
    {
      title: "Step 4: SCR Recommendation",
      desc: "Draft top-down proposals (Situation, Complication, Resolution) using structured consulting templates (Scaffold Chips). Get AI drafting hints for 5 🪙.",
      icon: CheckCircle,
      color: "text-orange-400"
    },
    {
      title: "Step 5: Assumptions & Risks",
      desc: "Isolate unproven variables and risk assumptions. Spend 5 🪙 to automatically extract potential assumptions from your drafted recommendation.",
      icon: AlertTriangle,
      color: "text-rose-400"
    },
    {
      title: "Step 6: Financial Quantification",
      desc: "Input quick sizing and payback estimates. Build confidence in your figures using the gated AI Quantification Assistant (Costs 5 🪙).",
      icon: Zap,
      color: "text-amber-400"
    },
    {
      title: "Step 7: Pitch & Judge Q&A",
      desc: "Review structured slide decks and prepare for judge grilling. Self-calibrate your answers against grading checklists to unlock model answers.",
      icon: Presentation,
      color: "text-purple-400"
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

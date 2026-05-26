import React from 'react';
import { Lock } from 'lucide-react';
import { ShimmerButton, Tooltip } from '../MicroInteractions';

type AITreeLockedViewProps = {
  isBuilding: boolean;
  tokens: number;
  hasMeceFeedback: boolean;
  onUnlock: () => void;
};

export const AITreeLockedView: React.FC<AITreeLockedViewProps> = ({
  isBuilding,
  tokens,
  hasMeceFeedback,
  onUnlock,
}) => {
  return (
    <div className="h-64 border border-dashed border-slate-800 rounded-xl bg-slate-900/20 flex flex-col items-center justify-center text-slate-400 gap-4 p-8 text-center max-w-lg mx-auto">
      <div className="p-3 bg-slate-850 rounded-full border border-slate-700 text-cyan-400 shrink-0">
        <Lock className="w-6 h-6" />
      </div>
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">AI Generated Tree Locked</h3>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed max-w-sm">
          Build and audit your own tree in the Interactive Playground to unlock the AI-suggested tree for free, or bypass active learning using tokens.
        </p>
      </div>
      <Tooltip content={hasMeceFeedback ? "Unlock the AI tree for free" : "Deduct 10 tokens to auto-generate the AI tree"} position="bottom" className="inline-flex">
        <ShimmerButton
          onClick={onUnlock}
          disabled={isBuilding || (!hasMeceFeedback && (tokens ?? 0) < 10)}
          isLoading={isBuilding}
          className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-xs uppercase font-bold text-white px-6 py-2.5 rounded-md transition-colors cursor-pointer"
        >
          {isBuilding 
            ? 'Generating...' 
            : hasMeceFeedback 
            ? 'Unlock AI Tree (Free)' 
            : 'Bypass & Unlock (Costs 10 🪙)'}
        </ShimmerButton>
      </Tooltip>
    </div>
  );
};

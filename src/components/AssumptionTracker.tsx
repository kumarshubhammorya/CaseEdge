import React, { useState } from 'react';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { Plus, Trash2, Wand2, AlertTriangle, Info, CheckCircle, Database } from 'lucide-react';
import { AppState, Assumption } from '../types';
import { extractAssumptions } from '../services/geminiService';
import { EmptyState } from './EmptyState';
import { ShimmerButton, Tooltip, CyclingLoadingText } from './MicroInteractions';
import { sounds } from '../lib/sounds';

import { useAppContext } from '../context/AppContext';

interface Props {
  onGoBack?: () => void;
}

export const AssumptionTracker = ({ onGoBack }: Props) => {
  const { appState, setAppState } = useAppContext();
  const [isExtracting, setIsExtracting] = useState(false);

  const handleExtractAssumptions = async () => {
    if (!appState.coreRecommendation && !appState.expandedRecommendation?.resolution) {
      toast.error("Please generate a recommendation first.");
      return;
    }

    setIsExtracting(true);
    sounds.playClick();
    
    try {
      const textToAnalyze = appState.expandedRecommendation 
        ? `${appState.expandedRecommendation.situation} ${appState.expandedRecommendation.complication} ${appState.expandedRecommendation.resolution}`
        : appState.coreRecommendation;
        
      const result = await extractAssumptions(textToAnalyze);
      
      const newAssumptions: Assumption[] = result.map((a: any) => ({
        ...a,
        id: Math.random().toString(36).substring(2, 11)
      }));
      
      setAppState(prev => ({
        ...prev,
        assumptions: prev.assumptions ? [...prev.assumptions, ...newAssumptions] : newAssumptions
      }));
      sounds.playSuccess();
      toast.success("Assumptions extracted successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to extract assumptions.");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleAddRow = () => {
    const newRow: Assumption = {
      id: Math.random().toString(36).substring(2, 11),
      statement: "",
      category: "Market",
      riskLevel: "Medium",
      whatBreaksThis: ""
    };
    setAppState(prev => ({
      ...prev,
      assumptions: prev.assumptions ? [...prev.assumptions, newRow] : [newRow]
    }));
    sounds.playAdd();
  };

  const handleUpdateRow = (id: string, field: keyof Assumption, value: string) => {
    setAppState(prev => ({
      ...prev,
      assumptions: prev.assumptions?.map(a => a.id === id ? { ...a, [field]: value } : a) || null
    }));
  };

  const handleDeleteRow = (id: string) => {
    setAppState(prev => ({
      ...prev,
      assumptions: prev.assumptions?.filter(a => a.id !== id) || null
    }));
    sounds.playRemove();
  };

  const riskStyles = {
    High: "bg-red-500/20 text-red-400 border-red-500/30",
    Medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    Low: "bg-green-500/20 text-green-400 border-green-500/30"
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Database className="w-6 h-6 text-blue-500" />
            Assumption Tracker
          </h2>
          <p className="text-slate-400 text-sm mt-1">Identify and monitor critical beliefs that underpin your recommendation.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <ShimmerButton
            onClick={handleExtractAssumptions}
            isLoading={isExtracting}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-blue-900/20"
          >
            {isExtracting ? (
              <CyclingLoadingText messages={['Analyzing strategy...', 'Identifying beliefs...', 'Mapping risks...']} />
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                Extract from Recommendation
              </>
            )}
          </ShimmerButton>
          
          <button
            onClick={handleAddRow}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium border border-slate-700 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Manual
          </button>
        </div>
      </div>
      
      {(!appState.coreRecommendation && !appState.expandedRecommendation) ? (
        <EmptyState 
          title="Awaiting Recommendation"
          description="You need to formulate a recommendation first before tracking its underlying assumptions."
          actionLabel="Go back to Draft"
          onAction={onGoBack}
        />
      ) : (
        <>
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm shadow-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-800/50">
              <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest w-1/3">Assumption Statement</th>
              <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest w-48">Category</th>
              <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest w-40">Risk Level</th>
              <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">What breaks this?</th>
              <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest w-16"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {appState.assumptions && appState.assumptions.length > 0 ? (
              appState.assumptions.map((assumption, index) => (
                <motion.tr 
                  key={assumption.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group hover:bg-slate-800/30 transition-colors"
                >
                  <td className="px-4 py-4 align-top">
                    <textarea
                      value={assumption.statement}
                      placeholder="e.g., Conversion rate will remain constant..."
                      onChange={(e) => handleUpdateRow(assumption.id, 'statement', e.target.value)}
                      className="w-full bg-transparent border-none outline-none text-slate-200 text-sm resize-none focus:ring-0 placeholder:text-slate-600 focus:placeholder:text-slate-700 min-h-[60px]"
                    />
                  </td>
                  <td className="px-4 py-4 align-top">
                    <select
                      value={assumption.category}
                      onChange={(e) => handleUpdateRow(assumption.id, 'category', e.target.value as any)}
                      className="w-full bg-slate-800/50 border border-slate-700 rounded-md px-2 py-1 text-xs text-slate-300 outline-none focus:border-blue-500/50 transition-colors"
                    >
                      <option value="Market">Market</option>
                      <option value="Financial">Financial</option>
                      <option value="Operational">Operational</option>
                      <option value="Regulatory">Regulatory</option>
                    </select>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <div className="flex items-center gap-2">
                       <select
                        value={assumption.riskLevel}
                        onChange={(e) => handleUpdateRow(assumption.id, 'riskLevel', e.target.value as any)}
                        className={`w-full border rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider outline-none transition-colors ${riskStyles[assumption.riskLevel]}`}
                      >
                        <option value="High" className="bg-slate-900">High</option>
                        <option value="Medium" className="bg-slate-900">Medium</option>
                        <option value="Low" className="bg-slate-900">Low</option>
                      </select>
                    </div>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <textarea
                      value={assumption.whatBreaksThis}
                      placeholder="e.g., A new competitor enters within 6 months..."
                      onChange={(e) => handleUpdateRow(assumption.id, 'whatBreaksThis', e.target.value)}
                      className="w-full bg-transparent border-none outline-none text-slate-400 text-sm italic resize-none focus:ring-0 placeholder:text-slate-700 min-h-[60px]"
                    />
                  </td>
                  <td className="px-4 py-4 align-top text-right">
                    <button
                      onClick={() => handleDeleteRow(assumption.id)}
                      className="text-slate-600 hover:text-red-500 transition-colors p-1"
                      title="Delete row"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </motion.tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center gap-3 animate-pulse opacity-40">
                    <AlertTriangle className="w-12 h-12 text-slate-600" />
                    <div>
                      <p className="text-slate-400 font-medium font-mono text-xs uppercase tracking-widest">No assumptions tracked</p>
                      <p className="text-slate-600 text-xs mt-1">Generate from recommendation or add manually.</p>
                    </div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-800/20">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400">
              <Info className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest">Why this matters</h4>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            In MBB competitions, identifying what *must* be true for your plan to work shows maturity and risk awareness. Judges often probe your worst-case scenarios.
          </p>
        </div>
        
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-800/20">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-red-500/20 text-red-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest">Killer Assumption</h4>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            The "Killer Assumption" is the one that, if proven false, makes the entire recommendation fail. Focus your sensitivity analysis here.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-slate-800/20">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-green-500/20 text-green-400">
              <CheckCircle className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest">Pro Tip</h4>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Don't just list assumptions. Use them to justify your "Risk Mitigation" slide. Every High Risk items should have an owner or action.
          </p>
        </div>
      </div>
      </>
      )}
    </motion.div>
  );
};

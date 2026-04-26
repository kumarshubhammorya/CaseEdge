import React, { useState } from 'react';
import { buildIssueTree } from '../services/geminiService';
import { AppState, IssueTreeNode } from '../types';
import { Network, Brain, ChevronRight, ChevronDown } from 'lucide-react';
import { ShimmerButton, CyclingLoadingText, EditableField, TypewriterText } from './MicroInteractions';

type Props = {
  appState: AppState;
  setAppState: React.Dispatch<React.SetStateAction<AppState>>;
};

const TreeNode: React.FC<{ node: IssueTreeNode; level: number; onUpdateText: (id: string, text: string) => void }> = ({ node, level, onUpdateText }) => {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="w-full">
      <div 
        className="flex items-center p-2 rounded-md transition-colors w-full group relative"
        style={{ paddingLeft: `${level * 1.5 + 0.5}rem` }}
      >
        <div 
          className="w-6 flex justify-center mr-1 cursor-pointer"
          onClick={() => hasChildren && setExpanded(!expanded)}
        >
          {hasChildren ? (
            expanded ? (
              <ChevronDown className="w-4 h-4 text-slate-400 hover:text-slate-200" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400 hover:text-slate-200" />
            )
          ) : (
            <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
          )}
        </div>
        <div className="flex-1">
          <EditableField 
            value={node.label} 
            onChange={(val) => onUpdateText(node.id, val)}
            className="w-auto inline-block m-0 p-1 bg-transparent hover:bg-slate-800/30"
            textClassName={`text-sm ${level === 0 ? 'font-bold text-blue-400' : level === 1 ? 'font-semibold text-slate-200' : 'text-slate-400'}`}
          />
        </div>
      </div>
      
      {expanded && hasChildren && (
        <div className="flex flex-col relative w-full">
          <div 
            className="absolute left-0 top-0 bottom-0 w-px bg-slate-800/80"
            style={{ left: `${level * 1.5 + 1.25}rem` }}
          />
          {node.children!.map((child) => (
            <TreeNode key={child.id} node={child} level={level + 1} onUpdateText={onUpdateText} />
          ))}
        </div>
      )}
    </div>
  );
};

export const IssueTreeSection: React.FC<Props> = ({ appState, setAppState }) => {
  const [isBuilding, setIsBuilding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBuild = async () => {
    if (!appState.caseGlance || !appState.caseGlance.coreProblem) {
      setError("Please run Case Intake first to extract the core problem.");
      return;
    }
    setError(null);
    setIsBuilding(true);
    try {
      const result = await buildIssueTree(appState.caseGlance.coreProblem);
      setAppState(prev => ({ ...prev, issueTree: result }));
    } catch (err: any) {
      setError("Failed to build issue tree. " + (err?.message || ""));
    } finally {
      setIsBuilding(false);
    }
  };

  const updateNodeLabel = (node: IssueTreeNode, id: string, newLabel: string): IssueTreeNode => {
    if (node.id === id) {
      return { ...node, label: newLabel };
    }
    if (node.children) {
      return {
        ...node,
        children: node.children.map(child => updateNodeLabel(child, id, newLabel))
      };
    }
    return node;
  };

  const handleUpdateText = (id: string, text: string) => {
    if (!appState.issueTree) return;
    setAppState(prev => ({ ...prev, issueTree: updateNodeLabel(prev.issueTree!, id, text) }));
  };

  const loadingMessages = [
    "Parsing main problem...", 
    "Applying MECE principles...", 
    "Branching sub-issues...", 
    "Structuring causal chain..."
  ];

  return (
    <section className="bg-[#0f172a] flex flex-col flex-1 min-h-0 border border-slate-800 animate-in fade-in slide-in-from-bottom-4 duration-500 rounded-lg overflow-hidden">
      <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-[#070b14]/50">
        <div className="flex items-center gap-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">MECE Issue Tree</h2>
          <ShimmerButton
            onClick={handleBuild}
            disabled={isBuilding || !appState.caseGlance}
            isLoading={isBuilding}
            className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-[10px] uppercase font-bold text-white px-3 py-1.5 rounded transition-colors"
          >
            {isBuilding ? 'Structuring...' : 'Build Logic Tree'}
          </ShimmerButton>
        </div>
        <div className="flex items-center gap-2">
          {isBuilding ? (
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

      <div className="p-6 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
        {error && <div className="text-red-400 text-xs">{error}</div>}

        {appState.issueTree ? (
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-6 font-sans text-slate-300 shadow-inner">
             <TreeNode node={appState.issueTree} level={0} onUpdateText={handleUpdateText} />
          </div>
        ) : (
          <div className="h-48 border border-dashed border-slate-800 rounded bg-slate-900/20 flex flex-col items-center justify-center text-slate-600">
            <span className="text-xs uppercase font-bold tracking-widest">Awaiting Core Problem Breakdown</span>
          </div>
        )}
      </div>
    </section>
  );
};

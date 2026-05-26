import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { buildIssueTree, evaluateIssueTree } from '../services/geminiService';
import { AppState, IssueTreeNode, NodeFeedbackItem } from '../types';
import { EmptyState } from './EmptyState';
import { ShimmerButton, CyclingLoadingText, Tooltip } from './MicroInteractions';
import { sounds } from '../lib/sounds';
import { TreeNode } from './issuetree/TreeNode';
import { MECECoachPanel } from './issuetree/MECECoachPanel';
import { AITreeLockedView } from './issuetree/AITreeLockedView';

import { useAppContext } from '../context/AppContext';

const generateUniqueId = () => `node_${Math.random().toString(36).substring(2, 11)}`;


export const IssueTreeSection: React.FC<{ onNext?: () => void; onGoBack?: () => void }> = ({ onNext, onGoBack }) => {
  const { appState, setAppState } = useAppContext();
  const [isBuilding, setIsBuilding] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);

  useEffect(() => {
    if (appState.caseGlance?.coreProblem && !appState.playgroundTree) {
      setAppState(prev => ({
        ...prev,
        playgroundTree: {
          id: 'root',
          label: appState.caseGlance!.coreProblem,
          children: []
        }
      }));
    }
  }, [appState.caseGlance?.coreProblem, appState.playgroundTree]);

  const handleBuild = async () => {
    sounds.playClick();
    if (!appState.caseGlance || !appState.caseGlance.coreProblem) {
      toast.error("Please run Case Intake first to extract the core problem.");
      return;
    }
    setIsBuilding(true);
    try {
      const result = await buildIssueTree(appState.caseGlance.coreProblem);
      setAppState(prev => ({ ...prev, issueTree: result }));
      toast.success("Issue tree built successfully!");
    } catch (err: any) {
      toast.error("Failed to build issue tree: " + (err?.message || ""));
    } finally {
      setIsBuilding(false);
    }
  };

  const handleUnlockAITree = async () => {
    sounds.playClick();
    if (!appState.caseGlance || !appState.caseGlance.coreProblem) {
      toast.error("Please run Case Intake first to extract the core problem.");
      return;
    }
    const hasMeceAudit = !!appState.meceFeedback;
    const isBypass = !appState.issueTree && !hasMeceAudit;
    if (isBypass) {
      if ((appState.tokens ?? 0) < 10) {
        sounds.playError();
        toast.error("Insufficient tokens! Build and audit your own tree in the Interactive Playground, or earn more tokens.");
        return;
      }
      setAppState(prev => ({ ...prev, tokens: Math.max(0, (prev.tokens ?? 50) - 10) }));
    }
    setIsBuilding(true);
    try {
      const result = await buildIssueTree(appState.caseGlance.coreProblem);
      setAppState(prev => ({ ...prev, issueTree: result }));
      sounds.playSuccess();
      toast.success(isBypass ? "AI Issue Tree generated! (-10 tokens)" : "AI Issue Tree generated!");
    } catch (err: any) {
      sounds.playError();
      toast.error("Failed to build issue tree: " + (err?.message || ""));
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
    if (appState.issueTreeMode === 'playground') {
      if (!appState.playgroundTree) return;
      setAppState(prev => ({
        ...prev,
        playgroundTree: updateNodeLabel(prev.playgroundTree!, id, text),
        meceFeedback: null // Clear outdated audit feedback
      }));
    } else {
      if (!appState.issueTree) return;
      setAppState(prev => ({ 
        ...prev, 
        issueTree: updateNodeLabel(prev.issueTree!, id, text) 
      }));
    }
  };

  const handleAddChild = (parentId: string) => {
    sounds.playClick();
    const newChild: IssueTreeNode = {
      id: generateUniqueId(),
      label: 'New Sub-issue',
      children: []
    };

    const addNode = (node: IssueTreeNode): IssueTreeNode => {
      if (node.id === parentId) {
        return {
          ...node,
          children: [...(node.children || []), newChild]
        };
      }
      if (node.children) {
        return {
          ...node,
          children: node.children.map(addNode)
        };
      }
      return node;
    };

    if (appState.playgroundTree) {
      setAppState(prev => ({
        ...prev,
        playgroundTree: addNode(prev.playgroundTree!),
        meceFeedback: null
      }));
      toast.success("Sub-issue added!");
    }
  };

  const handleDeleteNode = (nodeId: string) => {
    sounds.playRemove();
    const removeNode = (node: IssueTreeNode): IssueTreeNode | null => {
      if (node.id === nodeId) {
        return null;
      }
      if (node.children) {
        return {
          ...node,
          children: node.children
            .map(removeNode)
            .filter((n): n is IssueTreeNode => n !== null)
        };
      }
      return node;
    };

    if (appState.playgroundTree) {
      const updated = removeNode(appState.playgroundTree);
      setAppState(prev => ({
        ...prev,
        playgroundTree: updated,
        meceFeedback: null
      }));
      toast.info("Sub-issue removed");
    }
  };

  const handleResetPlayground = () => {
    sounds.playClick();
    setAppState(prev => ({
      ...prev,
      playgroundTree: {
        id: 'root',
        label: appState.caseGlance?.coreProblem || 'Core Problem',
        children: []
      },
      meceFeedback: null
    }));
    toast.info("Playground tree reset");
  };

  const handleInitializeFromAI = () => {
    sounds.playSuccess();
    if (!appState.issueTree) {
      toast.error("Generate an AI Tree first!");
      return;
    }
    // Deep copy current AI tree
    const copyTree = JSON.parse(JSON.stringify(appState.issueTree));
    setAppState(prev => ({
      ...prev,
      playgroundTree: copyTree,
      meceFeedback: null
    }));
    toast.success("AI Tree copied to Playground!");
  };

  const handleAudit = async () => {
    sounds.playClick();
    if (!appState.playgroundTree) {
      toast.error("Playground tree is empty!");
      return;
    }
    setIsAuditing(true);
    try {
      const issueTreeJson = JSON.stringify(appState.playgroundTree);
      const result = await evaluateIssueTree(issueTreeJson, appState.caseGlance?.coreProblem || '');
      
      const oldScore = appState.meceFeedback?.score ?? 0;
      const newScore = result.score ?? 0;
      let reward = 0;
      if (oldScore < 80 && newScore >= 80) {
        reward = oldScore > 0 ? 3 : 5;
      } else if (oldScore === 0) {
        reward = newScore >= 80 ? 5 : 2;
      }
      
      setAppState(prev => ({ 
        ...prev, 
        meceFeedback: result,
        tokens: (prev.tokens ?? 50) + reward
      }));
      sounds.playSuccess();
      if (reward > 0) {
        toast.success(`MECE audit completed! Earned +${reward} tokens.`);
      } else {
        toast.success("MECE audit completed!");
      }
    } catch (err: any) {
      sounds.playError();
      toast.error("Failed to run MECE audit: " + (err?.message || ""));
    } finally {
      setIsAuditing(false);
    }
  };

  const nodeFeedbackMap = useMemo(() => {
    const map: { [nodeId: string]: NodeFeedbackItem } = {};
    if (appState.meceFeedback?.nodeFeedback) {
      appState.meceFeedback.nodeFeedback.forEach((item) => {
        map[item.nodeId] = item;
      });
    }
    return map;
  }, [appState.meceFeedback]);

  const isPlayground = appState.issueTreeMode === 'playground';
  const activeTree = isPlayground ? appState.playgroundTree : appState.issueTree;

  const loadingMessages = [
    "Parsing main problem...", 
    "Applying MECE principles...", 
    "Branching sub-issues...", 
    "Structuring causal chain..."
  ];

  return (
    <section className="bg-[#0f172a] flex flex-col flex-1 min-h-0 border border-slate-800 animate-in fade-in slide-in-from-bottom-4 duration-500 rounded-lg overflow-hidden">
      {/* Upper Navigation Bar */}
      <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-[#070b14]/50 shrink-0">
        <div className="flex items-center gap-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">MECE Issue Tree</h2>
          {!isPlayground && (
            <Tooltip content="Generate a structured issue tree from the core problem" position="bottom" className="inline-flex">
              <ShimmerButton
                onClick={handleUnlockAITree}
                disabled={isBuilding || !appState.caseGlance || (!appState.issueTree && !appState.meceFeedback && (appState.tokens ?? 0) < 10)}
                isLoading={isBuilding}
                className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-[10px] uppercase font-bold text-white px-3 py-1.5 rounded transition-colors cursor-pointer"
              >
                {isBuilding 
                  ? 'Structuring...' 
                  : appState.issueTree 
                  ? 'Re-build Issue Tree' 
                  : appState.meceFeedback 
                  ? 'Unlock AI Tree (Free)' 
                  : 'Unlock AI Tree (10 🪙)'}
              </ShimmerButton>
            </Tooltip>
          )}
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

      {/* Mode Selector Tabs */}
      {appState.caseGlance && (
        <div className="flex border-b border-slate-850 bg-[#070b14]/20 px-6 py-2.5 shrink-0 gap-4">
          <button
            onClick={() => {
              sounds.playClick();
              const newState: Partial<AppState> = { issueTreeMode: 'playground' };
              if (!appState.playgroundTree) {
                newState.playgroundTree = {
                  id: 'root',
                  label: appState.caseGlance?.coreProblem || 'Core Problem',
                  children: []
                };
              }
              setAppState(prev => ({ ...prev, ...newState }));
            }}
            className={`text-[10px] uppercase font-bold tracking-wider py-1.5 px-3 rounded-md transition-all cursor-pointer border ${
              isPlayground
                ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 font-extrabold'
                : 'text-slate-500 hover:text-slate-400 border-transparent'
            }`}
          >
            Interactive Playground
          </button>
          <button
            onClick={() => {
              sounds.playClick();
              setAppState(prev => ({ ...prev, issueTreeMode: 'generate' }));
            }}
            className={`text-[10px] uppercase font-bold tracking-wider py-1.5 px-3 rounded-md transition-all cursor-pointer border flex items-center gap-1.5 ${
              !isPlayground
                ? 'bg-blue-500/10 text-blue-400 border-blue-500/30 font-extrabold'
                : 'text-slate-500 hover:text-slate-400 border-transparent'
            }`}
          >
            {appState.issueTree ? '✨' : '🔒'} AI Generated Tree
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <div className="p-6 flex-1 overflow-y-auto custom-scrollbar flex flex-col min-h-0">
        {activeTree ? (
          <div className="flex flex-col lg:flex-row gap-6 items-stretch flex-1 min-h-0">
            {/* Tree View Column */}
            <div className="flex-1 bg-slate-900/40 border border-slate-800/80 rounded-xl p-6 font-sans text-slate-300 shadow-inner overflow-y-auto custom-scrollbar">
              <TreeNode 
                node={activeTree} 
                level={0} 
                onUpdateText={handleUpdateText} 
                isPlayground={isPlayground}
                onAddChild={handleAddChild}
                onDeleteNode={handleDeleteNode}
                nodeFeedbackMap={nodeFeedbackMap}
              />
            </div>

            {/* Coach Audit Column (Playground Mode Only) */}
            {isPlayground && (
              <MECECoachPanel
                isAuditing={isAuditing}
                meceFeedback={appState.meceFeedback}
                hasAiTree={!!appState.issueTree}
                onInitializeFromAI={handleInitializeFromAI}
                onResetPlayground={handleResetPlayground}
                onAudit={handleAudit}
              />
            )}
          </div>
        ) : appState.caseGlance ? (
          <AITreeLockedView
            isBuilding={isBuilding}
            tokens={appState.tokens ?? 50}
            hasMeceFeedback={!!appState.meceFeedback}
            onUnlock={handleUnlockAITree}
          />
        ) : (
          <EmptyState 
            title="Awaiting Core Problem Breakdown"
            description="You need to analyze the case intake first before structuring the logic tree."
            actionLabel="Go to Intake"
            onAction={onGoBack}
          />
        )}

        {activeTree && onNext && (
          <div className="flex justify-end pt-4 border-t border-slate-800 mt-6 shrink-0">
            <Tooltip content="Proceed to select analysis frameworks" position="top" className="inline-flex">
              <button 
                onClick={() => {
                  sounds.playTransition();
                  if (onNext) onNext();
                }}
                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2 cursor-pointer"
              >
                Select Frameworks
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </Tooltip>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1e293b;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #334155;
        }
      `}} />
    </section>
  );
};

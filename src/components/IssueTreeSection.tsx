import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { Maximize2, Minimize2 } from 'lucide-react';
import { buildIssueTree, evaluateIssueTree, suggestSubIssues } from '../services/geminiService';
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
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandingNodes, setExpandingNodes] = useState<Record<string, boolean>>({});

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
        focusedNodeId: newChild.id,
        meceFeedback: null
      }));
      toast.success("Sub-issue added!");
    }
  };

  const handleAddSibling = (siblingId: string) => {
    sounds.playClick();
    if (siblingId === 'root') {
      toast.error("Cannot add sibling to the root node!");
      return;
    }
    const newSibling: IssueTreeNode = {
      id: generateUniqueId(),
      label: 'New Sibling',
      children: []
    };

    const addSiblingToParent = (node: IssueTreeNode): IssueTreeNode => {
      if (node.children) {
        const index = node.children.findIndex(child => child.id === siblingId);
        if (index !== -1) {
          const newChildren = [...node.children];
          newChildren.splice(index + 1, 0, newSibling);
          return {
            ...node,
            children: newChildren
          };
        }
        return {
          ...node,
          children: node.children.map(addSiblingToParent)
        };
      }
      return node;
    };

    if (appState.playgroundTree) {
      setAppState(prev => ({
        ...prev,
        playgroundTree: addSiblingToParent(prev.playgroundTree!),
        focusedNodeId: newSibling.id,
        meceFeedback: null
      }));
      toast.success("Sibling issue added!");
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
      let targetFocusId: string | null = null;
      
      const findFocusTarget = (node: IssueTreeNode, parentId: string | null = null): boolean => {
        if (node.children) {
          const idx = node.children.findIndex(c => c.id === nodeId);
          if (idx !== -1) {
            if (idx > 0) {
              targetFocusId = node.children[idx - 1].id;
            } else if (idx < node.children.length - 1) {
              targetFocusId = node.children[idx + 1].id;
            } else {
              targetFocusId = parentId || node.id;
            }
            return true;
          }
          for (const child of node.children) {
            if (findFocusTarget(child, node.id)) return true;
          }
        }
        return false;
      };

      findFocusTarget(appState.playgroundTree, null);

      const updated = removeNode(appState.playgroundTree);
      setAppState(prev => ({
        ...prev,
        playgroundTree: updated,
        focusedNodeId: targetFocusId,
        meceFeedback: null
      }));
      toast.info("Sub-issue removed");
    }
  };

  const handleExpandWithAI = async (parentId: string, parentLabel: string) => {
    sounds.playClick();
    if (!appState.caseBrief) {
      toast.error("Case brief is missing.");
      return;
    }
    const tokenCost = 2;
    if ((appState.tokens ?? 0) < tokenCost) {
      sounds.playError();
      toast.error(`Insufficient tokens! Suggesting sub-issues requires ${tokenCost} tokens.`);
      return;
    }

    setExpandingNodes(prev => ({ ...prev, [parentId]: true }));
    try {
      const suggestions = await suggestSubIssues(parentLabel, appState.caseBrief);
      
      if (!suggestions || suggestions.length === 0) {
        throw new Error("No suggestions returned from AI.");
      }

      const newChildren: IssueTreeNode[] = suggestions.map((label: string) => ({
        id: generateUniqueId(),
        label,
        children: []
      }));

      const addSuggestions = (node: IssueTreeNode): IssueTreeNode => {
        if (node.id === parentId) {
          return {
            ...node,
            children: [...(node.children || []), ...newChildren]
          };
        }
        if (node.children) {
          return {
            ...node,
            children: node.children.map(addSuggestions)
          };
        }
        return node;
      };

      if (appState.playgroundTree) {
        setAppState(prev => ({
          ...prev,
          playgroundTree: addSuggestions(prev.playgroundTree!),
          tokens: Math.max(0, (prev.tokens ?? 50) - tokenCost),
          meceFeedback: null
        }));
        sounds.playSuccess();
        toast.success(`AI suggested sub-issues added! (-${tokenCost} tokens)`);
      }
    } catch (err: any) {
      sounds.playError();
      toast.error("Failed to suggest sub-issues: " + (err?.message || ""));
      console.error(err);
    } finally {
      setExpandingNodes(prev => {
        const next = { ...prev };
        delete next[parentId];
        return next;
      });
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
                  : 'Unlock AI Tree (10 ⚡)'}
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
        <div className="flex justify-between items-center border-b border-slate-850 bg-[#070b14]/20 px-6 py-2.5 shrink-0 gap-4">
          <div className="flex gap-4">
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
                  ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 ' + (isExpanded ? 'border-cyan-500/50' : '') + ' font-extrabold'
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

          {isPlayground && (
            <div className="flex items-center gap-3">
              {appState.meceFeedback && (
                <span className={`text-[10px] font-bold px-2 py-1 rounded border hidden sm:inline-block ${
                  appState.meceFeedback.score >= 80 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                }`}>
                  MECE Score: {appState.meceFeedback.score}/100
                </span>
              )}
              {isExpanded && (
                <button
                  onClick={handleAudit}
                  disabled={isAuditing}
                  className="bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 text-[10px] uppercase font-bold text-white px-3 py-1.5 rounded transition-all cursor-pointer flex items-center gap-1.5 shadow-[0_0_10px_rgba(6,182,212,0.15)] hover:shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                >
                  {isAuditing ? 'Auditing...' : 'Run MECE Audit'}
                </button>
              )}
              <button
                onClick={() => {
                  sounds.playClick();
                  setIsExpanded(!isExpanded);
                }}
                className={`text-[10px] uppercase font-bold tracking-wider py-1.5 px-3 rounded-md transition-all cursor-pointer border flex items-center gap-1.5 ${
                  isExpanded
                    ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.1)]'
                    : 'text-slate-450 hover:text-slate-300 border-slate-800 bg-slate-900/30'
                }`}
                title={isExpanded ? "Show split view with Coach" : "Maximize issue tree playground"}
              >
                {isExpanded ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
                <span>{isExpanded ? 'Split View' : 'Focus Mode'}</span>
              </button>
            </div>
          )}
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
                onAddSibling={handleAddSibling}
                onExpandWithAI={handleExpandWithAI}
                expandingNodes={expandingNodes}
              />
            </div>

            {/* Coach Audit Column (Playground Mode Only) */}
            {isPlayground && !isExpanded && (
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
            {(() => {
              const isTreeCompleted = !!appState.issueTree || !!appState.meceFeedback;
              return (
                <Tooltip 
                  content={isTreeCompleted ? "Proceed to select analysis frameworks" : "Generate an AI Tree or Run MECE Audit on your playground tree to unlock"} 
                  position="top" 
                  className="inline-flex"
                >
                  <button 
                    disabled={!isTreeCompleted}
                    onClick={() => {
                      if (isTreeCompleted) {
                        sounds.playTransition();
                        if (onNext) onNext();
                      }
                    }}
                    className={`text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 px-4 py-2 rounded ${
                      isTreeCompleted
                        ? 'bg-blue-600 hover:bg-blue-500 text-white cursor-pointer'
                        : 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed'
                    }`}
                  >
                    Select Frameworks
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </button>
                </Tooltip>
              );
            })()}
          </div>
        )}
      </div>
    </section>
  );
};

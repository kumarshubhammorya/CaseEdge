import React, { useState } from 'react';
import { ChevronDown, ChevronRight, AlertTriangle, Plus, Trash2, Sparkles, Loader2 } from 'lucide-react';
import { EditableField, Tooltip } from '../MicroInteractions';
import { sounds } from '../../lib/sounds';
import { IssueTreeNode, NodeFeedbackItem } from '../../types';
import { useAppContext } from '../../context/AppContext';

type TreeNodeProps = {
  node: IssueTreeNode;
  level: number;
  onUpdateText: (id: string, text: string) => void;
  isPlayground?: boolean;
  onAddChild?: (parentId: string) => void;
  onDeleteNode?: (nodeId: string) => void;
  nodeFeedbackMap?: { [nodeId: string]: NodeFeedbackItem };
  onAddSibling?: (siblingId: string) => void;
  onExpandWithAI?: (nodeId: string, nodeLabel: string) => Promise<void>;
  expandingNodes?: Record<string, boolean>;
};

export const TreeNode: React.FC<TreeNodeProps> = ({ 
  node, 
  level, 
  onUpdateText, 
  isPlayground, 
  onAddChild, 
  onDeleteNode, 
  nodeFeedbackMap,
  onAddSibling,
  onExpandWithAI,
  expandingNodes
}) => {
  const [expanded, setExpanded] = useState(true);
  const { appState, setAppState } = useAppContext();
  const hasChildren = node.children && node.children.length > 0;
  const feedback = nodeFeedbackMap?.[node.id];
  const isFocused = appState.focusedNodeId === node.id;

  // Determine container classes and layout wrapper based on level
  let rowClasses = "flex items-center transition-all w-full group relative";
  
  if (level === 0) {
    rowClasses += " p-4 rounded-xl bg-gradient-to-r from-cyan-950/20 to-slate-900/90 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.06)] hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.12)] mb-4";
  } else if (level === 1) {
    rowClasses += " p-3 rounded-lg bg-slate-900/50 border border-slate-800 hover:bg-slate-900/80 hover:border-slate-700/60 shadow-sm mb-3";
  } else {
    rowClasses += " p-2 rounded-md hover:bg-slate-800/20";
  }

  const shouldRenderChildrenBlock = expanded && (hasChildren || isPlayground);

  return (
    <div className="w-full">
      <div className={rowClasses}>
        <div 
          className="w-6 flex justify-center mr-1 cursor-pointer shrink-0"
          onClick={() => {
            if (hasChildren) {
              sounds.playHover();
              setExpanded(!expanded);
            }
          }}
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
        <div className="flex-1 flex items-center gap-2 min-w-0">
          <EditableField 
            value={node.label} 
            onChange={(val) => onUpdateText(node.id, val)}
            className="w-full inline-block m-0 p-1 bg-transparent hover:bg-slate-800/30"
            textClassName={`text-sm ${
              level === 0 
                ? 'font-bold text-cyan-400' 
                : level === 1 
                ? 'font-semibold text-slate-200' 
                : 'text-slate-350 text-slate-300'
            }`}
            autoFocus={isFocused}
            onFocusedReset={() => {
              setAppState(prev => ({
                ...prev,
                focusedNodeId: null
              }));
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (level === 0) {
                  if (onAddChild) onAddChild(node.id);
                } else {
                  if (onAddSibling) onAddSibling(node.id);
                }
              } else if (e.key === 'Backspace' && e.currentTarget.value.trim() === '') {
                e.preventDefault();
                if (onDeleteNode && level > 0) {
                  onDeleteNode(node.id);
                }
              }
            }}
          />
          
          {feedback && (
            <Tooltip content={feedback.feedback} position="top">
              <div className={`p-1 rounded bg-slate-950 border flex items-center shrink-0 ${
                feedback.severity === 'warning' 
                  ? 'border-amber-500/30 text-amber-500 bg-amber-500/5' 
                  : 'border-blue-500/30 text-blue-400 bg-blue-500/5'
              }`}>
                <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />
              </div>
            </Tooltip>
          )}
        </div>

        {isPlayground && (
          <div className={`transition-opacity flex items-center gap-1.5 ml-2 ${expandingNodes?.[node.id] ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
            {onExpandWithAI && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onExpandWithAI(node.id, node.label);
                }}
                disabled={expandingNodes?.[node.id]}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 border border-slate-700 disabled:opacity-50 transition-all cursor-pointer"
                title="Suggest sub-issues with AI (Costs 2 ⚡)"
              >
                {expandingNodes?.[node.id] ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onAddChild) onAddChild(node.id);
              }}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-blue-300 border border-slate-700 transition-all cursor-pointer"
              title="Add sub-issue"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            {level > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onDeleteNode) onDeleteNode(node.id);
                }}
                className="p-1 rounded bg-slate-800 hover:bg-red-950/80 text-slate-400 hover:text-red-400 border border-slate-700 hover:border-red-900/50 transition-all cursor-pointer"
                title="Delete branch"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
      
      {shouldRenderChildrenBlock && (
        <div className="flex flex-col relative w-full pl-[22px]">
          <div 
            className="absolute left-[8px] top-0 bottom-0 w-px bg-slate-800/80"
          />
          {hasChildren && node.children!.map((child) => (
            <TreeNode 
              key={child.id} 
              node={child} 
              level={level + 1} 
              onUpdateText={onUpdateText} 
              isPlayground={isPlayground}
              onAddChild={onAddChild}
              onDeleteNode={onDeleteNode}
              nodeFeedbackMap={nodeFeedbackMap}
              onAddSibling={onAddSibling}
              onExpandWithAI={onExpandWithAI}
              expandingNodes={expandingNodes}
            />
          ))}
          {isPlayground && onAddChild && (
            <button
              onClick={() => onAddChild(node.id)}
              className="flex items-center gap-1.5 py-1.5 px-3 ml-[6px] mt-1 mb-3 rounded-lg border border-dashed border-slate-800 hover:border-cyan-500/40 text-slate-500 hover:text-cyan-400 text-xs font-medium transition-all cursor-pointer bg-slate-950/20 hover:bg-cyan-950/10 self-start"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add sub-issue</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

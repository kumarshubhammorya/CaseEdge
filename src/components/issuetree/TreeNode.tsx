import React, { useState } from 'react';
import { ChevronDown, ChevronRight, AlertTriangle, Plus, Trash2 } from 'lucide-react';
import { EditableField, Tooltip } from '../MicroInteractions';
import { sounds } from '../../lib/sounds';
import { IssueTreeNode, NodeFeedbackItem } from '../../types';

type TreeNodeProps = {
  node: IssueTreeNode;
  level: number;
  onUpdateText: (id: string, text: string) => void;
  isPlayground?: boolean;
  onAddChild?: (parentId: string) => void;
  onDeleteNode?: (nodeId: string) => void;
  nodeFeedbackMap?: { [nodeId: string]: NodeFeedbackItem };
};

export const TreeNode: React.FC<TreeNodeProps> = ({ 
  node, 
  level, 
  onUpdateText, 
  isPlayground, 
  onAddChild, 
  onDeleteNode, 
  nodeFeedbackMap 
}) => {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;
  const feedback = nodeFeedbackMap?.[node.id];

  return (
    <div className="w-full">
      <div 
        className="flex items-center p-2 rounded-md transition-colors w-full group relative hover:bg-slate-800/20"
        style={{ paddingLeft: `${level * 1.5 + 0.5}rem` }}
      >
        <div 
          className="w-6 flex justify-center mr-1 cursor-pointer"
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
            className="w-auto inline-block m-0 p-1 bg-transparent hover:bg-slate-800/30"
            textClassName={`text-sm ${level === 0 ? 'font-bold text-blue-400' : level === 1 ? 'font-semibold text-slate-200' : 'text-slate-400'}`}
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
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 ml-2">
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
      
      {expanded && hasChildren && (
        <div className="flex flex-col relative w-full">
          <div 
            className="absolute left-0 top-0 bottom-0 w-px bg-slate-800/80"
            style={{ left: `${level * 1.5 + 1.25}rem` }}
          />
          {node.children!.map((child) => (
            <TreeNode 
              key={child.id} 
              node={child} 
              level={level + 1} 
              onUpdateText={onUpdateText} 
              isPlayground={isPlayground}
              onAddChild={onAddChild}
              onDeleteNode={onDeleteNode}
              nodeFeedbackMap={nodeFeedbackMap}
            />
          ))}
        </div>
      )}
    </div>
  );
};

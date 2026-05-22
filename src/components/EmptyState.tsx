import React from 'react';
import { Navigation, FileSearch, Layers, PenTool, LayoutTemplate } from 'lucide-react';
import { ShimmerButton } from './MicroInteractions';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  title, 
  description, 
  actionLabel = "Go back", 
  onAction,
  icon = <FileSearch className="w-10 h-10 opacity-30 text-slate-500 mb-4" />
}) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in-95 duration-500 bg-[#0f172a] rounded-lg border border-slate-800">
      <div className="bg-slate-900/50 p-6 rounded-full border border-slate-800/80 mb-6 font-sans">
        {icon}
      </div>
      <h3 className="text-xl font-medium text-slate-300 mb-2">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm mb-6">{description}</p>
      {onAction && (
        <ShimmerButton
          onClick={onAction}
          className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-5 py-2.5 rounded flex items-center gap-2 transition-colors font-bold uppercase tracking-widest"
        >
          <Navigation className="w-3.5 h-3.5" />
          {actionLabel}
        </ShimmerButton>
      )}
    </div>
  );
};

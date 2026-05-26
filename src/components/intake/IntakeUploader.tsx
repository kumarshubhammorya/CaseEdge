import React, { useRef } from 'react';
import { Upload } from 'lucide-react';
import { CLASSIC_CASES } from './ClassicCases';
import { sounds } from '../../lib/sounds';
import { toast } from 'sonner';

type IntakeUploaderProps = {
  isUploading: boolean;
  caseBrief: string;
  onCaseBriefChange: (val: string) => void;
  onClassicCaseSelect: (content: string) => void;
  onFileSelect: (file: File) => void;
};

export const IntakeUploader: React.FC<IntakeUploaderProps> = ({
  isUploading,
  caseBrief,
  onCaseBriefChange,
  onClassicCaseSelect,
  onFileSelect,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && (file.type === "application/pdf" || file.type.startsWith("image/"))) {
      onFileSelect(file);
    } else {
      toast.error("Please upload a PDF or image file (JPG, PNG).");
    }
  };

  return (
    <div className="space-y-4 shrink-0">
      <div className="flex justify-between items-center">
        <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Upload Case Brief</span>
        <select 
          className="bg-slate-800 border border-slate-700 text-slate-355 text-[10px] rounded px-2.5 py-1.5 uppercase tracking-wider font-extrabold outline-none focus:border-blue-500 cursor-pointer"
          onChange={(e) => {
            if (e.target.value) {
              const selectedCase = CLASSIC_CASES.find(c => c.title === e.target.value);
              if (selectedCase) {
                sounds.playClick();
                onClassicCaseSelect(selectedCase.content);
              }
            }
          }}
          value=""
        >
          <option value="" disabled>Quick Start: Classic Cases</option>
          {CLASSIC_CASES.map(c => (
            <option key={c.title} value={c.title}>{c.title}</option>
          ))}
        </select>
      </div>
      
      <div
        onClick={() => !isUploading && fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`border-2 border-dashed border-cyan-500/30 hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(34,211,238,0.15)] bg-cyan-950/10 rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <input 
          type="file" 
          className="hidden" 
          ref={fileInputRef} 
          accept="application/pdf,image/jpeg,image/png"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFileSelect(file);
          }}
        />
        <Upload className={`w-8 h-8 text-cyan-400 mb-3 ${isUploading ? 'animate-bounce' : ''}`} />
        <p className="text-xs text-cyan-300 font-bold uppercase tracking-wider">
          {isUploading ? 'Reading case brief...' : 'Drop your case PDF or photo here'}
        </p>
        {!isUploading && <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wide">or click to browse (PDF, JPG, PNG)</p>}
      </div>

      <div className="border border-slate-800 rounded bg-slate-900/20 p-4">
        <span className="text-[10px] font-bold uppercase text-slate-500 block mb-2">Or Paste Text Case Brief Below</span>
        <textarea
          className="w-full h-32 bg-slate-900 border border-slate-700 rounded-md p-3 text-sm text-slate-350 focus:outline-none focus:border-blue-500 resize-none font-sans"
          placeholder="Paste case prompt, company background, exhibit notes here..."
          value={caseBrief}
          onChange={(e) => onCaseBriefChange(e.target.value)}
        />
      </div>
    </div>
  );
};

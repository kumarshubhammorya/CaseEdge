import React, { useState, useEffect, useRef } from 'react';
import { Check, Copy, Pencil } from 'lucide-react';

// --- Typewriter Effect ---
// Prevents re-animating the same text globally.
const animatedStrings = new Set<string>();

export const TypewriterText = ({ text, delay = 15, className = '' }: { text: string; delay?: number; className?: string }) => {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    if (!text) {
      setDisplayedText("");
      return;
    }
    
    if (animatedStrings.has(text)) {
      setDisplayedText(text);
      return;
    }
    
    animatedStrings.add(text);
    let i = 0;
    setDisplayedText(""); // Reset before typing
    
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayedText(text.substring(0, i + 1));
        i++;
      } else {
        clearInterval(timer);
      }
    }, delay);
    
    return () => clearInterval(timer);
  }, [text, delay]);

  return <span className={className}>{displayedText}</span>;
};


// --- Cycling Loading Text ---
export const CyclingLoadingText = ({ messages, interval = 1200 }: { messages: string[]; interval?: number }) => {
  const [idx, setIdx] = useState(0);
  
  useEffect(() => {
    if (messages.length <= 1) return;
    const timer = setInterval(() => setIdx(v => (v + 1) % messages.length), interval);
    return () => clearInterval(timer);
  }, [messages, interval]);
  
  return <span className="animate-pulse">{messages[idx] || 'Processing...'}</span>;
};


// --- Shimmer Button ---
export const ShimmerButton = ({ 
  isLoading, 
  children, 
  className = '', 
  disabled,
  ...props 
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { isLoading?: boolean }) => {
  return (
    <button
      className={`relative overflow-hidden ${className}`}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading && (
        <div 
          className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent z-10 pointer-events-none" 
        />
      )}
      <div className={isLoading ? 'opacity-80 flex items-center justify-center' : 'flex items-center justify-center gap-1.5'}>
        {children}
      </div>
    </button>
  );
};


// --- Copy Action Button ---
export const CopyActionButton = ({ textToCopy, className = '' }: { textToCopy: string; className?: string }) => {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  };
  
  return (
    <button 
      onClick={handleCopy} 
      title="Copy to clipboard"
      className={`${className} transition-all duration-300 flex items-center justify-center ${
        copied ? 'bg-green-500/20 text-green-500 border-green-500/50' : ''
      }`}
    >
      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
    </button>
  );
};


// --- Editable Field ---
export const EditableField = ({ 
  value, 
  onChange, 
  multiline = false,
  className = '',
  textClassName = ''
}: { 
  value: string; 
  onChange: (v: string) => void; 
  multiline?: boolean;
  className?: string;
  textClassName?: string;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement & HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      // Move cursor to end
      const len = inputRef.current.value.length;
      inputRef.current.setSelectionRange(len, len);
    }
  }, [isEditing]);

  if (isEditing) {
    if (multiline) {
      return (
        <textarea
          ref={inputRef}
          value={value}
          onChange={e => onChange(e.target.value)}
          onBlur={() => setIsEditing(false)}
          className={`w-full bg-slate-900 border border-blue-500/50 outline-none text-slate-200 resize-none font-sans p-2 rounded-md ${className} focus:ring-2 focus:ring-blue-500/20 min-h-[80px]`}
        />
      );
    }
    return (
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        onBlur={() => setIsEditing(false)}
        className={`w-full bg-slate-900 border border-blue-500/50 outline-none text-slate-200 font-sans p-2 rounded-md ${className} focus:ring-2 focus:ring-blue-500/20`}
      />
    );
  }

  return (
    <div 
      onClick={() => setIsEditing(true)} 
      className={`relative group cursor-pointer -m-2 p-2 rounded-md hover:bg-slate-800/30 transition-colors ${className}`}
    >
      <div className={`whitespace-pre-wrap ${textClassName}`}>
        <TypewriterText text={value} />
      </div>
      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 flex items-center gap-1 text-slate-400 bg-slate-800/90 px-1.5 py-0.5 rounded shadow-lg border border-slate-700 pointer-events-none transition-opacity">
        <span className="text-[9px] uppercase tracking-wider font-bold">click to edit</span>
        <Pencil className="w-3 h-3" />
      </div>
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { Check, Copy, Pencil } from 'lucide-react';
import { motion, HTMLMotionProps } from 'motion/react';

// --- Typewriter Effect ---
// Prevents re-animating the same text globally.
const animatedStrings = new Set<string>();

export const markAsAnimated = (text: string) => {
  if (text) animatedStrings.add(text);
};

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
}: HTMLMotionProps<"button"> & { isLoading?: boolean }) => {
  return (
    <motion.button
      whileHover={disabled || isLoading ? {} : { scale: 1.015 }}
      whileTap={disabled || isLoading ? {} : { scale: 0.98 }}
      className={`relative overflow-hidden transition-colors focus-visible:ring-2 focus-visible:ring-[#00d4ff] focus-visible:ring-offset-2 focus-visible:outline-none focus-visible:ring-offset-slate-950 ${className}`}
      disabled={isLoading || disabled}
      data-loading={isLoading ? "true" : undefined}
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
    </motion.button>
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
  textClassName = '',
  autoFocus = false,
  onFocusedReset,
  onKeyDown
}: { 
  value: string; 
  onChange: (v: string) => void; 
  multiline?: boolean;
  className?: string;
  textClassName?: string;
  autoFocus?: boolean;
  onFocusedReset?: () => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement & HTMLTextAreaElement>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    if (autoFocus) {
      setIsEditing(true);
      if (onFocusedReset) {
        onFocusedReset();
      }
    }
  }, [autoFocus, onFocusedReset]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      // Move cursor to end
      const len = inputRef.current.value.length;
      inputRef.current.setSelectionRange(len, len);
    }
  }, [isEditing]);

  const handleBlur = () => {
    markAsAnimated(localValue);
    onChange(localValue);
    setIsEditing(false);
  };

  if (isEditing) {
    if (multiline) {
      return (
        <textarea
          ref={inputRef}
          value={localValue}
          onChange={e => setLocalValue(e.target.value)}
          onClick={e => e.stopPropagation()}
          onBlur={handleBlur}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              markAsAnimated(localValue);
              onChange(localValue);
              setIsEditing(false);
            }
            if (onKeyDown) onKeyDown(e);
          }}
          className={`w-full bg-slate-900 border border-blue-500/50 outline-none text-slate-200 resize-none font-sans p-2 rounded-md ${className} focus:ring-2 focus:ring-blue-500/20 min-h-[80px]`}
        />
      );
    }
    return (
      <input
        ref={inputRef}
        type="text"
        value={localValue}
        onChange={e => setLocalValue(e.target.value)}
        onClick={e => e.stopPropagation()}
        onBlur={handleBlur}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            markAsAnimated(localValue);
            onChange(localValue);
            setIsEditing(false);
          }
          if (onKeyDown) onKeyDown(e);
        }}
        className={`w-full bg-slate-900 border border-blue-500/50 outline-none text-slate-200 font-sans p-2 rounded-md ${className} focus:ring-2 focus:ring-blue-500/20`}
      />
    );
  }

  return (
    <div 
      onClick={(e) => {
        e.stopPropagation();
        setLocalValue(value);
        setIsEditing(true);
      }} 
      className={`relative group cursor-pointer -m-2 p-2 rounded-md hover:bg-slate-800/30 transition-colors ${className}`}
    >
      <div className={`whitespace-pre-wrap ${textClassName}`}>
        <TypewriterText text={value} />
      </div>
    </div>
  );
};

export const EditableListField = ({ 
  items, 
  onChange, 
  className = '',
  textClassName = '',
  listType = 'ul'
}: { 
  items: string[]; 
  onChange: (v: string[]) => void; 
  className?: string;
  textClassName?: string;
  listType?: 'ul' | 'ol';
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(items.join('\n'));
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setLocalValue(items.join('\n'));
  }, [items]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      const len = inputRef.current.value.length;
      inputRef.current.setSelectionRange(len, len);
    }
  }, [isEditing]);

  const handleBlur = () => {
    onChange(localValue.split('\n').filter(s => s.trim() !== ''));
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <textarea
        ref={inputRef}
        value={localValue}
        onChange={e => setLocalValue(e.target.value)}
        onClick={e => e.stopPropagation()}
        onBlur={handleBlur}
        className={`w-full bg-slate-900 border border-blue-500/50 outline-none text-slate-200 resize-none font-sans p-2 rounded-md ${className} focus:ring-2 focus:ring-blue-500/20 min-h-[100px]`}
      />
    );
  }

  const ListTag = listType;

  return (
    <div 
      onClick={(e) => {
        e.stopPropagation();
        setLocalValue(items.join('\n'));
        setIsEditing(true);
      }} 
      className={`relative group cursor-pointer -m-2 p-2 rounded-md hover:bg-slate-800/30 transition-colors ${className}`}
    >
      <ListTag className={`pl-5 space-y-1 ${listType === 'ol' ? 'list-decimal' : 'list-disc'} ${textClassName}`}>
        {items.length > 0 ? items.map((item, i) => (
          <li key={i} className="pl-1">
            {/* Using TypewriterText here can be complex if it runs all at once or out of order, 
                but we can just use normal text to avoid layout jumps or wrap it. */}
            {item}
          </li>
        )) : <span className="opacity-50 italic list-none -ml-5">Empty</span>}
      </ListTag>
    </div>
  );
};

// --- Tooltip ---
export const Tooltip = ({ children, content, position = 'bottom', className = 'inline-flex' }: { children: React.ReactNode; content: string; position?: 'top' | 'bottom' | 'left' | 'right', className?: string }) => {
  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div className={`relative group/tooltip ${className}`}>
      {children}
      <div className={`absolute ${positionClasses[position]} w-max max-w-xs px-2 py-1 bg-slate-900 border border-slate-700 text-slate-300 text-[10px] font-sans rounded opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-50 overflow-hidden break-words pointer-events-none shadow-lg whitespace-normal leading-tight text-center`}>
        {content}
      </div>
    </div>
  );
};

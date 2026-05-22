import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown } from 'lucide-react';

export const ScrollDownIndicator: React.FC = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const checkScroll = () => {
      if (document.querySelector('[data-loading="true"]')) {
        setShow(false);
        return;
      }

      // Find all elements that might be scrollable
      const scrollableElements = Array.from(document.querySelectorAll('.overflow-y-auto, .overflow-auto'));
      let shouldShow = false;

      for (const el of scrollableElements) {
        // Must be visible and have actual scrollable content
        if (el.clientHeight > 0 && el.scrollHeight > el.clientHeight + 10) {
          const isNotAtBottom = el.scrollHeight - el.scrollTop > el.clientHeight + 40; 
          
          if (isNotAtBottom) {
            shouldShow = true;
            break;
          }
        }
      }
      setShow(shouldShow);
    };

    // Check initially and after short delays to account for dynamic content rendering
    checkScroll();
    const timeout1 = setTimeout(checkScroll, 500);
    const timeout2 = setTimeout(checkScroll, 1500);

    // Use capture phase to catch scroll events from any element
    window.addEventListener('scroll', checkScroll, true);
    window.addEventListener('resize', checkScroll);

    // Observe DOM mutations to check scroll state when new content arrives
    const observer = new MutationObserver(checkScroll);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });

    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
      window.removeEventListener('scroll', checkScroll, true);
      window.removeEventListener('resize', checkScroll);
      observer.disconnect();
    };
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="fixed bottom-28 md:bottom-24 lg:bottom-12 left-1/2 -translate-x-1/2 z-[100] pointer-events-none flex flex-col items-center gap-1.5"
        >
          <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-[#00d4ff]/80 px-4 py-1.5 bg-[#090b10]/90 backdrop-blur-md rounded-full border border-[#00d4ff]/30 shadow-[0_4px_20px_rgba(0,212,255,0.15)] flex items-center gap-2">
            Scroll for more
            <motion.div
              animate={{ y: [0, 4, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="bg-[#00d4ff]/10 rounded-full p-0.5"
            >
              <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 text-[#00d4ff]" />
            </motion.div>
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

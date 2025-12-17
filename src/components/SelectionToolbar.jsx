import { useEffect, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { MessageCircle, Copy, Check, Sparkles } from 'lucide-react';

const QUICK_QUESTIONS = [
  { label: '这句啥意思？', icon: '💡' },
  { label: '有替换表达吗？', icon: '🔄' },
  { label: '语法结构？', icon: '📐' }
];

export const SelectionToolbar = ({
  containerRef,
  onAskAI,
  onQuickQuestion,
  isVisible,
  selectedText
}) => {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [copied, setCopied] = useState(false);
  const toolbarRef = useRef(null);

    const updatePosition = useCallback(() => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || !containerRef?.current) {
        return;
      }

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      const toolbarHeight = 160;
      const toolbarWidth = 200;
      
      let top = rect.bottom + 12;
      let left = rect.left + (rect.width / 2) - (toolbarWidth / 2);

      if (top + toolbarHeight > window.innerHeight - 20) {
        top = rect.top - toolbarHeight - 12;
      }

      left = Math.max(10, Math.min(left, window.innerWidth - toolbarWidth - 10));
      top = Math.max(10, top);

      setPosition({ top, left });
    }, [containerRef]);

  useEffect(() => {
    if (isVisible && selectedText) {
      updatePosition();
    }
  }, [isVisible, selectedText, updatePosition]);

  const handleCopy = async () => {
    if (!selectedText) return;
    try {
      await navigator.clipboard.writeText(selectedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  const handleQuickQuestion = (question) => {
    onQuickQuestion?.(question);
  };

  if (!isVisible || !selectedText) return null;

  return createPortal(
    <div
      ref={toolbarRef}
      className="fixed z-[60] animate-in fade-in zoom-in-95 duration-150"
      style={{ top: position.top, left: position.left }}
    >
      <div className="bg-slate-900 dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-700 dark:border-slate-600 overflow-hidden min-w-[180px]">
        <div className="p-2 border-b border-slate-700 dark:border-slate-600">
          <div className="flex items-center gap-1">
            <button
              onClick={onAskAI}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors active:scale-[0.98]"
            >
              <MessageCircle className="w-4 h-4" />
              问 AI
            </button>
              <button
                onClick={handleCopy}
                className="p-2 rounded-xl hover:bg-slate-700 dark:hover:bg-slate-600 text-slate-300 transition-colors"
                title="复制"
              >
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
        
        <div className="p-2 space-y-1">
          <div className="px-2 py-1 text-[10px] text-slate-400 uppercase tracking-wide flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              快捷追问
            </div>
            {QUICK_QUESTIONS.map((q) => (
              <button
                key={q.label}
                onClick={() => handleQuickQuestion(q.label)}
                className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-200 hover:bg-slate-700 dark:hover:bg-slate-600 transition-colors flex items-center gap-2"
              >
              <span>{q.icon}</span>
              <span>{q.label}</span>
            </button>
          ))}
        </div>
      </div>
      
        <div
          className="absolute w-3 h-3 bg-slate-900 dark:bg-slate-800 border-t border-l border-slate-700 dark:border-slate-600 transform rotate-45 -top-1.5 left-1/2 -translate-x-1/2"
        />
    </div>,
    document.body
  );
};

export default SelectionToolbar;

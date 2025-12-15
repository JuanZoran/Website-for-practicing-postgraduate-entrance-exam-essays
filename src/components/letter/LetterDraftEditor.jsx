import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Check, RotateCcw } from 'lucide-react';
import { checkFormat } from '../../services/letterPromptService';

const DEFAULT_FORMAT_CHECKS = { salutation: 'warn', signOff: 'warn', punctuation: 'warn' };

const getFormatCheckIcon = (status) => {
  if (status === 'pass') return <Check className="w-4 h-4 text-green-500" />;
  if (status === 'fail') return <AlertCircle className="w-4 h-4 text-red-500" />;
  return <AlertCircle className="w-4 h-4 text-amber-500" />;
};

const countWords = (text) => String(text || '').split(/\\s+/).filter(Boolean).length;

const LetterDraftEditor = ({ title, text, initialText, register, onChange, onReset }) => {
  const [isFullscreenEditor, setIsFullscreenEditor] = useState(false);
  const [formatChecks, setFormatChecks] = useState(DEFAULT_FORMAT_CHECKS);

  const wordCount = useMemo(() => countWords(text), [text]);

  useEffect(() => {
    if (!text) return;
    const result = checkFormat(text, register);
    setFormatChecks(result.checks);
  }, [text, register]);

  return (
    <div className="card-breathe">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-semibold text-xl text-slate-800 dark:text-slate-100">{title}</h2>
        {text && (
          <span className="text-[13px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
            {wordCount} 词
          </span>
        )}
      </div>

      <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          {getFormatCheckIcon(formatChecks.salutation)}
          <span className="text-slate-600 dark:text-slate-400">称呼</span>
        </div>
        <div className="flex items-center gap-2">
          {getFormatCheckIcon(formatChecks.signOff)}
          <span className="text-slate-600 dark:text-slate-400">落款</span>
        </div>
        <div className="flex items-center gap-2">
          {getFormatCheckIcon(formatChecks.punctuation)}
          <span className="text-slate-600 dark:text-slate-400">署名</span>
        </div>
      </div>

      <div className="relative">
        <textarea
          value={text || ''}
          onChange={(e) => onChange(e.target.value)}
          onFocus={(e) => {
            if (window.innerWidth < 768) {
              e.target.blur();
              setIsFullscreenEditor(true);
            }
          }}
          className="input-field font-serif text-[17px] leading-8 min-h-[320px] resize-none"
          placeholder="点击开始编辑你的信件..."
          rows={12}
        />
        {text && initialText && text !== initialText && (
          <button
            onClick={onReset}
            className="absolute top-3 right-3 bg-white dark:bg-slate-800 text-slate-500 p-2 rounded-xl shadow-sm active:scale-95 transition-transform"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
      </div>

      {isFullscreenEditor && (
        <div className="md:hidden fixed inset-0 z-50 bg-white dark:bg-slate-900 flex flex-col animate-slideUp">
          <div className="px-6 py-4 glass border-b border-slate-200/50 dark:border-slate-700/50 flex justify-between items-center flex-shrink-0">
            <h3 className="font-semibold text-[17px] text-slate-800 dark:text-slate-100">{title}</h3>
            <button onClick={() => setIsFullscreenEditor(false)} className="touch-target text-teal-600 font-medium">
              完成
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <textarea
              value={text || ''}
              onChange={(e) => onChange(e.target.value)}
              className="w-full h-full p-6 bg-transparent text-[17px] leading-8 font-serif text-slate-700 dark:text-slate-300 focus:outline-none resize-none"
              placeholder="开始写作..."
              autoFocus
            />
          </div>
          <div className="px-6 py-4 pb-safe glass border-t border-slate-200/50 dark:border-slate-700/50 flex-shrink-0">
            <div className="flex gap-4 justify-center text-sm">
              <div className="flex items-center gap-2">
                {getFormatCheckIcon(formatChecks.salutation)}
                <span>称呼</span>
              </div>
              <div className="flex items-center gap-2">
                {getFormatCheckIcon(formatChecks.signOff)}
                <span>落款</span>
              </div>
              <div className="flex items-center gap-2">
                {getFormatCheckIcon(formatChecks.punctuation)}
                <span>署名</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LetterDraftEditor;


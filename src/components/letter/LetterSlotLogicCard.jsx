import { useEffect, useRef, useState } from 'react';
import { BrainCircuit, Loader } from 'lucide-react';
import { FollowUpChat } from '../FollowUpChat';
import { LogicStatusDisplay } from '../ScoreDisplay';
import SimpleMarkdown from '../SimpleMarkdown';
import { InlineError } from '../ErrorDisplay';
import { StreamingFeedbackCard } from '../StreamingText';

const CLEAR_STATUS_AFTER_MS = 1500;

const LetterSlotLogicCard = ({
  slot,
  value,
  onChange,
  onLogicCheck,
  disabled,
  isLoading,
  isStreaming,
  streamingText,
  onCancelStreaming,
  feedback,
  error,
  onRetry,
  onSaveVocab,
  sourceTopic,
  followUpContextId,
  followUpInitialContext,
}) => {
  const [savedTipStatus, setSavedTipStatus] = useState({});
  const timeoutsRef = useRef(new Map());

  useEffect(() => {
    return () => {
      for (const id of timeoutsRef.current.values()) {
        window.clearTimeout(id);
      }
      timeoutsRef.current.clear();
    };
  }, []);

  const scheduleClearStatus = (word) => {
    const key = String(word || '').trim();
    if (!key) return;

    const prevTimeoutId = timeoutsRef.current.get(key);
    if (prevTimeoutId) window.clearTimeout(prevTimeoutId);

    const timeoutId = window.setTimeout(() => {
      setSavedTipStatus((prev) => {
        if (!prev[key]) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      });
      timeoutsRef.current.delete(key);
    }, CLEAR_STATUS_AFTER_MS);

    timeoutsRef.current.set(key, timeoutId);
  };

  const handleSaveTip = (tip) => {
    const word = String(tip || '').trim();
    if (!word) return;

    const didAdd = onSaveVocab?.({
      word,
      meaning: '推荐词汇',
      sourceTopic,
      timestamp: Date.now(),
    });

    setSavedTipStatus((prev) => ({ ...prev, [word]: didAdd ? 'added' : 'exists' }));
    scheduleClearStatus(word);
  };

  return (
    <div className="card-breathe">
      <h5 className="font-semibold text-slate-800 dark:text-slate-100 text-[17px] mb-1">{slot.label}</h5>
      <p className="text-[15px] text-slate-500 dark:text-slate-400 mb-4">{slot.question}</p>
      <textarea
        className="input-field"
        rows={3}
        placeholder={slot.placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />

      {isStreaming && (
        <div className="mt-4">
          <StreamingFeedbackCard
            title="AI 审题中..."
            content={streamingText}
            isStreaming={true}
            onCancel={onCancelStreaming}
            type="info"
            icon={BrainCircuit}
          />
        </div>
      )}

      {feedback && (
        <div className="mt-4 space-y-3">
          <LogicStatusDisplay status={feedback.status} />
          <div
            className={`p-4 rounded-2xl ${
              feedback.status === 'pass' ? 'bg-green-50 dark:bg-green-900/20' : 'bg-amber-50 dark:bg-amber-900/20'
            }`}
          >
            <SimpleMarkdown
              text={feedback.comment}
              className={`text-[15px] ${
                feedback.status === 'pass'
                  ? 'text-green-800 dark:text-green-200'
                  : 'text-amber-800 dark:text-amber-200'
              }`}
            />

            {feedback.suggestion && (
              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                <span className="text-xs font-medium text-slate-500 mb-1 block">💡 建议</span>
                <p className="text-[14px] text-slate-600 dark:text-slate-300">{feedback.suggestion}</p>
              </div>
            )}

            {feedback.vocab_tips?.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                <span className="text-xs font-medium text-slate-500 mb-2 block">📚 高分词汇提示</span>
                <div className="flex flex-wrap gap-2">
                  {feedback.vocab_tips.map((tip, i) => {
                    const word = String(tip || '').trim();
                    const status = savedTipStatus[word];
                    const base = 'text-xs px-2 py-1 rounded-full active:scale-95 transition-all cursor-pointer';
                    const cls =
                      status === 'added'
                        ? 'bg-green-500 text-white'
                        : status === 'exists'
                          ? 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                          : 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-800';

                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSaveTip(word)}
                        className={`${base} ${cls}`}
                        title={status === 'added' ? '已加入单词本' : status === 'exists' ? '已在单词本' : '加入单词本'}
                      >
                        {word}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <FollowUpChat
            contextId={followUpContextId}
            initialContext={followUpInitialContext}
            title="继续追问"
            placeholder="对审题结果有疑问？继续追问..."
          />
        </div>
      )}

      {error && (
        <div className="mt-4">
          <InlineError error={error} onRetry={onRetry} />
        </div>
      )}

      <button
        onClick={onLogicCheck}
        disabled={disabled}
        className="mt-4 w-full py-3.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
      >
        {isLoading ? <Loader className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4" />}
        <span>AI 审题</span>
      </button>
    </div>
  );
};

export default LetterSlotLogicCard;

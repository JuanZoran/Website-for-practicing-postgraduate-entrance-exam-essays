import { useState, useEffect, lazy, Suspense } from 'react';
import { 
  BookOpen, Loader, Sparkles,
  Check, FileText, AlertCircle
} from 'lucide-react';
import { clearConversationHistoryByPrefix } from "../services/aiService";
import { buildLetterPrompt, getLetterTypeName, getLetterTypeIcon } from "../services/letterPromptService";
import { LETTER_TYPES } from "../data/letterData";
import { FollowUpChat } from "./FollowUpChat";
import SimpleMarkdown from "./SimpleMarkdown";
import { InlineError } from "./ErrorDisplay";
import { StreamingFeedbackCard } from "./StreamingText";
import { useStreamingAIJob } from "../hooks/useStreamingAIJob";
import LetterSlotLogicCard from "./letter/LetterSlotLogicCard";
import LetterDraftEditor from "./letter/LetterDraftEditor";
import LetterChecklist from "./letter/LetterChecklist";
import { buildFinalJsonPrompt } from "../utils/finalJsonPrompt";
import { normalizeLetterLogicJson, normalizeLetterScoringJson } from "../utils/aiResponseNormalization";

const ModelEssayModal = lazy(() => import('./ModelEssayModal'));

const createEmptyChecklist = () => ({
  tense: false,
  agreement: false,
  spelling: false,
  signOff: false,
  points: false,
});

const LetterWorkflowManager = ({ data, onSaveVocab, onSaveHistory }) => {
  const [step, setStep] = useState(0);
  const [inputs, setInputs] = useState({});
  const [feedback, setFeedback] = useState({});
  const [finalLetterText, setFinalLetterText] = useState(null);
  const [initialLetterText, setInitialLetterText] = useState(null);
  const [showModelEssay, setShowModelEssay] = useState(false);
  const [checklist, setChecklist] = useState(createEmptyChecklist);
  const { loading, streaming, error, runJob, stopStreaming, clearError } = useStreamingAIJob();

  const letterType = data.type || 'suggestion';
  const letterTypeInfo = LETTER_TYPES[letterType] || {};

  useEffect(() => {
    stopStreaming();
    setStep(0);
    setInputs({});
    setFeedback({});
    setFinalLetterText(null);
    setInitialLetterText(null);
    setShowModelEssay(false);
    setChecklist(createEmptyChecklist());
    clearError();
    clearConversationHistoryByPrefix(`letter_logic_${data.id}`);
    clearConversationHistoryByPrefix(`letter_polish_${data.id}`);
    clearConversationHistoryByPrefix(`letter_scoring_${data.id}`);
  }, [data]);

  useEffect(() => {
    if (step !== 1) return;

    const generatedText = generateLetterText();
    if (finalLetterText === null) {
      setInitialLetterText(generatedText);
      setFinalLetterText(generatedText);
    } else if (initialLetterText !== generatedText) {
      setInitialLetterText(generatedText);
    }
  }, [step, data, inputs, finalLetterText, initialLetterText]);

  const generateLetterText = () => {
    let txt = data.templateString || "";
    data.slots.forEach(s => {
      txt = txt.replace(`{{${s.id}}}`, inputs[s.id] || `[${s.label}]`);
    });
    return txt;
  };

  const handleLogicCheck = async (id) => {
    if (!inputs[id]) return;
    const slotInfo = data.slots.find((s) => s.id === id);
    const basePrompt = buildLetterPrompt('letter_logic', {
      letterType: data.type,
      register: data.register,
      scenario: data.scenario,
      requirements: data.requirements,
      slotLabel: slotInfo?.label,
      slotQuestion: slotInfo?.question,
      userInput: inputs[id]
    });
    const prompt = buildFinalJsonPrompt(basePrompt || '', {
      markdownInstruction: '先输出给学生看的中文 Markdown 反馈（用于流式展示）。',
      jsonExample:
        '{ "status":"pass/warn/fail", "score":1-10, "comment":"(与上面的 Markdown 反馈保持一致，可直接复用)", "suggestion":"具体改进建议", "format_hints":[], "content_check":{ "covered":[], "missing":[] }, "vocab_tips":[] }',
    });

    await runJob({
      type: 'logic',
      id,
      prompt,
      loadingKey: id,
      errorId: id,
      fallbackErrorMessage: '审题失败，请重试',
      normalizeJson: normalizeLetterLogicJson,
      onStart: () => {
        setFeedback((prev) => ({ ...prev, [id]: null }));
      },
      onSuccess: ({ json }) => {
        setFeedback((prev) => ({ ...prev, [id]: json }));
        onSaveHistory(data.id, { type: 'letter_logic', input: inputs[id], feedback: json, timestamp: Date.now() });
      }
    });
  };

  const handleResetLetter = () => {
    const initialText = generateLetterText();
    setInitialLetterText(initialText);
    setFinalLetterText(initialText);
  };

  const handleFinalScoring = async () => {
    const text = finalLetterText || generateLetterText();
    const basePrompt = buildLetterPrompt('letter_scoring', {
      letterType: data.type,
      register: data.register,
      scenario: data.scenario,
      requirements: data.requirements,
      essay: text
    });
    const prompt = buildFinalJsonPrompt(basePrompt || '', {
      markdownInstruction: '先输出给学生看的中文 Markdown 阅卷评语（用于流式展示）。',
      jsonExample:
        '{ "score":0-10, "level":"第X档", "comment":"(与上面的 Markdown 评语保持一致，可直接复用)", "dimensions":{}, "format_check":{ "salutation":"pass/warn/fail", "signOff":"pass/warn/fail", "punctuation":"pass/warn/fail", "issues":[] }, "strengths":[], "weaknesses":[], "improved_version":"改进后的范文", "checklist_reminder":[] }',
    });

    await runJob({
      type: 'scoring',
      id: 'final',
      prompt,
      loadingKey: 'final',
      errorId: 'final',
      fallbackErrorMessage: '评分失败，请重试',
      normalizeJson: normalizeLetterScoringJson,
      onStart: () => {
        setFeedback((prev) => ({ ...prev, final: null }));
      },
      onSuccess: ({ json }) => {
        setFeedback((prev) => ({ ...prev, final: json }));
        onSaveHistory(data.id, { type: 'letter_final', input: text, feedback: json, timestamp: Date.now() });
      }
    });
  };

  return (
    <div>
      <div className="flex justify-end mb-3">
        <button
          type="button"
          onClick={() => setShowModelEssay(true)}
          className="px-3 py-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-sm font-medium flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          <BookOpen className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          <span>查看范文</span>
        </button>
      </div>

      <div className="flex justify-center items-center gap-3 mb-8 py-2">
        {["填写框架", "成文评分"].map((t, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className={`flex items-center gap-2 transition-all duration-500 ${i === step ? 'opacity-100' : i < step ? 'opacity-60' : 'opacity-30'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-500 ${
                i === step 
                  ? 'bg-teal-600 text-white scale-110' 
                  : i < step 
                    ? 'bg-teal-100 dark:bg-teal-900/50 text-teal-600 dark:text-teal-400' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
              }`}>
                {i < step ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-[13px] font-medium hidden sm:block ${i === step ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400'}`}>{t}</span>
            </div>
            {i < 1 && <div className={`w-8 h-0.5 rounded-full transition-colors duration-500 ${i < step ? 'bg-teal-400' : 'bg-slate-200 dark:bg-slate-700'}`} />}
          </div>
        ))}
      </div>

      <div className="mb-6 p-4 bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/20 rounded-2xl border border-teal-200 dark:border-teal-800/50">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">{getLetterTypeIcon(letterType)}</span>
          <div>
            <h3 className="font-semibold text-slate-800 dark:text-slate-100">{getLetterTypeName(letterType)}</h3>
            <span className="text-xs px-2 py-0.5 bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 rounded-full">
              {data.register === 'formal' ? '正式语域' : '半正式语域'}
            </span>
          </div>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400">{data.scenario}</p>
        {data.requirements && (
          <div className="mt-3 flex flex-wrap gap-2">
            {data.requirements.map((req, i) => (
              <span key={i} className="text-xs px-2 py-1 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg">
                {i + 1}. {req}
              </span>
            ))}
          </div>
        )}
      </div>

      {step === 0 && (
        <div className="space-y-6 animate-slideUp">
          {letterTypeInfo.keyElements && (
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-200 dark:border-amber-800/50">
              <h4 className="font-medium text-amber-800 dark:text-amber-300 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                {getLetterTypeName(letterType)}关键要素
              </h4>
              <div className="flex flex-wrap gap-2">
                {letterTypeInfo.keyElements.map((el, i) => (
                  <span key={i} className="text-xs px-2 py-1 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 rounded-full">
                    {el}
                  </span>
                ))}
              </div>
            </div>
          )}

          {data.slots.map(slot => (
            <LetterSlotLogicCard
              key={slot.id}
              slot={slot}
              value={inputs[slot.id] || ''}
              onChange={(nextValue) => setInputs((p) => ({ ...p, [slot.id]: nextValue }))}
              onLogicCheck={() => handleLogicCheck(slot.id)}
              disabled={loading !== null}
              isLoading={loading === slot.id}
              isStreaming={loading === slot.id && streaming.type === 'logic' && streaming.id === slot.id}
              streamingText={streaming.text}
              onCancelStreaming={stopStreaming}
              feedback={feedback[slot.id]}
              error={error && error.id === slot.id && error.type === 'logic' ? error.message : null}
              onRetry={() => {
                clearError();
                handleLogicCheck(slot.id);
              }}
              onSaveVocab={onSaveVocab}
              sourceTopic={data.title}
              followUpContextId={`letter_logic_${data.id}_${slot.id}`}
              followUpInitialContext={`小作文题目: ${data.title}\n类型: ${getLetterTypeName(letterType)}\n用户思路: ${inputs[slot.id]}\nAI反馈: ${feedback[slot.id]?.comment || ''}`}
            />
          ))}

          <button onClick={() => setStep(1)} className="btn-primary bg-teal-600 hover:bg-teal-700 shadow-teal-200 dark:shadow-teal-900/30" disabled={loading !== null}>
            继续写作
          </button>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-6 animate-slideUp">
          <LetterDraftEditor
            title={data.title}
            text={finalLetterText}
            initialText={initialLetterText}
            register={data.register}
            onChange={setFinalLetterText}
            onReset={handleResetLetter}
          />

          <LetterChecklist
            checklist={checklist}
            onChange={(key, checked) => setChecklist((prev) => ({ ...prev, [key]: checked }))}
          />

          <button
            onClick={handleFinalScoring}
            disabled={loading !== null}
            className="w-full py-4 bg-teal-600 text-white rounded-2xl font-semibold text-[17px] flex justify-center items-center gap-2 active:scale-[0.98] transition-transform shadow-lg shadow-teal-200 dark:shadow-teal-900/30"
          >
            {loading === 'final' ? <Loader className="w-5 h-5 animate-spin" /> : <BookOpen className="w-5 h-5" />}
            <span>提交阅卷</span>
          </button>

          {loading === 'final' && streaming.type === 'scoring' && streaming.id === 'final' && (
            <div className="mt-4">
              <StreamingFeedbackCard
                title="阅卷中..."
                content={streaming.text}
                isStreaming={true}
                onCancel={stopStreaming}
                type="info"
                icon={BookOpen}
              />
            </div>
          )}

          {error && error.type === 'scoring' && (
            <InlineError 
              error={error.message} 
              onRetry={() => { clearError(); handleFinalScoring(); }} 
            />
          )}

          {feedback.final && (
            <div className="space-y-4">
              <div className="card-breathe text-center">
                <div className="text-6xl font-bold text-teal-600 dark:text-teal-400 mb-2">
                  {feedback.final.score}<span className="text-2xl text-slate-400">/10</span>
                </div>
                <div className="text-sm text-slate-500">{feedback.final.level}</div>
              </div>

              {feedback.final.dimensions && (
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(feedback.final.dimensions).map(([key, dim]) => (
                    <div key={key} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-slate-500 capitalize">{key}</span>
                        <span className="font-semibold text-teal-600 dark:text-teal-400">{dim.score}</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">{dim.comment}</p>
                    </div>
                  ))}
                </div>
              )}

              {feedback.final.format_check?.issues?.length > 0 && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-800/50">
                  <h4 className="font-medium text-red-800 dark:text-red-300 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    格式问题
                  </h4>
                  <ul className="space-y-1">
                    {feedback.final.format_check.issues.map((issue, i) => (
                      <li key={i} className="text-sm text-red-700 dark:text-red-300 flex items-start gap-2">
                        <span className="text-red-400">•</span>
                        {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="card-breathe">
                <h4 className="font-medium text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
                  <span>📝</span> 详细评语
                </h4>
                <SimpleMarkdown text={feedback.final.comment} className="text-[15px] text-slate-600 dark:text-slate-300 leading-relaxed" />

                {(feedback.final.strengths?.length > 0 || feedback.final.weaknesses?.length > 0) && (
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {feedback.final.strengths?.length > 0 && (
                      <div className="p-4 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800/50">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-emerald-500">✅</span>
                          <span className="font-medium text-emerald-700 dark:text-emerald-300 text-sm">优点</span>
                        </div>
                        <ul className="space-y-2">
                          {feedback.final.strengths.map((s, i) => (
                            <li key={i} className="flex items-start gap-2 text-[13px] text-emerald-700 dark:text-emerald-300">
                              <span className="text-emerald-400 mt-0.5">•</span>
                              <span>{s}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {feedback.final.weaknesses?.length > 0 && (
                      <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl border border-amber-200 dark:border-amber-800/50">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-amber-500">⚠️</span>
                          <span className="font-medium text-amber-700 dark:text-amber-300 text-sm">待改进</span>
                        </div>
                        <ul className="space-y-2">
                          {feedback.final.weaknesses.map((w, i) => (
                            <li key={i} className="flex items-start gap-2 text-[13px] text-amber-700 dark:text-amber-300">
                              <span className="text-amber-400 mt-0.5">•</span>
                              <span>{w}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {feedback.final.improved_version && (
                <div className="card-breathe">
                  <h4 className="font-medium text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-teal-500" />
                    9分范文参考
                  </h4>
                  <div className="p-4 bg-teal-50 dark:bg-teal-900/20 rounded-xl font-serif text-[15px] text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {feedback.final.improved_version}
                  </div>
                </div>
              )}

              <FollowUpChat
                contextId={`letter_scoring_${data.id}`}
                initialContext={`小作文题目: ${data.title}\n类型: ${getLetterTypeName(letterType)}\n作文: ${finalLetterText}\n评分: ${feedback.final.score}/10\n评语: ${feedback.final.comment}`}
                title="深入分析"
                placeholder="想了解更多？继续追问..."
              />
            </div>
          )}

          <button onClick={() => setStep(0)} className="btn-secondary">
            返回修改
          </button>
        </div>
      )}

      {showModelEssay && (
        <Suspense fallback={null}>
          <ModelEssayModal isOpen={showModelEssay} onClose={() => setShowModelEssay(false)} data={data} mode="letter" />
        </Suspense>
      )}
    </div>
  );
};

export default LetterWorkflowManager;

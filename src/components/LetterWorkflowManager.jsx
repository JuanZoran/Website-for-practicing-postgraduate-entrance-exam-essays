import { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, Loader, BrainCircuit, Sparkles, 
  Check, PlusCircle, RotateCcw, CheckSquare, FileText, AlertCircle
} from 'lucide-react';
import { callAIStream, clearConversationHistory } from "../services/aiService";
import { buildLetterPrompt, getLetterTypeName, getLetterTypeIcon, checkFormat } from "../services/letterPromptService";
import { LETTER_TYPES } from "../data/letterData";
import { FollowUpChat } from "./FollowUpChat";
import { GrammarScoreDisplay, LogicStatusDisplay } from "./ScoreDisplay";
import SimpleMarkdown from "./SimpleMarkdown";
import ModelEssayModal from "./ModelEssayModal";
import { InlineError } from "./ErrorDisplay";
import { StreamingFeedbackCard } from "./StreamingText";
import { parseJsonFromResponse, splitFinalJsonBlock } from "../utils/streamingJson";

const LetterWorkflowManager = ({ data, onSaveVocab, onSaveError, onSaveHistory }) => {
  const [step, setStep] = useState(0);
  const [inputs, setInputs] = useState({});
  const [feedback, setFeedback] = useState({});
  const [loading, setLoading] = useState(null);
  const [streaming, setStreaming] = useState({ type: null, id: null, text: '' });
  const [finalLetterText, setFinalLetterText] = useState(null);
  const [initialLetterText, setInitialLetterText] = useState(null);
  const [isFullscreenEditor, setIsFullscreenEditor] = useState(false);
  const [showModelEssay, setShowModelEssay] = useState(false);
  const [error, setError] = useState(null);
  const [savedTipStatus, setSavedTipStatus] = useState({});
  const [formatChecks, setFormatChecks] = useState({ salutation: 'warn', signOff: 'warn', punctuation: 'warn' });
  const [checklist, setChecklist] = useState({
    tense: false,
    agreement: false,
    spelling: false,
    signOff: false,
    points: false
  });
  const letterTextareaRef = useRef(null);
  const fullscreenTextareaRef = useRef(null);
  const abortRef = useRef(null);

  const abortOnly = () => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  };

  const stopStreaming = () => {
    abortOnly();
    setStreaming({ type: null, id: null, text: '' });
    setLoading(null);
  };

  useEffect(() => () => abortOnly(), []);

  const letterType = data.type || 'suggestion';
  const letterTypeInfo = LETTER_TYPES[letterType] || {};

  useEffect(() => {
    stopStreaming();
    setStep(0);
    setInputs({});
    setFeedback({});
    setFinalLetterText(null);
    setInitialLetterText(null);
    setError(null);
    setSavedTipStatus({});
    setShowModelEssay(false);
    setChecklist({ tense: false, agreement: false, spelling: false, signOff: false, points: false });
    clearConversationHistory(`letter_logic_${data.id}`);
    clearConversationHistory(`letter_polish_${data.id}`);
    clearConversationHistory(`letter_scoring_${data.id}`);
  }, [data]);

  useEffect(() => {
    if (step === 1) {
      const generatedText = generateLetterText();
      if (finalLetterText === null) {
        setInitialLetterText(generatedText);
        setFinalLetterText(generatedText);
      }
    }
  }, [step, data, inputs]);

  useEffect(() => {
    if (finalLetterText) {
      const result = checkFormat(finalLetterText, data.register);
      setFormatChecks(result.checks);
    }
  }, [finalLetterText, data.register]);

  const generateLetterText = () => {
    let txt = data.templateString || "";
    data.slots.forEach(s => {
      txt = txt.replace(`{{${s.id}}}`, inputs[s.id] || `[${s.label}]`);
    });
    return txt;
  };

  const handleLogicCheck = async (id) => {
    if (!inputs[id]) return;
    if (loading) return;
    setLoading(id);
    setError(null);
    setFeedback(prev => ({ ...prev, [id]: null }));
    setStreaming({ type: 'logic', id, text: '' });

    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const slotInfo = data.slots.find(s => s.id === id);
      const basePrompt = buildLetterPrompt('letter_logic', {
        letterType: data.type,
        register: data.register,
        scenario: data.scenario,
        requirements: data.requirements,
        slotLabel: slotInfo?.label,
        slotQuestion: slotInfo?.question,
        userInput: inputs[id]
      });
      const prompt = `${basePrompt || ''}

## 输出格式（重要，支持流式展示）
请忽略上文对输出格式的要求，仅按以下格式输出。
请按两段输出：
1) 先输出给学生看的中文 Markdown 反馈（用于流式展示）。
2) 最后一段必须输出如下包裹的 JSON（不要用 \`\`\` 包裹，不要输出任何多余字符）：
<FINAL_JSON>
{ "status":"pass/warn/fail", "score":1-10, "comment":"(与上面的 Markdown 反馈保持一致，可直接复用)", "suggestion":"具体改进建议", "format_hints":[], "content_check":{ "covered":[], "missing":[] }, "vocab_tips":[] }
</FINAL_JSON>`;

      const res = await callAIStream(prompt, {
        signal: controller.signal,
        onChunk: (_chunk, fullContent) => {
          const { displayText } = splitFinalJsonBlock(fullContent);
          setStreaming({ type: 'logic', id, text: displayText });
        }
      });

      if (controller.signal.aborted || !res) return;
      const { json, displayText } = parseJsonFromResponse(res);
      if (!json) {
        throw new Error('AI 返回格式解析失败，请重试');
      }
      
      if (json.error || json.status === 'error') {
        setError({ message: json.error || json.message || displayText, id, type: 'logic' });
      } else {
        setFeedback(prev => ({ ...prev, [id]: json }));
        onSaveHistory(data.id, { type: 'letter_logic', input: inputs[id], feedback: json, timestamp: Date.now() });
      }
    } catch (e) {
      if (!controller.signal.aborted) {
        console.error('Letter logic check error:', e);
        setError({ message: e?.message || '审题失败，请重试', id, type: 'logic' });
      }
    }
    if (!controller.signal.aborted) {
      setLoading(null);
      setStreaming({ type: null, id: null, text: '' });
    }
    if (abortRef.current === controller) abortRef.current = null;
  };

  const handleResetLetter = () => {
    const initialText = generateLetterText();
    setInitialLetterText(initialText);
    setFinalLetterText(initialText);
  };

  const handleFinalScoring = async () => {
    if (loading) return;
    setLoading('final');
    setError(null);
    const text = finalLetterText || generateLetterText();
    setFeedback(prev => ({ ...prev, final: null }));
    setStreaming({ type: 'scoring', id: 'final', text: '' });

    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const basePrompt = buildLetterPrompt('letter_scoring', {
        letterType: data.type,
        register: data.register,
        scenario: data.scenario,
        requirements: data.requirements,
        essay: text
      });
      const prompt = `${basePrompt || ''}

## 输出格式（重要，支持流式展示）
请忽略上文对输出格式的要求，仅按以下格式输出。
请按两段输出：
1) 先输出给学生看的中文 Markdown 阅卷评语（用于流式展示）。
2) 最后一段必须输出如下包裹的 JSON（不要用 \`\`\` 包裹，不要输出任何多余字符）：
<FINAL_JSON>
{ "score":0-10, "level":"第X档", "comment":"(与上面的 Markdown 评语保持一致，可直接复用)", "dimensions":{}, "format_check":{ "salutation":"pass/warn/fail", "signOff":"pass/warn/fail", "punctuation":"pass/warn/fail", "issues":[] }, "strengths":[], "weaknesses":[], "improved_version":"改进后的范文", "checklist_reminder":[] }
</FINAL_JSON>`;

      const res = await callAIStream(prompt, {
        signal: controller.signal,
        onChunk: (_chunk, fullContent) => {
          const { displayText } = splitFinalJsonBlock(fullContent);
          setStreaming({ type: 'scoring', id: 'final', text: displayText });
        }
      });

      if (controller.signal.aborted || !res) return;
      const { json, displayText } = parseJsonFromResponse(res);
      if (!json) {
        throw new Error('AI 返回格式解析失败，请重试');
      }
      
      if (json.error || json.status === 'error') {
        setError({ message: json.error || json.message || displayText, id: 'final', type: 'scoring' });
        return;
      }

      setFeedback(prev => ({ ...prev, final: json }));
      onSaveHistory(data.id, { type: 'letter_final', input: text, feedback: json, timestamp: Date.now() });
    } catch (e) {
      if (!controller.signal.aborted) {
        console.error('Letter scoring error:', e);
        setError({ message: e?.message || '评分失败，请重试', id: 'final', type: 'scoring' });
      }
    }
    if (!controller.signal.aborted) {
      setLoading(null);
      setStreaming({ type: null, id: null, text: '' });
    }
    if (abortRef.current === controller) abortRef.current = null;
  };

  const getFormatCheckIcon = (status) => {
    if (status === 'pass') return <Check className="w-4 h-4 text-green-500" />;
    if (status === 'fail') return <AlertCircle className="w-4 h-4 text-red-500" />;
    return <AlertCircle className="w-4 h-4 text-amber-500" />;
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
            <div key={slot.id} className="card-breathe">
              <h5 className="font-semibold text-slate-800 dark:text-slate-100 text-[17px] mb-1">{slot.label}</h5>
              <p className="text-[15px] text-slate-500 dark:text-slate-400 mb-4">{slot.question}</p>
              <textarea
                className="input-field"
                rows={3}
                placeholder={slot.placeholder}
                value={inputs[slot.id] || ''}
                onChange={e => setInputs(p => ({ ...p, [slot.id]: e.target.value }))}
              />

              {loading === slot.id && streaming.type === 'logic' && streaming.id === slot.id && (
                <div className="mt-4">
                  <StreamingFeedbackCard
                    title="AI 审题中..."
                    content={streaming.text}
                    isStreaming={true}
                    onCancel={stopStreaming}
                    type="info"
                    icon={BrainCircuit}
                  />
                </div>
              )}
              
              {feedback[slot.id] && (
                <div className="mt-4 space-y-3">
                  <LogicStatusDisplay status={feedback[slot.id].status} />
                  <div className={`p-4 rounded-2xl ${
                    feedback[slot.id].status === 'pass' 
                      ? 'bg-green-50 dark:bg-green-900/20' 
                      : 'bg-amber-50 dark:bg-amber-900/20'
                  }`}>
                    <SimpleMarkdown text={feedback[slot.id].comment} className={`text-[15px] ${
                      feedback[slot.id].status === 'pass'
                        ? 'text-green-800 dark:text-green-200'
                        : 'text-amber-800 dark:text-amber-200'
                    }`} />
                    {feedback[slot.id].suggestion && (
                      <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                        <span className="text-xs font-medium text-slate-500 mb-1 block">💡 建议</span>
                        <p className="text-[14px] text-slate-600 dark:text-slate-300">{feedback[slot.id].suggestion}</p>
                      </div>
                    )}
                    {feedback[slot.id].vocab_tips?.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                        <span className="text-xs font-medium text-slate-500 mb-2 block">📚 高分词汇提示</span>
                        <div className="flex flex-wrap gap-2">
                          {feedback[slot.id].vocab_tips.map((tip, i) => {
                            const word = String(tip || '').trim();
                            const key = `${slot.id}:${word}`;
                            const status = savedTipStatus[key];
                            const base = "text-xs px-2 py-1 rounded-full active:scale-95 transition-all cursor-pointer";
                            const cls =
                              status === 'added'
                                ? "bg-green-500 text-white"
                                : status === 'exists'
                                  ? "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                                  : "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-800";

                            return (
                              <button
                                key={i}
                                type="button"
                                onClick={() => {
                                  const didAdd = onSaveVocab?.({
                                    word,
                                    meaning: '推荐词汇',
                                    sourceTopic: data.title,
                                    timestamp: Date.now()
                                  });
                                  setSavedTipStatus(prev => ({ ...prev, [key]: didAdd ? 'added' : 'exists' }));
                                  window.setTimeout(() => {
                                    setSavedTipStatus(prev => {
                                      if (!prev[key]) return prev;
                                      const next = { ...prev };
                                      delete next[key];
                                      return next;
                                    });
                                  }, 1500);
                                }}
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
                    contextId={`letter_logic_${data.id}_${slot.id}`}
                    initialContext={`小作文题目: ${data.title}\n类型: ${getLetterTypeName(letterType)}\n用户思路: ${inputs[slot.id]}\nAI反馈: ${feedback[slot.id].comment}`}
                    title="继续追问"
                    placeholder="对审题结果有疑问？继续追问..."
                  />
                </div>
              )}

              {error && error.id === slot.id && error.type === 'logic' && (
                <div className="mt-4">
                  <InlineError 
                    error={error.message} 
                    onRetry={() => { setError(null); handleLogicCheck(slot.id); }} 
                  />
                </div>
              )}

              <button
                onClick={() => handleLogicCheck(slot.id)}
                disabled={loading !== null}
                className="mt-4 w-full py-3.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
              >
                {loading === slot.id ? <Loader className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4" />}
                <span>AI 审题</span>
              </button>
            </div>
          ))}

          <button onClick={() => setStep(1)} className="btn-primary bg-teal-600 hover:bg-teal-700 shadow-teal-200 dark:shadow-teal-900/30" disabled={loading !== null}>
            继续写作
          </button>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-6 animate-slideUp">
          <div className="card-breathe">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-semibold text-xl text-slate-800 dark:text-slate-100">{data.title}</h2>
              {finalLetterText && (
                <span className="text-[13px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                  {finalLetterText.split(/\s+/).filter(Boolean).length} 词
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
                ref={letterTextareaRef}
                value={finalLetterText || ''}
                onChange={(e) => setFinalLetterText(e.target.value)}
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
              {finalLetterText && initialLetterText && finalLetterText !== initialLetterText && (
                <button
                  onClick={handleResetLetter}
                  className="absolute top-3 right-3 bg-white dark:bg-slate-800 text-slate-500 p-2 rounded-xl shadow-sm active:scale-95 transition-transform"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>

            {isFullscreenEditor && (
              <div className="md:hidden fixed inset-0 z-50 bg-white dark:bg-slate-900 flex flex-col animate-slideUp">
                <div className="px-6 py-4 glass border-b border-slate-200/50 dark:border-slate-700/50 flex justify-between items-center flex-shrink-0">
                  <h3 className="font-semibold text-[17px] text-slate-800 dark:text-slate-100">{data.title}</h3>
                  <button 
                    onClick={() => setIsFullscreenEditor(false)}
                    className="touch-target text-teal-600 font-medium"
                  >
                    完成
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <textarea
                    ref={fullscreenTextareaRef}
                    value={finalLetterText || ''}
                    onChange={(e) => setFinalLetterText(e.target.value)}
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

          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-200 dark:border-amber-800/50">
            <h4 className="font-medium text-amber-800 dark:text-amber-300 mb-3 flex items-center gap-2">
              <CheckSquare className="w-4 h-4" />
              交卷前检查清单
            </h4>
            <div className="space-y-2">
              {[
                { key: 'tense', label: '时态一致性', hint: '过去事件用过去时，将来期待用将来时' },
                { key: 'agreement', label: '主谓一致', hint: '第三人称单数是否加了 s' },
                { key: 'spelling', label: '拼写一致', hint: 'Apologize/Apologise 全文统一' },
                { key: 'signOff', label: '落款逗号', hint: 'Yours sincerely 后是否有逗号' },
                { key: 'points', label: '信息点覆盖', hint: '题目要求的要点是否都提到' }
              ].map(item => (
                <label key={item.key} className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={checklist[item.key]}
                    onChange={(e) => setChecklist(prev => ({ ...prev, [item.key]: e.target.checked }))}
                    className="mt-1 w-4 h-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                  />
                  <div>
                    <span className={`font-medium text-sm ${checklist[item.key] ? 'text-amber-600 dark:text-amber-400' : 'text-slate-700 dark:text-slate-300'}`}>
                      {item.label}
                    </span>
                    <p className="text-xs text-slate-500">{item.hint}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

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
              onRetry={() => { setError(null); handleFinalScoring(); }} 
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

      <ModelEssayModal
        isOpen={showModelEssay}
        onClose={() => setShowModelEssay(false)}
        data={data}
        mode="letter"
      />
    </div>
  );
};

export default LetterWorkflowManager;

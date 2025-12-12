import { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, Loader, BrainCircuit, Sparkles, 
  Check, PlusCircle, RotateCcw, BarChart2, Brain, Library
} from 'lucide-react';
import { callAI, clearConversationHistory } from "../services/aiService";
import { buildPrompt } from "../services/promptService";
import { FollowUpChat } from "./FollowUpChat";
import { GrammarScoreDisplay, FinalScoreDisplay, LogicStatusDisplay } from "./ScoreDisplay";
import SimpleMarkdown from "./SimpleMarkdown";
import PersonalizedLearning from "./PersonalizedLearning";
import AdvancedAnalytics from "./AdvancedAnalytics";
import WritingMaterialLibrary from "./WritingMaterialLibrary";
import { InlineError } from "./ErrorDisplay";
import { recordPractice, analyzeEssayErrors, recordErrorPattern } from "../services/learningAnalyticsService";

const EssayWorkflowManager = ({ data, onSaveVocab, onSaveError, onSaveHistory }) => {
  const [step, setStep] = useState(0);
  const [inputs, setInputs] = useState({cn:{}, en:{}});
  const [feedback, setFeedback] = useState({cn:{}, en:{}, final:null});
  const [loading, setLoading] = useState(null);
  const [finalEssayText, setFinalEssayText] = useState(null);
  const [initialEssayText, setInitialEssayText] = useState(null);
  const [isFullscreenEditor, setIsFullscreenEditor] = useState(false);
  const [showLearning, setShowLearning] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showMaterialLibrary, setShowMaterialLibrary] = useState(false);
  const [error, setError] = useState(null);
  const [activeInputField, setActiveInputField] = useState(null);
  const essayTextareaRef = useRef(null);
  const fullscreenTextareaRef = useRef(null);
  
  useEffect(() => { 
    setStep(0); 
    setInputs({cn:{}, en:{}}); 
    setFeedback({cn:{}, en:{}, final:null}); 
    setFinalEssayText(null);
    setInitialEssayText(null);
    // 清除该题目的对话历史
    clearConversationHistory(`logic_${data.id}`);
    clearConversationHistory(`grammar_${data.id}`);
    clearConversationHistory(`scoring_${data.id}`);
  }, [data]);

  // Initialize essay text when entering step 2
  useEffect(() => {
    if (step === 2) {
      const generatedText = (() => {
        let txt = data.templateString || "";
        data.slots.forEach(s => txt = txt.replace(`{{${s.id}}}`, inputs.en[s.id]||`[${s.label}]`));
        return txt;
      })();
      
      // If finalEssayText is null, initialize both
      if (finalEssayText === null) {
        setInitialEssayText(generatedText);
        setFinalEssayText(generatedText);
      } else if (initialEssayText !== generatedText) {
        // If inputs changed (generated text is different), update initialEssayText
        // but keep the user's edited finalEssayText
        setInitialEssayText(generatedText);
      }
    }
  }, [step, data, inputs, finalEssayText, initialEssayText]);

  // 处理素材插入
  const handleInsertMaterial = (text) => {
    if (step === 2) {
      // 在成文阶段，插入到作文文本
      const textarea = isFullscreenEditor ? fullscreenTextareaRef.current : essayTextareaRef.current;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const currentText = finalEssayText || '';
        const newText = currentText.substring(0, start) + text + currentText.substring(end);
        setFinalEssayText(newText);
        // 设置光标位置
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(start + text.length, start + text.length);
        }, 0);
      } else {
        setFinalEssayText((prev) => (prev || '') + ' ' + text);
      }
    } else if (step === 1 && activeInputField) {
      // 在翻译阶段，插入到当前活跃的英文输入框
      setInputs(prev => ({
        ...prev,
        en: {
          ...prev.en,
          [activeInputField]: (prev.en[activeInputField] || '') + ' ' + text
        }
      }));
    }
  };

  // 根据 slot id 获取任务类型描述
  const getSlotTypeDescription = (slotId) => {
    const typeMap = {
      'desc': '图画描述 - 需要准确、生动地描述图画内容',
      'arg1': '核心意义/论点 - 需要深入分析主题的意义',
      'harm': '危害分析 - 需要分析问题的负面影响',
      'action': '建议/行动 - 需要提出可行的解决方案',
      'reason': '原因分析 - 需要分析现象背后的原因'
    };
    return typeMap[slotId] || '思路分析';
  };

  const handleLogic = async (id) => {
    if (!inputs.cn[id]) return;
    setLoading(id);
    setError(null);
    try {
      const slotInfo = data.slots.find(s => s.id === id);
      const prompt = buildPrompt('logic', {
        topic: data.title,
        description: data.description,
        userInput: inputs.cn[id],
        slotType: `${slotInfo?.label || '思路'} (${getSlotTypeDescription(id)})`
      });
      const res = await callAI(prompt || `Task: Kaoyan Logic Check. Topic: ${data.title}. User Idea: "${inputs.cn[id]}". Output JSON: { "status": "pass/warn", "comment": "Chinese feedback", "suggestion": "Improvement" }`, true);
      const json = JSON.parse(res.replace(/```json|```/g,''));
      
      // 检查是否返回了错误
      if (json.error || json.status === 'error') {
        setError({ message: json.error || json.message, id, type: 'logic' });
      } else {
        setFeedback(prev => ({...prev, cn: {...prev.cn, [id]: json}}));
        onSaveHistory(data.id, { type: 'logic', input: inputs.cn[id], feedback: json, timestamp: Date.now() });
      }
    } catch(e) { 
      console.error('Logic check error:', e);
      setError({ message: e.message || '审题失败，请重试', id, type: 'logic' });
    }
    setLoading(null);
  };

  const handleGrammar = async (id) => {
    if (!inputs.en[id]) return;
    setLoading(id);
    setError(null);
    try {
      const prompt = buildPrompt('grammar', {
        topic: data.title,
        description: data.description,
        chineseInput: inputs.cn[id],
        englishInput: inputs.en[id]
      });
      const res = await callAI(prompt || `Task: Kaoyan Grammar Check. Topic: ${data.title}. CN: "${inputs.cn[id]}". EN: "${inputs.en[id]}". Output JSON: { "score": 1-10, "comment": "Chinese feedback", "grammar_issues": [], "recommended_vocab": [{ "word": "word", "meaning": "meaning", "collocation": "col", "example": "Contextual example sentence", "scenario": "Thinking context" }] }`, true);
      const json = JSON.parse(res.replace(/```json|```/g,''));
      
      // 检查是否返回了错误
      if (json.error || json.status === 'error') {
        setError({ message: json.error || json.message, id, type: 'grammar' });
        setLoading(null);
        return;
      }
      
      setFeedback(prev => ({...prev, en: {...prev.en, [id]: json}}));
      onSaveHistory(data.id, { type: 'grammar', input: inputs.en[id], feedback: json, timestamp: Date.now() });
      if (json.grammar_issues?.length) json.grammar_issues.forEach(err => onSaveError({...err, timestamp: Date.now()}));
    } catch(e) { 
      console.error('Grammar check error:', e);
      setError({ message: e.message || '润色失败，请重试', id, type: 'grammar' });
    }
    setLoading(null);
  };

  const generateEssayText = () => {
    let txt = data.templateString || "";
    data.slots.forEach(s => txt = txt.replace(`{{${s.id}}}`, inputs.en[s.id]||`[${s.label}]`));
    return txt;
  };

  const handleResetEssay = () => {
    const initialText = generateEssayText();
    setInitialEssayText(initialText);
    setFinalEssayText(initialText);
  };

  const handleFinal = async () => {
    setLoading('final');
    setError(null);
    const text = finalEssayText || generateEssayText();
    try {
      const prompt = buildPrompt('scoring', {
        topic: data.title,
        description: data.description,
        essay: text
      });
      const res = await callAI(prompt || `Task: Grade Essay (20pts). Topic: ${data.title}. Text: ${text}. Output JSON: { "score": number, "comment": "Chinese feedback", "strengths": [], "weaknesses": [] }`, true);
      const json = JSON.parse(res.replace(/```json|```/g,'').trim());
      
      // 检查是否返回了错误
      if (json.error || json.status === 'error') {
        setError({ message: json.error || json.message, id: 'final', type: 'scoring' });
        setLoading(null);
        return;
      }
      
      setFeedback(prev => ({...prev, final: json}));
      onSaveHistory(data.id, { type: 'final', input: text, feedback: json, timestamp: Date.now() });
      
      // 记录学习数据
      const wordCount = text.split(/\s+/).filter(w => w.trim()).length;
      recordPractice({
        topicId: data.id,
        score: json.score ? json.score * 5 : 0, // 转换为100分制
        wordCount,
        errors: json.weaknesses || [],
        timeSpent: 0
      });
      
      // 分析错误模式
      const errorTypes = analyzeEssayErrors(json.comment);
      errorTypes.forEach(err => {
        recordErrorPattern(err.type, json.comment);
      });
    } catch(e) { 
      console.error('Scoring error:', e);
      setError({ message: e.message || '评分失败，请重试', id: 'final', type: 'scoring' });
    }
    setLoading(null);
  };

  // 获取词性颜色方案
  const getColorScheme = (meaning) => {
    const m = (meaning || '').toLowerCase();
    if (m.includes('n.') || m.includes('名词')) {
      return { border: 'border-l-blue-500', bg: 'bg-blue-50/50 dark:bg-blue-900/10', word: 'text-blue-600 dark:text-blue-400', tag: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' };
    }
    if (m.includes('v.') || m.includes('动词')) {
      return { border: 'border-l-emerald-500', bg: 'bg-emerald-50/50 dark:bg-emerald-900/10', word: 'text-emerald-600 dark:text-emerald-400', tag: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300' };
    }
    if (m.includes('adj') || m.includes('形容词')) {
      return { border: 'border-l-purple-500', bg: 'bg-purple-50/50 dark:bg-purple-900/10', word: 'text-purple-600 dark:text-purple-400', tag: 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300' };
    }
    return { border: 'border-l-amber-500', bg: 'bg-amber-50/50 dark:bg-amber-900/10', word: 'text-amber-600 dark:text-amber-400', tag: 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300' };
  };

  return (
    <div>
      {/* 步骤指示器 - 乔布斯极简风格 - 更紧凑 */}
      <div className="flex justify-center items-center gap-3 mb-6 py-1">
        {["思考", "翻译", "成文"].map((t, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 transition-all duration-500 ${i === step ? 'opacity-100' : i < step ? 'opacity-60' : 'opacity-30'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-500 ${
                i === step 
                  ? 'bg-indigo-600 text-white scale-110' 
                  : i < step 
                    ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
              }`}>
                {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${i === step ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400'}`}>{t}</span>
            </div>
            {i < 2 && <div className={`w-6 h-0.5 rounded-full transition-colors duration-500 ${i < step ? 'bg-indigo-400' : 'bg-slate-200 dark:bg-slate-700'}`} />}
          </div>
        ))}
      </div>

      {step === 0 && (
        <div className="space-y-6 animate-slideUp">
          {data.slots.map(slot => (
            <div key={slot.id} className="card-breathe">
              <h5 className="font-semibold text-slate-800 dark:text-slate-100 text-[17px] mb-1">{slot.label}</h5>
              <p className="text-[15px] text-slate-500 dark:text-slate-400 mb-4">{slot.question}</p>
              <textarea 
                className="input-field" 
                rows={3} 
                placeholder={slot.placeholder}
                value={inputs.cn[slot.id]||''} 
                onChange={e => setInputs(p => ({...p, cn: {...p.cn, [slot.id]: e.target.value}}))} 
              />
              {/* 反馈显示 */}
              {feedback.cn[slot.id] && (
                <div className="mt-4 space-y-3">
                  {/* 状态显示 */}
                  <LogicStatusDisplay status={feedback.cn[slot.id].status} />
                  {/* 评语 */}
                  <div className={`p-4 rounded-2xl ${
                    feedback.cn[slot.id].status === 'pass' 
                      ? 'bg-green-50 dark:bg-green-900/20' 
                      : 'bg-amber-50 dark:bg-amber-900/20'
                  }`}>
                    <SimpleMarkdown text={feedback.cn[slot.id].comment} className={`text-[15px] ${
                      feedback.cn[slot.id].status === 'pass'
                        ? 'text-green-800 dark:text-green-200'
                        : 'text-amber-800 dark:text-amber-200'
                    }`} />
                    {feedback.cn[slot.id].suggestion && (
                      <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                        <span className="text-xs font-medium text-slate-500 mb-1 block">💡 建议</span>
                        <p className="text-[14px] text-slate-600 dark:text-slate-300">{feedback.cn[slot.id].suggestion}</p>
                      </div>
                    )}
                  </div>
                  {/* 追问组件 */}
                  <FollowUpChat
                    contextId={`logic_${data.id}_${slot.id}`}
                    initialContext={`题目: ${data.title}\n用户思路: ${inputs.cn[slot.id]}\nAI反馈: ${feedback.cn[slot.id].comment}`}
                    title="继续追问"
                    placeholder="对审题结果有疑问？继续追问..."
                  />
                </div>
              )}
              {/* 错误显示 */}
              {error && error.id === slot.id && error.type === 'logic' && (
                <div className="mt-4">
                  <InlineError 
                    error={error.message} 
                    onRetry={() => { setError(null); handleLogic(slot.id); }} 
                  />
                </div>
              )}
              <button 
                onClick={() => handleLogic(slot.id)} 
                disabled={loading===slot.id} 
                className="mt-4 w-full py-3.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
              >
                {loading===slot.id ? <Loader className="w-4 h-4 animate-spin"/> : <BrainCircuit className="w-4 h-4"/>}
                <span>AI 审题</span>
              </button>
            </div>
          ))}
          <button onClick={() => setStep(1)} className="btn-primary">
            继续
          </button>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-6 animate-slideUp">
          {/* 素材库快捷入口 */}
          <button
            onClick={() => setShowMaterialLibrary(true)}
            className="w-full py-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800/50 text-amber-700 dark:text-amber-300 rounded-2xl font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          >
            <Library className="w-4 h-4" />
            <span>打开素材库</span>
          </button>
          
          {data.slots.map(slot => (
            <div key={slot.id} className="card-breathe">
              <div className="flex items-start justify-between mb-4">
                <h5 className="font-semibold text-slate-800 dark:text-slate-100 text-[17px]">{slot.label}</h5>
                {inputs.cn[slot.id] && (
                  <span className="text-[13px] text-slate-400 bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full max-w-[120px] truncate">
                    {inputs.cn[slot.id]}
                  </span>
                )}
              </div>
              <textarea 
                className="input-field font-mono" 
                rows={3} 
                placeholder="Write your English translation here..."
                value={inputs.en[slot.id]||''} 
                onChange={e => setInputs(p => ({...p, en: {...p.en, [slot.id]: e.target.value}}))}
                onFocus={() => setActiveInputField(slot.id)}
              />
              {/* 反馈显示 */}
              {feedback.en[slot.id] && (
                <div className="mt-4 space-y-3">
                  {/* 分数显示 */}
                  <GrammarScoreDisplay score={feedback.en[slot.id].score} />
                  {/* 评语 */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                    <SimpleMarkdown text={feedback.en[slot.id].comment} className="text-[15px] text-slate-600 dark:text-slate-300" />
                  </div>
                  {/* 推荐词汇 */}
                  {feedback.en[slot.id].recommended_vocab?.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-medium text-slate-500 px-1 flex items-center gap-1">
                        <span>📚</span> 推荐词汇
                      </span>
                      {feedback.en[slot.id].recommended_vocab.map((v, i) => {
                        const colorScheme = getColorScheme(v.meaning);
                        return (
                          <div key={i} className={`p-3 ${colorScheme.bg} rounded-xl border-l-4 ${colorScheme.border} border border-slate-200 dark:border-slate-700`}>
                            <div className="flex justify-between items-start gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`font-bold ${colorScheme.word}`}>{v.word}</span>
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${colorScheme.tag}`}>{v.meaning}</span>
                                </div>
                                {v.collocation && (
                                  <div className="mt-1 text-sm">
                                    <span className="text-slate-400">搭配: </span>
                                    <span className="text-slate-600 dark:text-slate-300">{v.collocation}</span>
                                  </div>
                                )}
                                {v.example && (
                                  <div className="mt-1.5 text-sm text-slate-500 dark:text-slate-400 italic line-clamp-2">
                                    {v.example}
                                  </div>
                                )}
                              </div>
                              <button 
                                onClick={() => onSaveVocab({...v, sourceTopic: data.title, timestamp: Date.now()})} 
                                className="flex-shrink-0 p-2 text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-lg transition-colors"
                              >
                                <PlusCircle className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {/* 追问组件 */}
                  <FollowUpChat
                    contextId={`grammar_${data.id}_${slot.id}`}
                    initialContext={`题目: ${data.title}\n中文: ${inputs.cn[slot.id]}\n英文: ${inputs.en[slot.id]}\nAI反馈: ${feedback.en[slot.id].comment}`}
                    title="继续优化"
                    placeholder="想要更好的表达？继续追问..."
                  />
                </div>
              )}
              {/* 错误显示 */}
              {error && error.id === slot.id && error.type === 'grammar' && (
                <div className="mt-4">
                  <InlineError 
                    error={error.message} 
                    onRetry={() => { setError(null); handleGrammar(slot.id); }} 
                  />
                </div>
              )}
              <button 
                onClick={() => handleGrammar(slot.id)} 
                disabled={loading===slot.id} 
                className="mt-4 w-full py-3.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-2xl font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
              >
                {loading===slot.id ? <Loader className="w-4 h-4 animate-spin"/> : <Sparkles className="w-4 h-4"/>}
                <span>AI 润色</span>
              </button>
            </div>
          ))}
          <div className="flex gap-3">
            <button onClick={() => setStep(0)} className="btn-secondary flex-1">返回</button>
            <button onClick={() => setStep(2)} className="btn-primary flex-[2]">继续</button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6 animate-slideUp">
          {/* 素材库快捷入口 */}
          <button
            onClick={() => setShowMaterialLibrary(true)}
            className="w-full py-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800/50 text-amber-700 dark:text-amber-300 rounded-2xl font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          >
            <Library className="w-4 h-4" />
            <span>打开素材库 · 一键插入</span>
          </button>
          
          <div className="card-breathe">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-semibold text-xl text-slate-800 dark:text-slate-100">{data.title}</h2>
              {finalEssayText && (
                <span className="text-[13px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                  {finalEssayText.length} 字符
                </span>
              )}
            </div>
            <div className="relative">
              <textarea
                ref={essayTextareaRef}
                value={finalEssayText || ''}
                onChange={(e) => setFinalEssayText(e.target.value)}
                onFocus={(e) => {
                  if (window.innerWidth < 768) {
                    e.target.blur();
                    setIsFullscreenEditor(true);
                  }
                }}
                className="input-field font-serif text-[17px] leading-8 min-h-[280px] resize-none"
                placeholder="点击开始编辑你的作文..."
                rows={10}
              />
              {finalEssayText && initialEssayText && finalEssayText !== initialEssayText && (
                <button
                  onClick={handleResetEssay}
                  className="absolute top-3 right-3 bg-white dark:bg-slate-800 text-slate-500 p-2 rounded-xl shadow-sm active:scale-95 transition-transform"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>
            
            {/* 移动端全屏编辑器 - 沉浸式体验 */}
            {isFullscreenEditor && (
              <div className="md:hidden fixed inset-0 z-50 bg-white dark:bg-slate-900 flex flex-col animate-slideUp">
                <div className="px-6 py-4 glass border-b border-slate-200/50 dark:border-slate-700/50 flex justify-between items-center flex-shrink-0">
                  <h3 className="font-semibold text-[17px] text-slate-800 dark:text-slate-100">{data.title}</h3>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setShowMaterialLibrary(true)}
                      className="p-2 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-lg transition-colors"
                    >
                      <Library className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => setIsFullscreenEditor(false)}
                      className="touch-target text-indigo-600 font-medium"
                    >
                      完成
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <textarea
                    ref={fullscreenTextareaRef}
                    value={finalEssayText || ''}
                    onChange={(e) => setFinalEssayText(e.target.value)}
                    className="w-full h-full p-6 bg-transparent text-[17px] leading-8 font-serif text-slate-700 dark:text-slate-300 focus:outline-none resize-none"
                    placeholder="开始写作..."
                    autoFocus
                  />
                </div>
                <div className="px-6 py-4 pb-safe glass border-t border-slate-200/50 dark:border-slate-700/50 flex-shrink-0">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowMaterialLibrary(true)}
                      className="flex-1 py-3 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-2xl text-[15px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                    >
                      <Library className="w-4 h-4" />
                      素材库
                    </button>
                    {finalEssayText && initialEssayText && finalEssayText !== initialEssayText && (
                      <button
                        onClick={handleResetEssay}
                        className="flex-1 py-3 text-slate-500 rounded-2xl text-[15px] flex items-center justify-center gap-2 active:bg-slate-100 dark:active:bg-slate-800 transition-colors"
                      >
                        <RotateCcw className="w-4 h-4" />
                        重置
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* 评分按钮 */}
          <button 
            onClick={handleFinal} 
            disabled={loading==='final'} 
            className="w-full py-4 bg-green-600 text-white rounded-2xl font-semibold text-[17px] flex justify-center items-center gap-2 active:scale-[0.98] transition-transform shadow-lg shadow-green-200 dark:shadow-green-900/30"
          >
            {loading==='final' ? <Loader className="w-5 h-5 animate-spin"/> : <BookOpen className="w-5 h-5"/>}
            <span>提交阅卷</span>
          </button>
          
          {/* 错误显示 */}
          {error && error.type === 'scoring' && (
            <InlineError 
              error={error.message} 
              onRetry={() => { setError(null); handleFinal(); }} 
            />
          )}
          
          {/* 评分结果 - 更优雅的展示 */}
          {feedback.final && (
            <div className="space-y-4">
              {/* 分数卡片 */}
              <FinalScoreDisplay score={feedback.final.score} />
              
              {/* 详细评语 */}
              <div className="card-breathe">
                <h4 className="font-medium text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
                  <span>📝</span> 详细评语
                </h4>
                <SimpleMarkdown text={feedback.final.comment} className="text-[15px] text-slate-600 dark:text-slate-300 leading-relaxed" />
                
                {/* 优点和不足 */}
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
              
              {/* 追问组件 */}
              <FollowUpChat
                contextId={`scoring_${data.id}`}
                initialContext={`题目: ${data.title}\n作文: ${finalEssayText}\n评分: ${feedback.final.score}/20\n评语: ${feedback.final.comment}`}
                title="深入分析"
                placeholder="想了解更多？继续追问..."
              />
              
              {/* 高级分析入口 */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAnalytics(true)}
                  className="flex-1 py-3.5 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-2xl font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-lg shadow-purple-200 dark:shadow-purple-900/30 hover:shadow-xl"
                >
                  <BarChart2 className="w-5 h-5" />
                  <span>高级分析</span>
                </button>
                <button
                  onClick={() => setShowLearning(true)}
                  className="flex-1 py-3.5 bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-2xl font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30 hover:shadow-xl"
                >
                  <Brain className="w-5 h-5" />
                  <span>学习分析</span>
                </button>
              </div>
            </div>
          )}
          
          <button onClick={() => setStep(1)} className="btn-secondary">
            返回修改
          </button>
        </div>
      )}
      
      {/* 个性化学习弹窗 */}
      <PersonalizedLearning 
        isOpen={showLearning} 
        onClose={() => setShowLearning(false)} 
      />
      
      {/* 高级分析弹窗 */}
      <AdvancedAnalytics 
        isOpen={showAnalytics} 
        onClose={() => setShowAnalytics(false)}
        essay={finalEssayText}
        history={[]}
      />
      
      {/* 写作素材库 */}
      <WritingMaterialLibrary
        isOpen={showMaterialLibrary}
        onClose={() => setShowMaterialLibrary(false)}
        onInsert={handleInsertMaterial}
        currentTopic={data.title}
      />
    </div>
  );
};

export default EssayWorkflowManager;
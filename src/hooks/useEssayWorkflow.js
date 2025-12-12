import { useState, useEffect, useCallback } from 'react';
import { callAI, clearConversationHistory } from "../services/aiService";
import { buildPrompt } from "../services/promptService";
import { recordPractice, analyzeEssayErrors, recordErrorPattern } from "../services/learningAnalyticsService";

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

export function useEssayWorkflow(data, { onSaveHistory, onSaveError }) {
  const [step, setStep] = useState(0);
  const [inputs, setInputs] = useState({ cn: {}, en: {} });
  const [feedback, setFeedback] = useState({ cn: {}, en: {}, final: null });
  const [loading, setLoading] = useState(null);
  const [finalEssayText, setFinalEssayText] = useState(null);
  const [initialEssayText, setInitialEssayText] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setStep(0);
    setInputs({ cn: {}, en: {} });
    setFeedback({ cn: {}, en: {}, final: null });
    setFinalEssayText(null);
    setInitialEssayText(null);
    clearConversationHistory(`logic_${data.id}`);
    clearConversationHistory(`grammar_${data.id}`);
    clearConversationHistory(`scoring_${data.id}`);
  }, [data]);

  useEffect(() => {
    if (step === 2) {
      const generatedText = generateEssayText();
      if (finalEssayText === null) {
        setInitialEssayText(generatedText);
        setFinalEssayText(generatedText);
      } else if (initialEssayText !== generatedText) {
        setInitialEssayText(generatedText);
      }
    }
  }, [step, data, inputs, finalEssayText, initialEssayText]);

  const generateEssayText = useCallback(() => {
    let txt = data.templateString || "";
    data.slots.forEach(s => txt = txt.replace(`{{${s.id}}}`, inputs.en[s.id] || `[${s.label}]`));
    return txt;
  }, [data, inputs.en]);

  const handleLogic = useCallback(async (id) => {
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
      const json = JSON.parse(res.replace(/```json|```/g, ''));
      
      if (json.error || json.status === 'error') {
        setError({ message: json.error || json.message, id, type: 'logic' });
      } else {
        setFeedback(prev => ({ ...prev, cn: { ...prev.cn, [id]: json } }));
        onSaveHistory(data.id, { type: 'logic', input: inputs.cn[id], feedback: json, timestamp: Date.now() });
      }
    } catch (e) {
      console.error('Logic check error:', e);
      setError({ message: e.message || '审题失败，请重试', id, type: 'logic' });
    }
    setLoading(null);
  }, [data, inputs.cn, onSaveHistory]);

  const handleGrammar = useCallback(async (id) => {
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
      const res = await callAI(prompt || `Task: Kaoyan Grammar Check. Topic: ${data.title}. CN: "${inputs.cn[id]}". EN: "${inputs.en[id]}". Output JSON: { "score": 1-10, "comment": "Chinese feedback", "grammar_issues": [], "recommended_vocab": [] }`, true);
      const json = JSON.parse(res.replace(/```json|```/g, ''));
      
      if (json.error || json.status === 'error') {
        setError({ message: json.error || json.message, id, type: 'grammar' });
        setLoading(null);
        return;
      }
      
      setFeedback(prev => ({ ...prev, en: { ...prev.en, [id]: json } }));
      onSaveHistory(data.id, { type: 'grammar', input: inputs.en[id], feedback: json, timestamp: Date.now() });
      if (json.grammar_issues?.length) {
        json.grammar_issues.forEach(err => onSaveError({ ...err, timestamp: Date.now() }));
      }
    } catch (e) {
      console.error('Grammar check error:', e);
      setError({ message: e.message || '润色失败，请重试', id, type: 'grammar' });
    }
    setLoading(null);
  }, [data, inputs.cn, inputs.en, onSaveHistory, onSaveError]);

  const handleFinal = useCallback(async () => {
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
      const json = JSON.parse(res.replace(/```json|```/g, '').trim());
      
      if (json.error || json.status === 'error') {
        setError({ message: json.error || json.message, id: 'final', type: 'scoring' });
        setLoading(null);
        return;
      }
      
      setFeedback(prev => ({ ...prev, final: json }));
      onSaveHistory(data.id, { type: 'final', input: text, feedback: json, timestamp: Date.now() });
      
      const wordCount = text.split(/\s+/).filter(w => w.trim()).length;
      recordPractice({
        topicId: data.id,
        score: json.score ? json.score * 5 : 0,
        wordCount,
        errors: json.weaknesses || [],
        timeSpent: 0
      });
      
      const errorTypes = analyzeEssayErrors(json.comment);
      errorTypes.forEach(err => {
        recordErrorPattern(err.type, json.comment);
      });
    } catch (e) {
      console.error('Scoring error:', e);
      setError({ message: e.message || '评分失败，请重试', id: 'final', type: 'scoring' });
    }
    setLoading(null);
  }, [data, finalEssayText, generateEssayText, onSaveHistory]);

  const handleResetEssay = useCallback(() => {
    const initialText = generateEssayText();
    setInitialEssayText(initialText);
    setFinalEssayText(initialText);
  }, [generateEssayText]);

  const updateInput = useCallback((lang, id, value) => {
    setInputs(prev => ({ ...prev, [lang]: { ...prev[lang], [id]: value } }));
  }, []);

  return {
    step,
    setStep,
    inputs,
    updateInput,
    feedback,
    loading,
    error,
    setError,
    finalEssayText,
    setFinalEssayText,
    initialEssayText,
    handleLogic,
    handleGrammar,
    handleFinal,
    handleResetEssay,
    generateEssayText
  };
}

export default useEssayWorkflow;

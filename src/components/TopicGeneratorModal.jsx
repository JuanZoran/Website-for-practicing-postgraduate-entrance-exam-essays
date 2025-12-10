import { useState } from 'react';
import { Sparkles, Loader } from 'lucide-react';
import { callAI } from "../services/aiService";

const TopicGeneratorModal = ({ isOpen, onClose, onGenerate }) => {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGen = async () => {
    if(!input) return;
    setLoading(true);
    const p = `Create Kaoyan Essay Topic based on: "${input}". Output JSON: { "id": "gen_${Date.now()}", "year": "AI生成", "title": "${input}", "mode": "Mode A", "visualType": "image", "description": "Cartoon desc", "defaultImage": "https://placehold.co/800x400/f3e8ff/6b21a8?text=${encodeURIComponent(input)}", "slots": [{"id": "desc", "label": "描述", "question": "Desc pic", "templateContext": "Spec...", "placeholder": "eg..." }, {"id": "arg1", "label": "论点", "question": "Why important?", "templateContext": "First...", "placeholder": "eg..." }, {"id": "action", "label": "建议", "question": "Action?", "templateContext": "So...", "placeholder": "eg..." }], "templateString": "Template text {{desc}} {{arg1}} {{action}}" }`;
    try {
      const res = await callAI(p, true);
      onGenerate(JSON.parse(res.replace(/```json|```/g,'')));
      onClose();
    } catch(e) { alert("生成失败"); }
    setLoading(false);
  };

  if(!isOpen) return null;
  
  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50 animate-fadeIn" onClick={onClose} />
      <div className="fixed inset-x-0 bottom-0 md:inset-0 md:flex md:items-center md:justify-center z-50 p-0 md:p-4">
        <div className="bg-white dark:bg-slate-900 rounded-t-3xl md:rounded-3xl w-full md:max-w-md shadow-2xl animate-slideUp">
          {/* 拖动指示器 (移动端) */}
          <div className="md:hidden w-12 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mt-3" />
          
          <div className="p-6">
            <h3 className="font-semibold text-xl text-slate-800 dark:text-slate-100 mb-2">AI 智能出题</h3>
            <p className="text-[15px] text-slate-500 mb-6">输入任意主题，AI 将为你生成完整的作文练习题</p>
            
            <input 
              className="input-field mb-6" 
              placeholder="例如：网络暴力、环境保护、人工智能..." 
              value={input} 
              onChange={e => setInput(e.target.value)} 
            />
            
            <div className="flex gap-3">
              <button 
                onClick={onClose} 
                className="btn-secondary flex-1"
              >
                取消
              </button>
              <button 
                onClick={handleGen} 
                disabled={loading || !input} 
                className={`btn-primary flex-[2] flex items-center justify-center gap-2 ${(!input || loading) ? 'opacity-50' : ''}`}
              >
                {loading ? <Loader className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                <span>{loading ? "生成中..." : "生成题目"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TopicGeneratorModal;

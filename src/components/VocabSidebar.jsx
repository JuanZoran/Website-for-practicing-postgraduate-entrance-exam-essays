import { useState, useRef } from 'react';
import { 
  Sparkles, Loader, Trash2, ChevronDown, ChevronUp, 
  Quote, PlusCircle, Lightbulb, Download, FileJson, CheckCircle 
} from 'lucide-react';
import Ripples from 'react-ripples';
import { callAI } from "../services/aiService";

// 静态词汇列表
const STATIC_VOCAB_LISTS = [
  { category: "个人品质", words: [{ word: "Perseverance", meaning: "坚持", col: "cultivate" }, { word: "Optimism", meaning: "乐观", col: "maintain" }] },
  { category: "社会公德", words: [{ word: "Integrity", meaning: "诚信", col: "adhere to" }, { word: "Public Spirit", meaning: "公德", col: "enhance" }] }
];

const VocabSidebar = ({ 
  isOpen, 
  toggle, 
  currentTopic, 
  savedVocab, 
  savedErrors, 
  onRemoveVocab, 
  onRemoveError, 
  onImportData, 
  onExportData, 
  onAddGeneratedVocab, 
  user 
}) => {
  const [activeTab, setActiveTab] = useState('system'); 
  const [expandedVocabIndex, setExpandedVocabIndex] = useState(null);
  const [aiVocabList, setAiVocabList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addStatusByIndex, setAddStatusByIndex] = useState({});
  const fileInputRef = useRef(null);
  const sidebarRef = useRef(null);
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);

  const toggleVocabExpand = (idx) => setExpandedVocabIndex(expandedVocabIndex === idx ? null : idx);

  const handleAddVocab = (item, idx) => {
    const didAdd = onAddGeneratedVocab?.({ ...item, sourceTopic: currentTopic, timestamp: Date.now() });
    setAddStatusByIndex(prev => ({ ...prev, [idx]: didAdd ? 'added' : 'exists' }));
    window.setTimeout(() => {
      setAddStatusByIndex(prev => {
        if (!prev[idx]) return prev;
        const next = { ...prev };
        delete next[idx];
        return next;
      });
    }, 1500);
  };

  const handleExpandVocab = async () => {
    setLoading(true);
    const prompt = `Task: Generate 3 advanced English vocabulary items for essay topic: "${currentTopic}". Target: High-scoring nouns/verbs/idioms. Output JSON array: [{ "word": "Resilience", "meaning": "韧性 (n.)", "collocation": "demonstrate resilience", "example": "Optimism helps us demonstrate resilience.", "scenario": "Thinking: Use when arguing difficulties make us stronger." }]`;
    try {
      console.log('[Composition] Starting AI request for vocab expansion...');
      const res = await callAI(prompt, true);
      console.log('[Composition] AI response received, length:', res?.length);
      if (!res) {
        throw new Error('AI 返回空响应，请检查 API 配置');
      }
      // 处理可能的 JSON 包装
      let jsonStr = res.replace(/```json|```/g, '').trim();
      // 如果响应本身是 JSON 字符串（错误响应）
      if (jsonStr.startsWith('{') && jsonStr.includes('"error"')) {
        const errorObj = JSON.parse(jsonStr);
        throw new Error(errorObj.error || errorObj.message || 'AI 返回错误');
      }
      const json = JSON.parse(jsonStr);
      if (Array.isArray(json)) {
        setAiVocabList(json);
        console.log('[Composition] Successfully parsed vocab list, count:', json.length);
      } else {
        throw new Error('AI 返回格式不正确，期望数组格式');
      }
    } catch (e) {
      console.error('[Composition] Error in handleExpandVocab:', e);
      alert(`生成推荐失败: ${e.message || '未知错误，请查看控制台'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => { 
        try { 
          onImportData(JSON.parse(event.target.result)); 
        } catch (err) { 
          alert("文件错误"); 
        } 
      };
      reader.readAsText(file);
    }
  };

  // 侧边栏滑动手势处理
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e) => {
    if (!touchStartX.current || !touchStartY.current) return;
    const touchX = e.touches[0].clientX;
    const touchY = e.touches[0].clientY;
    const deltaX = touchX - touchStartX.current;
    const deltaY = touchY - touchStartY.current;
    
    // 只处理水平滑动，且水平滑动距离大于垂直滑动距离
    if (Math.abs(deltaX) > Math.abs(deltaY) && deltaX < -50) {
      // 向左滑动超过50px，关闭侧边栏
      toggle();
      touchStartX.current = null;
      touchStartY.current = null;
    }
  };

  const handleTouchEnd = () => {
    touchStartX.current = null;
    touchStartY.current = null;
  };

  // 获取词性颜色方案
  const getColorScheme = (meaning, withExpandBg = false) => {
    const m = (meaning || '').toLowerCase();
    if (m.includes('n.') || m.includes('名词')) {
      return { 
        border: 'border-l-blue-500', 
        bg: 'bg-blue-50/30 dark:bg-blue-900/10', 
        word: 'text-blue-600 dark:text-blue-400', 
        tag: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300',
        ...(withExpandBg && { expandBg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700' })
      };
    }
    if (m.includes('v.') || m.includes('动词')) {
      return { 
        border: 'border-l-emerald-500', 
        bg: 'bg-emerald-50/30 dark:bg-emerald-900/10', 
        word: 'text-emerald-600 dark:text-emerald-400', 
        tag: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300',
        ...(withExpandBg && { expandBg: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700' })
      };
    }
    if (m.includes('adj') || m.includes('形容词')) {
      return { 
        border: 'border-l-purple-500', 
        bg: 'bg-purple-50/30 dark:bg-purple-900/10', 
        word: 'text-purple-600 dark:text-purple-400', 
        tag: 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300',
        ...(withExpandBg && { expandBg: 'bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700' })
      };
    }
    if (m.includes('adv') || m.includes('副词')) {
      return { 
        border: 'border-l-amber-500', 
        bg: 'bg-amber-50/30 dark:bg-amber-900/10', 
        word: 'text-amber-600 dark:text-amber-400', 
        tag: 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300',
        ...(withExpandBg && { expandBg: 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700' })
      };
    }
    return { 
      border: withExpandBg ? 'border-l-rose-500' : 'border-l-indigo-500', 
      bg: withExpandBg ? 'bg-rose-50/30 dark:bg-rose-900/10' : 'bg-indigo-50/50 dark:bg-indigo-900/10', 
      word: withExpandBg ? 'text-rose-600 dark:text-rose-400' : 'text-indigo-600 dark:text-indigo-400', 
      tag: withExpandBg ? 'bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300' : 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300',
      ...(withExpandBg && { expandBg: 'bg-rose-50 dark:bg-rose-900/20 border-rose-300 dark:border-rose-700' })
    };
  };

  return (
    <div 
      ref={sidebarRef}
      className={`fixed inset-y-0 right-0 w-full sm:w-96 bg-white dark:bg-slate-900 transform transition-transform duration-300 ease-out z-30 ${isOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* 头部 - 毛玻璃效果 */}
      <div className="px-6 py-4 glass border-b border-slate-200/50 dark:border-slate-700/50 flex justify-between items-center flex-shrink-0">
        <h3 className="font-semibold text-[17px] text-slate-800 dark:text-slate-100">笔记本</h3>
        <button onClick={toggle} className="touch-target text-indigo-600 font-medium active:scale-95 transition-transform">
          完成
        </button>
      </div>

      {/* 同步状态 */}
      <div className="px-6 py-3 flex items-center gap-2 text-[13px] border-b border-slate-100 dark:border-slate-800">
        {user ? (
          <><div className="w-2 h-2 bg-green-500 rounded-full" /><span className="text-slate-500">云端同步已开启</span></>
        ) : (
          <><div className="w-2 h-2 bg-slate-300 rounded-full" /><span className="text-slate-400">离线模式</span></>
        )}
      </div>

      {/* 标签页 - 更简洁 */}
      <div className="flex px-4 py-2 gap-2 flex-shrink-0">
        <button 
          onClick={() => setActiveTab('system')} 
          className={`flex-1 py-3 rounded-2xl text-[13px] font-medium transition-all ${
            activeTab === 'system' 
              ? 'bg-indigo-600 text-white' 
              : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
          }`}
        >
          必背词汇
        </button>
        <button 
          onClick={() => setActiveTab('myVocab')} 
          className={`flex-1 py-3 rounded-2xl text-[13px] font-medium transition-all ${
            activeTab === 'myVocab' 
              ? 'bg-amber-500 text-white' 
              : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
          }`}
        >
          收藏
        </button>
        <button 
          onClick={() => setActiveTab('mistakes')} 
          className={`flex-1 py-3 rounded-2xl text-[13px] font-medium transition-all ${
            activeTab === 'mistakes' 
              ? 'bg-red-500 text-white' 
              : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
          }`}
        >
          错题
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {activeTab === 'system' && (
          <div className="animate-fadeIn">
            {/* AI Generator */}
            <div className="mb-6 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/40 dark:to-purple-900/40 p-4 rounded-lg border border-indigo-100 dark:border-indigo-800">
              <h4 className="font-bold text-indigo-800 dark:text-indigo-200 mb-2 text-sm flex items-center gap-1"><Sparkles className="w-4 h-4" /> AI 词汇扩展 ({currentTopic})</h4>
              <p className="text-xs text-indigo-600 dark:text-indigo-300 mb-3">生成与当前主题相关的高级词汇、场景和例句。</p>
              
              {!aiVocabList.length && !loading && (
                <Ripples>
                  <button onClick={handleExpandVocab} className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-bold py-3.5 rounded-xl shadow-md hover:shadow-lg hover:from-indigo-500 hover:to-violet-500 active:scale-[0.98] transition-all flex justify-center items-center gap-2 min-h-[44px] group">
                    <Sparkles className="w-4 h-4 group-hover:animate-pulse" /> 
                    <span className="tracking-widest">生成推荐</span>
                  </button>
                </Ripples>
              )}
              {loading && <div className="text-center py-4"><Loader className="w-5 h-5 animate-spin text-indigo-500 mx-auto" /></div>}
              
              <div className="space-y-2">
                {aiVocabList.map((item, idx) => {
                  const colorScheme = getColorScheme(item.meaning);
                  return (
                    <div key={idx} className={`${colorScheme.bg} p-3 rounded-xl border-l-4 ${colorScheme.border} border border-slate-200 dark:border-slate-700 shadow-sm relative group`}>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-bold text-sm ${colorScheme.word}`}>{item.word}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${colorScheme.tag}`}>{item.meaning}</span>
                      </div>
                      {item.collocation && (
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          <span className="text-slate-400">搭配: </span>
                          <span className="text-slate-600 dark:text-slate-300">{item.collocation}</span>
                        </div>
                      )}
                      <div className="text-[10px] text-amber-600 dark:text-amber-400 mt-1.5 italic pr-6 line-clamp-2 bg-amber-50/50 dark:bg-amber-900/20 p-1.5 rounded">
                        💡 {item.scenario?.replace('Thinking:', '').trim()}
                      </div>
                      <button 
                        type="button"
                        onClick={() => handleAddVocab(item, idx)}
                        className={`absolute top-2 right-2 ${
                          addStatusByIndex[idx] === 'added'
                            ? 'bg-green-500 text-white'
                            : addStatusByIndex[idx] === 'exists'
                              ? 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-200'
                              : 'text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 bg-white dark:bg-slate-800'
                        } p-1.5 rounded-full shadow-sm hover:shadow transition-all`}
                        title={addStatusByIndex[idx] === 'added' ? '已加入单词本' : addStatusByIndex[idx] === 'exists' ? '已在单词本' : '加入单词本'}
                      >
                        {addStatusByIndex[idx] ? <CheckCircle className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
                      </button>
                    </div>
                  );
                })}
                {aiVocabList.length > 0 && (
                  <Ripples>
                    <button type="button" onClick={handleExpandVocab} className="w-full mt-2 text-xs text-indigo-600 dark:text-indigo-400 underline text-center py-2 min-h-[44px]">换一批</button>
                  </Ripples>
                )}
              </div>
            </div>

            {/* Static */}
            {STATIC_VOCAB_LISTS.map((list, idx) => {
              const categoryColors = [
                { header: 'text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800', accent: 'text-blue-600 dark:text-blue-400' },
                { header: 'text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800', accent: 'text-emerald-600 dark:text-emerald-400' },
                { header: 'text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800', accent: 'text-purple-600 dark:text-purple-400' },
              ];
              const colors = categoryColors[idx % categoryColors.length];
              
              return (
                <div key={idx} className="mb-4">
                  <h4 className={`font-bold mb-3 border-b pb-2 text-xs uppercase tracking-wider ${colors.header}`}>
                    {list.category}
                  </h4>
                  <div className="space-y-2">
                    {list.words.map((item, wIdx) => (
                      <div key={wIdx} className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`font-bold text-sm ${colors.accent}`}>{item.word}</span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">{item.meaning}</span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-1">
                          <span className="text-slate-400">搭配:</span>
                          <span className="text-slate-600 dark:text-slate-300 font-medium">{item.col}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'myVocab' && (
          <div className="animate-fadeIn space-y-3">
            {savedVocab.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-sm">
                <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>暂无收藏</p>
              </div>
            ) : (
              savedVocab.map((item, idx) => {
                const colorScheme = getColorScheme(item.meaning, true);
                return (
                  <div key={idx} className={`rounded-xl border-l-4 ${colorScheme.border} border transition-all duration-200 overflow-hidden ${expandedVocabIndex === idx ? colorScheme.expandBg : `${colorScheme.bg} border-slate-200 dark:border-slate-700`}`}>
                    <div className="p-3 relative cursor-pointer" onClick={() => toggleVocabExpand(idx)}>
                      <Ripples>
                        <button onClick={(e) => { e.stopPropagation(); onRemoveVocab(idx); }} className="absolute top-3 right-8 text-slate-300 hover:text-red-500 z-10 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </Ripples>
                      <div className="absolute top-3 right-2 text-slate-400">{expandedVocabIndex === idx ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-bold text-sm ${colorScheme.word}`}>{item.word}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${colorScheme.tag}`}>{item.meaning}</span>
                      </div>
                      {item.collocation && (
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          <span className="text-slate-400">搭配: </span>
                          <span className="text-slate-600 dark:text-slate-300">{item.collocation}</span>
                        </div>
                      )}
                    </div>
                    {expandedVocabIndex === idx && (
                      <div className="px-3 pb-3 pt-0 border-t border-slate-200/50 dark:border-slate-700/50 text-sm animate-fadeIn">
                        {item.scenario && (
                          <div className="mt-2 text-xs text-amber-700 dark:text-amber-300 bg-amber-100/50 dark:bg-amber-900/30 p-2.5 rounded-lg flex gap-2">
                            <Lightbulb className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-amber-500" />
                            <div><span className="font-bold">使用场景:</span> {item.scenario.replace('Thinking:', '').trim()}</div>
                          </div>
                        )}
                        {item.example && (
                          <div className="mt-2 text-xs bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 relative">
                            <Quote className="w-3 h-3 text-emerald-400 absolute -top-1.5 -left-1 bg-white dark:bg-slate-900 px-0.5" />
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium">例句: </span>
                            {item.example}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'mistakes' && (
          <div className="animate-fadeIn space-y-3">
            {savedErrors.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-sm">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>暂无错题</p>
              </div>
            ) : (
              savedErrors.map((err, idx) => (
                <div key={idx} className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 p-4 rounded-xl border-l-4 border-l-red-500 border border-red-200 dark:border-red-800/50 relative">
                  <Ripples>
                    <button onClick={() => onRemoveError(idx)} className="absolute top-2 right-2 text-slate-300 hover:text-red-500 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </Ripples>
                  <div className="space-y-2 text-sm pr-8">
                    <div className="flex items-start gap-2">
                      <span className="text-red-500 text-xs font-medium px-2 py-0.5 bg-red-100 dark:bg-red-900/50 rounded-full flex-shrink-0">原文</span>
                      <span className="text-red-700 dark:text-red-300 line-through">{err.original}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-emerald-500 text-xs font-medium px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex-shrink-0">修正</span>
                      <span className="text-emerald-700 dark:text-emerald-300 font-medium">{err.correction}</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-2 text-xs text-slate-600 dark:text-slate-400 border-t border-red-200 dark:border-red-800/50">
                    <span className="text-amber-600 dark:text-amber-400 font-medium">⚠️ 问题:</span> {err.issue}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
      
      {/* 底部操作栏 */}
      <div className="px-6 py-4 pb-safe glass border-t border-slate-200/50 dark:border-slate-700/50 flex gap-3">
        <button 
          onClick={onExportData} 
          className="flex-1 py-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[15px] font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
        >
          <Download className="w-4 h-4" /> 导出
        </button>
        <button 
          onClick={() => fileInputRef.current?.click()} 
          className="flex-1 py-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[15px] font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
        >
          <FileJson className="w-4 h-4" /> 导入
        </button>
        <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleFileChange} />
      </div>
    </div>
  );
};

export default VocabSidebar;

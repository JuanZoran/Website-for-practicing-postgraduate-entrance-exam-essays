import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, CheckCircle, XCircle, RefreshCw, ChevronRight, PenTool, Layout, List, HelpCircle, Sparkles, Loader, MessageSquare, Image as ImageIcon, Link as LinkIcon, Table as TableIcon, BrainCircuit, X, Bookmark, AlertTriangle, Trash2, Save, ChevronDown, ChevronUp, Quote, ArrowRight, Check, Upload, Cloud, Moon, Sun, Download, FileJson, PlusCircle, Lightbulb, Clock, History, Copy, LogIn, Wifi, WifiOff, User, Settings, LogOut } from 'lucide-react';
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, setDoc, onSnapshot, getDoc } from "firebase/firestore";
import { callAI } from "./services/aiService";
import AISettings from "./components/AISettings";
import AuthModal from "./components/AuthModal";
import { 
  signOutUser, 
  getCurrentUsername, 
  migrateAnonymousData,
  onAuthStateChange as onAuthStateChangeService
} from "./services/authService";

// --- FIREBASE INIT (SAFE MODE) ---
let auth, db, appId;
try {
  const firebaseConfig = JSON.parse(__firebase_config);
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
} catch (e) {
  console.warn("Firebase init failed/skipped (Offline mode active):", e);
  auth = null;
  db = null; 
}

// --- UTILS ---
const SimpleMarkdown = ({ text, className = "" }) => {
  if (!text) return null;
  return (
    <div className={`space-y-1 ${className}`}>
      {text.split('\n').map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1"></div>;
        const isBullet = line.trim().startsWith('- ') || line.trim().startsWith('* ');
        const cleanLine = isBullet ? line.trim().substring(2) : line;
        const parts = cleanLine.split(/(\*\*.*?\*\*)/g).map((part, j) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={j} className="font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/50 px-0.5 rounded">{part.slice(2, -2)}</strong>;
          }
          return part;
        });
        return (
          <div key={i} className={`${isBullet ? 'flex gap-2 ml-1' : ''} leading-relaxed break-words`}>
            {isBullet && <span className="text-indigo-400 mt-1.5 flex-shrink-0">•</span>}
            <div className={`${isBullet ? '' : ''}`}>{parts}</div>
          </div>
        );
      })}
    </div>
  );
};


// --- DATA ---
const INITIAL_EXAM_DATA = [
  {
    id: "2010", year: "2010", title: "文化火锅", mode: "Mode A", visualType: "image", description: "火锅里煮着佛像、莎士比亚、功夫等中西文化元素。",
    defaultImage: "https://placehold.co/800x400/e2e8f0/475569?text=2010+Exam:+Cultural+Hotpot",
    slots: [
      { id: "desc", label: "图画描述", question: "描述火锅中的中西元素融合。", templateContext: "Specifically, [INSERT HERE].", placeholder: "例如：火锅里汇聚了莎士比亚和功夫..." },
      { id: "arg1", label: "核心意义", question: "文化融合为何重要？", templateContext: "First and foremost, [INSERT HERE].", placeholder: "例如：促进文明繁荣，取长补短..." },
      { id: "action", label: "建议", question: "如何对待外来文化？", templateContext: "Accordingly, [INSERT HERE].", placeholder: "例如：取其精华，去其糟粕..." }
    ],
    templateString: "Unfolding before us is a thought-provoking cartoon: a huge 'hotpot' containing various cultural elements. Specifically, {{desc}}. Simple as the picture is, the symbolic meaning behind it is strictly distinct.\n\nThe primary purpose is to illustrate the importance of cultural integration. Why does this matter? First and foremost, {{arg1}}. It is cultural exchange that enables civilizations to flourish.\n\nIn view of the arguments above, cultural diversity is of vital importance. Accordingly, it is imperative for us to {{action}}. Only in this way can we build a harmonious global village."
  },
  {
    id: "2011", year: "2011", title: "旅途之余", mode: "Mode B", visualType: "image", description: "游客在船上乱扔垃圾，破坏风景。",
    defaultImage: "https://placehold.co/800x400/e2e8f0/475569?text=2011+Exam:+Littering+Tourists",
    slots: [
      { id: "desc", label: "图画描述", question: "描述游客的不文明行为。", templateContext: "Specifically, [INSERT HERE].", placeholder: "例如：游客一边欣赏风景，一边乱扔垃圾..." },
      { id: "harm", label: "危害分析", question: "这种行为有什么后果？", templateContext: "First and foremost, [INSERT HERE].", placeholder: "例如：破坏生态平衡，损害社会公德..." },
      { id: "action", label: "建议", question: "如何解决？", templateContext: "Accordingly, [INSERT HERE].", placeholder: "例如：提高环保意识，加强监管..." }
    ],
    templateString: "Unfolding before us is a thought-provoking cartoon showing tourists littering. Specifically, {{desc}}. Simple as the picture is, the symbolic meaning is strictly distinct.\n\nThe primary purpose is to illustrate the detrimental effect of immoral behavior. Why does this matter? First and foremost, {{harm}}. It is this lack of public spirit that threatens our environment.\n\nIn view of the arguments above, environmental protection is of vital importance. Accordingly, it is imperative for us to {{action}}. Only in this way can we leave a beautiful world for future generations."
  },
  {
    id: "2012", year: "2012", title: "打翻酒瓶", mode: "Mode A", visualType: "image", description: "瓶子倒了，一人叹息全完了，一人庆幸剩一半。",
    defaultImage: "https://placehold.co/800x400/e2e8f0/475569?text=2012+Exam:+Optimism",
    slots: [
      { id: "desc", label: "图画描述", question: "对比两人的反应。", templateContext: "Specifically, [INSERT HERE].", placeholder: "例如：一人悲观叹息，另一人乐观庆幸..." },
      { id: "arg1", label: "核心论点", question: "为什么乐观很重要？", templateContext: "First and foremost, [INSERT HERE].", placeholder: "例如：乐观是面对逆境的精神支柱..." },
      { id: "action", label: "建议", question: "我们该怎么做？", templateContext: "Accordingly, [INSERT HERE].", placeholder: "例如：停止抱怨，珍惜当下..." }
    ],
    templateString: "Unfolding before us is a thought-provoking cartoon. Specifically, {{desc}}. The purpose is to illustrate optimism. First and foremost, {{arg1}}. Accordingly, it is imperative for us to {{action}}."
  },
  {
    id: "2015", year: "2015", title: "聚餐玩手机", mode: "Mode B", visualType: "image", description: "聚餐时大家都在玩手机，没人交流。",
    defaultImage: "https://placehold.co/800x400/e2e8f0/475569?text=2015+Exam:+Phubbing",
    slots: [
      { id: "desc", label: "图画描述", question: "描述聚餐时的冷漠场景。", templateContext: "Specifically, [INSERT HERE].", placeholder: "例如：虽然坐在一起，但都在低头看屏幕..." },
      { id: "harm", label: "危害分析", question: "手机沉迷有什么坏处？", templateContext: "First and foremost, [INSERT HERE].", placeholder: "例如：阻碍了面对面的情感交流..." },
      { id: "action", label: "建议", question: "如何改变？", templateContext: "Accordingly, [INSERT HERE].", placeholder: "例如：放下手机，回归现实..." }
    ],
    templateString: "Unfolding before us is a thought-provoking cartoon about 'phubbing'. Specifically, {{desc}}. The purpose is to illustrate the harm of mobile addiction. First and foremost, {{harm}}. It is this indifference that stifles communication. Accordingly, it is imperative to {{action}}."
  },
  {
    id: "2016", year: "2016", title: "父子看电视", mode: "Mode A", visualType: "image", description: "父亲边看电视边让儿子学习，儿子也学着看电视。",
    defaultImage: "https://placehold.co/800x400/e2e8f0/475569?text=2016+Exam:+Role+Model",
    slots: [
      { id: "desc", label: "图画描述", question: "描述父子的行为对比。", templateContext: "Specifically, [INSERT HERE].", placeholder: "例如：父亲在沙发上看电视，却命令儿子去读书..." },
      { id: "arg1", label: "核心论点", question: "为什么榜样很重要？", templateContext: "First and foremost, [INSERT HERE].", placeholder: "例如：身教重于言教..." },
      { id: "action", label: "建议", question: "父母应该怎么做？", templateContext: "Accordingly, [INSERT HERE].", placeholder: "例如：以身作则，言行一致..." }
    ],
    templateString: "Unfolding before us is a thought-provoking cartoon. Specifically, {{desc}}. The purpose is to illustrate the power of role models. First and foremost, {{arg1}}. Accordingly, parents should {{action}}."
  },
  {
    id: "2025", year: "2025", title: "消费升级", mode: "Mode C", visualType: "table", description: "居民耐用消费品（空调、汽车等）拥有量逐年上升。",
    defaultImage: "https://placehold.co/800x400/e2e8f0/475569?text=2025+Exam:+Chart+Data",
    tableData: { headers: ["年份", "空调", "汽车", "电脑"], rows: [["2015", "80", "20", "50"], ["2024", "140", "60", "90"]] },
    slots: [
      { id: "desc", label: "数据描述", question: "描述数据的增长趋势。", templateContext: "Specifically, [INSERT HERE].", placeholder: "例如：空调数量从80激增到140..." },
      { id: "reason", label: "原因分析", question: "为什么会增长？", templateContext: "First and foremost, [INSERT HERE].", placeholder: "例如：经济发展，收入增加..." },
      { id: "action", label: "建议/展望", question: "未来该怎么做？", templateContext: "Accordingly, [INSERT HERE].", placeholder: "例如：继续促进经济，提升生活质量..." }
    ],
    templateString: "Unfolding before us is a clear chart. Specifically, {{desc}}. The purpose is to illustrate improved living standards. First and foremost, {{reason}}. Accordingly, we should {{action}}."
  },
  {
    id: "pred_ai", year: "2026预测", title: "AI与创造力", mode: "Mode A", visualType: "image", description: "AI瞬间作画 vs 老画家苦思冥想。",
    defaultImage: "https://placehold.co/800x400/e0e7ff/4338ca?text=2026+Prediction:+AI+vs+Human",
    slots: [
      { id: "desc", label: "对比描述", question: "对比AI的高效与人类的艰辛。", templateContext: "Specifically, [INSERT HERE].", placeholder: "例如：机器人秒出图，画家耗尽一生..." },
      { id: "arg1", label: "深层含义", question: "人类创造力的价值？", templateContext: "First and foremost, [INSERT HERE].", placeholder: "例如：人类作品包含灵魂与情感..." },
      { id: "action", label: "态度", question: "如何看待技术？", templateContext: "Accordingly, [INSERT HERE].", placeholder: "例如：善用工具，坚守人文..." }
    ],
    templateString: "The cartoon presents a contrast between AI and human artistry. Specifically, {{desc}}. The purpose is to illustrate the value of creativity. First and foremost, {{arg1}}. Accordingly, we should {{action}}."
  },
  {
    id: "pred_culture", year: "2026预测", title: "文化双创", mode: "Mode A", visualType: "image", description: "京剧脸谱戴VR眼镜。",
    defaultImage: "https://placehold.co/800x400/fef3c7/b45309?text=2026+Prediction:+Culture+meets+VR",
    slots: [
      { id: "desc", label: "图画描述", question: "描述传统与科技的结合。", templateContext: "Specifically, [INSERT HERE].", placeholder: "例如：古老的脸谱结合了现代VR技术..." },
      { id: "arg1", label: "创新价值", question: "为什么需要创新？", templateContext: "First and foremost, [INSERT HERE].", placeholder: "例如：科技让传统焕发新生..." },
      { id: "action", label: "建议", question: "如何传播文化？", templateContext: "Accordingly, [INSERT HERE].", placeholder: "例如：利用数字手段讲好中国故事..." }
    ],
    templateString: "Unfolding before us is a creative cartoon. Specifically, {{desc}}. The purpose is to illustrate cultural innovation. First and foremost, {{arg1}}. Accordingly, we should {{action}}."
  },
  {
    id: "pred_resilience", year: "2026预测", title: "内卷与韧性", mode: "Mode A", visualType: "image", description: "一人负重前行（内卷），一人轻装赏花（松弛）。",
    defaultImage: "https://placehold.co/800x400/ecfccb/3f6212?text=2026+Prediction:+Resilience",
    slots: [
      { id: "desc", label: "对比描述", question: "对比两种生活状态。", templateContext: "Specifically, [INSERT HERE].", placeholder: "例如：一人被名利压垮，一人享受过程..." },
      { id: "arg1", label: "哲理解析", question: "为什么心理韧性很重要？", templateContext: "First and foremost, [INSERT HERE].", placeholder: "例如：过程比结果重要，心态决定生活质量..." },
      { id: "action", label: "建议", question: "如何保持韧性？", templateContext: "Accordingly, [INSERT HERE].", placeholder: "例如：拒绝无意义的竞争，寻找内心平静..." }
    ],
    templateString: "The cartoon highlights two attitudes towards life. Specifically, {{desc}}. The purpose is to illustrate psychological resilience. First and foremost, {{arg1}}. Accordingly, we should {{action}}."
  },
  {
    id: "pred_public", year: "2026预测", title: "公共素养", mode: "Mode B", visualType: "image", description: "图书馆大声打电话，旁若无人。",
    defaultImage: "https://placehold.co/800x400/fee2e2/991b1b?text=2026+Prediction:+Public+Spirit",
    slots: [
      { id: "desc", label: "场景描述", question: "描述不文明行为。", templateContext: "Specifically, [INSERT HERE].", placeholder: "例如：在安静的图书馆大声喧哗..." },
      { id: "harm", label: "危害分析", question: "这种行为有何危害？", templateContext: "First and foremost, [INSERT HERE].", placeholder: "例如：破坏公共秩序，体现素质缺失..." },
      { id: "action", label: "建议", question: "如何提升素养？", templateContext: "Accordingly, [INSERT HERE].", placeholder: "例如：遵守公共规则，尊重他人..." }
    ],
    templateString: "Unfolding before us is a scene revealing lack of public spirit. Specifically, {{desc}}. The purpose is to illustrate the importance of social morality. First and foremost, {{harm}}. Accordingly, we should {{action}}."
  }
];

const STATIC_VOCAB_LISTS = [
  { category: "个人品质", words: [{ word: "Perseverance", meaning: "坚持", col: "cultivate" }, { word: "Optimism", meaning: "乐观", col: "maintain" }] },
  { category: "社会公德", words: [{ word: "Integrity", meaning: "诚信", col: "adhere to" }, { word: "Public Spirit", meaning: "公德", col: "enhance" }] }
];

// --- COMPONENTS ---

// --- History Drawer ---
const HistoryDrawer = ({ isOpen, onClose, history, topicTitle }) => {
  if (!isOpen) return null;
  return (
    <div className={`fixed inset-y-0 right-0 w-80 sm:w-96 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700 transform transition-transform duration-300 ease-in-out z-40 ${isOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col shadow-2xl`}>
      <div className="p-4 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
        <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2"><History className="w-5 h-5 text-indigo-600" /> 历史回溯</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1"><X className="w-6 h-6" /></button>
      </div>
      <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-xs text-indigo-800 dark:text-indigo-200 font-medium">当前题目: {topicTitle}</div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!history || history.length === 0 ? <div className="text-center py-10 text-slate-400 text-sm"><Clock className="w-8 h-8 mx-auto mb-2 opacity-30" /><p>暂无历史</p></div> : 
          history.slice().reverse().map((item, idx) => (
            <div key={idx} className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-100 dark:border-slate-700">
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${item.type==='logic'?'bg-blue-100 text-blue-700':item.type==='grammar'?'bg-purple-100 text-purple-700':'bg-green-100 text-green-700'}`}>{item.type}</span>
                <span className="text-[10px] text-slate-400">{new Date(item.timestamp).toLocaleString()}</span>
              </div>
              <div className="text-sm text-slate-700 dark:text-slate-300 mb-2 font-mono bg-slate-50 dark:bg-slate-900 p-2 rounded truncate">"{item.input.substring(0,50)}..."</div>
              {item.feedback && <div className="text-xs text-slate-500 dark:text-slate-400"><span className="font-bold">AI:</span> {item.feedback.comment?.substring(0,40)}...</div>}
            </div>
          ))
        }
      </div>
    </div>
  );
};

const VocabSidebar = ({ isOpen, toggle, currentTopic, savedVocab, savedErrors, onRemoveVocab, onRemoveError, onImportData, onExportData, onAddGeneratedVocab, user }) => {
  const [activeTab, setActiveTab] = useState('system'); 
  const [expandedVocabIndex, setExpandedVocabIndex] = useState(null);
  const [aiVocabList, setAiVocabList] = useState([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const toggleVocabExpand = (idx) => setExpandedVocabIndex(expandedVocabIndex === idx ? null : idx);

  const handleExpandVocab = async () => {
    setLoading(true);
    const prompt = `Task: Generate 3 advanced English vocabulary items for essay topic: "${currentTopic}". Target: High-scoring nouns/verbs/idioms. Output JSON array: [{ "word": "Resilience", "meaning": "韧性 (n.)", "collocation": "demonstrate resilience", "example": "Optimism helps us demonstrate resilience.", "scenario": "Thinking: Use when arguing difficulties make us stronger." }]`;
    try {
      const res = await callAI(prompt, true);
      const json = JSON.parse(res.replace(/```json|```/g, '').trim());
      if (Array.isArray(json)) setAiVocabList(json);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => { try { onImportData(JSON.parse(event.target.result)); } catch (err) { alert("文件错误"); } };
      reader.readAsText(file);
    }
  };

  return (
    <div className={`fixed inset-y-0 right-0 w-80 sm:w-96 bg-slate-50 dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700 transform transition-transform duration-300 ease-in-out z-30 ${isOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col shadow-2xl`}>
      <div className="p-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center flex-shrink-0">
        <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2"><BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> 我的笔记本</h3>
        <button onClick={toggle} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-full"><ChevronRight className="w-6 h-6" /></button>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/30 px-4 py-2 flex items-center gap-2 text-xs text-indigo-600 dark:text-indigo-300 border-b border-indigo-100 dark:border-indigo-900/50">
        {user ? <><Wifi className="w-3 h-3 text-green-500" /><span>云端同步已开启</span></> : <><WifiOff className="w-3 h-3 text-slate-400" /><span>离线模式 (数据仅保存在本地)</span></>}
      </div>

      <div className="flex border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex-shrink-0">
        <button onClick={() => setActiveTab('system')} className={`flex-1 py-3 text-xs font-bold border-b-2 transition-colors ${activeTab === 'system' ? 'border-indigo-600 text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/20' : 'border-transparent text-slate-500 dark:text-slate-400'}`}>📚 必背</button>
        <button onClick={() => setActiveTab('myVocab')} className={`flex-1 py-3 text-xs font-bold border-b-2 transition-colors ${activeTab === 'myVocab' ? 'border-amber-500 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20' : 'border-transparent text-slate-500 dark:text-slate-400'}`}>⭐ 生词</button>
        <button onClick={() => setActiveTab('mistakes')} className={`flex-1 py-3 text-xs font-bold border-b-2 transition-colors ${activeTab === 'mistakes' ? 'border-red-500 text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20' : 'border-transparent text-slate-500 dark:text-slate-400'}`}>🛑 错题</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === 'system' && (
          <div className="animate-fadeIn">
            {/* AI Generator */}
            <div className="mb-6 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/40 dark:to-purple-900/40 p-4 rounded-lg border border-indigo-100 dark:border-indigo-800">
              <h4 className="font-bold text-indigo-800 dark:text-indigo-200 mb-2 text-sm flex items-center gap-1"><Sparkles className="w-4 h-4" /> AI 词汇扩展 ({currentTopic})</h4>
              <p className="text-xs text-indigo-600 dark:text-indigo-300 mb-3">生成与当前主题相关的高级词汇、场景和例句。</p>
              
              {!aiVocabList.length && !loading && (
                <button onClick={handleExpandVocab} className="w-full bg-indigo-600 text-white text-xs font-bold py-2 rounded shadow-sm hover:bg-indigo-700 transition-colors flex justify-center items-center gap-2">
                  <Sparkles className="w-3 h-3" /> 生成推荐
                </button>
              )}
              {loading && <div className="text-center py-4"><Loader className="w-5 h-5 animate-spin text-indigo-500 mx-auto" /></div>}
              
              <div className="space-y-2">
                {aiVocabList.map((item, idx) => (
                  <div key={idx} className="bg-white dark:bg-slate-800 p-3 rounded border border-indigo-100 dark:border-slate-600 shadow-sm relative group">
                    <div className="font-bold text-slate-800 dark:text-slate-200 text-sm">{item.word}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{item.meaning}</div>
                    <div className="text-[10px] text-slate-400 mt-1 italic pr-6 truncate">{item.scenario}</div>
                    <button 
                      onClick={() => onAddGeneratedVocab({...item, sourceTopic: currentTopic, timestamp: Date.now()})}
                      className="absolute top-2 right-2 text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/50 p-1.5 rounded-full"
                    >
                      <PlusCircle className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {aiVocabList.length > 0 && <button onClick={handleExpandVocab} className="w-full mt-2 text-xs text-indigo-600 dark:text-indigo-400 underline text-center">换一批</button>}
              </div>
            </div>

            {/* Static */}
            {STATIC_VOCAB_LISTS.map((list, idx) => (
              <div key={idx} className="mb-4">
                <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-2 border-b border-slate-200 dark:border-slate-700 pb-1 text-xs uppercase tracking-wider">{list.category}</h4>
                <div className="space-y-2">
                  {list.words.map((item, wIdx) => (
                    <div key={wIdx} className="bg-white dark:bg-slate-800 p-2 rounded border border-slate-100 dark:border-slate-700 shadow-sm text-sm">
                      <div className="flex justify-between"><span className="font-bold text-slate-700 dark:text-slate-200">{item.word}</span><span className="text-xs text-slate-500">{item.meaning}</span></div>
                      <div className="text-xs text-slate-400 mt-0.5">搭配: {item.col}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'myVocab' && (
          <div className="animate-fadeIn space-y-3">
             {savedVocab.length === 0 ? <div className="text-center py-10 text-slate-400 text-sm"><Sparkles className="w-8 h-8 mx-auto mb-2 opacity-30" /><p>暂无收藏</p></div> : 
               savedVocab.map((item, idx) => (
                 <div key={idx} className={`rounded-lg border transition-all duration-200 overflow-hidden ${expandedVocabIndex === idx ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700' : 'bg-white dark:bg-slate-800 border-amber-100 dark:border-slate-700'}`}>
                    <div className="p-3 relative cursor-pointer" onClick={() => toggleVocabExpand(idx)}>
                      <button onClick={(e) => { e.stopPropagation(); onRemoveVocab(idx); }} className="absolute top-3 right-8 text-slate-300 hover:text-red-500 z-10"><Trash2 className="w-3 h-3" /></button>
                      <div className="absolute top-3 right-2 text-slate-400">{expandedVocabIndex === idx ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</div>
                      <div className="font-bold text-slate-800 dark:text-slate-200 text-sm flex items-center gap-2">{item.word} <span className="text-xs font-normal text-slate-500 dark:text-slate-400 bg-white/50 dark:bg-slate-700 px-1.5 py-0.5 rounded border border-slate-100 dark:border-slate-600">{item.meaning}</span></div>
                    </div>
                    {expandedVocabIndex === idx && (
                      <div className="px-3 pb-3 pt-0 border-t border-amber-200/50 dark:border-amber-800/50 text-sm animate-fadeIn">
                        {item.scenario && <div className="mt-2 text-xs text-amber-800 dark:text-amber-200 bg-amber-100/50 dark:bg-amber-900/30 p-2 rounded flex gap-2"><Lightbulb className="w-3 h-3 flex-shrink-0 mt-0.5" /><div><span className="font-bold">场景:</span> {item.scenario.replace('Thinking:', '')}</div></div>}
                        {item.example && <div className="mt-2 text-xs bg-white dark:bg-slate-900 p-2 rounded border border-amber-100 dark:border-slate-700 italic text-slate-600 dark:text-slate-300 relative"><Quote className="w-3 h-3 text-amber-300 absolute -top-1.5 -left-1 bg-white dark:bg-slate-900 px-0.5" />{item.example}</div>}
                      </div>
                    )}
                 </div>
               ))
             }
          </div>
        )}

        {activeTab === 'mistakes' && (
          <div className="animate-fadeIn space-y-3">
            {savedErrors.length === 0 ? <div className="text-center py-10 text-slate-400 text-sm"><CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-30" /><p>暂无错题</p></div> :
               savedErrors.map((err, idx) => (
                 <div key={idx} className="bg-red-50/50 dark:bg-red-900/10 p-3 rounded-lg border border-red-100 dark:border-red-900/30 relative">
                    <button onClick={() => onRemoveError(idx)} className="absolute top-2 right-2 text-slate-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                    <div className="space-y-1 text-sm"><div className="text-red-800 dark:text-red-300 line-through text-xs">{err.original}</div><div className="text-green-800 dark:text-green-300 font-medium">{err.correction}</div></div>
                    <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 border-t border-red-100 dark:border-red-900/30 pt-1"><span className="font-bold text-red-400">问题:</span> {err.issue}</div>
                 </div>
               ))
             }
          </div>
        )}
      </div>
      
      <div className="p-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 text-xs flex gap-2">
          <button onClick={onExportData} className="flex-1 flex items-center justify-center gap-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 py-2 rounded hover:bg-slate-100 dark:hover:bg-slate-600"><Download className="w-3 h-3" /> 导出</button>
          <button onClick={() => fileInputRef.current?.click()} className="flex-1 flex items-center justify-center gap-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 py-2 rounded hover:bg-slate-100 dark:hover:bg-slate-600"><FileJson className="w-3 h-3" /> 导入</button>
          <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleFileChange} />
      </div>
    </div>
  );
};

const QuestionVisualizer = ({ data }) => {
  const [imgSrc, setImgSrc] = useState(data.defaultImage);
  const fileInputRef = useRef(null);
  useEffect(() => { setImgSrc(data.defaultImage); }, [data]);
  const handleFileUpload = (e) => { if(e.target.files[0]) setImgSrc(URL.createObjectURL(e.target.files[0])); };

  if (data.visualType === "table") return <div className="mb-6 bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700 text-center text-sm dark:text-slate-300"><TableIcon className="w-6 h-6 mx-auto mb-2 text-indigo-500" />{data.description}</div>;

  return (
    <div className="mb-6 bg-slate-100 dark:bg-slate-900 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 relative group h-48 sm:h-64">
      <img src={imgSrc} alt="Exam" className="w-full h-full object-cover" onError={(e)=>{e.target.src="https://placehold.co/800x400?text=Image+Error"}} />
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
         <button onClick={() => fileInputRef.current?.click()} className="bg-white/90 dark:bg-slate-800/90 p-1.5 rounded shadow text-xs font-bold flex items-center gap-1 text-slate-700 dark:text-slate-200"><Upload className="w-3 h-3" /> 上传</button>
         <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
      </div>
      <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-xs p-2 text-center backdrop-blur-sm">{data.description}</div>
    </div>
  );
};

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
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex justify-between mb-4"><h3 className="font-bold text-lg dark:text-white">AI 自定义出题</h3><button onClick={onClose}><X className="w-5 h-5 text-slate-400"/></button></div>
        <input className="w-full p-3 border rounded mb-4 bg-slate-50 dark:bg-slate-900 dark:border-slate-600 dark:text-white" placeholder="输入主题 (如: 网络暴力)" value={input} onChange={e=>setInput(e.target.value)} />
        <button onClick={handleGen} disabled={loading} className="w-full py-3 bg-indigo-600 text-white rounded font-bold">{loading?"生成中...":"立即生成"}</button>
      </div>
    </div>
  );
};

const EssayWorkflowManager = ({ data, onSaveVocab, onSaveError, onSaveHistory }) => {
  const [step, setStep] = useState(0);
  const [inputs, setInputs] = useState({cn:{}, en:{}});
  const [feedback, setFeedback] = useState({cn:{}, en:{}, final:null});
  const [loading, setLoading] = useState(null);

  useEffect(() => { setStep(0); setInputs({cn:{}, en:{}}); setFeedback({cn:{}, en:{}, final:null}); }, [data]);

  const handleLogic = async (id) => {
    if (!inputs.cn[id]) return;
    setLoading(id);
    const p = `Task: Kaoyan Logic Check. Topic: ${data.title}. User Idea: "${inputs.cn[id]}". Output JSON: { "status": "pass/warn", "comment": "Chinese feedback", "suggestion": "Improvement" }`;
    try {
      const res = await callAI(p, true);
      const json = JSON.parse(res.replace(/```json|```/g,''));
      setFeedback(prev => ({...prev, cn: {...prev.cn, [id]: json}}));
      onSaveHistory(data.id, { type: 'logic', input: inputs.cn[id], feedback: json, timestamp: Date.now() });
    } catch(e) {}
    setLoading(null);
  };

  const handleGrammar = async (id) => {
    if (!inputs.en[id]) return;
    setLoading(id);
    const p = `Task: Kaoyan Grammar Check. Topic: ${data.title}. CN: "${inputs.cn[id]}". EN: "${inputs.en[id]}". Output JSON: { "score": 1-10, "comment": "Chinese feedback", "grammar_issues": [], "recommended_vocab": [{ "word": "word", "meaning": "meaning", "collocation": "col", "example": "Contextual example sentence", "scenario": "Thinking context" }] }`;
    try {
      const json = JSON.parse((await callAI(p, true)).replace(/```json|```/g,''));
      setFeedback(prev => ({...prev, en: {...prev.en, [id]: json}}));
      onSaveHistory(data.id, { type: 'grammar', input: inputs.en[id], feedback: json, timestamp: Date.now() });
      if (json.grammar_issues?.length) json.grammar_issues.forEach(err => onSaveError({...err, timestamp: Date.now()}));
    } catch(e) {}
    setLoading(null);
  };

  const handleFinal = async () => {
    setLoading('final');
    let text = data.templateString || "";
    data.slots.forEach(s => text = text.replace(`{{${s.id}}}`, inputs.en[s.id]||`[${s.label}]`));
    const p = `Task: Grade Essay (20pts). Topic: ${data.title}. Text: ${text}. Output JSON: { "score": number, "comment": "Chinese feedback", "strengths": [], "weaknesses": [] }`;
    try {
      const json = JSON.parse((await callAI(p, true)).replace(/```json|```/g,'').trim());
      setFeedback(prev => ({...prev, final: json}));
      onSaveHistory(data.id, { type: 'final', input: text, feedback: json, timestamp: Date.now() });
    } catch(e) { console.error(e); }
    setLoading(null);
  };

  return (
    <div>
      <div className="flex justify-between mb-6 px-4">
        {["中文思考", "词句翻译", "成文打分"].map((t,i) => (
          <div key={i} className={`flex flex-col items-center ${i<=step?'opacity-100':'opacity-40'}`}>
            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${i<=step?'bg-white dark:bg-slate-800 border-indigo-500':'bg-slate-100 dark:bg-slate-700 border-slate-300'}`}>{i+1}</div>
            <span className="text-[10px] mt-1 font-bold dark:text-slate-300">{t}</span>
          </div>
        ))}
      </div>

      {step === 0 && (
        <div className="space-y-4 animate-fadeIn">
          {data.slots.map(slot => (
            <div key={slot.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>
              <h5 className="font-bold text-slate-800 dark:text-slate-100 text-sm mb-2">{slot.label}</h5>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{slot.question}</p>
              <textarea 
                className="w-full p-2 border rounded bg-slate-50 dark:bg-slate-900 dark:border-slate-600 text-sm dark:text-slate-200" 
                rows={2} 
                value={inputs.cn[slot.id]||''} 
                onChange={e => setInputs(p => ({...p, cn: {...p.cn, [slot.id]: e.target.value}}))} 
              />
              <div className="flex justify-end mt-2 items-center">
                {feedback.cn[slot.id] && <div className="text-xs mr-auto bg-blue-50 dark:bg-blue-900/30 p-1 px-2 rounded text-blue-800 dark:text-blue-200"><SimpleMarkdown text={feedback.cn[slot.id].comment} /></div>}
                <button onClick={() => handleLogic(slot.id)} disabled={loading===slot.id} className="bg-blue-600 text-white px-3 py-1 rounded text-xs flex items-center gap-1">{loading===slot.id?<Loader className="w-3 h-3 animate-spin"/>:<BrainCircuit className="w-3 h-3"/>} 审题</button>
              </div>
            </div>
          ))}
          <button onClick={() => setStep(1)} className="w-full py-3 bg-slate-800 dark:bg-slate-700 text-white rounded-lg font-bold shadow">下一步</button>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4 animate-fadeIn">
          {data.slots.map(slot => (
            <div key={slot.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500"></div>
              <h5 className="font-bold text-slate-800 dark:text-slate-100 text-sm mb-2 flex justify-between">
                {slot.label}
                <span className="text-xs font-normal bg-slate-100 dark:bg-slate-700 px-2 rounded truncate max-w-[100px] text-slate-500 dark:text-slate-400">{inputs.cn[slot.id]}</span>
              </h5>
              <textarea 
                className="w-full p-2 border rounded bg-slate-50 dark:bg-slate-900 dark:border-slate-600 text-sm font-mono dark:text-slate-200" 
                rows={2} 
                value={inputs.en[slot.id]||''} 
                onChange={e => setInputs(p => ({...p, en: {...p.en, [slot.id]: e.target.value}}))} 
              />
              <div className="flex justify-end mt-2">
                <button onClick={() => handleGrammar(slot.id)} disabled={loading===slot.id} className="bg-purple-600 text-white px-3 py-1 rounded text-xs flex items-center gap-1">{loading===slot.id?<Loader className="w-3 h-3 animate-spin"/>:<Sparkles className="w-3 h-3"/>} 润色</button>
              </div>
              {feedback.en[slot.id] && (
                <div className="mt-2 text-xs bg-purple-50 dark:bg-purple-900/20 p-2 rounded">
                  <div className="font-bold text-purple-700 dark:text-purple-300 mb-1">评分: {feedback.en[slot.id].score}/10</div>
                  <div className="text-slate-600 dark:text-slate-300 mb-2"><SimpleMarkdown text={feedback.en[slot.id].comment} /></div>
                  {feedback.en[slot.id].recommended_vocab?.map((v, i) => (
                    <div key={i} className="flex justify-between items-center mt-2 bg-white dark:bg-slate-800 p-1.5 rounded border border-purple-100 dark:border-purple-800">
                      <div><span className="font-bold text-slate-800 dark:text-slate-200">{v.word}</span> <span className="text-[10px] text-slate-500 dark:text-slate-400">{v.meaning}</span></div>
                      <button onClick={() => onSaveVocab({...v, sourceTopic: data.title, timestamp: Date.now()})} className="text-purple-500 hover:bg-purple-100 p-1 rounded"><PlusCircle className="w-3 h-3" /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          <div className="flex gap-2">
            <button onClick={() => setStep(0)} className="flex-1 py-3 text-slate-500 dark:text-slate-400 border dark:border-slate-600 rounded-lg">上一步</button>
            <button onClick={() => setStep(2)} className="flex-[2] py-3 bg-slate-800 dark:bg-slate-700 text-white rounded-lg font-bold shadow">下一步</button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow min-h-[300px]">
            <h2 className="text-center font-bold text-lg mb-4 underline decoration-slate-300 underline-offset-4 text-slate-800 dark:text-slate-100">{data.title}</h2>
            <div className="whitespace-pre-wrap text-sm leading-loose font-serif text-slate-700 dark:text-slate-300">
              {(() => {
                let txt = data.templateString || "";
                data.slots.forEach(s => txt = txt.replace(`{{${s.id}}}`, inputs.en[s.id]||`[${s.label}]`));
                return txt;
              })()}
            </div>
          </div>
          <button onClick={handleFinal} disabled={loading==='final'} className="w-full py-3 bg-green-600 text-white rounded-lg font-bold shadow flex justify-center items-center gap-2">{loading==='final'?<Loader className="w-4 h-4 animate-spin"/>:<BookOpen className="w-4 h-4"/>} 最终阅卷</button>
          {feedback.final && (
            <div className="bg-slate-800 dark:bg-slate-900 text-white p-4 rounded-xl shadow-xl">
              <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-600"><span className="font-bold">阅卷报告</span> <span className="text-2xl font-bold text-yellow-400">{feedback.final.score}</span></div>
              <SimpleMarkdown text={feedback.final.comment} />
            </div>
          )}
          <button onClick={() => setStep(1)} className="w-full py-3 text-slate-500 dark:text-slate-400">返回修改</button>
        </div>
      )}
    </div>
  );
};

const App = () => {
  const [list, setList] = useState(INITIAL_EXAM_DATA);
  const [idx, setIdx] = useState(0);
  const [sidebar, setSidebar] = useState(false);
  const [genModal, setGenModal] = useState(false);
  const [historyDrawer, setHistoryDrawer] = useState(false);
  const [aiSettings, setAiSettings] = useState(false);
  const [authModal, setAuthModal] = useState(false);
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState(null);
  const [vocab, setVocab] = useState([]);
  const [errors, setErrors] = useState([]);
  const [history, setHistory] = useState({});
  const [dark, setDark] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [migrating, setMigrating] = useState(false);

  // 初始化：加载本地数据和主题
  useEffect(() => {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) setDark(true);
    // Local fallback init
    const localVocab = JSON.parse(localStorage.getItem('kaoyan_vocab') || '[]');
    const localErrors = JSON.parse(localStorage.getItem('kaoyan_errors') || '[]');
    setVocab(localVocab);
    setErrors(localErrors);
  }, []);

  // 监听认证状态变化
  useEffect(() => {
    if (!auth) return;

    const unsubscribe = onAuthStateChangeService(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        // 检查是否为匿名用户
        const isAnon = firebaseUser.isAnonymous;
        setIsAnonymous(isAnon);

        // 如果是正式用户，获取用户名
        if (!isAnon && db) {
          const currentUsername = await getCurrentUsername(db, firebaseUser.uid);
          setUsername(currentUsername);
        } else {
          setUsername(null);
        }
      } else {
        setUser(null);
        setUsername(null);
        setIsAnonymous(false);
      }
    });

    return () => unsubscribe();
  }, [auth, db]);

  // 如果没有登录，尝试匿名登录
  useEffect(() => {
    if (auth && !auth.currentUser) {
      signInAnonymously(auth)
        .then(c => {
          setUser(c.user);
          setIsAnonymous(true);
        })
        .catch(e => console.warn("匿名登录失败:", e));
    }
  }, [auth]);

  // 加载用户数据（正式用户从Firestore，匿名用户从localStorage）
  useEffect(() => {
    if (!user || !db) {
      // 如果没有用户或数据库，使用本地数据
      const localVocab = JSON.parse(localStorage.getItem('kaoyan_vocab') || '[]');
      const localErrors = JSON.parse(localStorage.getItem('kaoyan_errors') || '[]');
      const localHistory = JSON.parse(localStorage.getItem('kaoyan_history') || '{}');
      setVocab(localVocab);
      setErrors(localErrors);
      setHistory(localHistory);
      return;
    }

    // 匿名用户：只使用本地数据，不同步到Firestore
    if (isAnonymous) {
      const localVocab = JSON.parse(localStorage.getItem('kaoyan_vocab') || '[]');
      const localErrors = JSON.parse(localStorage.getItem('kaoyan_errors') || '[]');
      const localHistory = JSON.parse(localStorage.getItem('kaoyan_history') || '{}');
      setVocab(localVocab);
      setErrors(localErrors);
      setHistory(localHistory);
      return;
    }

    // 正式用户：从Firestore加载数据
    const notebookRef = doc(db, 'artifacts', appId, 'users', user.uid, 'userData', 'notebook');
    const historyRef = doc(db, 'artifacts', appId, 'users', user.uid, 'userData', 'history');

    const unsubNotebook = onSnapshot(notebookRef, (d) => {
      if(d.exists()) {
        const data = d.data();
        const cloudVocab = data.vocab || [];
        const cloudErrors = data.errors || [];
        setVocab(cloudVocab); 
        setErrors(cloudErrors);
        localStorage.setItem('kaoyan_vocab', JSON.stringify(cloudVocab));
        localStorage.setItem('kaoyan_errors', JSON.stringify(cloudErrors));
      } else {
        // Firestore没有数据，检查localStorage是否有数据需要上传
        const localVocab = JSON.parse(localStorage.getItem('kaoyan_vocab') || '[]');
        const localErrors = JSON.parse(localStorage.getItem('kaoyan_errors') || '[]');
        if (localVocab.length > 0 || localErrors.length > 0) {
          // 上传本地数据到Firestore
          setDoc(notebookRef, { vocab: localVocab, errors: localErrors }).catch(err => 
            console.warn("上传本地数据失败:", err)
          );
        }
      }
    }, (e) => console.warn("Firestore access error (likely offline):", e));
    
    const unsubHistory = onSnapshot(historyRef, (d) => {
      if(d.exists()) {
        const cloudHistory = d.data().records || {};
        setHistory(cloudHistory);
        localStorage.setItem('kaoyan_history', JSON.stringify(cloudHistory));
      } else {
        // Firestore没有历史，检查localStorage
        const localHistory = JSON.parse(localStorage.getItem('kaoyan_history') || '{}');
        if (Object.keys(localHistory).length > 0) {
          setDoc(historyRef, { records: localHistory }).catch(err => 
            console.warn("上传历史数据失败:", err)
          );
        }
      }
    }, (e) => console.warn("Firestore history error:", e));

    return () => { unsubNotebook(); unsubHistory(); };
  }, [user, isAnonymous, db]);

  const saveData = (v, e) => {
    setVocab(v); setErrors(e);
    localStorage.setItem('kaoyan_vocab', JSON.stringify(v));
    localStorage.setItem('kaoyan_errors', JSON.stringify(e));
    // 只有正式用户才同步到Firestore
    if(user && db && !isAnonymous) {
      setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'userData', 'notebook'), {vocab: v, errors: e}).catch(err => console.warn("Cloud save failed:", err));
    }
  };

  const saveHistory = (topicId, record) => {
    const newHistory = { ...history, [topicId]: [...(history[topicId] || []), record] };
    setHistory(newHistory);
    localStorage.setItem('kaoyan_history', JSON.stringify(newHistory));
    // 只有正式用户才同步到Firestore
    if(user && db && !isAnonymous) {
      setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'userData', 'history'), { records: newHistory }).catch(err => console.warn("History save failed:", err));
    }
  };

  // 处理登录成功
  const handleLoginSuccess = async (newUser) => {
    if (!newUser || !db) return;

    // 检查是否有匿名数据需要迁移
    const localVocab = JSON.parse(localStorage.getItem('kaoyan_vocab') || '[]');
    const localErrors = JSON.parse(localStorage.getItem('kaoyan_errors') || '[]');
    const localHistory = JSON.parse(localStorage.getItem('kaoyan_history') || '{}');

    const hasLocalData = localVocab.length > 0 || localErrors.length > 0 || Object.keys(localHistory).length > 0;

    if (hasLocalData && isAnonymous) {
      // 迁移匿名数据
      setMigrating(true);
      try {
        const anonymousData = {
          vocab: localVocab,
          errors: localErrors,
          history: localHistory
        };
        const result = await migrateAnonymousData(db, appId, newUser.uid, anonymousData);
        if (result.success) {
          // 迁移成功，清除本地数据（数据已在云端）
          localStorage.removeItem('kaoyan_vocab');
          localStorage.removeItem('kaoyan_errors');
          localStorage.removeItem('kaoyan_history');
        } else {
          console.warn("数据迁移失败:", result.error);
        }
      } catch (error) {
        console.error("数据迁移错误:", error);
      } finally {
        setMigrating(false);
      }
    }

    // 获取用户名
    const currentUsername = await getCurrentUsername(db, newUser.uid);
    setUsername(currentUsername);
    setIsAnonymous(false);
  };

  // 处理登出
  const handleSignOut = async () => {
    try {
      await signOutUser(auth);
      setUser(null);
      setUsername(null);
      setIsAnonymous(false);
      // 登出后尝试匿名登录
      if (auth) {
        signInAnonymously(auth)
          .then(c => {
            setUser(c.user);
            setIsAnonymous(true);
          })
          .catch(e => console.warn("匿名登录失败:", e));
      }
    } catch (error) {
      console.error("登出失败:", error);
    }
  };

  const handleExportData = () => {
    const dataStr = JSON.stringify({ savedVocab: vocab, savedErrors: errors }, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "kaoyan_notebook_backup.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportData = (data) => {
    let newVocab = vocab;
    let newErrors = errors;
    if (data.savedVocab && Array.isArray(data.savedVocab)) {
       const existingWords = new Set(vocab.map(v => v.word));
       const toAdd = data.savedVocab.filter(v => !existingWords.has(v.word));
       newVocab = [...toAdd, ...vocab];
    }
    if (data.savedErrors && Array.isArray(data.savedErrors)) {
       newErrors = [...data.savedErrors, ...errors];
    }
    saveData(newVocab, newErrors);
    alert("数据已导入并尝试同步至云端！");
  };

  return (
    <div className={dark?'dark':''}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors">
        <nav className="sticky top-0 z-20 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 h-14 flex items-center justify-between">
          <div className="font-bold flex gap-2 items-center"><PenTool className="w-5 h-5 text-indigo-600"/> Kaoyan<span className="text-indigo-600">Master</span></div>
          <div className="flex gap-2 items-center">
            {migrating && (
              <div className="text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-1 px-2">
                <Loader className="w-3 h-3 animate-spin" />
                <span>数据迁移中...</span>
              </div>
            )}
            {username ? (
              <div className="flex items-center gap-2 px-2 text-sm">
                <User className="w-4 h-4 text-indigo-600" />
                <span className="text-slate-700 dark:text-slate-300">{username}</span>
                <button onClick={handleSignOut} className="p-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 rounded" title="登出">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button onClick={()=>setAuthModal(true)} className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1" title="登录">
                <LogIn className="w-4 h-4" />
                <span>登录</span>
              </button>
            )}
            <button onClick={()=>setDark(!dark)} className="p-2 bg-slate-100 dark:bg-slate-700 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors" title="切换主题">{dark?<Sun className="w-4 h-4"/>:<Moon className="w-4 h-4"/>}</button>
            <button onClick={()=>setAiSettings(true)} className="p-2 bg-slate-100 dark:bg-slate-700 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors" title="AI设置"><Settings className="w-4 h-4"/></button>
            <button onClick={()=>setSidebar(true)} className="p-2 bg-slate-100 dark:bg-slate-700 rounded-full relative hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors" title="我的笔记本"><List className="w-4 h-4"/>{(vocab.length+errors.length)>0 && <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>}</button>
          </div>
        </nav>
        <main className="max-w-3xl mx-auto px-4 pt-6 pb-20">
          <div className="flex justify-between items-center mb-4">
             <div className="text-sm text-slate-500">当前: {list[idx].year}</div>
             <button onClick={()=>setHistoryDrawer(true)} className="text-xs bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 px-3 py-1.5 rounded-full flex items-center gap-1"><Clock className="w-3 h-3"/> 历史</button>
          </div>
          <QuestionVisualizer data={list[idx]} />
          <div className="flex gap-2 overflow-x-auto pb-4 mb-4">
            {list.map((d,i)=><button key={i} onClick={()=>setIdx(i)} className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${idx===i?'bg-indigo-600 text-white':'bg-white dark:bg-slate-800 dark:text-slate-300'}`}>{d.year}</button>)}
            <button onClick={()=>setGenModal(true)} className="px-4 py-2 rounded-lg text-sm whitespace-nowrap bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 flex items-center gap-1"><Sparkles className="w-3 h-3"/> AI出题</button>
          </div>
          <EssayWorkflowManager data={list[idx]} onSaveVocab={(v)=>{if(!vocab.some(x=>x.word===v.word)) saveData([v,...vocab], errors)}} onSaveError={(e)=>{saveData(vocab, [e,...errors])}} onSaveHistory={saveHistory} />
        </main>
        {sidebar && <div className="fixed inset-0 bg-black/50 z-30" onClick={()=>setSidebar(false)} />}
        <VocabSidebar isOpen={sidebar} toggle={()=>setSidebar(false)} currentTopic={list[idx].title} savedVocab={vocab} savedErrors={errors} onRemoveVocab={(i)=>saveData(vocab.filter((_,x)=>x!==i), errors)} onRemoveError={(i)=>saveData(vocab, errors.filter((_,x)=>x!==i))} onImportData={handleImportData} onExportData={handleExportData} onAddGeneratedVocab={(v)=>{if(!vocab.some(x=>x.word===v.word)) saveData([v,...vocab], errors)}} user={user} />
        <TopicGeneratorModal isOpen={genModal} onClose={()=>setGenModal(false)} onGenerate={(t)=>{setList([...list,t]);setIdx(list.length);}} />
        <HistoryDrawer isOpen={historyDrawer} onClose={()=>setHistoryDrawer(false)} history={history[list[idx].id]} topicTitle={list[idx].title} />
        <AISettings isOpen={aiSettings} onClose={()=>setAiSettings(false)} />
        <AuthModal 
          isOpen={authModal} 
          onClose={()=>setAuthModal(false)} 
          auth={auth}
          db={db}
          onLoginSuccess={handleLoginSuccess}
        />
      </div>
    </div>
  );
};

export default App;

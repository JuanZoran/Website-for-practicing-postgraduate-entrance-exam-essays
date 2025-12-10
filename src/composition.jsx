import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, CheckCircle, XCircle, RefreshCw, ChevronRight, PenTool, Layout, List, HelpCircle, Sparkles, Loader, MessageSquare, Image as ImageIcon, Link as LinkIcon, Table as TableIcon, BrainCircuit, X, Bookmark, AlertTriangle, Trash2, Save, ChevronDown, ChevronUp, Quote, ArrowRight, Check, Upload, Cloud, Moon, Sun, Download, FileJson, PlusCircle, Lightbulb, Clock, History, Copy, LogIn, Wifi, WifiOff, User, Settings, LogOut, Edit, RotateCcw } from 'lucide-react';
import Ripples from 'react-ripples';
import { callAI, clearConversationHistory } from "./services/aiService";
import { buildPrompt } from "./services/promptService";
import { FollowUpChat } from "./components/FollowUpChat";
import { GrammarScoreDisplay, FinalScoreDisplay, LogicStatusDisplay } from "./components/ScoreDisplay";
import AISettings from "./components/AISettings";
import AuthModal from "./components/AuthModal";
import { 
  signOutUser, 
  getCurrentUsername, 
  migrateAnonymousData,
  onAuthStateChange as onAuthStateChangeService
} from "./services/authService";
import { 
  initLeanCloud, 
  getCurrentUser as getLCUser,
  saveUserData,
  getUserData,
  subscribeUserData
} from "./services/leancloudService";

// --- LEANCLOUD INIT (SAFE MODE) ---
let lc, appId;
try {
  const lcConfig = window.__leancloud_config;
  if (lcConfig && lcConfig.appId && lcConfig.appKey) {
    initLeanCloud(lcConfig.appId, lcConfig.appKey, lcConfig.serverURL);
    lc = true;
  } else {
    console.warn("LeanCloud 配置不完整，使用离线模式");
    lc = false;
  }
  appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
} catch (e) {
  console.warn("LeanCloud init failed/skipped (Offline mode active):", e);
  lc = false;
}

// --- UTILS ---
const SimpleMarkdown = ({ text, className = "" }) => {
  if (!text) return null;
  
  // 格式化内联文本，支持更丰富的颜色
  const formatInline = (str) => {
    const elements = [];
    let lastIndex = 0;
    const matches = [];
    
    // 匹配粗体 **text**
    const boldRegex = /\*\*(.+?)\*\*/g;
    let match;
    while ((match = boldRegex.exec(str)) !== null) {
      matches.push({ start: match.index, end: match.index + match[0].length, content: match[1], type: 'bold' });
    }
    
    // 匹配引号内容 "text"
    const quoteRegex = /"([^"]+)"/g;
    while ((match = quoteRegex.exec(str)) !== null) {
      const overlaps = matches.some(m => 
        (match.index >= m.start && match.index < m.end) || 
        (match.index + match[0].length > m.start && match.index + match[0].length <= m.end)
      );
      if (!overlaps) {
        matches.push({ start: match.index, end: match.index + match[0].length, content: match[1], type: 'quote' });
      }
    }
    
    // 匹配英文单词/短语（用于高亮关键术语）
    const termRegex = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g;
    while ((match = termRegex.exec(str)) !== null) {
      const overlaps = matches.some(m => 
        (match.index >= m.start && match.index < m.end) || 
        (match.index + match[0].length > m.start && match.index + match[0].length <= m.end)
      );
      if (!overlaps && match[1].length > 3) {
        matches.push({ start: match.index, end: match.index + match[0].length, content: match[1], type: 'term' });
      }
    }
    
    // 按位置排序
    matches.sort((a, b) => a.start - b.start);
    
    // 构建结果
    matches.forEach((m, idx) => {
      if (m.start > lastIndex) {
        elements.push(<span key={`t${idx}`}>{str.slice(lastIndex, m.start)}</span>);
      }
      if (m.type === 'bold') {
        elements.push(
          <strong key={`b${idx}`} className="font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/40 px-1 rounded">
            {m.content}
          </strong>
        );
      } else if (m.type === 'quote') {
        elements.push(
          <span key={`q${idx}`} className="text-emerald-600 dark:text-emerald-400 font-medium">"{m.content}"</span>
        );
      } else if (m.type === 'term') {
        elements.push(
          <span key={`e${idx}`} className="text-blue-600 dark:text-blue-400 font-medium">{m.content}</span>
        );
      }
      lastIndex = m.end;
    });
    
    if (lastIndex < str.length) {
      elements.push(<span key="last">{str.slice(lastIndex)}</span>);
    }
    
    return elements.length > 0 ? elements : str;
  };
  
  return (
    <div className={`space-y-2 ${className}`}>
      {text.split('\n').map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-2"></div>;
        
        // 检测列表项
        const isBullet = /^[-*•]\s/.test(line.trim());
        const isNumbered = /^\d+[.)]\s/.test(line.trim());
        const cleanLine = isBullet ? line.trim().substring(2) : 
                         isNumbered ? line.trim().replace(/^\d+[.)]\s/, '') : line;
        
        const formattedContent = formatInline(cleanLine);
        
        if (isBullet) {
          return (
            <div key={i} className="flex gap-2 ml-1 leading-relaxed break-words">
              <span className="text-indigo-400 dark:text-indigo-500 mt-0.5 flex-shrink-0">•</span>
              <div className="flex-1">{formattedContent}</div>
            </div>
          );
        }
        
        if (isNumbered) {
          const num = line.trim().match(/^\d+/)[0];
          return (
            <div key={i} className="flex gap-2 ml-1 leading-relaxed break-words">
              <span className="text-emerald-500 dark:text-emerald-400 font-medium text-sm mt-0.5 flex-shrink-0 min-w-[1.5rem]">{num}.</span>
              <div className="flex-1">{formattedContent}</div>
            </div>
          );
        }
        
        return (
          <div key={i} className="leading-relaxed break-words">{formattedContent}</div>
        );
      })}
    </div>
  );
};

// --- EdgeSwipeDetector Component ---
const EdgeSwipeDetector = ({ onSwipeRight, enabled = true }) => {
  const touchStartX = useRef(null);
  const edgeThreshold = 20; // 从右边缘20px内开始滑动

  useEffect(() => {
    if (!enabled) return;

    const handleTouchStart = (e) => {
      const touchX = e.touches[0].clientX;
      const screenWidth = window.innerWidth;
      // 检测是否从右边缘开始
      if (screenWidth - touchX <= edgeThreshold) {
        touchStartX.current = touchX;
      }
    };

    const handleTouchMove = (e) => {
      if (touchStartX.current === null) return;
      const touchX = e.touches[0].clientX;
      const deltaX = touchX - touchStartX.current;
      
      // 向左滑动超过50px，触发打开侧边栏
      if (deltaX < -50) {
        onSwipeRight();
        touchStartX.current = null;
      }
    };

    const handleTouchEnd = () => {
      touchStartX.current = null;
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, onSwipeRight]);

  return null;
};

// --- SwipeableTopicCards Component (Jobs Style) ---
const SwipeableTopicCards = ({ list, currentIdx, onSelect, onGenerate }) => {
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const containerRef = useRef(null);
  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > minSwipeDistance && currentIdx < list.length - 1) onSelect(currentIdx + 1);
    if (distance < -minSwipeDistance && currentIdx > 0) onSelect(currentIdx - 1);
  };

  return (
    <div className="relative">
      {/* 当前题目卡片 - 大卡片设计 */}
      <div 
        ref={containerRef}
        className="relative overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div 
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${currentIdx * 100}%)` }}
        >
          {list.map((item, i) => (
            <div key={i} className="w-full flex-shrink-0 px-1">
              <div
                className={`p-6 rounded-3xl transition-all duration-300 ${
                  currentIdx === i
                    ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200 dark:shadow-indigo-900/50'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <span className={`text-sm ${currentIdx === i ? 'text-indigo-200' : 'text-slate-400'}`}>
                  {item.year}
                </span>
                <h3 className={`text-xl font-semibold mt-1 ${currentIdx === i ? 'text-white' : 'text-slate-800 dark:text-slate-200'}`}>
                  {item.title}
                </h3>
                <p className={`text-sm mt-2 line-clamp-2 ${currentIdx === i ? 'text-indigo-100' : 'text-slate-500'}`}>
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* 极简指示器 */}
      <div className="flex justify-center gap-2 mt-6">
        {list.map((_, i) => (
          <button
            key={i}
            onClick={() => onSelect(i)}
            className={`rounded-full transition-all duration-500 ${
              i === currentIdx 
                ? 'w-8 h-2 bg-indigo-600' 
                : 'w-2 h-2 bg-slate-300 dark:bg-slate-600 hover:bg-slate-400'
            }`}
          />
        ))}
      </div>
      
      {/* AI出题 - 更优雅的设计 */}
      <button 
        onClick={onGenerate}
        className="w-full mt-6 p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 text-amber-700 dark:text-amber-400 flex items-center justify-center gap-3 font-medium active:scale-[0.98] transition-transform"
      >
        <Sparkles className="w-5 h-5" />
        <span>AI 智能出题</span>
      </button>
    </div>
  );
};


// --- DATA ---
const INITIAL_EXAM_DATA = [
  {
    id: "2010", year: "2010", title: "文化火锅", mode: "Mode A", visualType: "image", description: "火锅里煮着佛像、莎士比亚、功夫等中西文化元素。",
    defaultImage: "/images/exam/2010.jpg",
    slots: [
      { id: "desc", label: "图画描述", question: "描述火锅中的中西元素融合。", templateContext: "Specifically, [INSERT HERE].", placeholder: "例如：火锅里汇聚了莎士比亚和功夫..." },
      { id: "arg1", label: "核心意义", question: "文化融合为何重要？", templateContext: "First and foremost, [INSERT HERE].", placeholder: "例如：促进文明繁荣，取长补短..." },
      { id: "action", label: "建议", question: "如何对待外来文化？", templateContext: "Accordingly, [INSERT HERE].", placeholder: "例如：取其精华，去其糟粕..." }
    ],
    templateString: "Unfolding before us is a thought-provoking cartoon: a huge 'hotpot' containing various cultural elements. Specifically, {{desc}}. Simple as the picture is, the symbolic meaning behind it is strictly distinct.\n\nThe primary purpose is to illustrate the importance of cultural integration. Why does this matter? First and foremost, {{arg1}}. It is cultural exchange that enables civilizations to flourish.\n\nIn view of the arguments above, cultural diversity is of vital importance. Accordingly, it is imperative for us to {{action}}. Only in this way can we build a harmonious global village."
  },
  {
    id: "2011", year: "2011", title: "旅途之余", mode: "Mode B", visualType: "image", description: "游客在船上乱扔垃圾，破坏风景。",
    defaultImage: "/images/exam/2011.jpg",
    slots: [
      { id: "desc", label: "图画描述", question: "描述游客的不文明行为。", templateContext: "Specifically, [INSERT HERE].", placeholder: "例如：游客一边欣赏风景，一边乱扔垃圾..." },
      { id: "harm", label: "危害分析", question: "这种行为有什么后果？", templateContext: "First and foremost, [INSERT HERE].", placeholder: "例如：破坏生态平衡，损害社会公德..." },
      { id: "action", label: "建议", question: "如何解决？", templateContext: "Accordingly, [INSERT HERE].", placeholder: "例如：提高环保意识，加强监管..." }
    ],
    templateString: "Unfolding before us is a thought-provoking cartoon showing tourists littering. Specifically, {{desc}}. Simple as the picture is, the symbolic meaning is strictly distinct.\n\nThe primary purpose is to illustrate the detrimental effect of immoral behavior. Why does this matter? First and foremost, {{harm}}. It is this lack of public spirit that threatens our environment.\n\nIn view of the arguments above, environmental protection is of vital importance. Accordingly, it is imperative for us to {{action}}. Only in this way can we leave a beautiful world for future generations."
  },
  {
    id: "2012", year: "2012", title: "打翻酒瓶", mode: "Mode A", visualType: "image", description: "瓶子倒了，一人叹息全完了，一人庆幸剩一半。",
    defaultImage: "/images/exam/2012.jpg",
    slots: [
      { id: "desc", label: "图画描述", question: "对比两人的反应。", templateContext: "Specifically, [INSERT HERE].", placeholder: "例如：一人悲观叹息，另一人乐观庆幸..." },
      { id: "arg1", label: "核心论点", question: "为什么乐观很重要？", templateContext: "First and foremost, [INSERT HERE].", placeholder: "例如：乐观是面对逆境的精神支柱..." },
      { id: "action", label: "建议", question: "我们该怎么做？", templateContext: "Accordingly, [INSERT HERE].", placeholder: "例如：停止抱怨，珍惜当下..." }
    ],
    templateString: "Unfolding before us is a thought-provoking cartoon. Specifically, {{desc}}. The purpose is to illustrate optimism. First and foremost, {{arg1}}. Accordingly, it is imperative for us to {{action}}."
  },
  {
    id: "2013", year: "2013", title: "选择", mode: "Mode A", visualType: "image", description: "一群毕业生站在分岔路口，有人选择就业，有人选择考研，有人选择创业。",
    defaultImage: "/images/exam/2013.jpg",
    slots: [
      { id: "desc", label: "图画描述", question: "描述毕业生面临的选择。", templateContext: "Specifically, [INSERT HERE].", placeholder: "例如：毕业生站在人生十字路口，面临多种选择..." },
      { id: "arg1", label: "核心意义", question: "为什么选择很重要？", templateContext: "First and foremost, [INSERT HERE].", placeholder: "例如：选择决定人生方向，需要理性思考..." },
      { id: "action", label: "建议", question: "如何做出正确选择？", templateContext: "Accordingly, [INSERT HERE].", placeholder: "例如：结合兴趣和能力，做出适合自己的选择..." }
    ],
    templateString: "Unfolding before us is a thought-provoking cartoon showing graduates at a crossroads. Specifically, {{desc}}. The purpose is to illustrate the importance of making choices. First and foremost, {{arg1}}. Accordingly, we should {{action}}."
  },
  {
    id: "2014", year: "2014", title: "相携", mode: "Mode A", visualType: "image", description: "三十年前，年轻的母亲牵着女儿的手；三十年后，女儿牵着年迈的母亲的手。",
    defaultImage: "/images/exam/2014.jpg",
    slots: [
      { id: "desc", label: "图画描述", question: "描述两幅图的对比。", templateContext: "Specifically, [INSERT HERE].", placeholder: "例如：三十年前母亲照顾女儿，三十年后女儿照顾母亲..." },
      { id: "arg1", label: "核心意义", question: "为什么孝道很重要？", templateContext: "First and foremost, [INSERT HERE].", placeholder: "例如：孝道是中华民族的传统美德..." },
      { id: "action", label: "建议", question: "如何传承孝道？", templateContext: "Accordingly, [INSERT HERE].", placeholder: "例如：关爱父母，传承美德..." }
    ],
    templateString: "Unfolding before us is a touching cartoon showing the cycle of care. Specifically, {{desc}}. The purpose is to illustrate filial piety. First and foremost, {{arg1}}. Accordingly, we should {{action}}."
  },
  {
    id: "2015", year: "2015", title: "聚餐玩手机", mode: "Mode B", visualType: "image", description: "聚餐时大家都在玩手机，没人交流。",
    defaultImage: "/images/exam/2015.jpg",
    slots: [
      { id: "desc", label: "图画描述", question: "描述聚餐时的冷漠场景。", templateContext: "Specifically, [INSERT HERE].", placeholder: "例如：虽然坐在一起，但都在低头看屏幕..." },
      { id: "harm", label: "危害分析", question: "手机沉迷有什么坏处？", templateContext: "First and foremost, [INSERT HERE].", placeholder: "例如：阻碍了面对面的情感交流..." },
      { id: "action", label: "建议", question: "如何改变？", templateContext: "Accordingly, [INSERT HERE].", placeholder: "例如：放下手机，回归现实..." }
    ],
    templateString: "Unfolding before us is a thought-provoking cartoon about 'phubbing'. Specifically, {{desc}}. The purpose is to illustrate the harm of mobile addiction. First and foremost, {{harm}}. It is this indifference that stifles communication. Accordingly, it is imperative to {{action}}."
  },
  {
    id: "2016", year: "2016", title: "父子看电视", mode: "Mode A", visualType: "image", description: "父亲边看电视边让儿子学习，儿子也学着看电视。",
    defaultImage: "/images/exam/2016.png",
    slots: [
      { id: "desc", label: "图画描述", question: "描述父子的行为对比。", templateContext: "Specifically, [INSERT HERE].", placeholder: "例如：父亲在沙发上看电视，却命令儿子去读书..." },
      { id: "arg1", label: "核心论点", question: "为什么榜样很重要？", templateContext: "First and foremost, [INSERT HERE].", placeholder: "例如：身教重于言教..." },
      { id: "action", label: "建议", question: "父母应该怎么做？", templateContext: "Accordingly, [INSERT HERE].", placeholder: "例如：以身作则，言行一致..." }
    ],
    templateString: "Unfolding before us is a thought-provoking cartoon. Specifically, {{desc}}. The purpose is to illustrate the power of role models. First and foremost, {{arg1}}. Accordingly, parents should {{action}}."
  },
  {
    id: "2017", year: "2017", title: "有书与读书", mode: "Mode A", visualType: "image", description: "一个人坐在书堆前，书很多，但他在玩手机。",
    defaultImage: "/images/exam/2017.jpg",
    slots: [
      { id: "desc", label: "图画描述", question: "描述图画中的矛盾。", templateContext: "Specifically, [INSERT HERE].", placeholder: "例如：面前有很多书，却在玩手机..." },
      { id: "harm", label: "问题分析", question: "这种现象有什么问题？", templateContext: "First and foremost, [INSERT HERE].", placeholder: "例如：拥有书不等于读书，需要实际行动..." },
      { id: "action", label: "建议", question: "如何培养阅读习惯？", templateContext: "Accordingly, [INSERT HERE].", placeholder: "例如：放下手机，静心阅读..." }
    ],
    templateString: "Unfolding before us is a thought-provoking cartoon. Specifically, {{desc}}. The purpose is to illustrate the gap between owning books and reading. First and foremost, {{harm}}. Accordingly, we should {{action}}."
  },
  {
    id: "2018", year: "2018", title: "选课进行时", mode: "Mode A", visualType: "image", description: "一个学生坐在电脑前选课，一边是\"知识新、重创新、有难度\"的课，一边是\"给分高、易通过、作业少\"的课。",
    defaultImage: "/images/exam/2018.jpg",
    slots: [
      { id: "desc", label: "图画描述", question: "描述学生选课时的两难选择。", templateContext: "Specifically, [INSERT HERE].", placeholder: "例如：学生面临两种课程的选择..." },
      { id: "arg1", label: "核心意义", question: "为什么应该选择有挑战的课程？", templateContext: "First and foremost, [INSERT HERE].", placeholder: "例如：挑战促进成长，知识提升能力..." },
      { id: "action", label: "建议", question: "如何做出正确选择？", templateContext: "Accordingly, [INSERT HERE].", placeholder: "例如：选择有挑战的课程，追求真正的学习..." }
    ],
    templateString: "Unfolding before us is a cartoon about course selection. Specifically, {{desc}}. The purpose is to illustrate the importance of choosing challenging courses. First and foremost, {{arg1}}. Accordingly, we should {{action}}."
  },
  {
    id: "2019", year: "2019", title: "途中", mode: "Mode A", visualType: "image", description: "一个人在路上，前面是\"坚持\"，后面是\"放弃\"，他选择了坚持。",
    defaultImage: "/images/exam/2019.png",
    slots: [
      { id: "desc", label: "图画描述", question: "描述图画中的场景。", templateContext: "Specifically, [INSERT HERE].", placeholder: "例如：一个人在路上，面临坚持和放弃的选择..." },
      { id: "arg1", label: "核心意义", question: "为什么坚持很重要？", templateContext: "First and foremost, [INSERT HERE].", placeholder: "例如：坚持是成功的关键，放弃意味着失败..." },
      { id: "action", label: "建议", question: "如何培养坚持的品质？", templateContext: "Accordingly, [INSERT HERE].", placeholder: "例如：设定目标，克服困难，永不放弃..." }
    ],
    templateString: "Unfolding before us is a cartoon about persistence. Specifically, {{desc}}. The purpose is to illustrate the value of perseverance. First and foremost, {{arg1}}. Accordingly, we should {{action}}."
  },
  {
    id: "2020", year: "2020", title: "习惯", mode: "Mode A", visualType: "image", description: "一个女孩坐在桌前，桌上有一本书，但她低头看手机。",
    defaultImage: "/images/exam/2020.png",
    slots: [
      { id: "desc", label: "图画描述", question: "描述图画中的场景。", templateContext: "Specifically, [INSERT HERE].", placeholder: "例如：女孩面前有书，却在看手机..." },
      { id: "harm", label: "问题分析", question: "这种习惯有什么危害？", templateContext: "First and foremost, [INSERT HERE].", placeholder: "例如：手机成瘾影响学习，分散注意力..." },
      { id: "action", label: "建议", question: "如何改变不良习惯？", templateContext: "Accordingly, [INSERT HERE].", placeholder: "例如：培养良好习惯，合理使用手机..." }
    ],
    templateString: "Unfolding before us is a cartoon about habits. Specifically, {{desc}}. The purpose is to illustrate the impact of bad habits. First and foremost, {{harm}}. Accordingly, we should {{action}}."
  },
  {
    id: "2021", year: "2021", title: "兴趣", mode: "Mode A", visualType: "image", description: "一个孩子穿着戏曲服装，对父亲说很多同学觉得学唱戏不好玩，父亲鼓励他说只要自己喜欢就足够了。",
    defaultImage: "/images/exam/2021.png",
    slots: [
      { id: "desc", label: "图画描述", question: "描述父子关于学戏曲的对话。", templateContext: "Specifically, [INSERT HERE].", placeholder: "例如：孩子担心同学觉得学唱戏不好玩，父亲鼓励他坚持自己的兴趣..." },
      { id: "arg1", label: "核心意义", question: "为什么坚持自己的兴趣很重要？", templateContext: "First and foremost, [INSERT HERE].", placeholder: "例如：兴趣是最好的老师，坚持自己的选择才能获得真正的快乐..." },
      { id: "action", label: "建议", question: "如何对待自己的兴趣？", templateContext: "Accordingly, [INSERT HERE].", placeholder: "例如：不要被他人意见左右，坚持自己的热爱..." }
    ],
    templateString: "Unfolding before us is a thought-provoking cartoon. Specifically, {{desc}}. The purpose is to illustrate the importance of following one's own interests. First and foremost, {{arg1}}. Accordingly, we should {{action}}."
  },
  {
    id: "2022", year: "2022", title: "跨学科学习", mode: "Mode A", visualType: "image", description: "两个学生站在公告栏前，一个说不是我们专业的听了也没多大用，另一个说听听总会有好处。",
    defaultImage: "/images/exam/2022.png",
    slots: [
      { id: "desc", label: "图画描述", question: "描述两个学生对听讲座的不同态度。", templateContext: "Specifically, [INSERT HERE].", placeholder: "例如：一个学生认为非专业的讲座没用，另一个认为听听总会有好处..." },
      { id: "arg1", label: "核心意义", question: "为什么跨学科学习很重要？", templateContext: "First and foremost, [INSERT HERE].", placeholder: "例如：跨学科学习能拓宽视野，促进创新思维..." },
      { id: "action", label: "建议", question: "如何培养跨学科学习的意识？", templateContext: "Accordingly, [INSERT HERE].", placeholder: "例如：保持开放心态，积极参与各类讲座和活动..." }
    ],
    templateString: "Unfolding before us is a thought-provoking cartoon. Specifically, {{desc}}. The purpose is to illustrate the importance of interdisciplinary learning. First and foremost, {{arg1}}. Accordingly, we should {{action}}."
  },
  {
    id: "2023", year: "2023", title: "传统文化复兴", mode: "Mode A", visualType: "image", description: "一位老人看着村里的龙舟比赛，感叹比赛越来越热闹了，很多人前来观看和参与。",
    defaultImage: "/images/exam/2023.png",
    slots: [
      { id: "desc", label: "图画描述", question: "描述龙舟比赛的热闹场景。", templateContext: "Specifically, [INSERT HERE].", placeholder: "例如：村里的龙舟比赛越来越热闹，吸引了很多人前来观看..." },
      { id: "arg1", label: "核心意义", question: "为什么传统文化活动的复兴很重要？", templateContext: "First and foremost, [INSERT HERE].", placeholder: "例如：传统文化是民族精神的载体，复兴有助于增强文化自信..." },
      { id: "action", label: "建议", question: "如何促进传统文化的传承与发展？", templateContext: "Accordingly, [INSERT HERE].", placeholder: "例如：积极参与传统活动，让传统文化在现代社会焕发新活力..." }
    ],
    templateString: "Unfolding before us is a thought-provoking cartoon. Specifically, {{desc}}. The purpose is to illustrate the revitalization of traditional culture. First and foremost, {{arg1}}. Accordingly, we should {{action}}."
  },
  {
    id: "2024", year: "2024", title: "创新", mode: "Mode A", visualType: "image", description: "一个创新者站在传统和创新的交界处，思考如何平衡。",
    defaultImage: "/images/exam/2024.png",
    slots: [
      { id: "desc", label: "图画描述", question: "描述创新者的处境。", templateContext: "Specifically, [INSERT HERE].", placeholder: "例如：创新者站在传统与创新的交界处..." },
      { id: "arg1", label: "核心意义", question: "为什么创新很重要？", templateContext: "First and foremost, [INSERT HERE].", placeholder: "例如：创新是发展的动力，推动社会进步..." },
      { id: "action", label: "建议", question: "如何培养创新能力？", templateContext: "Accordingly, [INSERT HERE].", placeholder: "例如：保持好奇心，勇于尝试，不断学习..." }
    ],
    templateString: "Unfolding before us is a cartoon about innovation. Specifically, {{desc}}. The purpose is to illustrate the importance of innovation. First and foremost, {{arg1}}. Accordingly, we should {{action}}."
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

// --- History Drawer (Jobs Style) ---
const HistoryDrawer = ({ isOpen, onClose, history, topicTitle }) => {
  if (!isOpen) return null;
  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40 animate-fadeIn" onClick={onClose} />
      <div className={`fixed inset-y-0 right-0 w-full sm:w-96 bg-white dark:bg-slate-900 transform transition-transform duration-300 ease-out z-40 ${isOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}>
        {/* 头部 */}
        <div className="px-6 py-4 glass border-b border-slate-200/50 dark:border-slate-700/50 flex justify-between items-center">
          <h3 className="font-semibold text-[17px] text-slate-800 dark:text-slate-100">练习历史</h3>
          <button onClick={onClose} className="touch-target text-indigo-600 font-medium active:scale-95 transition-transform">
            完成
          </button>
        </div>
        
        {/* 当前题目 */}
        <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-800">
          <span className="text-[13px] text-slate-400">当前题目</span>
          <p className="text-[15px] text-slate-700 dark:text-slate-200 font-medium">{topicTitle}</p>
        </div>
        
        {/* 历史列表 */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {!history || history.length === 0 ? (
            <div className="text-center py-16">
              <Clock className="w-12 h-12 mx-auto mb-4 text-slate-200 dark:text-slate-700" />
              <p className="text-[15px] text-slate-400">暂无练习记录</p>
            </div>
          ) : (
            history.slice().reverse().map((item, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800">
                <div className="flex justify-between items-center mb-3">
                  <span className={`text-[13px] font-medium px-3 py-1 rounded-full ${
                    item.type === 'logic' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' :
                    item.type === 'grammar' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300' :
                    'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
                  }`}>
                    {item.type === 'logic' ? '审题' : item.type === 'grammar' ? '润色' : '阅卷'}
                  </span>
                  <span className="text-[12px] text-slate-400">
                    {new Date(item.timestamp).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-[15px] text-slate-600 dark:text-slate-300 line-clamp-2 mb-2">
                  {item.input}
                </p>
                {item.feedback?.comment && (
                  <p className="text-[13px] text-slate-400 line-clamp-1">
                    AI: {item.feedback.comment}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};

const VocabSidebar = ({ isOpen, toggle, currentTopic, savedVocab, savedErrors, onRemoveVocab, onRemoveError, onImportData, onExportData, onAddGeneratedVocab, user }) => {
  const [activeTab, setActiveTab] = useState('system'); 
  const [expandedVocabIndex, setExpandedVocabIndex] = useState(null);
  const [aiVocabList, setAiVocabList] = useState([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  const sidebarRef = useRef(null);
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);

  const toggleVocabExpand = (idx) => setExpandedVocabIndex(expandedVocabIndex === idx ? null : idx);

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
      reader.onload = (event) => { try { onImportData(JSON.parse(event.target.result)); } catch (err) { alert("文件错误"); } };
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

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === 'system' && (
          <div className="animate-fadeIn">
            {/* AI Generator */}
            <div className="mb-6 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/40 dark:to-purple-900/40 p-4 rounded-lg border border-indigo-100 dark:border-indigo-800">
              <h4 className="font-bold text-indigo-800 dark:text-indigo-200 mb-2 text-sm flex items-center gap-1"><Sparkles className="w-4 h-4" /> AI 词汇扩展 ({currentTopic})</h4>
              <p className="text-xs text-indigo-600 dark:text-indigo-300 mb-3">生成与当前主题相关的高级词汇、场景和例句。</p>
              
              {!aiVocabList.length && !loading && (
                <Ripples>
                  <button onClick={handleExpandVocab} className="w-full bg-indigo-600 text-white text-xs font-bold py-3 rounded shadow-sm hover:bg-indigo-700 transition-colors flex justify-center items-center gap-2 min-h-[44px]">
                    <Sparkles className="w-3 h-3" /> 生成推荐
                  </button>
                </Ripples>
              )}
              {loading && <div className="text-center py-4"><Loader className="w-5 h-5 animate-spin text-indigo-500 mx-auto" /></div>}
              
              <div className="space-y-2">
                {aiVocabList.map((item, idx) => {
                  // 根据词性选择颜色
                  const meaning = (item.meaning || '').toLowerCase();
                  const colorScheme = meaning.includes('n.') || meaning.includes('名词') 
                    ? { border: 'border-l-blue-500', bg: 'bg-blue-50/50 dark:bg-blue-900/10', word: 'text-blue-600 dark:text-blue-400', tag: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' }
                    : meaning.includes('v.') || meaning.includes('动词')
                    ? { border: 'border-l-emerald-500', bg: 'bg-emerald-50/50 dark:bg-emerald-900/10', word: 'text-emerald-600 dark:text-emerald-400', tag: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300' }
                    : meaning.includes('adj') || meaning.includes('形容词')
                    ? { border: 'border-l-purple-500', bg: 'bg-purple-50/50 dark:bg-purple-900/10', word: 'text-purple-600 dark:text-purple-400', tag: 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300' }
                    : meaning.includes('adv') || meaning.includes('副词')
                    ? { border: 'border-l-amber-500', bg: 'bg-amber-50/50 dark:bg-amber-900/10', word: 'text-amber-600 dark:text-amber-400', tag: 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300' }
                    : { border: 'border-l-indigo-500', bg: 'bg-indigo-50/50 dark:bg-indigo-900/10', word: 'text-indigo-600 dark:text-indigo-400', tag: 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300' };
                  
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
                        onClick={() => onAddGeneratedVocab({...item, sourceTopic: currentTopic, timestamp: Date.now()})}
                        className="absolute top-2 right-2 text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 bg-white dark:bg-slate-800 p-1.5 rounded-full shadow-sm hover:shadow transition-all"
                      >
                        <PlusCircle className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
                {aiVocabList.length > 0 && (
                  <Ripples>
                    <button onClick={handleExpandVocab} className="w-full mt-2 text-xs text-indigo-600 dark:text-indigo-400 underline text-center py-2 min-h-[44px]">换一批</button>
                  </Ripples>
                )}
              </div>
            </div>

            {/* Static */}
            {STATIC_VOCAB_LISTS.map((list, idx) => {
              // 为不同分类设置不同的主题色
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
             {savedVocab.length === 0 ? <div className="text-center py-10 text-slate-400 text-sm"><Sparkles className="w-8 h-8 mx-auto mb-2 opacity-30" /><p>暂无收藏</p></div> : 
               savedVocab.map((item, idx) => {
                 // 根据词性选择颜色
                 const meaning = (item.meaning || '').toLowerCase();
                 const colorScheme = meaning.includes('n.') || meaning.includes('名词') 
                   ? { border: 'border-l-blue-500', bg: 'bg-blue-50/30 dark:bg-blue-900/10', word: 'text-blue-600 dark:text-blue-400', tag: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300', expandBg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700' }
                   : meaning.includes('v.') || meaning.includes('动词')
                   ? { border: 'border-l-emerald-500', bg: 'bg-emerald-50/30 dark:bg-emerald-900/10', word: 'text-emerald-600 dark:text-emerald-400', tag: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300', expandBg: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700' }
                   : meaning.includes('adj') || meaning.includes('形容词')
                   ? { border: 'border-l-purple-500', bg: 'bg-purple-50/30 dark:bg-purple-900/10', word: 'text-purple-600 dark:text-purple-400', tag: 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300', expandBg: 'bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700' }
                   : meaning.includes('adv') || meaning.includes('副词')
                   ? { border: 'border-l-amber-500', bg: 'bg-amber-50/30 dark:bg-amber-900/10', word: 'text-amber-600 dark:text-amber-400', tag: 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300', expandBg: 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700' }
                   : { border: 'border-l-rose-500', bg: 'bg-rose-50/30 dark:bg-rose-900/10', word: 'text-rose-600 dark:text-rose-400', tag: 'bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300', expandBg: 'bg-rose-50 dark:bg-rose-900/20 border-rose-300 dark:border-rose-700' };
                 
                 return (
                   <div key={idx} className={`rounded-xl border-l-4 ${colorScheme.border} border transition-all duration-200 overflow-hidden ${expandedVocabIndex === idx ? colorScheme.expandBg : `${colorScheme.bg} border-slate-200 dark:border-slate-700`}`}>
                      <div className="p-3 relative cursor-pointer" onClick={() => toggleVocabExpand(idx)}>
                        <Ripples>
                        <button onClick={(e) => { e.stopPropagation(); onRemoveVocab(idx); }} className="absolute top-3 right-8 text-slate-300 hover:text-red-500 z-10 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full"><Trash2 className="w-4 h-4" /></button>
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
             }
          </div>
        )}

        {activeTab === 'mistakes' && (
          <div className="animate-fadeIn space-y-3">
            {savedErrors.length === 0 ? <div className="text-center py-10 text-slate-400 text-sm"><CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-30" /><p>暂无错题</p></div> :
               savedErrors.map((err, idx) => (
                 <div key={idx} className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 p-4 rounded-xl border-l-4 border-l-red-500 border border-red-200 dark:border-red-800/50 relative">
                    <Ripples>
                      <button onClick={() => onRemoveError(idx)} className="absolute top-2 right-2 text-slate-300 hover:text-red-500 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full"><Trash2 className="w-4 h-4" /></button>
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
             }
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

const QuestionVisualizer = ({ data }) => {
  const [imgSrc, setImgSrc] = useState(data.defaultImage);
  const fileInputRef = useRef(null);
  useEffect(() => { setImgSrc(data.defaultImage); }, [data]);
  const handleFileUpload = (e) => { if(e.target.files[0]) setImgSrc(URL.createObjectURL(e.target.files[0])); };

  if (data.visualType === "table") {
    return (
      <div className="mb-8 card-breathe text-center">
        <TableIcon className="w-8 h-8 mx-auto mb-3 text-indigo-500" />
        <p className="text-[15px] text-slate-600 dark:text-slate-300">{data.description}</p>
      </div>
    );
  }

  return (
    <div className="mb-8 rounded-3xl overflow-hidden bg-slate-100 dark:bg-slate-800 relative group">
      <div className="flex items-center justify-center min-h-[220px] max-h-[400px] p-4">
        <img 
          src={imgSrc} 
          alt="Exam" 
          className="max-w-full max-h-[380px] object-contain rounded-2xl" 
          onError={(e) => {e.target.src="https://placehold.co/800x400?text=Image+Error"}} 
        />
      </div>
      {/* 上传按钮 - 更隐蔽 */}
      <button 
        onClick={() => fileInputRef.current?.click()} 
        className="absolute top-4 right-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm p-3 rounded-2xl shadow-lg opacity-0 group-hover:opacity-100 md:opacity-100 transition-opacity active:scale-95"
      >
        <Upload className="w-4 h-4 text-slate-600 dark:text-slate-300" />
      </button>
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
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

const EssayWorkflowManager = ({ data, onSaveVocab, onSaveError, onSaveHistory }) => {
  const [step, setStep] = useState(0);
  const [inputs, setInputs] = useState({cn:{}, en:{}});
  const [feedback, setFeedback] = useState({cn:{}, en:{}, final:null});
  const [loading, setLoading] = useState(null);
  const [finalEssayText, setFinalEssayText] = useState(null);
  const [initialEssayText, setInitialEssayText] = useState(null);
  const [isFullscreenEditor, setIsFullscreenEditor] = useState(false);
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

  const handleLogic = async (id) => {
    if (!inputs.cn[id]) return;
    setLoading(id);
    try {
      const prompt = buildPrompt('logic', {
        topic: data.title,
        description: data.description,
        userInput: inputs.cn[id]
      });
      const res = await callAI(prompt || `Task: Kaoyan Logic Check. Topic: ${data.title}. User Idea: "${inputs.cn[id]}". Output JSON: { "status": "pass/warn", "comment": "Chinese feedback", "suggestion": "Improvement" }`, true);
      const json = JSON.parse(res.replace(/```json|```/g,''));
      setFeedback(prev => ({...prev, cn: {...prev.cn, [id]: json}}));
      onSaveHistory(data.id, { type: 'logic', input: inputs.cn[id], feedback: json, timestamp: Date.now() });
    } catch(e) { console.error('Logic check error:', e); }
    setLoading(null);
  };

  const handleGrammar = async (id) => {
    if (!inputs.en[id]) return;
    setLoading(id);
    try {
      const prompt = buildPrompt('grammar', {
        topic: data.title,
        description: data.description,
        chineseInput: inputs.cn[id],
        englishInput: inputs.en[id]
      });
      const res = await callAI(prompt || `Task: Kaoyan Grammar Check. Topic: ${data.title}. CN: "${inputs.cn[id]}". EN: "${inputs.en[id]}". Output JSON: { "score": 1-10, "comment": "Chinese feedback", "grammar_issues": [], "recommended_vocab": [{ "word": "word", "meaning": "meaning", "collocation": "col", "example": "Contextual example sentence", "scenario": "Thinking context" }] }`, true);
      const json = JSON.parse(res.replace(/```json|```/g,''));
      setFeedback(prev => ({...prev, en: {...prev.en, [id]: json}}));
      onSaveHistory(data.id, { type: 'grammar', input: inputs.en[id], feedback: json, timestamp: Date.now() });
      if (json.grammar_issues?.length) json.grammar_issues.forEach(err => onSaveError({...err, timestamp: Date.now()}));
    } catch(e) { console.error('Grammar check error:', e); }
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
    const text = finalEssayText || generateEssayText();
    try {
      const prompt = buildPrompt('scoring', {
        topic: data.title,
        description: data.description,
        essay: text
      });
      const res = await callAI(prompt || `Task: Grade Essay (20pts). Topic: ${data.title}. Text: ${text}. Output JSON: { "score": number, "comment": "Chinese feedback", "strengths": [], "weaknesses": [] }`, true);
      const json = JSON.parse(res.replace(/```json|```/g,'').trim());
      setFeedback(prev => ({...prev, final: json}));
      onSaveHistory(data.id, { type: 'final', input: text, feedback: json, timestamp: Date.now() });
    } catch(e) { console.error('Scoring error:', e); }
    setLoading(null);
  };

  return (
    <div>
      {/* 步骤指示器 - 乔布斯极简风格 */}
      <div className="flex justify-center items-center gap-3 mb-8 py-2">
        {["思考", "翻译", "成文"].map((t, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className={`flex items-center gap-2 transition-all duration-500 ${i === step ? 'opacity-100' : i < step ? 'opacity-60' : 'opacity-30'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-500 ${
                i === step 
                  ? 'bg-indigo-600 text-white scale-110' 
                  : i < step 
                    ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
              }`}>
                {i < step ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-[13px] font-medium hidden sm:block ${i === step ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400'}`}>{t}</span>
            </div>
            {i < 2 && <div className={`w-8 h-0.5 rounded-full transition-colors duration-500 ${i < step ? 'bg-indigo-400' : 'bg-slate-200 dark:bg-slate-700'}`} />}
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
                        // 根据词性选择颜色
                        const meaning = (v.meaning || '').toLowerCase();
                        const colorScheme = meaning.includes('n.') || meaning.includes('名词') 
                          ? { border: 'border-l-blue-500', bg: 'bg-blue-50/50 dark:bg-blue-900/10', word: 'text-blue-600 dark:text-blue-400', tag: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' }
                          : meaning.includes('v.') || meaning.includes('动词')
                          ? { border: 'border-l-emerald-500', bg: 'bg-emerald-50/50 dark:bg-emerald-900/10', word: 'text-emerald-600 dark:text-emerald-400', tag: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300' }
                          : meaning.includes('adj') || meaning.includes('形容词')
                          ? { border: 'border-l-purple-500', bg: 'bg-purple-50/50 dark:bg-purple-900/10', word: 'text-purple-600 dark:text-purple-400', tag: 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300' }
                          : { border: 'border-l-amber-500', bg: 'bg-amber-50/50 dark:bg-amber-900/10', word: 'text-amber-600 dark:text-amber-400', tag: 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300' };
                        
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
                  <button 
                    onClick={() => setIsFullscreenEditor(false)}
                    className="touch-target text-indigo-600 font-medium"
                  >
                    完成
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <textarea
                    value={finalEssayText || ''}
                    onChange={(e) => setFinalEssayText(e.target.value)}
                    className="w-full h-full p-6 bg-transparent text-[17px] leading-8 font-serif text-slate-700 dark:text-slate-300 focus:outline-none resize-none"
                    placeholder="开始写作..."
                    autoFocus
                  />
                </div>
                <div className="px-6 py-4 pb-safe glass border-t border-slate-200/50 dark:border-slate-700/50 flex-shrink-0">
                  {finalEssayText && initialEssayText && finalEssayText !== initialEssayText && (
                    <button
                      onClick={handleResetEssay}
                      className="w-full py-3.5 text-slate-500 rounded-2xl text-[15px] flex items-center justify-center gap-2 active:bg-slate-100 dark:active:bg-slate-800 transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" />
                      重置为模板
                    </button>
                  )}
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
            </div>
          )}
          
          <button onClick={() => setStep(1)} className="btn-secondary">
            返回修改
          </button>
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
  const [profileSheet, setProfileSheet] = useState(false);
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
    if (!lc) return;

    const unsubscribe = onAuthStateChangeService(null, async (lcUser) => {
      if (lcUser) {
        setUser(lcUser);
        // LeanCloud 不支持匿名用户，所以始终为 false
        setIsAnonymous(false);

        // 获取用户名
        const currentUsername = await getCurrentUsername(null, lcUser.uid);
        setUsername(currentUsername);
      } else {
        setUser(null);
        setUsername(null);
        setIsAnonymous(false);
      }
    });

    return () => unsubscribe();
  }, [lc]);

  // 加载用户数据（正式用户从LeanCloud，匿名用户从localStorage）
  useEffect(() => {
    if (!user || !lc) {
      // 如果没有用户或LeanCloud未初始化，使用本地数据
      const localVocab = JSON.parse(localStorage.getItem('kaoyan_vocab') || '[]');
      const localErrors = JSON.parse(localStorage.getItem('kaoyan_errors') || '[]');
      const localHistory = JSON.parse(localStorage.getItem('kaoyan_history') || '{}');
      setVocab(localVocab);
      setErrors(localErrors);
      setHistory(localHistory);
      return;
    }

    // 匿名用户：只使用本地数据，不同步到LeanCloud
    if (isAnonymous) {
      const localVocab = JSON.parse(localStorage.getItem('kaoyan_vocab') || '[]');
      const localErrors = JSON.parse(localStorage.getItem('kaoyan_errors') || '[]');
      const localHistory = JSON.parse(localStorage.getItem('kaoyan_history') || '{}');
      setVocab(localVocab);
      setErrors(localErrors);
      setHistory(localHistory);
      return;
    }

    // 正式用户：从LeanCloud加载数据
    const userId = user.uid;

    // 加载笔记本数据
    const loadNotebookData = async () => {
      try {
        const notebookData = await getUserData(userId, 'notebook');
        if (notebookData) {
          const cloudVocab = notebookData.vocab || [];
          const cloudErrors = notebookData.errors || [];
          setVocab(cloudVocab);
          setErrors(cloudErrors);
          localStorage.setItem('kaoyan_vocab', JSON.stringify(cloudVocab));
          localStorage.setItem('kaoyan_errors', JSON.stringify(cloudErrors));
        } else {
          // LeanCloud没有数据，检查localStorage是否有数据需要上传
          const localVocab = JSON.parse(localStorage.getItem('kaoyan_vocab') || '[]');
          const localErrors = JSON.parse(localStorage.getItem('kaoyan_errors') || '[]');
          if (localVocab.length > 0 || localErrors.length > 0) {
            // 上传本地数据到LeanCloud
            await saveUserData(userId, 'notebook', { vocab: localVocab, errors: localErrors });
          }
        }
      } catch (err) {
        console.warn("加载笔记本数据失败:", err);
        // 失败时使用本地数据
        const localVocab = JSON.parse(localStorage.getItem('kaoyan_vocab') || '[]');
        const localErrors = JSON.parse(localStorage.getItem('kaoyan_errors') || '[]');
        setVocab(localVocab);
        setErrors(localErrors);
      }
    };

    // 加载历史数据
    const loadHistoryData = async () => {
      try {
        const historyData = await getUserData(userId, 'history');
        if (historyData) {
          const cloudHistory = historyData.records || {};
          setHistory(cloudHistory);
          localStorage.setItem('kaoyan_history', JSON.stringify(cloudHistory));
        } else {
          // LeanCloud没有历史，检查localStorage
          const localHistory = JSON.parse(localStorage.getItem('kaoyan_history') || '{}');
          if (Object.keys(localHistory).length > 0) {
            await saveUserData(userId, 'history', { records: localHistory });
          }
        }
      } catch (err) {
        console.warn("加载历史数据失败:", err);
        // 失败时使用本地数据
        const localHistory = JSON.parse(localStorage.getItem('kaoyan_history') || '{}');
        setHistory(localHistory);
      }
    };

    // 立即加载数据
    loadNotebookData();
    loadHistoryData();

    // 订阅数据变化（轮询方式）
    const unsubNotebook = subscribeUserData(userId, 'notebook', (data) => {
      if (data) {
        setVocab(data.vocab || []);
        setErrors(data.errors || []);
        localStorage.setItem('kaoyan_vocab', JSON.stringify(data.vocab || []));
        localStorage.setItem('kaoyan_errors', JSON.stringify(data.errors || []));
      }
    });

    const unsubHistory = subscribeUserData(userId, 'history', (data) => {
      if (data) {
        setHistory(data.records || {});
        localStorage.setItem('kaoyan_history', JSON.stringify(data.records || {}));
      }
    });

    return () => { 
      unsubNotebook(); 
      unsubHistory(); 
    };
  }, [user, isAnonymous, lc]);

  const saveData = (v, e) => {
    setVocab(v); setErrors(e);
    localStorage.setItem('kaoyan_vocab', JSON.stringify(v));
    localStorage.setItem('kaoyan_errors', JSON.stringify(e));
    // 只有正式用户才同步到LeanCloud
    if(user && lc && !isAnonymous) {
      saveUserData(user.uid, 'notebook', {vocab: v, errors: e}).catch(err => console.warn("Cloud save failed:", err));
    }
  };

  const saveHistory = (topicId, record) => {
    const newHistory = { ...history, [topicId]: [...(history[topicId] || []), record] };
    setHistory(newHistory);
    localStorage.setItem('kaoyan_history', JSON.stringify(newHistory));
    // 只有正式用户才同步到LeanCloud
    if(user && lc && !isAnonymous) {
      saveUserData(user.uid, 'history', { records: newHistory }).catch(err => console.warn("History save failed:", err));
    }
  };

  // 处理登录成功
  const handleLoginSuccess = async (newUser) => {
    if (!newUser || !lc) return;

    // 检查是否有本地数据需要迁移
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
        const result = await migrateAnonymousData(null, appId, newUser.uid, anonymousData);
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
    const currentUsername = await getCurrentUsername(null, newUser.uid);
    setUsername(currentUsername);
    setIsAnonymous(false);
  };

  // 处理登出
  const handleSignOut = async () => {
    try {
      await signOutUser(null);
      setUser(null);
      setUsername(null);
      setIsAnonymous(false);
      // LeanCloud 不支持匿名登录，登出后用户需要手动登录
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
        {/* 顶部导航栏 - 桌面端显示 */}
        <nav className="hidden md:flex sticky top-0 z-20 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 h-14 items-center justify-between">
          <div className="font-bold flex gap-2 items-center"><PenTool className="w-5 h-5 text-indigo-600"/> Kaoyan<span className="text-indigo-600">Master</span></div>
          <div className="flex gap-2 items-center">
            {migrating && (
              <div className="text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-1 px-2">
                <Loader className="w-3 h-3 animate-spin" />
                <span>数据迁移中...</span>
              </div>
            )}
            {user && !isAnonymous ? (
              <div className="flex items-center gap-2 px-2 text-sm">
                <User className="w-4 h-4 text-indigo-600" />
                <span className="text-slate-700 dark:text-slate-300">{username || '用户'}</span>
                <button onClick={handleSignOut} className="p-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 rounded min-h-[44px] min-w-[44px] flex items-center justify-center" title="登出">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button onClick={()=>setAuthModal(true)} className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1 min-h-[44px]" title="登录">
                <LogIn className="w-4 h-4" />
                <span>登录</span>
              </button>
            )}
            <button onClick={()=>setDark(!dark)} className="p-2 bg-slate-100 dark:bg-slate-700 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center" title="切换主题">{dark?<Sun className="w-4 h-4"/>:<Moon className="w-4 h-4"/>}</button>
            <button onClick={()=>setAiSettings(true)} className="p-2 bg-slate-100 dark:bg-slate-700 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center" title="AI设置"><Settings className="w-4 h-4"/></button>
            <button onClick={()=>setSidebar(true)} className="p-2 bg-slate-100 dark:bg-slate-700 rounded-full relative hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center" title="我的笔记本"><List className="w-4 h-4"/>{(vocab.length+errors.length)>0 && <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>}</button>
          </div>
        </nav>
        
        {/* 底部导航栏 - 乔布斯极简风格 (3个核心入口) */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-20 glass border-t border-slate-200/50 dark:border-slate-700/50">
          <div className="flex justify-around items-center h-20 px-6 pb-safe">
            <button 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex flex-col items-center justify-center gap-1.5 touch-target text-indigo-600 dark:text-indigo-400 active:scale-95 transition-transform"
            >
              <PenTool className="w-6 h-6" />
              <span className="text-[11px] font-medium">练习</span>
            </button>
            <button 
              onClick={() => setSidebar(true)}
              className="flex flex-col items-center justify-center gap-1.5 touch-target text-slate-500 dark:text-slate-400 active:scale-95 transition-transform relative"
            >
              <BookOpen className="w-6 h-6" />
              <span className="text-[11px] font-medium">笔记</span>
              {(vocab.length+errors.length)>0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-900"></span>
              )}
            </button>
            <button 
              onClick={() => setAuthModal(user ? false : true) || (user && setProfileSheet(true))}
              className="flex flex-col items-center justify-center gap-1.5 touch-target text-slate-500 dark:text-slate-400 active:scale-95 transition-transform"
            >
              <User className="w-6 h-6" />
              <span className="text-[11px] font-medium">我的</span>
            </button>
          </div>
        </nav>
        <main className="max-w-3xl mx-auto px-5 pt-6 pb-28 md:pb-8">
          {/* 移动端顶部操作栏 */}
          <div className="md:hidden flex justify-between items-center mb-6">
            <button 
              onClick={() => setHistoryDrawer(true)} 
              className="touch-target text-slate-500 active:scale-95 transition-transform"
            >
              <Clock className="w-5 h-5" />
            </button>
            <span className="text-[13px] text-slate-400 font-medium">{list[idx].year}</span>
            <button 
              onClick={() => setAiSettings(true)} 
              className="touch-target text-slate-500 active:scale-95 transition-transform"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
          
          <QuestionVisualizer data={list[idx]} />
          
          {/* 移动端滑动卡片题目切换 */}
          <div className="md:hidden mb-8">
            <SwipeableTopicCards 
              list={list} 
              currentIdx={idx} 
              onSelect={(i) => setIdx(i)}
              onGenerate={() => setGenModal(true)}
            />
          </div>
          
          {/* 桌面端按钮列表 */}
          <div className="hidden md:flex gap-2 overflow-x-auto pb-4 mb-6">
            {list.map((d,i) => (
              <button 
                key={i} 
                onClick={() => setIdx(i)} 
                className={`px-5 py-3 rounded-2xl text-[15px] whitespace-nowrap transition-all ${
                  idx === i 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/50' 
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                }`}
              >
                {d.year}
              </button>
            ))}
            <button 
              onClick={() => setGenModal(true)} 
              className="px-5 py-3 rounded-2xl text-[15px] whitespace-nowrap bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4"/> AI出题
            </button>
          </div>
          
          <EssayWorkflowManager 
            data={list[idx]} 
            onSaveVocab={(v) => {if(!vocab.some(x => x.word === v.word)) saveData([v,...vocab], errors)}} 
            onSaveError={(e) => {saveData(vocab, [e,...errors])}} 
            onSaveHistory={saveHistory} 
          />
        </main>
        {/* 侧边栏遮罩层 - 支持从右边缘滑动打开 */}
        <EdgeSwipeDetector 
          onSwipeRight={() => setSidebar(true)}
          enabled={!sidebar}
        />
        {sidebar && <div className="fixed inset-0 bg-black/40 z-20 animate-fadeIn" onClick={()=>setSidebar(false)} />}
        <VocabSidebar isOpen={sidebar} toggle={()=>setSidebar(false)} currentTopic={list[idx].title} savedVocab={vocab} savedErrors={errors} onRemoveVocab={(i)=>saveData(vocab.filter((_,x)=>x!==i), errors)} onRemoveError={(i)=>saveData(vocab, errors.filter((_,x)=>x!==i))} onImportData={handleImportData} onExportData={handleExportData} onAddGeneratedVocab={(v)=>{if(!vocab.some(x=>x.word===v.word)) saveData([v,...vocab], errors)}} user={user} />
        <TopicGeneratorModal isOpen={genModal} onClose={()=>setGenModal(false)} onGenerate={(t)=>{setList([...list,t]);setIdx(list.length);}} />
        <HistoryDrawer isOpen={historyDrawer} onClose={()=>setHistoryDrawer(false)} history={history[list[idx].id]} topicTitle={list[idx].title} />
        <AISettings isOpen={aiSettings} onClose={()=>setAiSettings(false)} />
        <AuthModal 
          isOpen={authModal} 
          onClose={()=>setAuthModal(false)} 
          auth={lc ? {} : null}
          db={lc ? {} : null}
          onLoginSuccess={handleLoginSuccess}
        />
        
        {/* 我的 - 底部弹出面板 (乔布斯风格) */}
        {profileSheet && (
          <>
            <div className="md:hidden fixed inset-0 bg-black/40 z-40 animate-fadeIn" onClick={() => setProfileSheet(false)} />
            <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 rounded-t-3xl animate-slideUp">
              <div className="w-12 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mt-3 mb-2" />
              <div className="px-6 py-4">
                {/* 用户信息 */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                    <User className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[17px] text-slate-800 dark:text-slate-100">
                      {username || '未登录'}
                    </h3>
                    <p className="text-[13px] text-slate-400">
                      {user ? '云端同步已开启' : '点击登录开启云同步'}
                    </p>
                  </div>
                </div>
                
                {/* 功能列表 */}
                <div className="space-y-1">
                  <button 
                    onClick={() => { setProfileSheet(false); setHistoryDrawer(true); }}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-[0.98] transition-all"
                  >
                    <Clock className="w-5 h-5 text-slate-500" />
                    <span className="text-[17px] text-slate-700 dark:text-slate-200">练习历史</span>
                    <ChevronRight className="w-5 h-5 text-slate-300 ml-auto" />
                  </button>
                  
                  <button 
                    onClick={() => { setProfileSheet(false); setAiSettings(true); }}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-[0.98] transition-all"
                  >
                    <Settings className="w-5 h-5 text-slate-500" />
                    <span className="text-[17px] text-slate-700 dark:text-slate-200">AI 设置</span>
                    <ChevronRight className="w-5 h-5 text-slate-300 ml-auto" />
                  </button>
                  
                  <button 
                    onClick={() => setDark(!dark)}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-[0.98] transition-all"
                  >
                    {dark ? <Sun className="w-5 h-5 text-slate-500" /> : <Moon className="w-5 h-5 text-slate-500" />}
                    <span className="text-[17px] text-slate-700 dark:text-slate-200">深色模式</span>
                    <div className={`ml-auto w-12 h-7 rounded-full transition-colors ${dark ? 'bg-indigo-600' : 'bg-slate-200'} relative`}>
                      <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${dark ? 'translate-x-6' : 'translate-x-1'}`} />
                    </div>
                  </button>
                </div>
                
                {/* 登录/登出按钮 */}
                <div className="mt-6 pb-safe">
                  {user ? (
                    <button 
                      onClick={() => { handleSignOut(); setProfileSheet(false); }}
                      className="w-full py-4 text-red-500 rounded-2xl font-medium text-[17px] active:bg-red-50 dark:active:bg-red-900/20 transition-colors"
                    >
                      退出登录
                    </button>
                  ) : (
                    <button 
                      onClick={() => { setProfileSheet(false); setAuthModal(true); }}
                      className="btn-primary"
                    >
                      登录 / 注册
                    </button>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default App;

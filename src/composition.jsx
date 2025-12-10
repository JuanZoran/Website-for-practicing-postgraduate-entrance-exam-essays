import { useState, useEffect } from 'react';
import { 
  BookOpen, PenTool, List, Sparkles, Loader, 
  Moon, Sun, Clock, User, Settings, LogOut, LogIn, ChevronRight,
  Brain, BarChart2, Map
} from 'lucide-react';
import { 
  signOutUser, 
  getCurrentUsername, 
  migrateAnonymousData,
  onAuthStateChange as onAuthStateChangeService
} from "./services/authService";
import { 
  initLeanCloud, 
  saveUserData,
  getUserData,
  subscribeUserData
} from "./services/leancloudService";

// 导入拆分后的组件
import { EdgeSwipeDetector, SwipeableTopicCards } from "./components/common";
import AISettings from "./components/AISettings";
import AuthModal from "./components/AuthModal";
import HistoryDrawer from "./components/HistoryDrawer";
import VocabSidebar from "./components/VocabSidebar";
import QuestionVisualizer from "./components/QuestionVisualizer";
import TopicGeneratorModal from "./components/TopicGeneratorModal";
import EssayWorkflowManager from "./components/EssayWorkflowManager";
import PersonalizedLearning from "./components/PersonalizedLearning";
import AdvancedAnalytics from "./components/AdvancedAnalytics";
import LearningPathPlanner from "./components/LearningPathPlanner";

// 导入数据
import { INITIAL_EXAM_DATA } from "./data/examData";

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
  const [showLearning, setShowLearning] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showPathPlanner, setShowPathPlanner] = useState(false);

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
        setIsAnonymous(false);
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

  // 加载用户数据
  useEffect(() => {
    if (!user || !lc) {
      const localVocab = JSON.parse(localStorage.getItem('kaoyan_vocab') || '[]');
      const localErrors = JSON.parse(localStorage.getItem('kaoyan_errors') || '[]');
      const localHistory = JSON.parse(localStorage.getItem('kaoyan_history') || '{}');
      setVocab(localVocab);
      setErrors(localErrors);
      setHistory(localHistory);
      return;
    }

    if (isAnonymous) {
      const localVocab = JSON.parse(localStorage.getItem('kaoyan_vocab') || '[]');
      const localErrors = JSON.parse(localStorage.getItem('kaoyan_errors') || '[]');
      const localHistory = JSON.parse(localStorage.getItem('kaoyan_history') || '{}');
      setVocab(localVocab);
      setErrors(localErrors);
      setHistory(localHistory);
      return;
    }

    const userId = user.uid;

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
          const localVocab = JSON.parse(localStorage.getItem('kaoyan_vocab') || '[]');
          const localErrors = JSON.parse(localStorage.getItem('kaoyan_errors') || '[]');
          if (localVocab.length > 0 || localErrors.length > 0) {
            await saveUserData(userId, 'notebook', { vocab: localVocab, errors: localErrors });
          }
        }
      } catch (err) {
        console.warn("加载笔记本数据失败:", err);
        const localVocab = JSON.parse(localStorage.getItem('kaoyan_vocab') || '[]');
        const localErrors = JSON.parse(localStorage.getItem('kaoyan_errors') || '[]');
        setVocab(localVocab);
        setErrors(localErrors);
      }
    };

    const loadHistoryData = async () => {
      try {
        const historyData = await getUserData(userId, 'history');
        if (historyData) {
          const cloudHistory = historyData.records || {};
          setHistory(cloudHistory);
          localStorage.setItem('kaoyan_history', JSON.stringify(cloudHistory));
        } else {
          const localHistory = JSON.parse(localStorage.getItem('kaoyan_history') || '{}');
          if (Object.keys(localHistory).length > 0) {
            await saveUserData(userId, 'history', { records: localHistory });
          }
        }
      } catch (err) {
        console.warn("加载历史数据失败:", err);
        const localHistory = JSON.parse(localStorage.getItem('kaoyan_history') || '{}');
        setHistory(localHistory);
      }
    };

    loadNotebookData();
    loadHistoryData();

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
    setVocab(v); 
    setErrors(e);
    localStorage.setItem('kaoyan_vocab', JSON.stringify(v));
    localStorage.setItem('kaoyan_errors', JSON.stringify(e));
    if(user && lc && !isAnonymous) {
      saveUserData(user.uid, 'notebook', {vocab: v, errors: e}).catch(err => console.warn("Cloud save failed:", err));
    }
  };

  const saveHistory = (topicId, record) => {
    const newHistory = { ...history, [topicId]: [...(history[topicId] || []), record] };
    setHistory(newHistory);
    localStorage.setItem('kaoyan_history', JSON.stringify(newHistory));
    if(user && lc && !isAnonymous) {
      saveUserData(user.uid, 'history', { records: newHistory }).catch(err => console.warn("History save failed:", err));
    }
  };

  const handleLoginSuccess = async (newUser) => {
    if (!newUser || !lc) return;

    const localVocab = JSON.parse(localStorage.getItem('kaoyan_vocab') || '[]');
    const localErrors = JSON.parse(localStorage.getItem('kaoyan_errors') || '[]');
    const localHistory = JSON.parse(localStorage.getItem('kaoyan_history') || '{}');

    const hasLocalData = localVocab.length > 0 || localErrors.length > 0 || Object.keys(localHistory).length > 0;

    if (hasLocalData && isAnonymous) {
      setMigrating(true);
      try {
        const anonymousData = { vocab: localVocab, errors: localErrors, history: localHistory };
        const result = await migrateAnonymousData(null, appId, newUser.uid, anonymousData);
        if (result.success) {
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

    const currentUsername = await getCurrentUsername(null, newUser.uid);
    setUsername(currentUsername);
    setIsAnonymous(false);
  };

  const handleSignOut = async () => {
    try {
      await signOutUser(null);
      setUser(null);
      setUsername(null);
      setIsAnonymous(false);
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
            <button onClick={()=>setShowPathPlanner(true)} className="p-2 bg-slate-100 dark:bg-slate-700 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center" title="学习路径"><Map className="w-4 h-4"/></button>
            <button onClick={()=>setShowLearning(true)} className="p-2 bg-slate-100 dark:bg-slate-700 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center" title="学习分析"><Brain className="w-4 h-4"/></button>
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
        
        <VocabSidebar 
          isOpen={sidebar} 
          toggle={()=>setSidebar(false)} 
          currentTopic={list[idx].title} 
          savedVocab={vocab} 
          savedErrors={errors} 
          onRemoveVocab={(i)=>saveData(vocab.filter((_,x)=>x!==i), errors)} 
          onRemoveError={(i)=>saveData(vocab, errors.filter((_,x)=>x!==i))} 
          onImportData={handleImportData} 
          onExportData={handleExportData} 
          onAddGeneratedVocab={(v)=>{if(!vocab.some(x=>x.word===v.word)) saveData([v,...vocab], errors)}} 
          user={user} 
        />
        
        <TopicGeneratorModal 
          isOpen={genModal} 
          onClose={()=>setGenModal(false)} 
          onGenerate={(t)=>{setList([...list,t]);setIdx(list.length);}} 
        />
        
        <HistoryDrawer 
          isOpen={historyDrawer} 
          onClose={()=>setHistoryDrawer(false)} 
          history={history[list[idx].id]} 
          topicTitle={list[idx].title} 
        />
        
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
                    onClick={() => { setProfileSheet(false); setShowPathPlanner(true); }}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-[0.98] transition-all"
                  >
                    <Map className="w-5 h-5 text-slate-500" />
                    <span className="text-[17px] text-slate-700 dark:text-slate-200">学习路径</span>
                    <ChevronRight className="w-5 h-5 text-slate-300 ml-auto" />
                  </button>
                  
                  <button 
                    onClick={() => { setProfileSheet(false); setShowLearning(true); }}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-[0.98] transition-all"
                  >
                    <Brain className="w-5 h-5 text-slate-500" />
                    <span className="text-[17px] text-slate-700 dark:text-slate-200">学习分析</span>
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
        
        {/* 个性化学习弹窗 */}
        <PersonalizedLearning 
          isOpen={showLearning} 
          onClose={() => setShowLearning(false)} 
        />
        
        {/* 高级分析弹窗 */}
        <AdvancedAnalytics 
          isOpen={showAnalytics} 
          onClose={() => setShowAnalytics(false)}
          essay={null}
          history={history[list[idx]?.id] || []}
        />
        
        {/* 学习路径规划弹窗 */}
        <LearningPathPlanner 
          isOpen={showPathPlanner} 
          onClose={() => setShowPathPlanner(false)}
          examData={list}
          onSelectTopic={(topic) => {
            const topicIdx = list.findIndex(t => t.id === topic.id);
            if (topicIdx !== -1) setIdx(topicIdx);
          }}
        />
      </div>
    </div>
  );
};

export default App;

import { useEffect, useState, lazy, Suspense } from 'react';
import { 
  BookOpen, PenTool, List, Sparkles, Loader, 
  Moon, Sun, Clock, User, Settings, LogOut, LogIn, ChevronRight,
  Brain, Map, ChevronDown, Check,
  PanelLeftClose, PanelLeftOpen, Download
} from 'lucide-react';
import { useAuth, useAppData } from "./context";
import { EdgeSwipeDetector, SwipeableTopicCards } from "./components/common";
import QuestionVisualizer from "./components/QuestionVisualizer";
import EssayWorkflowManager from "./components/EssayWorkflowManager";
import LetterWorkflowManager from "./components/LetterWorkflowManager";
import WritingModeSwitch from "./components/WritingModeSwitch";
import { INITIAL_EXAM_DATA } from "./data/examData";
import { INITIAL_LETTER_DATA } from "./data/letterData";

const AISettings = lazy(() => import('./components/AISettings'));
const AuthModal = lazy(() => import('./components/AuthModal'));
const HistoryDrawer = lazy(() => import('./components/HistoryDrawer'));
const TopicGeneratorModal = lazy(() => import('./components/TopicGeneratorModal'));
const VocabSidebar = lazy(() => import('./components/VocabSidebar'));
const PersonalizedLearning = lazy(() => import('./components/PersonalizedLearning'));
const AdvancedAnalytics = lazy(() => import('./components/AdvancedAnalytics'));
const LearningPathPlanner = lazy(() => import('./components/LearningPathPlanner'));

const App = () => {
  const { 
    user, username, migrating, authModal, isLeanCloudEnabled,
    handleLoginSuccess, handleSignOut, openAuthModal, closeAuthModal 
  } = useAuth();
  
  const { 
    vocab, errors, history, dark,
    addVocab, addError, removeVocab, removeError,
    toggleDark, handleExportData, handleImportData, saveHistory 
  } = useAppData();

  const [list, setList] = useState(INITIAL_EXAM_DATA);
  const [idx, setIdx] = useState(0);
  const [letterList] = useState(INITIAL_LETTER_DATA);
  const [letterIdx, setLetterIdx] = useState(0);
  const [writingMode, setWritingMode] = useState('essay');
  const [sidebar, setSidebar] = useState(false);
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [topicSheet, setTopicSheet] = useState(false);
  const [genModal, setGenModal] = useState(false);
  const [historyDrawer, setHistoryDrawer] = useState(false);
  const [aiSettings, setAiSettings] = useState(false);
  const [profileSheet, setProfileSheet] = useState(false);
  const [showLearning, setShowLearning] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showPathPlanner, setShowPathPlanner] = useState(false);
  const [sidebarMounted, setSidebarMounted] = useState(false);

  const currentList = writingMode === 'essay' ? list : letterList;
  const currentIdx = writingMode === 'essay' ? idx : letterIdx;
  const setCurrentIdx = writingMode === 'essay' ? setIdx : setLetterIdx;
  const currentData = currentList[currentIdx];

  const onLoginSuccess = async (newUser) => {
    const localVocab = JSON.parse(localStorage.getItem('kaoyan_vocab') || '[]');
    const localErrors = JSON.parse(localStorage.getItem('kaoyan_errors') || '[]');
    const localHistory = JSON.parse(localStorage.getItem('kaoyan_history') || '{}');
    await handleLoginSuccess(newUser, { vocab: localVocab, errors: localErrors, history: localHistory });
  };

  useEffect(() => {
    if (sidebar) {
      setSidebarMounted(true);
      return;
    }
    if (!sidebarMounted) return;
    const timeoutId = window.setTimeout(() => setSidebarMounted(false), 320);
    return () => window.clearTimeout(timeoutId);
  }, [sidebar, sidebarMounted]);

  return (
    <div className={dark ? 'dark' : ''}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors">
        <nav className="hidden md:flex sticky top-0 z-20 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 h-14 items-center justify-between">
          <div className="font-bold flex gap-2 items-center">
            <PenTool className="w-5 h-5 text-indigo-600"/>
            Kaoyan<span className="text-indigo-600">Master</span>
          </div>
          <div className="flex gap-2 items-center">
            {migrating && (
              <div className="text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-1 px-2">
                <Loader className="w-3 h-3 animate-spin" />
                <span>数据迁移中...</span>
              </div>
            )}
            {user ? (
              <div className="flex items-center gap-2 px-2 text-sm">
                <User className="w-4 h-4 text-indigo-600" />
                <span className="text-slate-700 dark:text-slate-300">{username || '用户'}</span>
                <button onClick={handleSignOut} className="p-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 rounded min-h-[44px] min-w-[44px] flex items-center justify-center" title="登出">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button onClick={openAuthModal} className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1 min-h-[44px]" title="登录">
                <LogIn className="w-4 h-4" />
                <span>登录</span>
              </button>
            )}
            <button onClick={toggleDark} className="p-2 bg-slate-100 dark:bg-slate-700 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center" title="切换主题">
              {dark ? <Sun className="w-4 h-4"/> : <Moon className="w-4 h-4"/>}
            </button>
            <button onClick={() => setShowPathPlanner(true)} className="p-2 bg-slate-100 dark:bg-slate-700 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center" title="学习路径">
              <Map className="w-4 h-4"/>
            </button>
            <button onClick={() => setShowLearning(true)} className="p-2 bg-slate-100 dark:bg-slate-700 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center" title="学习分析">
              <Brain className="w-4 h-4"/>
            </button>
            <button onClick={() => setAiSettings(true)} className="hidden md:flex p-2 bg-slate-100 dark:bg-slate-700 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors min-h-[44px] min-w-[44px] items-center justify-center" title="AI设置">
              <Settings className="w-4 h-4"/>
            </button>
            <button onClick={handleExportData} className="md:hidden p-2 bg-slate-100 dark:bg-slate-700 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center" title="导出数据">
              <Download className="w-4 h-4"/>
            </button>
            <button onClick={() => setSidebar(true)} className="p-2 bg-slate-100 dark:bg-slate-700 rounded-full relative hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center" title="我的笔记本">
              <List className="w-4 h-4"/>
              {(vocab.length + errors.length) > 0 && <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>}
            </button>
          </div>
        </nav>
        
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-20 glass border-t border-slate-200/50 dark:border-slate-700/50">
          <div className="flex justify-around items-center h-20 px-6 pb-safe">
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex flex-col items-center justify-center gap-1.5 touch-target text-indigo-600 dark:text-indigo-400 active:scale-95 transition-transform">
              <PenTool className="w-6 h-6" />
              <span className="text-[11px] font-medium">练习</span>
            </button>
            <button onClick={() => setSidebar(true)} className="flex flex-col items-center justify-center gap-1.5 touch-target text-slate-500 dark:text-slate-400 active:scale-95 transition-transform relative">
              <BookOpen className="w-6 h-6" />
              <span className="text-[11px] font-medium">笔记</span>
              {(vocab.length + errors.length) > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-900"></span>
              )}
            </button>
            <button onClick={() => user ? setProfileSheet(true) : openAuthModal()} className="flex flex-col items-center justify-center gap-1.5 touch-target text-slate-500 dark:text-slate-400 active:scale-95 transition-transform">
              <User className="w-6 h-6" />
              <span className="text-[11px] font-medium">我的</span>
            </button>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-28 md:pb-8">
          <div className="md:hidden flex justify-between items-center mb-6 sticky top-0 z-10 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-md py-2 -mx-4 px-4 border-b border-slate-200/50 dark:border-slate-800/50">
            <button onClick={() => setHistoryDrawer(true)} className="touch-target text-slate-500 active:scale-95 transition-transform">
              <Clock className="w-5 h-5" />
            </button>
            <button onClick={() => setTopicSheet(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 active:scale-95 transition-transform">
              <span className="text-[13px] text-slate-700 dark:text-slate-200 font-semibold">{currentData?.year}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
            <button onClick={() => setAiSettings(true)} className="touch-target text-slate-500 active:scale-95 transition-transform">
              <Settings className="w-5 h-5" />
            </button>
          </div>

          <div className="md:flex md:gap-8 transition-all duration-300">
            <aside className={`hidden md:block shrink-0 transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] ${leftSidebarOpen ? 'w-64 opacity-100' : 'w-0 opacity-0 overflow-hidden'}`}>
              <div className="sticky top-20 max-h-[calc(100vh-7rem)] flex flex-col">
                <div className="mb-4 flex items-center gap-2 pr-2 shrink-0">
                  <div className="flex-1">
                    <WritingModeSwitch mode={writingMode} onModeChange={setWritingMode} />
                  </div>
                  <button onClick={() => setLeftSidebarOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors" title="收起侧边栏">
                    <PanelLeftClose className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-0 pb-4">
                  <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 px-2">
                    {writingMode === 'essay' ? '真题年份' : '信函主题'}
                  </h3>
                  
                  <div className="space-y-1">
                    {currentList.map((d, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentIdx(i)}
                        className={`w-full text-left px-4 py-3 rounded-xl text-[14px] transition-all ${
                          currentIdx === i
                            ? writingMode === 'essay'
                              ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium shadow-sm ring-1 ring-indigo-200 dark:ring-indigo-700/50'
                              : 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 font-medium shadow-sm ring-1 ring-teal-200 dark:ring-teal-700/50'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span>{d.year}</span>
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5 truncate opacity-80">
                          {d.title?.split(' ')[0] || 'Topic'}
                        </div>
                      </button>
                    ))}
                    
                    {writingMode === 'essay' && (
                      <button
                        onClick={() => setGenModal(true)}
                        className="w-full mt-4 px-4 py-3 rounded-xl border border-dashed border-amber-300 dark:border-amber-700 text-amber-600 dark:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>AI 生成题目</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </aside>

            <div className="flex-1 min-w-0 transition-all duration-300">
              {!leftSidebarOpen && (
                <div className="hidden md:block mb-6 animate-fadeIn">
                  <button onClick={() => setLeftSidebarOpen(true)} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow transition-all group">
                    <PanelLeftOpen className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                    <span>展开列表</span>
                  </button>
                </div>
              )}

              <div className="md:hidden">
                <WritingModeSwitch mode={writingMode} onModeChange={setWritingMode} />
              </div>

              <div className="md:hidden mb-8 mt-4">
                <SwipeableTopicCards 
                  list={currentList} 
                  currentIdx={currentIdx} 
                  onSelect={(i) => setCurrentIdx(i)}
                  onGenerate={writingMode === 'essay' ? () => setGenModal(true) : null}
                />
              </div>

              {writingMode === 'essay' ? (
                <div className="xl:grid xl:grid-cols-12 xl:gap-8 items-start">
                  <div className="xl:col-span-5 xl:sticky xl:top-20">
                    <QuestionVisualizer data={currentData} />
                  </div>
                  <div className="xl:col-span-7 mt-6 xl:mt-0">
                    <EssayWorkflowManager 
                      data={currentData} 
                      onSaveVocab={addVocab} 
                      onSaveError={addError} 
                      onSaveHistory={saveHistory} 
                    />
                  </div>
                </div>
              ) : (
                <div className="max-w-3xl mx-auto xl:max-w-none">
                  <LetterWorkflowManager 
                    data={currentData} 
                    onSaveVocab={addVocab} 
                    onSaveError={addError} 
                    onSaveHistory={saveHistory} 
                  />
                </div>
              )}
            </div>
          </div>
        </main>

        <EdgeSwipeDetector onSwipeRight={() => setSidebar(true)} enabled={!sidebar && !sidebarMounted} />
        {sidebar && <div className="fixed inset-0 bg-black/40 z-20 animate-fadeIn" onClick={() => setSidebar(false)} />}
        
        {(sidebar || sidebarMounted) && (
          <Suspense fallback={null}>
            <VocabSidebar
              isOpen={sidebar}
              toggle={() => setSidebar(false)}
              currentTopic={currentData?.title}
              savedVocab={vocab}
              savedErrors={errors}
              onRemoveVocab={removeVocab}
              onRemoveError={removeError}
              onImportData={handleImportData}
              onExportData={handleExportData}
              onAddGeneratedVocab={addVocab}
              user={user}
            />
          </Suspense>
        )}
        
        {topicSheet && (
          <>
            <div className="md:hidden fixed inset-0 bg-black/40 z-40 animate-fadeIn" onClick={() => setTopicSheet(false)} />
            <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 rounded-t-3xl animate-slideUp max-h-[70vh] flex flex-col">
              <div className="w-12 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mt-3 mb-2 flex-shrink-0" />
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center flex-shrink-0">
                <h3 className="font-semibold text-slate-800 dark:text-slate-100">选择题目</h3>
                <WritingModeSwitch mode={writingMode} onModeChange={(m) => { setWritingMode(m); setTopicSheet(false); }} />
              </div>
              <div className="overflow-y-auto p-4 space-y-2">
                {currentList.map((d, i) => (
                  <button
                    key={i}
                    onClick={() => { setCurrentIdx(i); setTopicSheet(false); }}
                    className={`w-full text-left p-4 rounded-2xl transition-all ${
                      currentIdx === i
                        ? 'bg-indigo-50 dark:bg-indigo-900/30 ring-1 ring-indigo-500/30'
                        : 'bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className={`font-semibold ${currentIdx === i ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-300'}`}>
                        {d.year}
                      </span>
                      {currentIdx === i && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
                    </div>
                    <div className="text-xs text-slate-400 truncate opacity-80">
                      {d.title}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
        
        {genModal && (
          <Suspense fallback={null}>
            <TopicGeneratorModal
              isOpen={genModal}
              onClose={() => setGenModal(false)}
              onGenerate={(t) => { setList([...list, t]); setIdx(list.length); }}
            />
          </Suspense>
        )}
        
        {historyDrawer && (
          <Suspense fallback={null}>
            <HistoryDrawer
              isOpen={historyDrawer}
              onClose={() => setHistoryDrawer(false)}
              history={history[currentData?.id]}
              topicTitle={currentData?.title}
            />
          </Suspense>
        )}
        
        {aiSettings && (
          <Suspense fallback={null}>
            <AISettings isOpen={aiSettings} onClose={() => setAiSettings(false)} />
          </Suspense>
        )}
        
        {authModal && (
          <Suspense fallback={null}>
            <AuthModal
              isOpen={authModal}
              onClose={closeAuthModal}
              auth={isLeanCloudEnabled ? {} : null}
              db={isLeanCloudEnabled ? {} : null}
              onLoginSuccess={onLoginSuccess}
            />
          </Suspense>
        )}
        
        {profileSheet && (
          <>
            <div className="md:hidden fixed inset-0 bg-black/40 z-40 animate-fadeIn" onClick={() => setProfileSheet(false)} />
            <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 rounded-t-3xl animate-slideUp">
              <div className="w-12 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mt-3 mb-2" />
              <div className="px-6 py-4">
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
                
                <div className="space-y-1">
                  <button onClick={() => { setProfileSheet(false); setHistoryDrawer(true); }} className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-[0.98] transition-all">
                    <Clock className="w-5 h-5 text-slate-500" />
                    <span className="text-[17px] text-slate-700 dark:text-slate-200">练习历史</span>
                    <ChevronRight className="w-5 h-5 text-slate-300 ml-auto" />
                  </button>
                  
                  <button onClick={() => { setProfileSheet(false); setShowPathPlanner(true); }} className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-[0.98] transition-all">
                    <Map className="w-5 h-5 text-slate-500" />
                    <span className="text-[17px] text-slate-700 dark:text-slate-200">学习路径</span>
                    <ChevronRight className="w-5 h-5 text-slate-300 ml-auto" />
                  </button>
                  
                  <button onClick={() => { setProfileSheet(false); setShowLearning(true); }} className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-[0.98] transition-all">
                    <Brain className="w-5 h-5 text-slate-500" />
                    <span className="text-[17px] text-slate-700 dark:text-slate-200">学习分析</span>
                    <ChevronRight className="w-5 h-5 text-slate-300 ml-auto" />
                  </button>
                  
                  <button onClick={() => { setProfileSheet(false); setAiSettings(true); }} className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-[0.98] transition-all">
                    <Settings className="w-5 h-5 text-slate-500" />
                    <span className="text-[17px] text-slate-700 dark:text-slate-200">AI 设置</span>
                    <ChevronRight className="w-5 h-5 text-slate-300 ml-auto" />
                  </button>
                  
                  <button onClick={toggleDark} className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-[0.98] transition-all">
                    {dark ? <Sun className="w-5 h-5 text-slate-500" /> : <Moon className="w-5 h-5 text-slate-500" />}
                    <span className="text-[17px] text-slate-700 dark:text-slate-200">深色模式</span>
                    <div className={`ml-auto w-12 h-7 rounded-full transition-colors ${dark ? 'bg-indigo-600' : 'bg-slate-200'} relative`}>
                      <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${dark ? 'translate-x-6' : 'translate-x-1'}`} />
                    </div>
                  </button>
                </div>
                
                <div className="mt-6 pb-safe">
                  {user ? (
                    <button onClick={() => { handleSignOut(); setProfileSheet(false); }} className="w-full py-4 text-red-500 rounded-2xl font-medium text-[17px] active:bg-red-50 dark:active:bg-red-900/20 transition-colors">
                      退出登录
                    </button>
                  ) : (
                    <button onClick={() => { setProfileSheet(false); openAuthModal(); }} className="btn-primary">
                      登录 / 注册
                    </button>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
        
        {showLearning && (
          <Suspense fallback={null}>
            <PersonalizedLearning isOpen={showLearning} onClose={() => setShowLearning(false)} />
          </Suspense>
        )}
        
        {showAnalytics && (
          <Suspense fallback={null}>
            <AdvancedAnalytics
              isOpen={showAnalytics}
              onClose={() => setShowAnalytics(false)}
              essay={null}
              history={history[currentData?.id] || []}
            />
          </Suspense>
        )}
        
        {showPathPlanner && (
          <Suspense fallback={null}>
            <LearningPathPlanner
              isOpen={showPathPlanner}
              onClose={() => setShowPathPlanner(false)}
              examData={currentList}
              onSelectTopic={(topic) => {
                const topicIdx = currentList.findIndex(t => t.id === topic.id);
                if (topicIdx !== -1) setCurrentIdx(topicIdx);
              }}
            />
          </Suspense>
        )}
      </div>
    </div>
  );
};

export default App;

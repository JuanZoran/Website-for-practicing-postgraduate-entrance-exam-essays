import { useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp, Copy, GitBranch, MessageCircle, X, XCircle } from 'lucide-react';
import { ChatList } from './StreamingText';
import { InlineError } from './ErrorDisplay';
import { useAIChat } from '../hooks/useAIChat';
import { getBuiltInEssayModel, getBuiltInLetterModel } from '../services/modelTextService';

const ModelEssayModal = ({ isOpen, onClose, data, mode = 'essay' }) => {
  const contentRef = useRef(null);
  const [selectedText, setSelectedText] = useState('');
  const [askInput, setAskInput] = useState('');
  const [askOpen, setAskOpen] = useState(false);
  const [structureOpen, setStructureOpen] = useState(true);
  const [highlight, setHighlight] = useState(null);
  const [mobileTab, setMobileTab] = useState('content');

  const modelView = useMemo(() => {
    if (!data) return mode === 'letter' ? getBuiltInLetterModel(null) : getBuiltInEssayModel(null);
    return mode === 'letter' ? getBuiltInLetterModel(data) : getBuiltInEssayModel(data);
  }, [mode, data]);

  const accent = mode === 'letter' ? 'teal' : 'indigo';

  const styles = useMemo(() => {
    if (accent === 'teal') {
      return {
        varInline:
          'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-200 ring-1 ring-teal-200/60 dark:ring-teal-700/50 rounded px-1',
        varPill:
          'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-200 ring-1 ring-teal-200/70 dark:ring-teal-700/60 rounded px-1',
        fixedMuted: 'text-slate-500 dark:text-slate-400',
        accentText: 'text-teal-700 dark:text-teal-200',
        accentDot: 'bg-teal-500',
        accentIcon: 'text-teal-600 dark:text-teal-400',
        accentButton: 'bg-teal-600 hover:bg-teal-700 text-white'
      };
    }
    return {
      varInline:
        'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-200 ring-1 ring-indigo-200/60 dark:ring-indigo-700/50 rounded px-1',
      varPill:
        'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-200 ring-1 ring-indigo-200/70 dark:ring-indigo-700/60 rounded px-1',
      fixedMuted: 'text-slate-500 dark:text-slate-400',
      accentText: 'text-indigo-700 dark:text-indigo-200',
      accentDot: 'bg-indigo-500',
      accentIcon: 'text-indigo-600 dark:text-indigo-400',
      accentButton: 'bg-indigo-600 hover:bg-indigo-700 text-white'
    };
  }, [accent]);

  const renderSegments = (segments, { skeleton = false } = {}) => {
    if (!segments || segments.length === 0) return null;
    return segments.map((seg, idx) => {
      const text = skeleton && seg.kind === 'var' ? `[${seg.label || '变量'}]` : seg.text;
      const cls =
        seg.kind === 'var'
          ? `font-medium ${skeleton ? styles.varPill : styles.varInline}`
          : skeleton
            ? styles.fixedMuted
            : 'text-slate-700 dark:text-slate-200';
      return (
        <span key={idx} className={cls}>
          {text}
        </span>
      );
    });
  };

  const buildStructureNodes = () => {
    if (!data) return [];

    if (mode === 'letter') {
      const skeletonSegments = (modelView.segments || []).map((s) =>
        s.kind === 'var' ? { ...s, text: `[${s.label || '变量'}]` } : s
      );
      return [
        {
          id: 'decisions',
          title: '决策路径',
          subtitle: 'Register → Type → Fill',
          meta: [
            { label: 'Register', value: String(data.register || '').toUpperCase() || 'FORMAL' },
            { label: 'Type', value: String(data.type || 'letter') }
          ]
        },
        {
          id: 'template',
          title: '模板骨架',
          subtitle: 'Fixed + placeholders',
          skeletonSegments
        },
        {
          id: 'fill',
          title: '变量填充',
          subtitle: 'Topic-specific',
          variables: modelView.variables || []
        }
      ];
    }

    const nodes = [
      {
        id: 'mode',
        title: '决策路径',
        subtitle: 'Mode → 3 paragraphs',
        meta: [
          { label: 'Mode', value: modelView.mode || String(data.mode || 'Mode A') },
          { label: 'Type', value: modelView.modeDesc || '' }
        ]
      }
    ];

    for (const block of modelView.blocks || []) {
      const vars = (block.segments || []).filter((s) => s.kind === 'var').map((s) => ({
        id: s.key || s.label || s.text,
        label: s.label,
        value: s.text
      }));
      nodes.push({
        id: block.id,
        title: block.title,
        subtitle: block.subtitle,
        skeletonSegments: block.segments,
        variables: vars
      });
    }

    return nodes;
  };

  const structureNodes = useMemo(buildStructureNodes, [mode, data, modelView]);

  const askContextId = useMemo(() => `model_selection_${mode}_${data?.id || 'unknown'}`, [mode, data]);
  const {
    messages,
    isStreaming,
    streamingContent,
    error,
    sendMessage,
    cancelStream,
    clearHistory
  } = useAIChat(askContextId, { enableHistory: true });

  const triggerBlockHighlight = (blockId) => {
    if (!blockId) return;
    setHighlight({ type: 'block', blockId, ts: Date.now() });
  };

  const triggerVarHighlight = (key, blockId = null) => {
    if (!key) return;
    setHighlight({ type: 'var', key, blockId, ts: Date.now() });
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(modelView.text || '');
    } catch {
      // ignore
    }
  };

  const updateSelection = () => {
    if (!isOpen) return;
    const selection = window.getSelection?.();
    if (!selection || selection.isCollapsed) {
      setSelectedText('');
      return;
    }

    const anchorNode = selection.anchorNode;
    const focusNode = selection.focusNode;
    const container = contentRef.current;
    if (!container || !anchorNode || !focusNode) {
      setSelectedText('');
      return;
    }

    if (!container.contains(anchorNode) || !container.contains(focusNode)) {
      setSelectedText('');
      return;
    }

    const text = selection.toString().trim();
    setSelectedText(text.slice(0, 800));
  };

  useEffect(() => {
    if (!isOpen) return;
    setSelectedText('');
    setAskInput('');
    setAskOpen(false);
    setStructureOpen(true);
    setHighlight(null);
    setMobileTab('content');
  }, [isOpen, data?.id]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!highlight || !contentRef.current) return;

    const container = contentRef.current;
    const isEssay = mode === 'essay';
    const selector =
      highlight.type === 'block'
        ? isEssay
          ? `[data-block-id="${highlight.blockId}"]`
          : null
        : highlight.type === 'var'
          ? highlight.blockId && isEssay
            ? `[data-block-id="${highlight.blockId}"] [data-var-key="${highlight.key}"]`
            : `[data-var-key="${highlight.key}"]`
          : null;

    if (!selector) return;

    const el = container.querySelector(selector);
    if (!el) return;

    try {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch {
      // ignore
    }
  }, [highlight?.ts, mode]);

  const handleAsk = async () => {
    const question = askInput.trim();
    const quote = selectedText.trim();
    if (!question || !quote || isStreaming) return;

    const prompt = `你是一位考研英语写作老师。请基于【范文】与【选中片段】回答用户问题。

要求：
1) 用中文回答
2) 先解释含义（必要时给出更自然的译法）
3) 再讲语法结构/用词亮点/可替换表达（给2-3个替换）
4) 如选中片段有更地道写法，可给出改写版本

【题目】
${mode === 'letter' ? '小作文' : '大作文'} · ${data?.year || ''} ${data?.title || ''}

【范文】
${modelView.text}

【选中片段】
${quote}

【用户问题】
${question}`;

    try {
      await sendMessage(prompt);
      setAskInput('');
      setAskOpen(true);
    } catch {
      // error is handled by hook state
    }
  };

  if (!isOpen) return null;

    const setTab = (tab) => {
    setMobileTab(tab);
    if (tab === 'structure') setStructureOpen(true);
    if (tab === 'ask') setAskOpen(true);
  };

  // Mobile Bottom Navigation
  const MobileNav = () => (
    <div className="md:hidden fixed bottom-0 inset-x-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 pb-safe z-10">
      <div className="flex items-center justify-around h-14">
        <button
          onClick={() => setTab('content')}
          className={`flex flex-col items-center justify-center flex-1 h-full gap-1 ${
            mobileTab === 'content' ? styles.accentText : 'text-slate-400'
          }`}
        >
          <BookOpen className="w-5 h-5" />
          <span className="text-[10px] font-medium">范文</span>
        </button>
        <button
          onClick={() => setTab('structure')}
          className={`flex flex-col items-center justify-center flex-1 h-full gap-1 ${
            mobileTab === 'structure' ? styles.accentText : 'text-slate-400'
          }`}
        >
          <GitBranch className="w-5 h-5" />
          <span className="text-[10px] font-medium">结构</span>
        </button>
        <button
          onClick={() => setTab('ask')}
          className={`relative flex flex-col items-center justify-center flex-1 h-full gap-1 ${
            mobileTab === 'ask' ? styles.accentText : 'text-slate-400'
          }`}
        >
          <div className="relative">
            <MessageCircle className="w-5 h-5" />
            {selectedText && mobileTab !== 'ask' && (
              <span className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ${styles.accentDot} ring-2 ring-white dark:ring-slate-900`} />
            )}
          </div>
          <span className="text-[10px] font-medium">问 AI</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 md:bg-black/0 md:pointer-events-none z-40 animate-fadeIn backdrop-blur-sm md:backdrop-blur-none"
        onClick={onClose}
      />
      
      {/* Container - Mobile: Full Screen, Desktop: Floating Panel */}
      <div className="fixed inset-0 md:top-16 md:bottom-4 md:right-4 md:left-auto z-50 flex flex-col md:block pointer-events-none">
        <div className="bg-white dark:bg-slate-900 w-full h-full md:w-[640px] lg:w-[720px] md:h-full md:rounded-3xl shadow-2xl animate-modelPanel overflow-hidden flex flex-col border-none md:border border-slate-100 dark:border-slate-800 pointer-events-auto">
          
          {/* Header */}
          <div className="flex-none p-4 md:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-20">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <BookOpen className={`w-5 h-5 ${styles.accentIcon}`} />
                <h3 className="font-semibold text-[17px] text-slate-800 dark:text-slate-100">查看范文</h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-1">
                {mode === 'letter' ? '小作文' : '大作文'} · {data?.year || ''} {data?.title || ''}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                disabled={!modelView.text}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
                title="复制"
              >
                <Copy className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors"
                title="关闭"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-hidden relative flex flex-col md:grid md:grid-cols-[280px_1fr] md:grid-rows-[1fr_auto] md:gap-4 md:p-5">
            
            {/* Mobile Selection Tip */}
            {selectedText && mobileTab === 'content' && (
              <div className="md:hidden absolute top-4 left-4 right-4 z-10 animate-slideDown">
                <button
                  onClick={() => setTab('ask')}
                  className={`w-full p-3 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 flex items-center justify-between gap-3 bg-white dark:bg-slate-800`}
                >
                  <div className="min-w-0 flex-1 text-left">
                    <div className="text-xs text-slate-400 mb-0.5">已选中片段</div>
                    <div className="text-sm text-slate-700 dark:text-slate-200 truncate">{selectedText}</div>
                  </div>
                  <div className={`text-sm font-medium whitespace-nowrap px-3 py-1.5 rounded-lg ${styles.varPill}`}>
                    去提问
                  </div>
                </button>
              </div>
            )}

            {/* Structure Panel */}
            <div
              className={`${
                mobileTab === 'structure' ? 'flex flex-col flex-1 min-h-0 bg-slate-50 dark:bg-slate-900' : 'hidden'
              } md:flex md:flex-col rounded-2xl md:border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden md:row-span-2 md:min-h-0`}
            >
              {/* Desktop Header for Structure */}
              <button
                type="button"
                onClick={() => setStructureOpen(!structureOpen)}
                className="hidden md:flex w-full px-4 py-3 items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <GitBranch className={`w-5 h-5 ${styles.accentIcon}`} />
                  <span className="font-medium text-slate-700 dark:text-slate-200">拼接结构</span>
                </div>
                {structureOpen ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
              </button>

              {(structureOpen || mobileTab === 'structure') && (
                <div
                  className={`px-4 pb-20 md:pb-4 overflow-auto custom-scrollbar ${
                    mobileTab === 'structure' ? 'flex-1 min-h-0 pt-4' : 'max-h-[24vh]'
                  } md:max-h-none md:flex-1 md:min-h-0`}
                >
                  {/* ... Structure Content ... */}
                  <div className="relative pl-6 mt-2">
                    <div className="absolute left-2 top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-700" />
                    <div className="space-y-6 md:space-y-4">
                      {structureNodes.map((node, idx) => (
                        <div key={node.id || idx} className="relative">
                          <div className={`absolute -left-1.5 top-2 w-3 h-3 rounded-full ${styles.accentDot} ring-4 ring-white dark:ring-slate-900`} />
                          <div className="pl-4">
                            <button
                              type="button"
                              onClick={() => {
                                if (mode !== 'essay') return;
                                if (!node.id || node.id === 'mode') return;
                                triggerBlockHighlight(node.id);
                                if (window.innerWidth < 768) setTab('content');
                              }}
                              className={`w-full flex flex-col md:flex-row md:items-baseline gap-1 md:gap-2 text-left ${
                                mode === 'essay' && node.id && node.id !== 'mode'
                                  ? 'hover:opacity-90 cursor-pointer'
                                  : 'cursor-default'
                              }`}
                            >
                              <span className="font-semibold text-lg md:text-base text-slate-800 dark:text-slate-100">{node.title}</span>
                              {node.subtitle && <span className="text-sm md:text-xs text-slate-400">{node.subtitle}</span>}
                            </button>

                            {node.skeletonSegments?.length > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (mode !== 'essay') return;
                                  if (!node.id || node.id === 'mode') return;
                                  triggerBlockHighlight(node.id);
                                  if (window.innerWidth < 768) setTab('content');
                                }}
                                className={`mt-3 p-3 rounded-xl bg-white md:bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 w-full text-left shadow-sm md:shadow-none ${
                                  mode === 'essay' && node.id && node.id !== 'mode'
                                    ? 'active:scale-95 md:hover:bg-slate-100/70 dark:hover:bg-slate-800 cursor-pointer transition-transform md:transition-colors'
                                    : 'cursor-default'
                                }`}
                              >
                                <div className="text-xs text-slate-400 mb-2">模板骨架（占位符）</div>
                                <div className="text-[14px] md:text-[13px] leading-relaxed whitespace-pre-wrap break-words">
                                  {renderSegments(node.skeletonSegments, { skeleton: true })}
                                </div>
                              </button>
                            )}
                            
                            {/* Variables list */}
                            {node.variables?.length > 0 && (
                                <div className="mt-3 grid grid-cols-1 gap-2">
                                  {node.variables.map((v, i) => (
                                    <button
                                      type="button"
                                      key={v.id || i}
                                      onClick={() => {
                                        triggerVarHighlight(v.key || v.id, mode === 'essay' ? node.id : null);
                                        if (window.innerWidth < 768) setTab('content');
                                      }}
                                      className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors shadow-sm md:shadow-none active:scale-95 md:active:scale-100 transition-transform md:transition-none"
                                    >
                                      <div className="text-xs text-slate-400">{v.label || '变量'}</div>
                                      <div className={`mt-1 text-sm font-medium ${styles.accentText} whitespace-pre-wrap break-words`}>
                                        {v.value}
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Content Panel */}
            <div
              ref={contentRef}
              onMouseUp={updateSelection}
              onKeyUp={updateSelection}
              onTouchEnd={updateSelection}
              className={`${
                mobileTab === 'content' ? 'block' : 'hidden'
              } md:block p-4 pb-20 md:pb-4 bg-slate-50 dark:bg-slate-800/50 md:rounded-2xl md:border border-slate-200 dark:border-slate-700 flex-1 overflow-auto break-words text-[16px] md:text-[15px] leading-relaxed font-serif md:min-h-0 custom-scrollbar scroll-smooth`}
            >
              <div className="mx-auto w-full max-w-[72ch] min-h-[50vh]">
                {/* ... Content rendering (same as before) ... */}
                  {mode === 'essay' && modelView.blocks?.length ? (
                    <div className="space-y-6 md:space-y-4">
                      {modelView.blocks.map((block) => {
                        const isBlockActive =
                          highlight?.type === 'block' && highlight.blockId === block.id;
                        const isBlockContextActive =
                          highlight?.type === 'var' && highlight.blockId && highlight.blockId === block.id;

                        return (
                          <div
                            key={block.id}
                            data-block-id={block.id}
                            className={`rounded-xl px-3 py-2 -mx-3 transition-colors duration-500 ${
                              isBlockActive
                                ? 'bg-amber-100/70 dark:bg-amber-900/25 ring-1 ring-amber-300/70 dark:ring-amber-700/40'
                                : isBlockContextActive
                                  ? 'bg-amber-50/70 dark:bg-amber-900/10'
                                  : 'bg-transparent'
                            }`}
                          >
                            <div className="whitespace-pre-wrap break-words">
                              {(block.segments || []).map((seg, idx) => {
                                const isVarActive =
                                  highlight?.type === 'var' &&
                                  seg.kind === 'var' &&
                                  seg.key &&
                                  seg.key === highlight.key &&
                                  (!highlight.blockId || highlight.blockId === block.id);

                                const text = seg.text;
                                const baseCls =
                                  seg.kind === 'var'
                                    ? `font-medium ${styles.varInline}`
                                    : 'text-slate-700 dark:text-slate-200';
                                const highlightCls = isVarActive
                                  ? 'ring-2 ring-amber-400/60 dark:ring-amber-500/50 shadow-sm'
                                  : '';

                                return (
                                  <span
                                    key={`${block.id}_${idx}`}
                                    data-var-key={seg.kind === 'var' ? seg.key || '' : undefined}
                                    className={`${baseCls} ${highlightCls}`}
                                  >
                                    {text}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : modelView.segments?.length ? (
                    <div className="whitespace-pre-wrap break-words">
                      {modelView.segments.map((seg, idx) => {
                         // ... rendering ...
                         const isVarActive =
                          highlight?.type === 'var' &&
                          seg.kind === 'var' &&
                          seg.key &&
                          seg.key === highlight.key;
  
                        const text = seg.text;
                        const baseCls =
                          seg.kind === 'var'
                            ? `font-medium ${styles.varInline}`
                            : 'text-slate-700 dark:text-slate-200';
                        const highlightCls = isVarActive
                          ? 'ring-2 ring-amber-400/60 dark:ring-amber-500/50 shadow-sm'
                          : '';
  
                        return (
                          <span
                            key={idx}
                            data-var-key={seg.kind === 'var' ? seg.key || '' : undefined}
                            className={`${baseCls} ${highlightCls}`}
                          >
                            {text}
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-40 text-slate-400">暂无内置范文</div>
                  )}
              </div>
            </div>

            {/* Ask AI Panel */}
            <div
              className={`${
                mobileTab === 'ask' ? 'flex flex-col flex-1 min-h-0' : 'hidden'
              } md:block p-0 md:p-4 pb-0 md:pb-safe md:rounded-2xl md:border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900`}
            >
              {/* Desktop Header for Ask */}
              <div className="hidden md:flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2 min-w-0">
                  <MessageCircle className={`w-5 h-5 ${styles.accentIcon}`} />
                  <span className="font-medium text-slate-700 dark:text-slate-200">选中文本问 AI</span>
                  {selectedText && (
                    <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[150px]">
                      已选中：{selectedText}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                    {selectedText && (
                      <button
                        type="button"
                        onClick={() => setSelectedText('')}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"
                        title="清除选中"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setAskOpen(!askOpen)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${styles.accentText} border-current opacity-70 hover:opacity-100`}
                    >
                      {askOpen ? '收起' : '展开'}
                    </button>
                </div>
              </div>

              {/* Mobile Selected Text Indicator in Ask Tab */}
              <div className="md:hidden p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-start gap-3">
                   <div className={`mt-0.5 p-1.5 rounded-lg bg-white dark:bg-slate-800 shadow-sm text-indigo-500`}>
                      <MessageCircle className="w-4 h-4" />
                   </div>
                   <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                        {selectedText ? '已选中上下文' : '未选中内容'}
                      </div>
                      <div className="text-sm text-slate-700 dark:text-slate-200 line-clamp-2">
                        {selectedText || '请先在"范文"页面长按选择一段文字，再来提问。'}
                      </div>
                   </div>
                   {selectedText && (
                      <button onClick={() => setSelectedText('')} className="text-slate-400 p-2">
                        <XCircle className="w-5 h-5" />
                      </button>
                   )}
                </div>
              </div>

              {(askOpen || mobileTab === 'ask') && (
                <div className={`flex flex-col h-full md:h-auto ${mobileTab === 'ask' ? 'flex-1 min-h-0' : ''}`}>
                  {error && (
                    <div className="m-4 md:mx-0 md:mt-0">
                       <InlineError error={error} onRetry={handleAsk} />
                    </div>
                  )}

                  <div className={`flex-1 overflow-y-auto custom-scrollbar p-4 md:p-0 md:mb-3 ${mobileTab === 'ask' ? 'pb-20' : 'max-h-[240px]'}`}>
                    {(messages.length > 0 || isStreaming) ? (
                       <ChatList messages={messages} streamingContent={streamingContent} isStreaming={isStreaming} />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-slate-400 py-10">
                        <MessageCircle className="w-12 h-12 mb-3 opacity-20" />
                        <p className="text-sm">选中文本后，在此提问</p>
                      </div>
                    )}
                  </div>

                  {/* Input Area - Fixed at bottom for mobile */}
                  <div className={`p-3 md:p-0 bg-white dark:bg-slate-900 border-t md:border-t-0 border-slate-100 dark:border-slate-800 ${mobileTab === 'ask' ? 'absolute bottom-14 inset-x-0' : ''}`}>
                    <div className="flex items-end gap-2">
                      <textarea
                        value={askInput}
                        onChange={(e) => setAskInput(e.target.value)}
                        placeholder={selectedText ? '问个问题...' : '请先选中文本'}
                        className="flex-1 resize-none bg-slate-100 dark:bg-slate-800 border-0 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/50"
                        rows={1}
                        style={{ minHeight: '44px', maxHeight: '120px' }}
                        disabled={isStreaming}
                      />
                      <button
                        type="button"
                        onClick={handleAsk}
                        disabled={!selectedText || !askInput.trim() || isStreaming}
                        className={`p-3 rounded-xl flex-none disabled:opacity-50 disabled:grayscale transition-all ${styles.accentButton}`}
                      >
                         {isStreaming ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                         ) : (
                            <div className="font-bold text-sm">发送</div>
                         )}
                      </button>
                      {messages.length > 0 && !isStreaming && (
                        <button
                           onClick={clearHistory}
                           className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700"
                           title="清空"
                        >
                           <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
          
          <MobileNav />
        </div>
      </div>
    </>
  );
};

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 md:bg-black/0 md:pointer-events-none z-40 animate-fadeIn"
        onClick={onClose}
      />
      <div className="fixed inset-x-0 bottom-0 md:top-16 md:bottom-4 md:right-4 md:left-auto z-50 p-0 md:p-0">
        <div className="bg-white dark:bg-slate-900 rounded-t-3xl md:rounded-3xl w-full md:w-[640px] lg:w-[720px] shadow-2xl animate-modelPanel overflow-hidden max-h-[92vh] md:max-h-none md:h-full flex flex-col border border-slate-100 dark:border-slate-800">
          <div className="md:hidden flex justify-center pt-3 pb-1">
            <div className="w-12 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700" />
          </div>
          <div className="p-4 md:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <BookOpen className={`w-5 h-5 ${styles.accentIcon}`} />
                <h3 className="font-semibold text-[17px] text-slate-800 dark:text-slate-100">查看范文</h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-1">
                {mode === 'letter' ? '小作文' : '大作文'} · {data?.year || ''} {data?.title || ''}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                disabled={!modelView.text}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
                title="复制"
              >
                <Copy className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                title="关闭"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-4 md:p-5 flex-1 overflow-hidden min-h-0 flex flex-col gap-4 md:grid md:grid-cols-[280px_1fr] md:grid-rows-[1fr_auto] md:gap-4">
            <div className="md:hidden">
              <div className="p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setTab('content')}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                    mobileTab === 'content'
                      ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  范文
                </button>
                <button
                  type="button"
                  onClick={() => setTab('structure')}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                    mobileTab === 'structure'
                      ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  结构
                </button>
                <button
                  type="button"
                  onClick={() => setTab('ask')}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                    mobileTab === 'ask'
                      ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  <span className="inline-flex items-center justify-center gap-1">
                    问 AI
                    {selectedText && mobileTab !== 'ask' && (
                      <span className={`w-1.5 h-1.5 rounded-full ${styles.accentDot}`} />
                    )}
                  </span>
                </button>
              </div>

              {selectedText && mobileTab === 'content' && (
                <button
                  type="button"
                  onClick={() => setTab('ask')}
                  className="mt-3 w-full px-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-left active:scale-[0.99] transition-transform"
                  title="针对选中片段提问"
                >
                  <div className="text-xs text-slate-400 mb-1">已选中片段</div>
                  <div className="text-sm text-slate-700 dark:text-slate-200 truncate">{selectedText}</div>
                  <div className={`mt-2 text-sm font-medium ${styles.accentText}`}>去问 AI →</div>
                </button>
              )}
            </div>

            <div
              className={`${mobileTab === 'structure' ? 'flex flex-col flex-1 min-h-0' : 'hidden'} md:flex md:flex-col rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden md:row-span-2 md:min-h-0`}
            >
              <button
                type="button"
                onClick={() => setStructureOpen(!structureOpen)}
                className="w-full px-3 md:px-4 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <GitBranch className={`w-5 h-5 ${styles.accentIcon}`} />
                  <span className="font-medium text-slate-700 dark:text-slate-200">拼接结构</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    模板骨架
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${styles.varPill}`}>
                    题目变量
                  </span>
                </div>
                {structureOpen ? (
                  <ChevronUp className="w-5 h-5 text-slate-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                )}
              </button>

              {structureOpen && (
                <div
                  className={`px-3 md:px-4 pb-4 overflow-auto pr-2 custom-scrollbar ${
                    mobileTab === 'structure' ? 'flex-1 min-h-0 max-h-none' : 'max-h-[24vh]'
                  } md:max-h-none md:flex-1 md:min-h-0`}
                >
                  <div className="relative pl-6 mt-2">
                    <div className="absolute left-2 top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-700" />
                    <div className="space-y-4">
                      {structureNodes.map((node, idx) => (
                        <div key={node.id || idx} className="relative">
                          <div className={`absolute -left-1.5 top-2 w-3 h-3 rounded-full ${styles.accentDot} ring-4 ring-white dark:ring-slate-900`} />
                          <div className="pl-4">
                            <button
                              type="button"
                              onClick={() => {
                                if (mode !== 'essay') return;
                                if (!node.id || node.id === 'mode') return;
                                triggerBlockHighlight(node.id);
                              }}
                              className={`w-full flex items-baseline gap-2 text-left ${
                                mode === 'essay' && node.id && node.id !== 'mode'
                                  ? 'hover:opacity-90 cursor-pointer'
                                  : 'cursor-default'
                              }`}
                              title={mode === 'essay' && node.id && node.id !== 'mode' ? '定位并高亮该段' : undefined}
                            >
                              <span className="font-semibold text-slate-800 dark:text-slate-100">{node.title}</span>
                              {node.subtitle && <span className="text-xs text-slate-400">{node.subtitle}</span>}
                            </button>

                            {node.meta?.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-2">
                                {node.meta.map((m, i) => (
                                  <span
                                    key={i}
                                    className="text-xs px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                                  >
                                    {m.label}: <span className="font-medium">{m.value}</span>
                                  </span>
                                ))}
                              </div>
                            )}

                            {node.skeletonSegments?.length > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (mode !== 'essay') return;
                                  if (!node.id || node.id === 'mode') return;
                                  triggerBlockHighlight(node.id);
                                }}
                                className={`mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 w-full text-left ${
                                  mode === 'essay' && node.id && node.id !== 'mode'
                                    ? 'hover:bg-slate-100/70 dark:hover:bg-slate-800 cursor-pointer'
                                    : 'cursor-default'
                                }`}
                                title={mode === 'essay' && node.id && node.id !== 'mode' ? '定位并高亮该段' : undefined}
                              >
                                <div className="text-xs text-slate-400 mb-2">模板骨架（占位符）</div>
                                <div className="text-[13px] leading-relaxed whitespace-pre-wrap break-words">
                                  {renderSegments(node.skeletonSegments, { skeleton: true })}
                                </div>
                              </button>
                            )}

                            {node.variables?.length > 0 && (
                              <div className="mt-3 grid grid-cols-1 gap-2">
                                {node.variables.map((v, i) => (
                                  <button
                                    type="button"
                                    key={v.id || i}
                                    onClick={() => triggerVarHighlight(v.key || v.id, mode === 'essay' ? node.id : null)}
                                    className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                                    title="定位并高亮该变量"
                                  >
                                    <div className="text-xs text-slate-400">{v.label || '变量'}</div>
                                    <div className={`mt-1 text-sm font-medium ${styles.accentText} whitespace-pre-wrap break-words`}>
                                      {v.value}
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div
              ref={contentRef}
              onMouseUp={updateSelection}
              onKeyUp={updateSelection}
              onTouchEnd={updateSelection}
              className={`${mobileTab === 'content' ? '' : 'hidden'} md:block p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 flex-1 overflow-auto break-words text-[15px] leading-relaxed font-serif md:min-h-0 custom-scrollbar`}
            >
              <div className="mx-auto w-full max-w-[72ch]">
                {mode === 'essay' && modelView.blocks?.length ? (
                  <div className="space-y-4">
                    {modelView.blocks.map((block) => {
                      const isBlockActive =
                        highlight?.type === 'block' && highlight.blockId === block.id;
                      const isBlockContextActive =
                        highlight?.type === 'var' && highlight.blockId && highlight.blockId === block.id;

                      return (
                        <div
                          key={block.id}
                          data-block-id={block.id}
                          className={`rounded-xl px-2 py-1 -mx-2 transition-colors ${
                            isBlockActive
                              ? 'bg-amber-100/70 dark:bg-amber-900/25 ring-1 ring-amber-300/70 dark:ring-amber-700/40'
                              : isBlockContextActive
                                ? 'bg-amber-50/70 dark:bg-amber-900/10'
                                : 'bg-transparent'
                          }`}
                        >
                          <div className="whitespace-pre-wrap break-words">
                            {(block.segments || []).map((seg, idx) => {
                              const isVarActive =
                                highlight?.type === 'var' &&
                                seg.kind === 'var' &&
                                seg.key &&
                                seg.key === highlight.key &&
                                (!highlight.blockId || highlight.blockId === block.id);

                              const text = seg.text;
                              const baseCls =
                                seg.kind === 'var'
                                  ? `font-medium ${styles.varInline}`
                                  : 'text-slate-700 dark:text-slate-200';
                              const highlightCls = isVarActive
                                ? 'ring-2 ring-amber-400/60 dark:ring-amber-500/50 shadow-sm'
                                : '';

                              return (
                                <span
                                  key={`${block.id}_${idx}`}
                                  data-var-key={seg.kind === 'var' ? seg.key || '' : undefined}
                                  className={`${baseCls} ${highlightCls}`}
                                >
                                  {text}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : modelView.segments?.length ? (
                  <div className="whitespace-pre-wrap break-words">
                    {modelView.segments.map((seg, idx) => {
                      const isVarActive =
                        highlight?.type === 'var' &&
                        seg.kind === 'var' &&
                        seg.key &&
                        seg.key === highlight.key;

                      const text = seg.text;
                      const baseCls =
                        seg.kind === 'var'
                          ? `font-medium ${styles.varInline}`
                          : 'text-slate-700 dark:text-slate-200';
                      const highlightCls = isVarActive
                        ? 'ring-2 ring-amber-400/60 dark:ring-amber-500/50 shadow-sm'
                        : '';

                      return (
                        <span
                          key={idx}
                          data-var-key={seg.kind === 'var' ? seg.key || '' : undefined}
                          className={`${baseCls} ${highlightCls}`}
                        >
                          {text}
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  '暂无内置范文'
                )}
              </div>
            </div>

            <div
              className={`${mobileTab === 'ask' ? 'flex flex-col flex-1 min-h-0' : 'hidden'} md:block p-4 pb-safe rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <MessageCircle className={`w-5 h-5 ${styles.accentIcon}`} />
                  <span className="font-medium text-slate-700 dark:text-slate-200">选中文本问 AI</span>
                  {selectedText && (
                    <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      已选中：{selectedText}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {selectedText && (
                    <button
                      type="button"
                      onClick={() => setSelectedText('')}
                      className="p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500"
                      title="清除选中"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setAskOpen(!askOpen)}
                    className={`px-3 py-2 rounded-xl text-sm font-medium ${styles.accentButton}`}
                  >
                    {askOpen ? '收起' : '展开'}
                  </button>
                </div>
              </div>

              {askOpen && (
                <div className={`mt-4 ${mobileTab === 'ask' ? 'flex-1 min-h-0 flex flex-col gap-3' : 'space-y-3'}`}>
                  {error && (
                    <InlineError error={error} onRetry={handleAsk} />
                  )}

                  {(messages.length > 0 || isStreaming) && (
                    <div className={`${mobileTab === 'ask' ? 'flex-1 min-h-0 overflow-y-auto custom-scrollbar' : 'max-h-[240px] overflow-y-auto custom-scrollbar'}`}>
                      <ChatList messages={messages} streamingContent={streamingContent} isStreaming={isStreaming} />
                    </div>
                  )}

                  <div className="flex items-end gap-2">
                    <textarea
                      value={askInput}
                      onChange={(e) => setAskInput(e.target.value)}
                      placeholder={selectedText ? '输入你的问题，例如：这句为什么用 whereas？能给2个替换表达吗？' : '先在上方范文里选中一句/一段再提问'}
                      className="flex-1 resize-none input-field"
                      rows={2}
                      disabled={isStreaming}
                    />
                    <button
                      type="button"
                      onClick={handleAsk}
                      disabled={!selectedText || !askInput.trim() || isStreaming}
                      className={`px-4 py-3 rounded-2xl font-medium disabled:opacity-50 ${styles.accentButton}`}
                    >
                      提问
                    </button>
                    {isStreaming && (
                      <button
                        type="button"
                        onClick={cancelStream}
                        className="px-3 py-3 rounded-2xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium"
                      >
                        停止
                      </button>
                    )}
                    {messages.length > 0 && !isStreaming && (
                      <button
                        type="button"
                        onClick={clearHistory}
                        className="px-3 py-3 rounded-2xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium"
                      >
                        清空
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ModelEssayModal;

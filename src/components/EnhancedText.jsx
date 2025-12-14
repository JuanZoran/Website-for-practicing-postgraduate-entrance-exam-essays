/**
 * 增强文本显示组件
 * 智能高亮英文单词、中文释义、语法结构等，提升可读性
 */

import { useState } from 'react';

/**
 * 词性颜色映射
 */
const POS_COLORS = {
  noun: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30',
  verb: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30',
  adj: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30',
  adv: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30',
  prep: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30',
  conj: 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-900/30',
  default: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30'
};

/**
 * 检测词性
 */
const detectPOS = (meaning) => {
  if (!meaning) return 'default';
  const m = meaning.toLowerCase();
  if (m.includes('n.') || m.includes('名词')) return 'noun';
  if (m.includes('v.') || m.includes('动词')) return 'verb';
  if (m.includes('adj.') || m.includes('形容词')) return 'adj';
  if (m.includes('adv.') || m.includes('副词')) return 'adv';
  if (m.includes('prep.') || m.includes('介词')) return 'prep';
  if (m.includes('conj.') || m.includes('连词')) return 'conj';
  return 'default';
};

/**
 * 单词卡片 - 增强版
 */
export const WordCard = ({ word, meaning, collocation, example, scenario, compact = false }) => {
  const [expanded, setExpanded] = useState(false);
  const pos = detectPOS(meaning);
  const colorClass = POS_COLORS[pos];

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg ${colorClass} text-sm font-medium`}>
        <span className="font-semibold">{word}</span>
        {meaning && <span className="opacity-70 text-xs">({meaning})</span>}
      </span>
    );
  }

  return (
    <div 
      className={`p-3 rounded-xl border transition-all duration-200 cursor-pointer hover:shadow-md ${
        expanded ? 'bg-white dark:bg-slate-800 shadow-md' : 'bg-slate-50 dark:bg-slate-800/50'
      }`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`font-bold text-base ${colorClass.split(' ')[0]}`}>{word}</span>
            {meaning && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${colorClass}`}>
                {meaning}
              </span>
            )}
          </div>
          {collocation && (
            <div className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
              <span className="text-slate-400 dark:text-slate-500">搭配: </span>
              <span className="text-slate-600 dark:text-slate-300 font-medium">{collocation}</span>
            </div>
          )}
        </div>
        <span className={`text-xs transition-transform ${expanded ? 'rotate-180' : ''}`}>▼</span>
      </div>
      
      {expanded && (example || scenario) && (
        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 space-y-2 animate-fadeIn">
          {example && (
            <div className="text-sm">
              <span className="text-emerald-500 font-medium">例句: </span>
              <HighlightedSentence text={example} highlightWord={word} />
            </div>
          )}
          {scenario && (
            <div className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-2 rounded-lg">
              <span className="font-medium">💡 使用场景: </span>
              {scenario.replace('Thinking:', '').trim()}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * 高亮句子 - 突出显示指定单词
 */
export const HighlightedSentence = ({ text, highlightWord, className = '' }) => {
  if (!text) return null;
  if (!highlightWord) return <span className={className}>{text}</span>;

  const regex = new RegExp(`(${highlightWord})`, 'gi');
  const parts = text.split(regex);

  return (
    <span className={`text-slate-600 dark:text-slate-300 ${className}`}>
      {parts.map((part, i) => 
        part.toLowerCase() === highlightWord.toLowerCase() ? (
          <mark key={i} className="bg-yellow-200 dark:bg-yellow-800/50 text-yellow-800 dark:text-yellow-200 px-0.5 rounded font-medium">
            {part}
          </mark>
        ) : part
      )}
    </span>
  );
};

/**
 * 增强 Markdown 渲染 - 更丰富的颜色
 */
export const EnhancedMarkdown = ({ text, className = '' }) => {
  if (!text) return null;

  return (
    <div className={`space-y-2 ${className}`}>
      {text.split('\n').map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-2" />;
        
        // 检测列表项
        const isBullet = /^[-*•]\s/.test(line.trim());
        const isNumbered = /^\d+[.)]\s/.test(line.trim());
        const cleanLine = isBullet ? line.trim().substring(2) : 
                         isNumbered ? line.trim().replace(/^\d+[.)]\s/, '') : line;

        // 处理内联格式
        const formattedParts = formatInlineText(cleanLine);

        if (isBullet || isNumbered) {
          return (
            <div key={i} className="flex gap-2 ml-1 leading-relaxed">
              <span className={`flex-shrink-0 mt-1 ${
                isBullet ? 'text-indigo-400 dark:text-indigo-500' : 'text-emerald-500 dark:text-emerald-400 font-medium text-sm'
              }`}>
                {isBullet ? '•' : line.trim().match(/^\d+/)[0] + '.'}
              </span>
              <div className="flex-1">{formattedParts}</div>
            </div>
          );
        }

        return <div key={i} className="leading-relaxed">{formattedParts}</div>;
      })}
    </div>
  );
};

/**
 * 格式化内联文本
 */
const formatInlineText = (text) => {
  // 匹配模式：**粗体**, *斜体*, `代码`, "引用", 英文单词
  const patterns = [
    { regex: /\*\*(.+?)\*\*/g, render: (m, i) => (
      <strong key={`b${i}`} className="font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/40 px-1 rounded">
        {m}
      </strong>
    )},
    { regex: /\*(.+?)\*/g, render: (m, i) => (
      <em key={`i${i}`} className="italic text-purple-600 dark:text-purple-400">{m}</em>
    )},
    { regex: /`(.+?)`/g, render: (m, i) => (
      <code key={`c${i}`} className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-rose-600 dark:text-rose-400 rounded text-sm font-mono">
        {m}
      </code>
    )},
    { regex: /"([^"]+)"/g, render: (m, i) => (
      <span key={`q${i}`} className="text-emerald-600 dark:text-emerald-400 font-medium">"{m}"</span>
    )},
  ];

  let result = text;
  const elements = [];
  let lastIndex = 0;

  // 先处理粗体
  const boldRegex = /\*\*(.+?)\*\*/g;
  let match;
  const matches = [];
  
  while ((match = boldRegex.exec(text)) !== null) {
    matches.push({ start: match.index, end: match.index + match[0].length, content: match[1], type: 'bold' });
  }

  // 处理引号
  const quoteRegex = /"([^"]+)"/g;
  while ((match = quoteRegex.exec(text)) !== null) {
    const overlaps = matches.some(m => 
      (match.index >= m.start && match.index < m.end) || 
      (match.index + match[0].length > m.start && match.index + match[0].length <= m.end)
    );
    if (!overlaps) {
      matches.push({ start: match.index, end: match.index + match[0].length, content: match[1], type: 'quote' });
    }
  }

  // 按位置排序
  matches.sort((a, b) => a.start - b.start);

  // 构建结果
  matches.forEach((m, idx) => {
    if (m.start > lastIndex) {
      elements.push(<span key={`t${idx}`}>{text.slice(lastIndex, m.start)}</span>);
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
    }
    lastIndex = m.end;
  });

  if (lastIndex < text.length) {
    elements.push(<span key="last">{text.slice(lastIndex)}</span>);
  }

  return elements.length > 0 ? elements : text;
};

/**
 * 语法错误高亮
 */
export const GrammarErrorDisplay = ({ original, correction, issue }) => {
  return (
    <div className="p-3 rounded-xl bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border border-red-200 dark:border-red-800/50">
      <div className="space-y-2">
        <div className="flex items-start gap-2">
          <span className="text-red-500 text-xs font-medium px-2 py-0.5 bg-red-100 dark:bg-red-900/50 rounded-full">原文</span>
          <span className="text-red-700 dark:text-red-300 line-through text-sm flex-1">{original}</span>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-emerald-500 text-xs font-medium px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/50 rounded-full">修正</span>
          <span className="text-emerald-700 dark:text-emerald-300 font-medium text-sm flex-1">{correction}</span>
        </div>
        {issue && (
          <div className="mt-2 pt-2 border-t border-red-200 dark:border-red-800/50 text-xs text-slate-600 dark:text-slate-400">
            <span className="text-amber-600 dark:text-amber-400 font-medium">问题: </span>{issue}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * 推荐词汇列表 - 增强版
 */
export const RecommendedVocabList = ({ vocabs, onSave }) => {
  const [savedStatus, setSavedStatus] = useState({});
  if (!vocabs || vocabs.length === 0) return null;

  const categoryColors = [
    'border-l-blue-500 bg-blue-50/50 dark:bg-blue-900/10',
    'border-l-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10',
    'border-l-purple-500 bg-purple-50/50 dark:bg-purple-900/10',
    'border-l-amber-500 bg-amber-50/50 dark:bg-amber-900/10',
    'border-l-rose-500 bg-rose-50/50 dark:bg-rose-900/10',
  ];

  return (
    <div className="space-y-2">
      <span className="text-xs font-medium text-slate-500 px-1 flex items-center gap-1">
        <span>📚</span> 推荐词汇
      </span>
      {vocabs.map((v, i) => {
        const pos = detectPOS(v.meaning);
        const wordColor = POS_COLORS[pos];
        
        return (
          <div 
            key={i} 
            className={`p-3 rounded-xl border-l-4 ${categoryColors[i % categoryColors.length]} border border-slate-200 dark:border-slate-700`}
          >
            <div className="flex justify-between items-start gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`font-bold ${wordColor.split(' ')[0]}`}>{v.word}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${wordColor}`}>{v.meaning}</span>
                </div>
                {v.collocation && (
                  <div className="mt-1 text-sm">
                    <span className="text-slate-400">搭配: </span>
                    <span className="text-slate-600 dark:text-slate-300">{v.collocation}</span>
                  </div>
                )}
                {v.example && (
                  <div className="mt-1.5 text-sm text-slate-500 dark:text-slate-400 italic">
                    <HighlightedSentence text={v.example} highlightWord={v.word} />
                  </div>
                )}
              </div>
              {onSave && (
                <button 
                  type="button"
                  onClick={() => {
                    const word = String(v?.word || '').trim();
                    if (!word) return;
                    const didAdd = onSave?.({ ...v, word, timestamp: Date.now() });
                    setSavedStatus(prev => ({ ...prev, [word]: didAdd ? 'added' : 'exists' }));
                    window.setTimeout(() => {
                      setSavedStatus(prev => {
                        if (!prev[word]) return prev;
                        const next = { ...prev };
                        delete next[word];
                        return next;
                      });
                    }, 1500);
                  }}
                  className={`flex-shrink-0 p-2 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-lg transition-colors ${
                    savedStatus[String(v?.word || '').trim()] === 'added'
                      ? 'text-green-600 dark:text-green-400'
                      : savedStatus[String(v?.word || '').trim()] === 'exists'
                        ? 'text-slate-400'
                        : 'text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300'
                  }`}
                  title={
                    savedStatus[String(v?.word || '').trim()] === 'added'
                      ? '已加入单词本'
                      : savedStatus[String(v?.word || '').trim()] === 'exists'
                        ? '已在单词本'
                        : '加入单词本'
                  }
                >
                  {savedStatus[String(v?.word || '').trim()] ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  )}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

/**
 * 优缺点对比显示
 */
export const StrengthsWeaknesses = ({ strengths = [], weaknesses = [] }) => {
  if (strengths.length === 0 && weaknesses.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {strengths.length > 0 && (
        <div className="p-4 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800/50">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-emerald-500">✅</span>
            <span className="font-medium text-emerald-700 dark:text-emerald-300">优点</span>
          </div>
          <ul className="space-y-2">
            {strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-emerald-700 dark:text-emerald-300">
                <span className="text-emerald-400 mt-1">•</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {weaknesses.length > 0 && (
        <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl border border-amber-200 dark:border-amber-800/50">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-amber-500">⚠️</span>
            <span className="font-medium text-amber-700 dark:text-amber-300">待改进</span>
          </div>
          <ul className="space-y-2">
            {weaknesses.map((w, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-300">
                <span className="text-amber-400 mt-1">•</span>
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default {
  WordCard,
  HighlightedSentence,
  EnhancedMarkdown,
  GrammarErrorDisplay,
  RecommendedVocabList,
  StrengthsWeaknesses
};

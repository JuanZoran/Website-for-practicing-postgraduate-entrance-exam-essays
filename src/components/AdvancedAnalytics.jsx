/**
 * 高级分析组件
 * 提供文章对比、词云、写作风格分析、进步轨迹等功能
 */

import { useState, useEffect, useMemo } from 'react';
import { 
  X, FileText, Cloud, PenTool, TrendingUp, 
  ChevronDown, ChevronUp, Copy, Check, RefreshCw,
  BarChart2, Sparkles, ArrowRight, Minus, Plus
} from 'lucide-react';
import { analyzeWritingStyle, extractKeywords, getProgressTrack } from '../services/learningAnalyticsService';
import { callAIStream } from '../services/aiService';

const AdvancedAnalytics = ({ isOpen, onClose, essay, history }) => {
  const [activeTab, setActiveTab] = useState('compare');
  const [loading, setLoading] = useState(false);
  const [compareResult, setCompareResult] = useState(null);
  const [styleAnalysis, setStyleAnalysis] = useState(null);
  const [keywords, setKeywords] = useState([]);

  useEffect(() => {
    if (isOpen && essay) {
      // 分析写作风格
      const style = analyzeWritingStyle(essay);
      setStyleAnalysis(style);
      
      // 提取关键词
      const kw = extractKeywords(essay);
      setKeywords(kw);
    }
  }, [isOpen, essay]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed inset-x-4 top-[5%] bottom-[5%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[700px] bg-white dark:bg-slate-900 rounded-2xl z-50 flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-indigo-600" />
            <h2 className="font-semibold text-lg">高级分析</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
          {[
            { id: 'compare', label: '范文对比', icon: FileText },
            { id: 'wordcloud', label: '主题词云', icon: Cloud },
            { id: 'style', label: '风格分析', icon: PenTool },
            { id: 'timeline', label: '进步轨迹', icon: TrendingUp }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 px-2 text-sm font-medium flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'compare' && (
            <CompareTab 
              essay={essay} 
              result={compareResult} 
              setResult={setCompareResult}
              loading={loading}
              setLoading={setLoading}
            />
          )}
          {activeTab === 'wordcloud' && (
            <WordCloudTab keywords={keywords} />
          )}
          {activeTab === 'style' && (
            <StyleTab analysis={styleAnalysis} essay={essay} />
          )}
          {activeTab === 'timeline' && (
            <TimelineTab history={history} />
          )}
        </div>
      </div>
    </>
  );
};

// 范文对比标签页
const CompareTab = ({ essay, result, setResult, loading, setLoading }) => {
  const [modelEssay, setModelEssay] = useState('');
  const [showInput, setShowInput] = useState(true);

  const handleCompare = async () => {
    if (!essay || !modelEssay.trim()) return;
    
    setLoading(true);
    setResult(null);
    
    const prompt = `请对比分析以下两篇文章，指出学生作文与范文的差异，并给出具体改进建议。

【学生作文】
${essay}

【范文/参考文章】
${modelEssay}

请从以下维度进行对比分析，返回JSON格式：
{
  "overallComparison": "总体对比评价",
  "dimensions": [
    {
      "name": "维度名称（如：词汇运用、句式结构、论证逻辑、文章结构、语言表达）",
      "studentScore": 1-10分,
      "modelScore": 1-10分,
      "gap": "差距描述",
      "suggestion": "具体改进建议"
    }
  ],
  "highlights": ["学生作文的亮点1", "亮点2"],
  "keyImprovements": ["最需要改进的点1", "改进点2", "改进点3"],
  "modelPhrases": ["可以学习的范文表达1", "表达2", "表达3"]
}`;

    try {
      let fullContent = '';
      await callAIStream(prompt, {
        jsonMode: true,
        onChunk: (chunk, full) => {
          fullContent = full;
        },
        onComplete: (content) => {
          try {
            const parsed = JSON.parse(content);
            setResult(parsed);
            setShowInput(false);
          } catch (e) {
            console.error('Parse error:', e);
            setResult({ error: '分析结果解析失败' });
          }
        },
        onError: (err) => {
          setResult({ error: err });
        }
      });
    } catch (e) {
      setResult({ error: e.message });
    } finally {
      setLoading(false);
    }
  };

  if (!essay) {
    return (
      <div className="text-center py-12">
        <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500">请先完成一篇作文</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showInput && (
        <>
          <div>
            <label className="block text-sm font-medium mb-2">粘贴范文或参考文章</label>
            <textarea
              value={modelEssay}
              onChange={(e) => setModelEssay(e.target.value)}
              placeholder="在此粘贴你想对比的范文..."
              className="w-full h-40 p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={handleCompare}
            disabled={loading || !modelEssay.trim()}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                分析中...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                开始对比分析
              </>
            )}
          </button>
        </>
      )}

      {result && !result.error && (
        <div className="space-y-4">
          <button 
            onClick={() => setShowInput(!showInput)}
            className="text-sm text-indigo-600 flex items-center gap-1"
          >
            {showInput ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {showInput ? '收起输入' : '重新对比'}
          </button>

          {/* 总体评价 */}
          <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4">
            <h4 className="font-medium text-indigo-800 dark:text-indigo-300 mb-2">总体对比</h4>
            <p className="text-sm text-indigo-700 dark:text-indigo-400">{result.overallComparison}</p>
          </div>

          {/* 维度对比 */}
          {result.dimensions?.map((dim, idx) => (
            <div key={idx} className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium">{dim.name}</span>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-500">你: {dim.studentScore}</span>
                  <ArrowRight className="w-3 h-3 text-slate-400" />
                  <span className="text-indigo-600">范文: {dim.modelScore}</span>
                </div>
              </div>
              <div className="flex gap-1 mb-2">
                <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-amber-500 rounded-full"
                    style={{ width: `${dim.studentScore * 10}%` }}
                  />
                </div>
                <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500 rounded-full"
                    style={{ width: `${dim.modelScore * 10}%` }}
                  />
                </div>
              </div>
              <p className="text-xs text-slate-500 mb-1">{dim.gap}</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">{dim.suggestion}</p>
            </div>
          ))}

          {/* 亮点 */}
          {result.highlights?.length > 0 && (
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
              <h4 className="font-medium text-green-800 dark:text-green-300 mb-2">你的亮点</h4>
              <ul className="space-y-1">
                {result.highlights.map((h, i) => (
                  <li key={i} className="text-sm text-green-700 dark:text-green-400 flex items-start gap-2">
                    <Plus className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 改进点 */}
          {result.keyImprovements?.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4">
              <h4 className="font-medium text-amber-800 dark:text-amber-300 mb-2">重点改进</h4>
              <ul className="space-y-1">
                {result.keyImprovements.map((imp, i) => (
                  <li key={i} className="text-sm text-amber-700 dark:text-amber-400 flex items-start gap-2">
                    <Minus className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    {imp}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 可学习的表达 */}
          {result.modelPhrases?.length > 0 && (
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
              <h4 className="font-medium mb-2">值得学习的表达</h4>
              <div className="flex flex-wrap gap-2">
                {result.modelPhrases.map((phrase, i) => (
                  <span key={i} className="px-3 py-1.5 bg-white dark:bg-slate-700 rounded-lg text-sm border border-slate-200 dark:border-slate-600">
                    {phrase}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {result?.error && (
        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 text-red-600 dark:text-red-400">
          {result.error}
        </div>
      )}
    </div>
  );
};

// 词云标签页
const WordCloudTab = ({ keywords }) => {
  if (!keywords?.length) {
    return (
      <div className="text-center py-12">
        <Cloud className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500">请先完成一篇作文</p>
      </div>
    );
  }

  const maxCount = Math.max(...keywords.map(k => k.count));
  
  // 生成随机颜色
  const colors = [
    'text-indigo-600', 'text-purple-600', 'text-blue-600', 
    'text-green-600', 'text-amber-600', 'text-rose-600',
    'text-cyan-600', 'text-teal-600', 'text-orange-600'
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">你的文章中出现频率最高的词汇：</p>
      
      {/* 词云展示 */}
      <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-6 min-h-[300px] flex flex-wrap items-center justify-center gap-3">
        {keywords.map((kw, idx) => {
          const size = 0.8 + (kw.count / maxCount) * 1.2;
          const color = colors[idx % colors.length];
          return (
            <span
              key={kw.word}
              className={`${color} font-medium transition-transform hover:scale-110 cursor-default`}
              style={{ fontSize: `${size}rem` }}
              title={`出现 ${kw.count} 次`}
            >
              {kw.word}
            </span>
          );
        })}
      </div>

      {/* 词频列表 */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="p-3 border-b border-slate-100 dark:border-slate-700">
          <h4 className="font-medium text-sm">词频统计</h4>
        </div>
        <div className="max-h-48 overflow-y-auto">
          {keywords.slice(0, 15).map((kw, idx) => (
            <div key={kw.word} className="flex items-center justify-between px-3 py-2 border-b border-slate-50 dark:border-slate-700/50 last:border-0">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-slate-100 dark:bg-slate-700 text-xs flex items-center justify-center text-slate-500">
                  {idx + 1}
                </span>
                <span className="text-sm">{kw.word}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-20 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500 rounded-full"
                    style={{ width: `${(kw.count / maxCount) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-slate-400 w-6 text-right">{kw.count}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// 风格分析标签页
const StyleTab = ({ analysis, essay }) => {
  if (!analysis) {
    return (
      <div className="text-center py-12">
        <PenTool className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500">请先完成一篇作文</p>
      </div>
    );
  }

  const metrics = [
    { label: '总字数', value: analysis.totalWords, unit: '词', icon: '📝' },
    { label: '句子数', value: analysis.totalSentences, unit: '句', icon: '📄' },
    { label: '段落数', value: analysis.totalParagraphs, unit: '段', icon: '📑' },
    { label: '平均句长', value: analysis.avgSentenceLength, unit: '词/句', icon: '📏' },
    { label: '词汇多样性', value: `${Math.round(analysis.lexicalDiversity * 100)}%`, unit: '', icon: '🎨' },
    { label: '复杂词汇', value: `${analysis.complexWordRatio}%`, unit: '', icon: '🔤' },
    { label: '连接词', value: analysis.connectorCount, unit: '个', icon: '🔗' },
  ];

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-amber-600 bg-amber-100';
    return 'text-red-600 bg-red-100';
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return '优秀';
    if (score >= 60) return '良好';
    return '需改进';
  };

  return (
    <div className="space-y-4">
      {/* 风格得分 */}
      <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl p-5 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-purple-100 text-sm">写作风格得分</p>
            <p className="text-4xl font-bold mt-1">{analysis.styleScore}</p>
          </div>
          <div className={`px-3 py-1.5 rounded-full text-sm font-medium ${getScoreColor(analysis.styleScore)}`}>
            {getScoreLabel(analysis.styleScore)}
          </div>
        </div>
      </div>

      {/* 指标网格 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {metrics.map(metric => (
          <div key={metric.label} className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-100 dark:border-slate-700">
            <div className="text-lg mb-1">{metric.icon}</div>
            <p className="text-xl font-bold">{metric.value}<span className="text-sm font-normal text-slate-400 ml-1">{metric.unit}</span></p>
            <p className="text-xs text-slate-500">{metric.label}</p>
          </div>
        ))}
      </div>

      {/* 风格建议 */}
      <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
        <h4 className="font-medium mb-3">风格改进建议</h4>
        <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
          {analysis.avgSentenceLength < 12 && (
            <li className="flex items-start gap-2">
              <span className="text-amber-500">•</span>
              句子偏短，可以尝试使用更复杂的句式结构
            </li>
          )}
          {analysis.avgSentenceLength > 25 && (
            <li className="flex items-start gap-2">
              <span className="text-amber-500">•</span>
              句子偏长，建议适当拆分以提高可读性
            </li>
          )}
          {analysis.lexicalDiversity < 0.4 && (
            <li className="flex items-start gap-2">
              <span className="text-amber-500">•</span>
              词汇重复较多，尝试使用同义词替换
            </li>
          )}
          {analysis.complexWordRatio < 10 && (
            <li className="flex items-start gap-2">
              <span className="text-amber-500">•</span>
              可以适当增加高级词汇的使用
            </li>
          )}
          {analysis.connectorCount < 2 && (
            <li className="flex items-start gap-2">
              <span className="text-amber-500">•</span>
              建议增加过渡词使用，提升文章连贯性
            </li>
          )}
          {analysis.styleScore >= 80 && (
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              写作风格良好，继续保持！
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};

// 进步轨迹标签页
const TimelineTab = ({ history }) => {
  const progressData = useMemo(() => getProgressTrack(), []);
  
  if (!progressData?.length && !history?.length) {
    return (
      <div className="text-center py-12">
        <TrendingUp className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500">暂无历史数据</p>
        <p className="text-sm text-slate-400 mt-1">完成更多练习后查看进步轨迹</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 进步图表 */}
      {progressData?.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
          <h4 className="font-medium mb-4">分数趋势</h4>
          <div className="flex items-end gap-2 h-40">
            {progressData.slice(-10).map((week, idx) => {
              const height = Math.max(10, week.avgScore);
              return (
                <div key={week.week} className="flex-1 flex flex-col items-center">
                  <div className="w-full flex flex-col items-center">
                    <span className="text-xs text-slate-500 mb-1">{Math.round(week.avgScore)}</span>
                    <div 
                      className="w-full bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t transition-all hover:from-indigo-500 hover:to-indigo-300"
                      style={{ height: `${height}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 truncate w-full text-center">
                    {week.week.slice(5)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 历史记录 */}
      {history?.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
          <div className="p-3 border-b border-slate-100 dark:border-slate-700">
            <h4 className="font-medium text-sm">最近练习</h4>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {history.slice(-10).reverse().map((record, idx) => (
              <div key={idx} className="flex items-center justify-between px-4 py-3 border-b border-slate-50 dark:border-slate-700/50 last:border-0">
                <div>
                  <p className="text-sm font-medium">{new Date(record.date).toLocaleDateString()}</p>
                  <p className="text-xs text-slate-400">{record.wordCount || '-'} 词</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-indigo-600">{record.score || '-'}</p>
                  <p className="text-xs text-slate-400">分</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedAnalytics;

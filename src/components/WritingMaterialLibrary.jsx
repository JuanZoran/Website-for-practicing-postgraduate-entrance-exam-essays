import { useState, useCallback } from 'react';
import { 
  X, Search, Copy, Check, ChevronDown, ChevronRight,
  FileText, Layout, Lightbulb, Quote, Plus, Trash2, Edit2, Save
} from 'lucide-react';

// 优秀句式模板数据
const SENTENCE_TEMPLATES = {
  opening: {
    title: '开头句式',
    items: [
      { id: 'o1', text: 'With the rapid development of..., ... has become increasingly important.', cn: '随着...的快速发展，...变得越来越重要。' },
      { id: 'o2', text: 'In recent years, there has been a growing concern over...', cn: '近年来，人们越来越关注...' },
      { id: 'o3', text: 'It is widely acknowledged that...', cn: '人们普遍认为...' },
      { id: 'o4', text: 'When it comes to..., opinions vary from person to person.', cn: '谈到...，人们的看法各不相同。' },
      { id: 'o5', text: 'The issue of... has aroused wide public concern.', cn: '...问题引起了广泛的公众关注。' },
    ]
  },
  transition: {
    title: '过渡句式',
    items: [
      { id: 't1', text: 'On the one hand..., on the other hand...', cn: '一方面...，另一方面...' },
      { id: 't2', text: 'Furthermore / Moreover / In addition...', cn: '此外 / 而且 / 另外...' },
      { id: 't3', text: 'However / Nevertheless / Nonetheless...', cn: '然而 / 尽管如此...' },
      { id: 't4', text: 'In contrast / On the contrary...', cn: '相比之下 / 相反...' },
      { id: 't5', text: 'As a result / Consequently / Therefore...', cn: '因此 / 结果...' },
    ]
  },
  conclusion: {
    title: '结尾句式',
    items: [
      { id: 'c1', text: 'In conclusion / To sum up / All in all...', cn: '总之 / 综上所述...' },
      { id: 'c2', text: 'Taking all factors into consideration...', cn: '综合考虑所有因素...' },
      { id: 'c3', text: 'From what has been discussed above, we may safely draw the conclusion that...', cn: '从以上讨论中，我们可以得出结论...' },
      { id: 'c4', text: 'It is high time that we took effective measures to...', cn: '是时候采取有效措施来...' },
      { id: 'c5', text: 'Only in this way can we...', cn: '只有这样我们才能...' },
    ]
  },
  emphasis: {
    title: '强调句式',
    items: [
      { id: 'e1', text: 'It is... that/who...', cn: '正是...（强调句）' },
      { id: 'e2', text: 'What... is that...', cn: '...的是...（主语从句）' },
      { id: 'e3', text: 'There is no denying that...', cn: '不可否认的是...' },
      { id: 'e4', text: 'It goes without saying that...', cn: '不言而喻...' },
      { id: 'e5', text: 'Nothing is more important than...', cn: '没有什么比...更重要' },
    ]
  }
};

// 论证结构模板
const ARGUMENT_STRUCTURES = [
  {
    id: 'as1',
    name: '总分总结构',
    description: '先提出观点，分点论述，最后总结',
    template: `【开头】提出中心论点
【主体段1】分论点1 + 论据 + 分析
【主体段2】分论点2 + 论据 + 分析
【主体段3】分论点3 + 论据 + 分析（可选）
【结尾】重申观点 + 呼吁/展望`
  },
  {
    id: 'as2',
    name: '对比论证结构',
    description: '正反两方面对比分析',
    template: `【开头】引出话题，表明立场
【主体段1】正面观点 + 支持理由
【主体段2】反面观点 + 反驳/让步
【主体段3】个人立场 + 深入分析
【结尾】总结观点 + 建议`
  },
  {
    id: 'as3',
    name: '问题解决结构',
    description: '分析问题，提出解决方案',
    template: `【开头】描述现象/问题
【主体段1】分析原因1
【主体段2】分析原因2
【主体段3】提出解决方案
【结尾】总结 + 展望`
  },
  {
    id: 'as4',
    name: '图表描述结构',
    description: '适用于图表作文',
    template: `【开头】描述图表主题
【主体段1】描述主要数据/趋势
【主体段2】分析原因
【主体段3】预测/建议
【结尾】总结观点`
  }
];

// 主题相关素材库
const TOPIC_MATERIALS = {
  technology: {
    title: '科技与创新',
    keywords: ['technology', 'innovation', 'AI', 'internet', '科技', '创新'],
    expressions: [
      'technological advancement / breakthrough',
      'digital transformation',
      'artificial intelligence / machine learning',
      'the information age / digital era',
      'cutting-edge technology'
    ],
    examples: [
      'The rapid advancement of AI has revolutionized various industries.',
      'Digital technology has fundamentally changed the way we communicate.',
    ],
    arguments: [
      '科技提高生产效率，促进经济发展',
      '科技改变生活方式，提升生活质量',
      '科技带来隐私和安全问题',
      '科技可能导致失业和社会不平等'
    ]
  },
  education: {
    title: '教育与学习',
    keywords: ['education', 'learning', 'school', 'student', '教育', '学习'],
    expressions: [
      'quality education / well-rounded education',
      'lifelong learning',
      'academic performance / achievement',
      'educational resources',
      'critical thinking skills'
    ],
    examples: [
      'Education plays a crucial role in personal development and social progress.',
      'Online learning has become an integral part of modern education.',
    ],
    arguments: [
      '教育是个人发展和社会进步的基础',
      '素质教育比应试教育更重要',
      '终身学习是适应社会变化的关键',
      '教育公平是社会公平的重要体现'
    ]
  },
  environment: {
    title: '环境与可持续发展',
    keywords: ['environment', 'pollution', 'climate', 'sustainable', '环境', '污染'],
    expressions: [
      'environmental protection / conservation',
      'sustainable development',
      'carbon footprint / emissions',
      'renewable energy',
      'ecological balance'
    ],
    examples: [
      'Climate change poses a serious threat to human survival.',
      'Sustainable development requires the joint efforts of all countries.',
    ],
    arguments: [
      '环境保护是人类生存的必要条件',
      '经济发展与环境保护可以兼顾',
      '个人行动对环境保护有重要影响',
      '政府应制定更严格的环保政策'
    ]
  },
  society: {
    title: '社会与文化',
    keywords: ['society', 'culture', 'tradition', 'globalization', '社会', '文化'],
    expressions: [
      'cultural heritage / tradition',
      'social responsibility',
      'globalization / cultural exchange',
      'social harmony / cohesion',
      'public awareness'
    ],
    examples: [
      'Globalization has brought both opportunities and challenges to traditional cultures.',
      'Social media has profoundly changed the way people interact.',
    ],
    arguments: [
      '传统文化需要保护和传承',
      '全球化促进文化交流与融合',
      '社会责任是企业发展的重要组成部分',
      '公民意识是社会进步的基础'
    ]
  }
};


// 常用表达库
const COMMON_EXPRESSIONS = {
  cause: {
    title: '原因表达',
    items: [
      'The reason for... is that...',
      '... can be attributed to...',
      '... is mainly due to...',
      'One of the primary causes is...',
      '... stems from...'
    ]
  },
  effect: {
    title: '结果表达',
    items: [
      '... leads to / results in / gives rise to...',
      '... has a profound impact on...',
      'As a consequence / result...',
      '... contributes to...',
      '... brings about...'
    ]
  },
  example: {
    title: '举例表达',
    items: [
      'For example / For instance...',
      'Take... as an example...',
      'A case in point is...',
      'This can be illustrated by...',
      'To illustrate this point...'
    ]
  },
  opinion: {
    title: '观点表达',
    items: [
      'In my opinion / view...',
      'From my perspective...',
      'As far as I am concerned...',
      'I am convinced that...',
      'It seems to me that...'
    ]
  },
  comparison: {
    title: '比较表达',
    items: [
      'Compared with / to...',
      'In comparison with...',
      'Similarly / Likewise...',
      '... is superior / inferior to...',
      'There is a striking contrast between...'
    ]
  }
};

const WritingMaterialLibrary = ({ isOpen, onClose, onInsert, currentTopic = '' }) => {
  const [activeTab, setActiveTab] = useState('sentences');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState({});
  const [copiedId, setCopiedId] = useState(null);
  const [customMaterials, setCustomMaterials] = useState(() => {
    const saved = localStorage.getItem('custom_writing_materials');
    return saved ? JSON.parse(saved) : [];
  });
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [newCustomItem, setNewCustomItem] = useState({ text: '', cn: '', category: 'custom' });

  // 根据当前主题匹配素材
  const matchedTopic = Object.entries(TOPIC_MATERIALS).find(([key, data]) => 
    data.keywords.some(kw => currentTopic.toLowerCase().includes(kw.toLowerCase()))
  );

  const toggleSection = (key) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCopy = useCallback((text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const handleInsert = useCallback((text) => {
    if (onInsert) {
      onInsert(text);
      onClose();
    } else {
      handleCopy(text, 'insert');
    }
  }, [onInsert, onClose, handleCopy]);

  const saveCustomMaterials = (materials) => {
    setCustomMaterials(materials);
    localStorage.setItem('custom_writing_materials', JSON.stringify(materials));
  };

  const addCustomMaterial = () => {
    if (!newCustomItem.text.trim()) return;
    const newItem = {
      id: `custom_${Date.now()}`,
      ...newCustomItem,
      createdAt: new Date().toISOString()
    };
    saveCustomMaterials([newItem, ...customMaterials]);
    setNewCustomItem({ text: '', cn: '', category: 'custom' });
    setIsAddingCustom(false);
  };

  const removeCustomMaterial = (id) => {
    saveCustomMaterials(customMaterials.filter(m => m.id !== id));
  };

  // 搜索过滤
  const filterBySearch = (items, getText) => {
    if (!searchQuery) return items;
    const query = searchQuery.toLowerCase();
    return items.filter(item => {
      const text = getText(item);
      return text.toLowerCase().includes(query);
    });
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'sentences', label: '句式模板', icon: Quote },
    { id: 'structures', label: '论证结构', icon: Layout },
    { id: 'topics', label: '主题素材', icon: Lightbulb },
    { id: 'expressions', label: '常用表达', icon: FileText },
    { id: 'custom', label: '我的收藏', icon: Plus },
  ];

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40 animate-fadeIn" onClick={onClose} />
      <div className="fixed inset-x-4 top-[5%] bottom-[5%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[700px] bg-white dark:bg-slate-900 rounded-2xl z-50 flex flex-col overflow-hidden shadow-2xl animate-slideUp">
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">写作素材库</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 搜索栏 */}
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="搜索句式、表达、素材..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* 标签页 */}
        <div className="flex gap-1 px-4 py-2 border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* 句式模板 */}
          {activeTab === 'sentences' && (
            <div className="space-y-4">
              {Object.entries(SENTENCE_TEMPLATES).map(([key, section]) => (
                <div key={key} className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                  <button
                    onClick={() => toggleSection(key)}
                    className="w-full flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <span className="font-medium text-slate-700 dark:text-slate-200">{section.title}</span>
                    {expandedSections[key] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                  {(expandedSections[key] || searchQuery) && (
                    <div className="p-3 space-y-2">
                      {filterBySearch(section.items, item => item.text + item.cn).map(item => (
                        <div key={item.id} className="group p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
                          <p className="text-sm text-slate-800 dark:text-slate-200 font-medium">{item.text}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{item.cn}</p>
                          <div className="flex gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleCopy(item.text, item.id)}
                              className="flex items-center gap-1 px-2 py-1 text-xs bg-slate-200 dark:bg-slate-700 rounded hover:bg-slate-300 dark:hover:bg-slate-600"
                            >
                              {copiedId === item.id ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                              复制
                            </button>
                            <button
                              onClick={() => handleInsert(item.text)}
                              className="flex items-center gap-1 px-2 py-1 text-xs bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded hover:bg-indigo-200 dark:hover:bg-indigo-800"
                            >
                              <Plus className="w-3 h-3" />
                              插入
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 论证结构 */}
          {activeTab === 'structures' && (
            <div className="space-y-4">
              {filterBySearch(ARGUMENT_STRUCTURES, s => s.name + s.description + s.template).map(structure => (
                <div key={structure.id} className="border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-slate-800 dark:text-slate-100">{structure.name}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{structure.description}</p>
                    </div>
                    <button
                      onClick={() => handleCopy(structure.template, structure.id)}
                      className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      {copiedId === structure.id ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <pre className="text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-3 rounded-lg whitespace-pre-wrap font-sans">
                    {structure.template}
                  </pre>
                </div>
              ))}
            </div>
          )}

          {/* 主题素材 */}
          {activeTab === 'topics' && (
            <div className="space-y-4">
              {matchedTopic && (
                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl mb-4">
                  <p className="text-sm text-indigo-700 dark:text-indigo-300">
                    🎯 根据当前主题，为您推荐：<strong>{matchedTopic[1].title}</strong>
                  </p>
                </div>
              )}
              {Object.entries(TOPIC_MATERIALS).map(([key, topic]) => (
                <div key={key} className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                  <button
                    onClick={() => toggleSection(`topic_${key}`)}
                    className={`w-full flex items-center justify-between p-3 transition-colors ${
                      matchedTopic?.[0] === key 
                        ? 'bg-indigo-100 dark:bg-indigo-900/50' 
                        : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span className="font-medium text-slate-700 dark:text-slate-200">{topic.title}</span>
                    {expandedSections[`topic_${key}`] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                  {(expandedSections[`topic_${key}`] || matchedTopic?.[0] === key) && (
                    <div className="p-4 space-y-4">
                      <div>
                        <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2">常用表达</h4>
                        <div className="flex flex-wrap gap-2">
                          {topic.expressions.map((exp, i) => (
                            <button
                              key={i}
                              onClick={() => handleInsert(exp)}
                              className="px-2 py-1 text-xs bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                            >
                              {exp}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2">例句</h4>
                        {topic.examples.map((ex, i) => (
                          <div key={i} className="group flex items-start gap-2 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800">
                            <p className="text-sm text-slate-700 dark:text-slate-300 flex-1">{ex}</p>
                            <button
                              onClick={() => handleInsert(ex)}
                              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-all"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2">论点参考</h4>
                        <ul className="space-y-1">
                          {topic.arguments.map((arg, i) => (
                            <li key={i} className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2">
                              <span className="text-indigo-500">•</span>
                              {arg}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 常用表达 */}
          {activeTab === 'expressions' && (
            <div className="space-y-4">
              {Object.entries(COMMON_EXPRESSIONS).map(([key, section]) => (
                <div key={key} className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                  <button
                    onClick={() => toggleSection(`exp_${key}`)}
                    className="w-full flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <span className="font-medium text-slate-700 dark:text-slate-200">{section.title}</span>
                    {expandedSections[`exp_${key}`] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                  {(expandedSections[`exp_${key}`] || searchQuery) && (
                    <div className="p-3">
                      <div className="flex flex-wrap gap-2">
                        {filterBySearch(section.items, item => item).map((item, i) => (
                          <button
                            key={i}
                            onClick={() => handleInsert(item)}
                            className="px-3 py-2 text-sm bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 我的收藏 */}
          {activeTab === 'custom' && (
            <div className="space-y-4">
              {/* 添加新素材 */}
              {isAddingCustom ? (
                <div className="border border-indigo-200 dark:border-indigo-800 rounded-xl p-4 bg-indigo-50/50 dark:bg-indigo-900/20">
                  <textarea
                    placeholder="输入英文句式或表达..."
                    value={newCustomItem.text}
                    onChange={(e) => setNewCustomItem(prev => ({ ...prev, text: e.target.value }))}
                    className="w-full p-3 bg-white dark:bg-slate-800 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    rows={2}
                  />
                  <input
                    type="text"
                    placeholder="中文释义（可选）"
                    value={newCustomItem.cn}
                    onChange={(e) => setNewCustomItem(prev => ({ ...prev, cn: e.target.value }))}
                    className="w-full mt-2 p-2 bg-white dark:bg-slate-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={addCustomMaterial}
                      className="flex items-center gap-1 px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"
                    >
                      <Save className="w-4 h-4" />
                      保存
                    </button>
                    <button
                      onClick={() => { setIsAddingCustom(false); setNewCustomItem({ text: '', cn: '', category: 'custom' }); }}
                      className="px-3 py-2 bg-slate-200 dark:bg-slate-700 rounded-lg text-sm hover:bg-slate-300 dark:hover:bg-slate-600"
                    >
                      取消
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setIsAddingCustom(true)}
                  className="w-full p-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-slate-500 dark:text-slate-400 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  添加自定义素材
                </button>
              )}

              {/* 已保存的素材 */}
              {customMaterials.length === 0 && !isAddingCustom ? (
                <div className="text-center py-8 text-slate-400">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>还没有收藏的素材</p>
                  <p className="text-sm mt-1">点击上方按钮添加你的第一个素材</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {customMaterials.map(item => (
                    <div key={item.id} className="group p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
                      <p className="text-sm text-slate-800 dark:text-slate-200">{item.text}</p>
                      {item.cn && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{item.cn}</p>}
                      <div className="flex gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleInsert(item.text)}
                          className="flex items-center gap-1 px-2 py-1 text-xs bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded hover:bg-indigo-200"
                        >
                          <Plus className="w-3 h-3" />
                          插入
                        </button>
                        <button
                          onClick={() => removeCustomMaterial(item.id)}
                          className="flex items-center gap-1 px-2 py-1 text-xs bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 rounded hover:bg-red-200"
                        >
                          <Trash2 className="w-3 h-3" />
                          删除
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 底部提示 */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
            💡 点击表达可一键插入到写作区域，或复制到剪贴板
          </p>
        </div>
      </div>
    </>
  );
};

export default WritingMaterialLibrary;

/**
 * 提示词模板管理服务
 * 支持考研英语作文的审题、润色、评分等专用模板
 */

const TEMPLATES_STORAGE_KEY = 'kaoyan_prompt_templates';
const ACTIVE_TEMPLATE_KEY = 'kaoyan_active_templates';

// 考研英语作文评分标准 (官方评分细则)
export const SCORING_CRITERIA = {
  content: {
    name: '内容完整性',
    weight: 0.4,
    levels: {
      excellent: '内容切题，包含所有要点，表达清楚',
      good: '内容基本切题，包含大部分要点',
      fair: '内容基本切题，但遗漏部分要点',
      poor: '内容不切题，遗漏多个要点'
    }
  },
  language: {
    name: '语言质量',
    weight: 0.3,
    levels: {
      excellent: '语法正确，用词准确，句式多样',
      good: '语法基本正确，用词较准确',
      fair: '有一些语法错误，但不影响理解',
      poor: '语法错误较多，影响理解'
    }
  },
  organization: {
    name: '组织结构',
    weight: 0.2,
    levels: {
      excellent: '结构清晰，逻辑性强，衔接自然',
      good: '结构较清晰，有一定逻辑性',
      fair: '结构基本清晰，但衔接不够自然',
      poor: '结构混乱，缺乏逻辑性'
    }
  },
  format: {
    name: '格式规范',
    weight: 0.1,
    levels: {
      excellent: '格式规范，字数符合要求',
      good: '格式基本规范',
      fair: '格式有小问题',
      poor: '格式不规范'
    }
  }
};

// 默认提示词模板
const DEFAULT_TEMPLATES = {
  // 审题模板
  logic: {
    id: 'logic_default',
    name: '审题分析 (默认)',
    type: 'logic',
    description: '分析用户思路是否切题、逻辑是否清晰',
    isDefault: true,
    template: `你是一位资深的考研英语阅卷专家。请分析学生的作文思路。

## 任务
分析学生对考研英语作文题目的理解和构思是否正确。

## 题目信息
- 题目: {{topic}}
- 题目描述: {{description}}

## 学生思路
{{userInput}}

## 评估维度
1. **切题性**: 思路是否紧扣题目主旨
2. **逻辑性**: 论证是否有条理、有层次
3. **深度**: 是否有独到见解或深入分析
4. **可行性**: 是否便于展开成完整作文

## 输出要求
请用JSON格式输出:
{
  "status": "pass/warn/fail",
  "score": 1-10,
  "comment": "中文点评，指出优点和不足",
  "suggestion": "具体改进建议",
  "keyPoints": ["要点1", "要点2"]
}`,
    fewShotExamples: [
      {
        input: '题目：文化火锅\n思路：我想写中西文化融合的好处，比如促进交流、取长补短',
        output: '{"status":"pass","score":8,"comment":"思路切题，抓住了文化融合的核心。建议可以加入具体例子，如饮食、节日等方面的融合现象。","suggestion":"可以从个人、社会、国家三个层面展开论述","keyPoints":["文化交流促进理解","取长补短共同发展"]}'
      }
    ]
  },
  
  // 润色模板
  grammar: {
    id: 'grammar_default',
    name: '语法润色 (默认)',
    type: 'grammar',
    description: '检查语法错误，推荐高级词汇和句式',
    isDefault: true,
    template: `你是一位专业的考研英语写作教师。请对学生的英文翻译进行润色和评分。

## 任务
检查语法错误，评估翻译质量，推荐高级词汇。

## 原文思路 (中文)
{{chineseInput}}

## 学生翻译 (英文)
{{englishInput}}

## 评估标准
1. **语法正确性**: 时态、主谓一致、冠词、介词等
2. **词汇水平**: 是否使用了考研高频词汇和高级表达
3. **句式多样性**: 是否有复合句、倒装句、强调句等
4. **表达地道性**: 是否符合英语表达习惯

## 输出要求
请用JSON格式输出:
{
  "score": 1-10,
  "comment": "中文总体评价",
  "grammar_issues": [
    {"original": "错误原文", "correction": "正确写法", "issue": "错误类型说明"}
  ],
  "recommended_vocab": [
    {
      "word": "推荐词汇",
      "meaning": "中文含义",
      "collocation": "常用搭配",
      "example": "例句",
      "scenario": "使用场景说明"
    }
  ],
  "improved_version": "润色后的完整句子"
}`,
    fewShotExamples: [
      {
        input: '中文：文化交流促进相互理解\n英文：Culture exchange promote mutual understanding.',
        output: '{"score":6,"comment":"基本表达了原意，但有语法错误。","grammar_issues":[{"original":"Culture exchange","correction":"Cultural exchange","issue":"需要用形容词cultural修饰名词"},{"original":"promote","correction":"promotes","issue":"主语是单数，谓语动词需要加s"}],"recommended_vocab":[{"word":"facilitate","meaning":"促进","collocation":"facilitate communication/understanding","example":"Cultural exchange facilitates mutual understanding.","scenario":"正式学术写作中替代promote"}],"improved_version":"Cultural exchange facilitates mutual understanding between different nations."}'
      }
    ]
  },
  
  // 评分模板
  scoring: {
    id: 'scoring_default',
    name: '作文评分 (默认)',
    type: 'scoring',
    description: '按考研评分标准进行全面评分',
    isDefault: true,
    template: `你是一位严格的考研英语阅卷老师。请按照考研英语作文评分标准对这篇作文进行评分。

## 题目信息
- 题目: {{topic}}
- 题目描述: {{description}}

## 学生作文
{{essay}}

## 考研英语作文评分标准 (满分20分)

### 第一档 (17-20分)
- 内容切题，包含所有要点
- 语法正确，用词准确，句式多样
- 结构清晰，逻辑性强
- 字数符合要求 (160-200词)

### 第二档 (13-16分)
- 内容基本切题，包含大部分要点
- 语法基本正确，用词较准确
- 结构较清晰，有一定逻辑性

### 第三档 (9-12分)
- 内容基本切题，但遗漏部分要点
- 有一些语法错误，但不影响理解
- 结构基本清晰

### 第四档 (5-8分)
- 内容不够切题，遗漏多个要点
- 语法错误较多，部分影响理解
- 结构不够清晰

### 第五档 (1-4分)
- 内容不切题
- 语法错误严重，难以理解
- 结构混乱

## 输出要求
请用JSON格式输出:
{
  "score": 0-20,
  "level": "第X档",
  "comment": "总体评价",
  "dimensions": {
    "content": {"score": 1-5, "comment": "内容评价"},
    "language": {"score": 1-5, "comment": "语言评价"},
    "organization": {"score": 1-5, "comment": "结构评价"},
    "format": {"score": 1-5, "comment": "格式评价"}
  },
  "strengths": ["亮点1", "亮点2"],
  "weaknesses": ["不足1", "不足2"],
  "suggestions": ["改进建议1", "改进建议2"],
  "wordCount": 实际字数
}`,
    fewShotExamples: []
  },
  
  // 词汇扩展模板
  vocab: {
    id: 'vocab_default',
    name: '词汇扩展 (默认)',
    type: 'vocab',
    description: '根据主题生成高级词汇',
    isDefault: true,
    template: `你是一位考研英语词汇专家。请根据作文主题生成高分词汇推荐。

## 主题
{{topic}}

## 要求
生成3-5个与主题相关的高级词汇，适合考研英语作文使用。

## 输出要求
请用JSON数组格式输出:
[
  {
    "word": "词汇",
    "meaning": "中文含义",
    "partOfSpeech": "词性",
    "collocation": "常用搭配",
    "example": "例句",
    "scenario": "适用场景",
    "synonyms": ["同义词1", "同义词2"],
    "frequency": "考研出现频率 (高/中/低)"
  }
]`,
    fewShotExamples: []
  }
};

/**
 * 获取所有模板
 */
export const getAllTemplates = () => {
  try {
    const stored = localStorage.getItem(TEMPLATES_STORAGE_KEY);
    if (stored) {
      const customTemplates = JSON.parse(stored);
      // 合并默认模板和自定义模板
      return { ...DEFAULT_TEMPLATES, ...customTemplates };
    }
  } catch (e) {
    console.warn('Failed to read templates:', e);
  }
  return { ...DEFAULT_TEMPLATES };
};

/**
 * 获取指定类型的模板列表
 */
export const getTemplatesByType = (type) => {
  const all = getAllTemplates();
  return Object.values(all).filter(t => t.type === type);
};

/**
 * 获取当前激活的模板配置
 */
export const getActiveTemplates = () => {
  try {
    const stored = localStorage.getItem(ACTIVE_TEMPLATE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn('Failed to read active templates:', e);
  }
  return {
    logic: 'logic_default',
    grammar: 'grammar_default',
    scoring: 'scoring_default',
    vocab: 'vocab_default'
  };
};

/**
 * 设置激活的模板
 */
export const setActiveTemplate = (type, templateId) => {
  const active = getActiveTemplates();
  active[type] = templateId;
  try {
    localStorage.setItem(ACTIVE_TEMPLATE_KEY, JSON.stringify(active));
  } catch (e) {
    console.error('Failed to save active template:', e);
  }
};

/**
 * 保存自定义模板
 */
export const saveTemplate = (template) => {
  const templates = getAllTemplates();
  // 确保有唯一ID
  if (!template.id) {
    template.id = `custom_${Date.now()}`;
  }
  template.isDefault = false;
  template.updatedAt = Date.now();
  
  templates[template.id] = template;
  
  // 只保存非默认模板
  const customTemplates = {};
  Object.entries(templates).forEach(([id, t]) => {
    if (!t.isDefault) {
      customTemplates[id] = t;
    }
  });
  
  try {
    localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(customTemplates));
  } catch (e) {
    console.error('Failed to save template:', e);
  }
  
  return template;
};

/**
 * 删除自定义模板
 */
export const deleteTemplate = (templateId) => {
  const templates = getAllTemplates();
  if (templates[templateId]?.isDefault) {
    throw new Error('不能删除默认模板');
  }
  
  delete templates[templateId];
  
  const customTemplates = {};
  Object.entries(templates).forEach(([id, t]) => {
    if (!t.isDefault) {
      customTemplates[id] = t;
    }
  });
  
  try {
    localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(customTemplates));
  } catch (e) {
    console.error('Failed to delete template:', e);
  }
};

/**
 * 构建完整的提示词
 */
export const buildPrompt = (type, variables = {}) => {
  const activeTemplates = getActiveTemplates();
  const templates = getAllTemplates();
  const templateId = activeTemplates[type];
  const template = templates[templateId];
  
  if (!template) {
    console.warn(`Template not found: ${templateId}`);
    return null;
  }
  
  let prompt = template.template;
  
  // 替换变量
  Object.entries(variables).forEach(([key, value]) => {
    prompt = prompt.replace(new RegExp(`{{${key}}}`, 'g'), value || '');
  });
  
  // 添加 Few-shot 示例
  if (template.fewShotExamples?.length > 0) {
    const examples = template.fewShotExamples
      .map((ex, i) => `### 示例 ${i + 1}\n输入: ${ex.input}\n输出: ${ex.output}`)
      .join('\n\n');
    prompt = prompt + '\n\n## 参考示例\n' + examples;
  }
  
  return prompt;
};

/**
 * 获取模板类型的中文名称
 */
export const getTypeName = (type) => {
  const names = {
    logic: '审题分析',
    grammar: '语法润色',
    scoring: '作文评分',
    vocab: '词汇扩展'
  };
  return names[type] || type;
};

/**
 * 导出模板
 */
export const exportTemplates = () => {
  const templates = getAllTemplates();
  const active = getActiveTemplates();
  return JSON.stringify({ templates, active }, null, 2);
};

/**
 * 导入模板
 */
export const importTemplates = (jsonString) => {
  try {
    const data = JSON.parse(jsonString);
    if (data.templates) {
      // 只导入非默认模板
      const customTemplates = {};
      Object.entries(data.templates).forEach(([id, t]) => {
        if (!t.isDefault) {
          customTemplates[id] = t;
        }
      });
      localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(customTemplates));
    }
    if (data.active) {
      localStorage.setItem(ACTIVE_TEMPLATE_KEY, JSON.stringify(data.active));
    }
    return true;
  } catch (e) {
    console.error('Failed to import templates:', e);
    return false;
  }
};

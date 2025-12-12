/**
 * 小作文专用提示词服务
 */

import { LETTER_TYPES, VOCAB_UPGRADES } from '../data/letterData';

export const LETTER_SCORING_CRITERIA = {
  content: {
    name: '内容完整性',
    weight: 0.3,
    maxPoints: 3,
    description: '信息点覆盖是否完整'
  },
  organization: {
    name: '组织结构',
    weight: 0.3,
    maxPoints: 3,
    description: '格式规范、段落清晰'
  },
  language: {
    name: '语言质量',
    weight: 0.3,
    maxPoints: 3,
    description: '语法正确、词汇得体'
  },
  register: {
    name: '语域恰当性',
    weight: 0.1,
    maxPoints: 1,
    description: '语气与收信人身份匹配'
  }
};

export const FORMAT_RULES = {
  salutation: {
    formal: /^Dear (Sir or Madam|Mr\.|Mrs\.|Ms\.|Professor|Dr\.)/,
    semiFormat: /^Dear [A-Z][a-z]+,$/
  },
  signOff: {
    formal: ['Yours sincerely,', 'Yours faithfully,', 'Respectfully yours,'],
    semiFormat: ['Yours,', 'Best regards,', 'Warmly,']
  },
  punctuation: {
    afterSalutation: ',',
    afterSignOff: ','
  }
};

const LETTER_PROMPT_TEMPLATES = {
  letter_logic: {
    id: 'letter_logic_default',
    name: '小作文审题分析',
    type: 'letter_logic',
    description: '分析小作文思路是否切题、格式是否规范',
    template: `你是一位资深的考研英语小作文阅卷专家。请分析学生的写作思路。

## 任务
分析学生对考研英语小作文题目的理解是否正确，思路是否清晰。

## 题目信息
- 类型: {{letterType}} ({{letterTypeName}})
- 语域要求: {{register}}
- 场景: {{scenario}}
- 题目要求: {{requirements}}

## 当前填写内容
- 字段: {{slotLabel}}
- 问题: {{slotQuestion}}
- 学生思路: {{userInput}}

## 该信件类型的关键要素
{{keyElements}}

## 评估维度
1. **信息点覆盖**: 是否涵盖题目要求的信息点
2. **语域意识**: 用词和语气是否符合收信人身份
3. **逻辑连贯性**: 思路是否清晰、衔接自然
4. **格式意识**: 是否注意到格式要求

## 输出要求
请用JSON格式输出:
{
  "status": "pass/warn/fail",
  "score": 1-10,
  "comment": "中文点评，指出优点和不足",
  "format_hints": ["格式提示1", "格式提示2"],
  "content_check": {
    "covered": ["已覆盖的要点"],
    "missing": ["可能遗漏的要点"]
  },
  "suggestion": "具体改进建议",
  "vocab_tips": ["高分词汇建议1", "高分词汇建议2"]
}`
  },

  letter_polish: {
    id: 'letter_polish_default',
    name: '小作文语言润色',
    type: 'letter_polish',
    description: '检查语法错误，推荐高级表达',
    template: `你是一位专业的考研英语小作文写作教师。请对学生的英文内容进行润色和评分。

## 任务
检查语法错误，评估语言质量，推荐9分高级表达。

## 信件信息
- 类型: {{letterType}} ({{letterTypeName}})
- 语域: {{register}}
- 场景: {{scenario}}

## 当前字段
- 字段: {{slotLabel}}
- 中文思路: {{chineseInput}}
- 英文翻译: {{englishInput}}

## 该类型信件的高分词汇参考
{{vocabReference}}

## 评估标准
1. **语法正确性**: 时态、主谓一致、冠词、介词
2. **词汇水平**: 是否使用了高级表达
3. **语域恰当性**: 正式程度是否合适
4. **表达地道性**: 是否符合英语书信表达习惯

## 输出要求
请用JSON格式输出:
{
  "score": 1-10,
  "comment": "中文总体评价",
  "grammar_issues": [
    {"original": "错误原文", "correction": "正确写法", "issue": "错误说明"}
  ],
  "register_issues": ["语域问题说明"],
  "recommended_vocab": [
    {
      "word": "推荐词汇/短语",
      "meaning": "中文含义",
      "collocation": "常用搭配",
      "example": "例句",
      "scenario": "使用场景"
    }
  ],
  "improved_version": "润色后的完整内容"
}`
  },

  letter_scoring: {
    id: 'letter_scoring_default',
    name: '小作文评分',
    type: 'letter_scoring',
    description: '按考研小作文评分标准进行全面评分',
    template: `你是一位严格的考研英语小作文阅卷老师。请按照考研评分标准进行评分。

## 题目信息
- 类型: {{letterType}} ({{letterTypeName}})
- 语域: {{register}}
- 场景: {{scenario}}
- 要求: {{requirements}}

## 学生作文
{{essay}}

## 小作文评分标准 (满分10分)

### 第一档 (9-10分) - 优秀
- 内容完整，覆盖所有信息点
- 格式完全正确（称呼、落款、标点）
- 语域高度恰当，语气得体
- 语法零失误，词汇多样

### 第二档 (7-8分) - 良好
- 内容较完整，覆盖大部分信息点
- 格式基本正确
- 语域较恰当
- 语法基本正确，有少量错误

### 第三档 (5-6分) - 及格
- 内容基本完整，有遗漏
- 格式有小问题
- 语域基本恰当
- 有一些语法错误

### 第四档 (3-4分) - 不及格
- 内容不完整
- 格式错误明显
- 语域不够恰当
- 语法错误较多

### 第五档 (1-2分) - 差
- 内容严重不完整
- 格式错误
- 语域不当
- 难以理解

## 格式检查清单
1. 称呼是否正确（Dear + 正确的称谓 + 逗号）
2. 落款是否正确（Yours sincerely/faithfully + 逗号）
3. 署名是否正确（Li Ming，不能用真实姓名）
4. 段落是否清晰
5. 标点符号是否正确

## 输出要求
请用JSON格式输出:
{
  "score": 0-10,
  "level": "第X档",
  "comment": "总体评价",
  "dimensions": {
    "content": {"score": 1-3, "comment": "内容评价"},
    "organization": {"score": 1-3, "comment": "结构/格式评价"},
    "language": {"score": 1-3, "comment": "语言评价"},
    "register": {"score": 0-1, "comment": "语域评价"}
  },
  "format_check": {
    "salutation": "pass/warn/fail",
    "signOff": "pass/warn/fail",
    "punctuation": "pass/warn/fail",
    "issues": ["格式问题1", "格式问题2"]
  },
  "strengths": ["亮点1", "亮点2"],
  "weaknesses": ["不足1", "不足2"],
  "improved_version": "改进后的范文",
  "checklist_reminder": ["交卷前检查项1", "交卷前检查项2"]
}`
  }
};

export const buildLetterPrompt = (type, variables = {}) => {
  const template = LETTER_PROMPT_TEMPLATES[type];
  if (!template) {
    console.error(`Letter prompt template not found: ${type}`);
    return null;
  }

  let prompt = template.template;

  const letterTypeInfo = LETTER_TYPES[variables.letterType];
  if (letterTypeInfo) {
    variables.letterTypeName = letterTypeInfo.name;
    variables.keyElements = letterTypeInfo.keyElements?.join('、') || '';
  }

  const vocabRef = VOCAB_UPGRADES[variables.letterType];
  if (vocabRef) {
    const vocabLines = Object.entries(vocabRef)
      .map(([basic, advanced]) => `- ${basic} → ${advanced.join(' / ')}`)
      .join('\n');
    variables.vocabReference = vocabLines;
  } else {
    variables.vocabReference = '无特定词汇参考';
  }

  Object.entries(variables).forEach(([key, value]) => {
    const val = Array.isArray(value) ? value.join('\n') : (value || '');
    prompt = prompt.replace(new RegExp(`{{${key}}}`, 'g'), val);
  });

  return prompt;
};

export const getLetterTypeName = (type) => {
  return LETTER_TYPES[type]?.name || type;
};

export const getLetterTypeIcon = (type) => {
  return LETTER_TYPES[type]?.icon || '📝';
};

export const getKeyElements = (type) => {
  return LETTER_TYPES[type]?.keyElements || [];
};

export const getRegister = (type) => {
  return LETTER_TYPES[type]?.register || 'formal';
};

export const getVocabUpgrades = (type) => {
  return VOCAB_UPGRADES[type] || {};
};

export const checkFormat = (text, register = 'formal') => {
  const issues = [];
  const checks = {
    salutation: 'warn',
    signOff: 'warn',
    punctuation: 'warn'
  };

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  
  const salutationLine = lines.find(l => l.toLowerCase().startsWith('dear'));
  if (salutationLine) {
    if (!salutationLine.endsWith(',')) {
      issues.push('称呼后应使用逗号');
      checks.salutation = 'fail';
    } else {
      checks.salutation = 'pass';
    }
  } else if (!text.toLowerCase().includes('notice')) {
    issues.push('缺少称呼语（Dear ...）');
    checks.salutation = 'fail';
  }

  const signOffPatterns = ['yours sincerely', 'yours faithfully', 'yours,', 'best regards', 'respectfully'];
  const hasSignOff = signOffPatterns.some(p => text.toLowerCase().includes(p));
  
  if (hasSignOff) {
    const signOffLine = lines.find(l => signOffPatterns.some(p => l.toLowerCase().includes(p)));
    if (signOffLine && !signOffLine.endsWith(',')) {
      issues.push('落款后应使用逗号');
      checks.signOff = 'warn';
    } else {
      checks.signOff = 'pass';
    }
  } else if (!text.toLowerCase().includes('notice') && !text.toLowerCase().includes('student union')) {
    issues.push('缺少落款语（Yours sincerely/faithfully）');
    checks.signOff = 'fail';
  }

  if (text.toLowerCase().includes('li ming')) {
    checks.punctuation = 'pass';
  } else if (!text.toLowerCase().includes('notice')) {
    issues.push('署名应为 Li Ming');
  }

  return { checks, issues };
};

const isPlainObject = (value) => {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
};

const asString = (value, fallback = '') => {
  if (typeof value === 'string') return value;
  if (value === null || value === undefined) return fallback;
  return String(value);
};

const asNumber = (value, fallback = 0) => {
  const num = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const clamp = (value, min, max) => {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
};

const normalizeStatus = (status, fallback = 'warn') => {
  const s = String(status || '').toLowerCase();
  if (s === 'pass' || s === 'warn' || s === 'fail') return s;
  return fallback;
};

const toStringArray = (value) => {
  if (Array.isArray(value)) {
    return value.map((x) => String(x || '').trim()).filter(Boolean);
  }
  const s = String(value || '').trim();
  return s ? [s] : [];
};

const toObjectArray = (value) => {
  if (!Array.isArray(value)) return [];
  return value.filter(isPlainObject);
};

export const normalizeEssayLogicJson = (json, { displayText } = {}) => {
  if (!isPlainObject(json)) throw new Error('AI 返回的 JSON 不是对象');

  return {
    ...json,
    status: normalizeStatus(json.status),
    comment: asString(json.comment, displayText || ''),
    suggestion: asString(json.suggestion, ''),
    keyPoints: toStringArray(json.keyPoints),
  };
};

export const normalizeEssayGrammarJson = (json, { displayText } = {}) => {
  if (!isPlainObject(json)) throw new Error('AI 返回的 JSON 不是对象');

  const grammarIssues = toObjectArray(json.grammar_issues).map((issue) => ({
    original: asString(issue.original, ''),
    correction: asString(issue.correction, ''),
    issue: asString(issue.issue, ''),
  }));

  const recommendedVocab = toObjectArray(json.recommended_vocab).map((v) => ({
    word: asString(v.word, ''),
    meaning: asString(v.meaning, ''),
    collocation: asString(v.collocation, ''),
    example: asString(v.example, ''),
    scenario: asString(v.scenario, ''),
  }));

  return {
    ...json,
    score: clamp(asNumber(json.score, 0), 0, 10),
    comment: asString(json.comment, displayText || ''),
    grammar_issues: grammarIssues,
    recommended_vocab: recommendedVocab,
    improved_version: asString(json.improved_version, ''),
  };
};

export const normalizeEssayScoringJson = (json, { displayText } = {}) => {
  if (!isPlainObject(json)) throw new Error('AI 返回的 JSON 不是对象');

  return {
    ...json,
    score: clamp(asNumber(json.score, 0), 0, 20),
    comment: asString(json.comment, displayText || ''),
    strengths: toStringArray(json.strengths),
    weaknesses: toStringArray(json.weaknesses),
  };
};

export const normalizeLetterLogicJson = (json, { displayText } = {}) => {
  if (!isPlainObject(json)) throw new Error('AI 返回的 JSON 不是对象');

  const contentCheck = isPlainObject(json.content_check) ? json.content_check : {};

  return {
    ...json,
    status: normalizeStatus(json.status),
    score: clamp(asNumber(json.score, 0), 0, 10),
    comment: asString(json.comment, displayText || ''),
    suggestion: asString(json.suggestion, ''),
    format_hints: toStringArray(json.format_hints),
    content_check: {
      covered: toStringArray(contentCheck.covered),
      missing: toStringArray(contentCheck.missing),
    },
    vocab_tips: toStringArray(json.vocab_tips),
  };
};

const normalizeFormatCheck = (formatCheck) => {
  const fc = isPlainObject(formatCheck) ? formatCheck : {};
  return {
    salutation: normalizeStatus(fc.salutation, 'warn'),
    signOff: normalizeStatus(fc.signOff, 'warn'),
    punctuation: normalizeStatus(fc.punctuation, 'warn'),
    issues: toStringArray(fc.issues),
  };
};

const normalizeDimensions = (dimensions) => {
  if (!isPlainObject(dimensions)) return {};

  const next = {};
  for (const [key, dim] of Object.entries(dimensions)) {
    if (!isPlainObject(dim)) continue;
    next[key] = {
      ...dim,
      score: asNumber(dim.score, 0),
      comment: asString(dim.comment, ''),
    };
  }
  return next;
};

export const normalizeLetterScoringJson = (json, { displayText } = {}) => {
  if (!isPlainObject(json)) throw new Error('AI 返回的 JSON 不是对象');

  return {
    ...json,
    score: clamp(asNumber(json.score, 0), 0, 10),
    level: asString(json.level, ''),
    comment: asString(json.comment, displayText || ''),
    dimensions: normalizeDimensions(json.dimensions),
    format_check: normalizeFormatCheck(json.format_check),
    strengths: toStringArray(json.strengths),
    weaknesses: toStringArray(json.weaknesses),
    improved_version: asString(json.improved_version, ''),
    checklist_reminder: toStringArray(json.checklist_reminder),
  };
};


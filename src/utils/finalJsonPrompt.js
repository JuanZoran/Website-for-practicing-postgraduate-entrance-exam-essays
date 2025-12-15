import { FINAL_JSON_END_TAG, FINAL_JSON_START_TAG } from './streamingJson';

/**
 * Build a prompt that instructs the model to output:
 * 1) A Markdown block for streaming display
 * 2) A final JSON block wrapped in <FINAL_JSON> ... </FINAL_JSON>
 */
export const buildFinalJsonPrompt = (
  basePrompt,
  {
    markdownInstruction = '先输出给学生看的中文 Markdown 反馈（用于流式展示）。',
    jsonExample = '{}',
  } = {}
) => {
  return `${basePrompt || ''}

## 输出格式（重要，支持流式展示）
请忽略上文对输出格式的要求，仅按以下格式输出。
请按两段输出：
1) ${markdownInstruction}
2) 最后一段必须输出如下包裹的 JSON（不要用 \`\`\` 包裹，不要输出任何多余字符）：
${FINAL_JSON_START_TAG}
${jsonExample}
${FINAL_JSON_END_TAG}`;
};

export default buildFinalJsonPrompt;


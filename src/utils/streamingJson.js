export const FINAL_JSON_START_TAG = '<FINAL_JSON>';
export const FINAL_JSON_END_TAG = '</FINAL_JSON>';

export const splitFinalJsonBlock = (fullText) => {
  const text = String(fullText || '');
  const start = text.lastIndexOf(FINAL_JSON_START_TAG);
  const end = text.lastIndexOf(FINAL_JSON_END_TAG);

  if (start !== -1 && end !== -1 && end > start) {
    return {
      displayText: text.slice(0, start).trimEnd(),
      jsonText: text.slice(start + FINAL_JSON_START_TAG.length, end).trim()
    };
  }

  return { displayText: text.trimEnd(), jsonText: null };
};

export const parseJsonFromResponse = (fullText) => {
  const text = String(fullText || '').trim();
  const { displayText, jsonText } = splitFinalJsonBlock(text);

  const candidates = [];
  if (jsonText) candidates.push(jsonText);

  // Fallback: fenced JSON
  const fencedJson =
    text.match(/```json\\s*([\\s\\S]*?)```/i)?.[1]?.trim() ||
    text.match(/```\\s*([\\s\\S]*?)```/)?.[1]?.trim();
  if (fencedJson) candidates.push(fencedJson);

  // Fallback: whole response as JSON
  candidates.push(text);

  for (const candidate of candidates) {
    try {
      return { json: JSON.parse(candidate), displayText };
    } catch {
      // try next
    }
  }

  return { json: null, displayText };
};


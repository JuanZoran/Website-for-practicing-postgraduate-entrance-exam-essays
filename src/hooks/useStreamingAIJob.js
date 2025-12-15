/**
 * Streaming AI job hook
 * - Handles AbortController lifecycle
 * - Manages loading + streaming preview text (with <FINAL_JSON> stripping)
 * - Parses final JSON and normalizes error objects
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { callAIStream } from '../services/aiService';
import { parseJsonFromResponse, splitFinalJsonBlock } from '../utils/streamingJson';

const EMPTY_STREAMING = { type: null, id: null, text: '' };

export const useStreamingAIJob = () => {
  const [loading, setLoading] = useState(null);
  const [streaming, setStreaming] = useState(EMPTY_STREAMING);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const abortOnly = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  }, []);

  const stopStreaming = useCallback(() => {
    abortOnly();
    setStreaming(EMPTY_STREAMING);
    setLoading(null);
  }, [abortOnly]);

  const clearError = useCallback(() => setError(null), []);

  useEffect(() => () => abortOnly(), [abortOnly]);

  /**
   * Run a streaming job that ends with a <FINAL_JSON> ... </FINAL_JSON> block.
   * @returns {Promise<{ok:boolean, json:any, displayText:string, raw:string} | null>}
   */
  const runJob = useCallback(
    async ({
      type,
      id,
      prompt,
      loadingKey = id,
      errorId = loadingKey,
      fallbackErrorMessage = '请求失败，请重试',
      normalizeJson,
      onStart,
      onSuccess,
      onError
    }) => {
      if (!prompt) return null;
      if (loading !== null) return null;

      setLoading(loadingKey);
      setError(null);
      onStart?.();
      setStreaming({ type, id: errorId, text: '' });

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await callAIStream(prompt, {
          signal: controller.signal,
          onChunk: (_chunk, fullContent) => {
            const { displayText } = splitFinalJsonBlock(fullContent);
            setStreaming({ type, id: errorId, text: displayText });
          }
        });

        if (controller.signal.aborted || !res) return null;

        const { json, displayText } = parseJsonFromResponse(res);
        if (!json) {
          throw new Error('AI 返回格式解析失败，请重试');
        }

        if (json.error || json.status === 'error') {
          const err = { message: json.error || json.message || displayText, id: errorId, type };
          setError(err);
          onError?.(err, { json, displayText, raw: res });
          return { ok: false, json, displayText, raw: res };
        }

        let normalized = json;
        if (normalizeJson) {
          normalized = normalizeJson(json, { displayText, raw: res });
        }

        if (!normalized) {
          throw new Error('AI 返回 JSON 结构异常，请重试');
        }

        onSuccess?.({ json: normalized, displayText, raw: res });
        return { ok: true, json: normalized, displayText, raw: res };
      } catch (e) {
        if (!controller.signal.aborted) {
          const err = { message: e?.message || fallbackErrorMessage, id: errorId, type };
          setError(err);
          onError?.(err, null);
        }
        return null;
      } finally {
        if (!controller.signal.aborted) {
          setLoading(null);
          setStreaming(EMPTY_STREAMING);
        }
        if (abortRef.current === controller) abortRef.current = null;
      }
    },
    [loading]
  );

  return {
    loading,
    streaming,
    error,
    runJob,
    stopStreaming,
    clearError,
    setError
  };
};

export default useStreamingAIJob;

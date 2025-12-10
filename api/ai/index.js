/**
 * Vercel Serverless Function - AI API 代理
 * 支持 DeepSeek
 */

export default async function handler(req, res) {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 先处理 OPTIONS 预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 只允许 POST 请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 手动解析请求体（Vercel Serverless Functions 可能需要）
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        return res.status(400).json({ error: 'Invalid JSON in request body' });
      }
    }
    if (!body) {
      return res.status(400).json({ error: 'Request body is required' });
    }

    const { prompt, jsonMode = false, provider = 'deepseek', model } = body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    let result;

    switch (provider) {
      case 'deepseek':
        result = await callDeepSeek(prompt, jsonMode, model);
        break;
      default:
        return res.status(400).json({ error: `Unsupported provider: ${provider}` });
    }

    return res.status(200).json({ text: result, provider, model });
  } catch (error) {
    console.error('AI API Error:', error);
    return res.status(500).json({ 
      error: error.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

/**
 * 调用 DeepSeek API
 */
async function callDeepSeek(prompt, jsonMode = false, model = 'deepseek-chat') {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  
  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY is not configured');
  }

  const url = 'https://api.deepseek.com/v1/chat/completions';
  
  const messages = [
    {
      role: 'user',
      content: prompt
    }
  ];

  // 如果启用 JSON 模式，添加系统提示
  if (jsonMode) {
    messages.unshift({
      role: 'system',
      content: 'You are a helpful assistant that responds in valid JSON format only.'
    });
  }

  const payload = {
    model: model,
    messages: messages,
    temperature: 0.7,
    ...(jsonMode && { response_format: { type: 'json_object' } })
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`DeepSeek API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "AI 暂时无法响应";
}


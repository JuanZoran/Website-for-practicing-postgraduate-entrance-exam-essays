/**
 * Cloudflare Worker - AI API
 * 支持 DeepSeek
 * 
 * 部署步骤：
 * 1. 在 Cloudflare Dashboard 创建新的 Worker
 * 2. 将此代码复制到 Worker 编辑器
 * 3. 在 Worker 设置中添加环境变量（Secrets）：
 *    - DEEPSEEK_API_KEY
 * 4. 保存并部署
 */

export default {
  async fetch(request, env, ctx) {
    return handleRequest(request, env);
  }
};

async function handleRequest(request, env) {
  // 处理 CORS 预检请求
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  // 只允许 POST 请求
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  try {
    // 解析请求体
    const body = await request.json();
    const { prompt, jsonMode = false, provider = 'deepseek', model } = body;

    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Prompt is required' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    let result;

    switch (provider) {
      case 'deepseek':
        result = await callDeepSeek(prompt, jsonMode, model, env);
        break;
      default:
        return new Response(JSON.stringify({ error: `Unsupported provider: ${provider}` }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
    }

    return new Response(JSON.stringify({ text: result, provider, model }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('AI API Error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}

/**
 * 调用 DeepSeek API
 */
async function callDeepSeek(prompt, jsonMode = false, model = 'deepseek-chat', env) {
  const apiKey = env.DEEPSEEK_API_KEY;
  
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


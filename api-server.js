/**
 * 简单的本地 API 服务器（用于开发测试）
 * 运行: node api-server.js
 */

import { createServer } from 'http';
import { parse } from 'url';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 读取环境变量
const envFile = join(__dirname, '.env.local');
let envVars = {};
try {
  const envContent = readFileSync(envFile, 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      if (value && !value.startsWith('your_') && value !== '') {
        envVars[key] = value;
      }
    }
  });
} catch (e) {
  console.warn('无法读取 .env.local 文件:', e.message);
}

const DEEPSEEK_API_KEY = envVars.DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY;

const server = createServer(async (req, res) => {
  // 设置 CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method !== 'POST' || !req.url.startsWith('/api/ai')) {
    res.writeHead(404);
    res.end('Not Found');
    return;
  }

  try {
    let body = '';
    for await (const chunk of req) {
      body += chunk.toString();
    }

    const { prompt, jsonMode = false, provider = 'deepseek', model } = JSON.parse(body);

    if (!prompt) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Prompt is required' }));
      return;
    }

    let result;

    if (provider === 'deepseek') {
      if (!DEEPSEEK_API_KEY) {
        throw new Error('DEEPSEEK_API_KEY is not configured');
      }
      result = await callDeepSeek(prompt, jsonMode, model || 'deepseek-chat');
    } else {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: `Unsupported provider: ${provider}` }));
      return;
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ text: result, provider, model: model || 'default' }));
  } catch (error) {
    console.error('API Error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: error.message }));
  }
});

async function callDeepSeek(prompt, jsonMode = false, model = 'deepseek-chat') {
  const url = 'https://api.deepseek.com/v1/chat/completions';
  
  const messages = [{ role: 'user', content: prompt }];
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
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
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

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`\n🚀 本地 API 服务器运行在 http://localhost:${PORT}`);
  console.log(`📝 DeepSeek API Key: ${DEEPSEEK_API_KEY ? '✅ 已配置' : '❌ 未配置'}\n`);
});


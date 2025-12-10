# Cloudflare Workers API 迁移指南

## 概述

将 API 从 Vercel Serverless Functions 迁移到 Cloudflare Workers，实现完全在 Cloudflare 上运行。

## 迁移步骤

### 步骤 1：创建新的 Cloudflare Worker

1. 访问 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 **Workers & Pages**
3. 点击 **Create application** > **Create Worker**
4. 给 Worker 起名，例如：`kaoyan-api`
5. 点击 **Deploy** 创建基础 Worker

### 步骤 2：部署 API 代码

1. 在 Worker 编辑器中，删除默认代码
2. 打开项目中的 `cloudflare-worker-api.js` 文件
3. 复制整个代码到 Worker 编辑器
4. 点击 **Save and deploy**

### 步骤 3：配置环境变量（重要）

在 Cloudflare Worker 中，环境变量称为 "Secrets"：

1. 在 Worker 页面，点击 **Settings** 标签
2. 滚动到 **Variables and Secrets** 部分
3. 点击 **Add variable** 或 **Encrypt** 按钮
4. 添加以下 Secrets（选择 "Encrypted" 类型）：
   - **GEMINI_API_KEY** - 您的 Gemini API Key
   - **DEEPSEEK_API_KEY** - 您的 DeepSeek API Key
   - **OPENAI_API_KEY** - 您的 OpenAI API Key（如果使用）

**注意**：在 Cloudflare Workers 中，这些变量会自动通过 `env` 参数传递，代码中已经处理好了。

### 步骤 4：代码已准备好

`cloudflare-worker-api.js` 文件已经使用正确的 Cloudflare Workers 格式：
- 使用 `export default { async fetch(request, env) }` 格式
- 环境变量通过 `env` 参数传递
- 所有 API 调用函数都已更新为接收 `env` 参数

直接复制整个文件内容到 Worker 编辑器即可。

### 步骤 5：获取 Worker 地址

部署成功后，您会看到 Worker 的地址，例如：
- `https://kaoyan-api.your-username.workers.dev`

### 步骤 6：更新前端配置

有两种方式：

#### 方式 A：更新 Cloudflare Pages 环境变量（推荐）

1. 在 Cloudflare Pages 项目设置中
2. 进入 **Settings** > **Environment variables**
3. 更新 `VITE_API_BASE_URL` 为新的 Worker 地址：
   - `https://kaoyan-api.your-username.workers.dev`
   - **注意**：只填写 Worker 地址，不需要 `/api/ai` 路径
4. 重新部署 Pages 项目

代码已经更新，会自动使用环境变量。如果设置了 `VITE_API_BASE_URL`，会直接使用 Worker 地址；否则会回退到 Vercel API (`/api/ai`)。

#### 方式 B：直接修改代码（不推荐）

如果不想使用环境变量，可以直接修改 `src/services/aiService.js`：

```javascript
const apiBaseUrl = 'https://kaoyan-api.your-username.workers.dev';
const apiUrl = apiBaseUrl || '/api/ai';
```

## 代码差异说明

### Vercel vs Cloudflare Workers

| 特性 | Vercel | Cloudflare Workers |
|------|--------|-------------------|
| 入口函数 | `export default async function handler(req, res)` | `export default { async fetch(request, env) }` |
| 请求对象 | `req.body` | `await request.json()` |
| 响应对象 | `res.json()` | `new Response(JSON.stringify())` |
| 环境变量 | `process.env.XXX` | `env.XXX` |
| CORS | `res.setHeader()` | `Response` headers |

## 测试

部署完成后：

1. 访问 Cloudflare Pages 网站
2. 尝试使用 AI 功能
3. 检查浏览器控制台的 Network 标签
4. 确认请求发送到新的 Worker 地址
5. 测试所有 AI 提供商（Gemini/DeepSeek/OpenAI）

## 故障排查

### 如果遇到 500 错误
- 检查环境变量（Secrets）是否正确配置
- 查看 Cloudflare Worker 的日志（Dashboard > Workers > 您的 Worker > Logs）

### 如果遇到 CORS 错误
- 确认 Worker 代码中的 CORS 头已正确设置
- 检查请求方法是否为 POST

### 如果 API 调用失败
- 检查 API Key 是否正确
- 查看 Worker 日志获取详细错误信息

## 优势

迁移到 Cloudflare Workers 后：

1. ✅ **完全在 Cloudflare 上**：前端和 API 都在 Cloudflare，统一管理
2. ✅ **国内访问稳定**：Cloudflare 在国内访问相对稳定
3. ✅ **免费额度充足**：每天 100,000 次请求
4. ✅ **全球边缘网络**：低延迟访问
5. ✅ **无需维护 Vercel**：减少依赖

## 注意事项

1. **环境变量安全**：Cloudflare Workers 的 Secrets 是加密存储的，比环境变量更安全
2. **代码更新**：需要同时更新 Worker 代码和前端配置
3. **测试**：迁移后充分测试所有功能
4. **备份**：保留 Vercel 版本作为备份，直到确认 Workers 版本完全正常


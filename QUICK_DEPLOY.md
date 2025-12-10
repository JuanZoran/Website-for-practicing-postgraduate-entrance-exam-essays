# 快速部署指南 - Cloudflare Workers API

## 5 分钟快速部署

### 步骤 1：创建 Cloudflare Worker（2分钟）

1. 访问 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. **Workers & Pages** > **Create application** > **Create Worker**
3. 名称：`kaoyan-api`（或您喜欢的名字）
4. 点击 **Deploy** 创建

### 步骤 2：部署代码（1分钟）

1. 在 Worker 编辑器中，**删除所有默认代码**
2. 打开项目中的 `cloudflare-worker-api.js` 文件
3. **复制整个文件内容**
4. 粘贴到 Worker 编辑器
5. 点击 **Save and deploy**

### 步骤 3：配置环境变量（2分钟）

1. 在 Worker 页面，点击 **Settings** 标签
2. 滚动到 **Variables and Secrets**
3. 点击 **Add variable** > **Encrypt**
4. 添加以下 Secrets（每个都要选择 "Encrypted"）：
   - **Variable name**: `GEMINI_API_KEY`，**Value**: 您的 Gemini API Key
   - **Variable name**: `DEEPSEEK_API_KEY`，**Value**: 您的 DeepSeek API Key
   - **Variable name**: `OPENAI_API_KEY`，**Value**: 您的 OpenAI API Key（如果使用）

### 步骤 4：获取 Worker 地址

部署成功后，您会看到 Worker 地址，例如：
- `https://kaoyan-api.your-username.workers.dev`

**复制这个地址**

### 步骤 5：更新 Cloudflare Pages 环境变量

1. 在 Cloudflare Pages 项目设置中
2. **Settings** > **Environment variables**
3. 更新 `VITE_API_BASE_URL`：
   - **Value**: `https://kaoyan-api.your-username.workers.dev`（您的 Worker 地址）
   - **注意**：只填写地址，不要包含 `/api/ai`
4. 选择环境：**Production**（或全部）
5. 点击 **Save**

### 步骤 6：重新部署 Pages

1. 在 Pages 项目的 **Deployments** 标签
2. 点击最新部署的 **...** > **Retry deployment**
3. 等待部署完成

## 完成！

现在您的网站完全运行在 Cloudflare 上：
- ✅ 前端：Cloudflare Pages
- ✅ API：Cloudflare Workers
- ✅ 国内用户可以直接访问

## 测试

1. 访问您的 Cloudflare Pages 地址
2. 尝试使用 AI 功能
3. 检查浏览器控制台，确认请求发送到 Worker 地址

## 如果遇到问题

- **API 调用失败**：检查 Worker 的环境变量（Secrets）是否正确配置
- **CORS 错误**：确认 Worker 代码已正确部署
- **404 错误**：检查 Worker 地址是否正确配置在 Pages 环境变量中

查看详细文档：`CLOUDFLARE_MIGRATION.md`


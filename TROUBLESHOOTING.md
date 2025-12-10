# 故障排查指南

## 问题：405 错误 - API 调用失败

### 症状
- 浏览器控制台显示：`/api/ai:1 Failed to load resource: the server responded with a status of 405`
- AI 功能无法使用

### 原因分析

405 错误说明请求发送到了错误的地方：
- 如果环境变量正确配置，应该发送到 Cloudflare Worker
- 如果环境变量未配置，会发送到 `/api/ai`（相对路径），这在 Cloudflare Pages 上不存在

### 解决步骤

#### 步骤 1：检查环境变量配置

1. 在 Cloudflare Dashboard 中，进入您的 **Pages** 项目
2. 点击 **Settings** > **Environment variables**
3. 确认以下配置：
   - **Variable name**: `VITE_API_BASE_URL`（必须完全一致，包括大小写）
   - **Value**: 您的 Cloudflare Worker 地址，例如：`https://kaoyan-api.your-username.workers.dev`
     - **重要**：只填写 Worker 地址，不要包含 `/api/ai` 路径
   - **Environment**: 必须选择 **Production**（或全部环境）

#### 步骤 2：检查 Worker 地址

1. 在 Cloudflare Dashboard 中，进入您的 **Worker** 项目
2. 在右侧边栏找到 **Domains & Routes**
3. 复制完整的 Worker 地址（例如：`https://kaoyan-api.your-username.workers.dev`）
4. 确认这个地址与 Pages 环境变量中的值一致

#### 步骤 3：重新部署 Pages

**重要**：修改环境变量后，必须重新部署才能生效！

1. 在 Pages 项目中，进入 **Deployments** 标签
2. 找到最新的部署记录
3. 点击右侧的 **...**（三个点）菜单
4. 选择 **Retry deployment** 或 **Redeploy**
5. 等待部署完成（通常 1-2 分钟）

#### 步骤 4：验证环境变量

部署完成后：

1. 访问您的网站
2. 打开浏览器开发者工具（F12）
3. 切换到 **Console** 标签
4. 尝试使用 AI 功能
5. 查看控制台输出，应该看到：
   ```
   [AI Service] API URL: https://kaoyan-api.your-username.workers.dev Base URL: https://kaoyan-api.your-username.workers.dev
   ```

如果看到 `Base URL: (not set)`，说明环境变量没有正确读取。

### 常见错误

#### 错误 1：环境变量名称错误
- ❌ 错误：`API_BASE_URL` 或 `VITE_API_URL`
- ✅ 正确：`VITE_API_BASE_URL`（必须以 `VITE_` 开头）

#### 错误 2：环境变量值包含路径
- ❌ 错误：`https://kaoyan-api.xxx.workers.dev/api/ai`
- ✅ 正确：`https://kaoyan-api.xxx.workers.dev`（只填写 Worker 地址）

#### 错误 3：环境变量未选择环境
- ❌ 错误：只选择了 Development
- ✅ 正确：选择 Production（或全部环境）

#### 错误 4：未重新部署
- ❌ 错误：修改环境变量后没有重新部署
- ✅ 正确：修改环境变量后必须重新部署

### 临时解决方案

如果环境变量配置有问题，可以临时修改代码：

在 `src/services/aiService.js` 中，临时硬编码 Worker 地址：

```javascript
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://kaoyan-api.your-username.workers.dev';
const apiUrl = apiBaseUrl ? apiBaseUrl : '/api/ai';
```

**注意**：这只是临时方案，建议使用环境变量。

### 其他错误

#### Firebase 权限错误
如果看到 `Missing or insufficient permissions`：
1. 检查 Firestore 安全规则是否正确配置
2. 确认规则已发布（不只是保存）

#### 其他错误
查看浏览器控制台的完整错误信息，根据具体错误进行排查。


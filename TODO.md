# 部署方案 TODO

## 📋 项目概述
将 Gemini 作文练习网站部署为跨平台 PWA 应用，支持：
- ✅ 电脑和手机同步（iOS/Android/Linux/Windows/macOS）
- ✅ 可更换 AI API（Gemini/DeepSeek/OpenAI 等）
- ✅ 便于添加新功能

## 🎯 部署架构
- **前端**: React PWA（所有平台统一代码）
- **后端**: Vercel Serverless Functions（API 代理）
- **数据同步**: Firebase Firestore
- **部署平台**: Vercel（免费）

---

## 📝 任务清单

### 阶段一：项目基础配置 ⏳

#### 1.1 创建项目配置文件
- [x] 创建 `package.json` - 项目依赖和脚本
- [x] 创建 `vite.config.js` - Vite 构建配置
- [x] 创建 `tailwind.config.js` - Tailwind CSS 配置
- [x] 创建 `postcss.config.js` - PostCSS 配置
- [x] 创建 `vercel.json` - Vercel 部署配置

#### 1.2 创建项目入口文件
- [x] 创建 `index.html` - HTML 入口（包含 Firebase 配置占位符）
- [x] 创建 `src/main.jsx` - React 应用入口
- [x] 创建 `src/index.css` - 全局样式（Tailwind）

#### 1.3 重构现有代码
- [x] 将 `composition.jsx` 移动到 `src/` 目录
- [x] 更新所有导入路径
- [x] 测试本地运行是否正常

---

### 阶段二：AI 服务抽象化 🔧 ✅

#### 2.1 创建 AI 服务层
- [x] 创建 `src/services/aiService.js` - AI 服务抽象层
  - [x] 实现统一的 `call()` 方法
  - [x] 支持多提供商切换（gemini/deepseek/openai/claude）
  - [x] 实现提供商配置管理（localStorage）
  - [x] 提供提供商列表获取方法

#### 2.2 创建后端 API 代理
- [x] 创建 `api/ai/index.js` - Vercel Serverless Function
  - [x] 实现 Gemini API 调用
  - [x] 实现 DeepSeek API 调用
  - [x] 实现 OpenAI API 调用（可选）
  - [x] 实现错误处理和日志记录
  - [x] 支持 JSON 模式

#### 2.3 更新前端代码
- [x] 在 `composition.jsx` 中替换 `callGemini` 为 `callAI`
- [x] 更新所有 AI 调用使用新的服务层
- [x] 测试 AI 调用是否正常工作

---

### 阶段三：AI 提供商切换 UI 🎨 ✅

#### 3.1 创建设置组件
- [x] 创建 `src/components/AISettings.jsx` - AI 提供商设置组件
  - [x] 显示当前使用的提供商
  - [x] 提供商列表选择器
  - [x] 模型选择（如果提供商支持多个模型）
  - [x] 设置保存功能

#### 3.2 集成到主应用
- [x] 在导航栏添加设置按钮
- [x] 实现设置模态框/抽屉
- [x] 添加提供商切换逻辑
- [x] 测试切换功能

---

### 阶段四：PWA 配置 📱 ✅

#### 4.1 安装 PWA 插件
- [x] 安装 `vite-plugin-pwa` 依赖
- [x] 更新 `vite.config.js` 添加 PWA 插件配置

#### 4.2 创建 PWA 资源
- [x] 创建 `public/manifest.json` - PWA 清单文件
- [x] 准备应用图标（192x192 和 512x512）
  - [x] 创建 `public/icon-192.png`
  - [x] 创建 `public/icon-512.png`
- [x] 配置 Service Worker（自动生成）

#### 4.3 测试 PWA 功能
- [x] 本地测试 PWA 安装提示
- [x] 测试离线功能
- [x] 测试添加到主屏幕

---

### 阶段五：Firebase 配置 🔥 ✅

#### 5.1 Firebase 项目设置
- [x] 在 Firebase Console 创建项目
- [x] 启用 Firestore Database
- [x] 配置安全规则（允许匿名用户读写）
- [x] 获取 Firebase 配置信息

#### 5.2 更新前端配置
- [x] 在 `index.html` 中替换 Firebase 配置占位符
- [x] 测试 Firebase 连接
- [x] 测试数据同步功能

---

### 阶段六：环境变量配置 🔐 ✅

#### 6.1 准备环境变量
- [x] 获取 Gemini API Key
- [x] 获取 DeepSeek API Key（如需要）
- [x] 获取 OpenAI API Key（如需要）
- [x] 准备 Firebase 配置

#### 6.2 创建环境变量文件
- [x] 创建 `.env.example` - 环境变量模板
- [x] 创建 `.env.local` - 本地开发环境变量（不提交到 Git）
- [x] 更新 `.gitignore` 忽略 `.env.local`

---

### 阶段七：代码优化和测试 🧪

#### 7.1 代码优化
- [ ] 检查并修复所有 ESLint 警告
- [ ] 优化组件性能（React.memo 等）
- [ ] 添加错误边界（Error Boundary）
- [ ] 优化加载状态和错误提示

#### 7.2 功能测试
- [ ] 测试作文练习流程
- [ ] 测试词汇收藏功能
- [ ] 测试错题记录功能
- [ ] 测试历史记录功能
- [ ] 测试 AI 提供商切换
- [ ] 测试数据同步（多设备）

#### 7.3 跨平台测试
- [ ] 在 Chrome 浏览器测试
- [ ] 在 Firefox 浏览器测试
- [ ] 在 Safari 浏览器测试（iOS）
- [ ] 在 Android Chrome 测试
- [ ] 测试响应式布局（移动端/桌面端）

---

### 阶段八：Git 和版本控制 📦 ✅

#### 8.1 初始化 Git 仓库
- [x] 初始化 Git：`git init`
- [x] 创建 `.gitignore` 文件
- [x] 添加所有文件到 Git
- [x] 创建初始提交

#### 8.2 准备 GitHub 仓库
- [x] 在 GitHub 创建新仓库
- [x] 添加远程仓库地址
- [x] 推送代码到 GitHub

---

### 阶段九：Vercel 部署 🚀

#### 9.1 Vercel 账号设置
- [x] 注册 Vercel 账号（使用 GitHub 登录）
- [x] 连接 GitHub 账号

#### 9.2 项目部署
- [x] 在 Vercel 导入 GitHub 项目
- [x] 配置构建设置
  - [x] 构建命令：`npm run build`
  - [x] 输出目录：`dist`
  - [x] 安装命令：`npm install`

#### 9.3 环境变量配置
- [x] 在 Vercel 项目设置中添加环境变量：
  - [x] `GEMINI_API_KEY`
  - [x] `DEEPSEEK_API_KEY`（如需要）
  - [x] `OPENAI_API_KEY`（如需要）
- [x] 验证环境变量已正确设置

#### 9.4 部署验证
- [x] 等待首次部署完成
- [x] 访问部署的网站（`your-app.vercel.app`）
- [x] 测试所有功能是否正常
- [x] 检查控制台是否有错误

---

### 阶段十：文档和后续优化 📚

#### 10.1 创建文档
- [ ] 创建 `README.md` - 项目说明文档
  - [ ] 项目介绍
  - [ ] 功能特性
  - [ ] 安装和运行说明
  - [ ] 部署说明
  - [ ] 环境变量配置说明
- [ ] 创建 `DEPLOYMENT.md` - 部署详细指南

#### 10.2 后续优化（可选）
- [ ] 添加使用统计（可选）
- [ ] 添加用户反馈功能（可选）
- [ ] 性能监控（可选）
- [ ] 自定义域名配置（可选）

---

## 🎯 优先级说明

### 高优先级（必须完成）
1. ✅ 阶段一：项目基础配置
2. ✅ 阶段二：AI 服务抽象化
3. ✅ 阶段三：AI 提供商切换 UI
4. ✅ 阶段五：Firebase 配置
5. ✅ 阶段六：环境变量配置
6. ✅ 阶段八：Git 和版本控制
7. ✅ 阶段九：Vercel 部署

### 中优先级（建议完成）
1. ✅ 阶段四：PWA 配置（提升用户体验）
2. ⚠️ 阶段七：代码优化和测试（确保稳定性）

### 低优先级（可选）
1. 📝 阶段十：文档和后续优化

---

## 📊 进度跟踪

- **总任务数**: ~50 项
- **已完成**: 30+ 项
- **进行中**: 0 项
- **待开始**: ~20 项

### ✅ 已完成阶段
- 阶段一：项目基础配置
- 阶段二：AI 服务抽象化
- 阶段三：AI 提供商切换 UI
- 阶段四：PWA 配置
- 阶段五：Firebase 配置
- 阶段六：环境变量配置

---

## 🔗 相关资源

- [Vercel 文档](https://vercel.com/docs)
- [Firebase 文档](https://firebase.google.com/docs)
- [Vite PWA 插件](https://vite-pwa-org.netlify.app/)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)

---

## 📝 注意事项

1. **API 密钥安全**：永远不要将 API 密钥提交到 Git，使用环境变量
2. **Firebase 安全规则**：确保配置正确的 Firestore 安全规则
3. **测试环境**：在本地充分测试后再部署到生产环境
4. **备份数据**：定期导出用户数据作为备份

---

## ✅ 完成检查清单

部署完成后，请确认：
- [ ] 网站可以正常访问
- [ ] 所有功能正常工作
- [ ] AI 调用成功
- [ ] 数据可以同步
- [x] PWA 可以安装
- [ ] 移动端显示正常
- [ ] 没有控制台错误
- [ ] 环境变量已正确配置

---

**最后更新**: 2025-01-10
**状态**: 🟢 阶段一、二、三、四、五、六已完成


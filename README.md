# DeepSeek Chat Clone

一个类似 DeepSeek 聊天界面的前端单页应用，采用 Vue 3 + TypeScript + Vite 技术栈，具备扁平化设计和良好的用户体验。

## 功能特性

- 🎨 **现代化界面** - 类似 DeepSeek 的扁平化设计风格
- 💬 **实时聊天** - 支持消息发送、接收和显示
- 📱 **响应式设计** - 适配桌面和移动设备
- 🔐 **认证集成** - 预留后端认证接口
- 🚀 **TypeScript** - 完整的类型支持
- ⚡ **Vite 构建** - 快速的开发体验

## 技术栈

- **前端框架**: Vue 3 + Composition API
- **开发语言**: TypeScript
- **构建工具**: Vite
- **状态管理**: Pinia
- **路由管理**: Vue Router
- **HTTP 客户端**: Axios
- **样式**: CSS3 + Flexbox/Grid

## 项目结构

```
src/
├── components/          # 可复用组件
├── views/               # 页面组件
│   └── ChatPage.vue     # 主聊天页面
├── stores/              # 状态管理
│   ├── auth.ts         # 认证状态
│   └── chat.ts         # 聊天状态
├── services/            # API 服务
│   └── api.ts          # 接口封装
├── router/              # 路由配置
│   └── index.ts        # 路由定义
└── main.ts             # 应用入口
```

## 快速开始

### 环境要求

- Node.js ≥ 18.0.0
- pnpm ≥ 8.0.0（推荐使用项目指定的 8.15.0）

### 安装依赖

```bash
pnpm install
```

### 配置环境变量

复制 `.env.example` 为 `.env.local` 并修改配置：

```bash
cp .env.example .env.local
```

编辑 `.env.local` 文件，设置后端 API 地址：

```env
VITE_BACKEND_URL=http://your-backend-api.com
```

### 开发模式

```bash
pnpm dev
```

访问 http://localhost:3000

### 构建生产版本

```bash
pnpm build
```

### 预览构建结果

```bash
pnpm preview
```

## API 接口说明

### 认证接口

- `POST /auth/login` - 用户登录
- `POST /auth/register` - 用户注册
- `GET /auth/profile` - 获取用户信息
- `POST /auth/refresh` - 刷新 token

### 聊天接口

- `GET /chat/sessions` - 获取会话列表
- `POST /chat/sessions` - 创建新会话
- `GET /chat/sessions/:id` - 获取会话详情
- `POST /chat/messages` - 发送消息
- `DELETE /chat/sessions/:id` - 删除会话
- `PATCH /chat/sessions/:id` - 重命名会话

### 用户接口

- `GET /user/info` - 获取用户信息
- `GET /user/usage` - 获取使用情况
- `PATCH /user/info` - 更新用户信息
- `POST /user/change-password` - 修改密码

### 流式聊天

支持 Server-Sent Events (SSE) 的流式响应：

```typescript
const stream = new ChatStream()
stream.connect(sessionId)
stream.onMessage((data) => {
  // 处理实时消息
})
```

## 状态管理

### 认证状态 (auth store)

管理用户登录状态、token 和用户信息。

```typescript
const authStore = useAuthStore()

// 检查是否已认证
authStore.isAuthenticated

// 设置 token
authStore.setToken('your-jwt-token')

// 清除认证信息
authStore.clearAuth()
```

### 聊天状态 (chat store)

管理聊天会话、消息和加载状态。

```typescript
const chatStore = useChatStore()

// 当前会话
chatStore.currentSession

// 当前消息列表
chatStore.currentMessages

// 添加新会话
chatStore.addSession(newSession)
```

## 开发指南

### 添加新页面

1. 在 `src/views/` 目录创建 Vue 组件
2. 在 `src/router/index.ts` 中添加路由配置
3. 更新导航菜单（如需要）

### 添加新 API 接口

1. 在 `src/services/api.ts` 中定义接口类型和方法
2. 在对应的 store 中添加状态管理逻辑
3. 在组件中调用 API 方法

### 样式规范

- 使用 CSS 变量定义主题色彩
- 采用 BEM 命名规范
- 移动端优先的响应式设计
- 保持扁平化设计风格

## 浏览器兼容性

- Chrome ≥ 88
- Firefox ≥ 78
- Safari ≥ 14
- Edge ≥ 88

## 部署说明

### 构建优化

项目已配置 Vite 的生产构建优化：

- 代码分割
- Tree shaking
- 资源压缩
- 预加载优化

### 服务器配置

部署时需要配置服务器支持 SPA 路由：

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 许可证

MIT License

## 联系方式

如有问题或建议，请通过以下方式联系：

- 提交 Issue
- 发送邮件

---

**注意**: 本项目为前端界面实现，需要配合后端 API 服务使用。后端接口规范请参考 API 接口说明部分。
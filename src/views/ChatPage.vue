<template>
  <div class="chat-container">
    <!-- 侧边栏 -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <h2>DeepSeek Chat</h2>
        <button class="new-chat-btn" @click="startNewChat">
          <span>+</span> 新对话
        </button>
      </div>
      
      <div class="chat-history">
        <div 
          v-for="chat in chatHistory" 
          :key="chat.id"
          class="chat-item"
          :class="{ active: currentChatId === chat.id }"
          @click="switchChat(chat.id)"
        >
          <span class="chat-title">{{ chat.title }}</span>
          <span class="chat-date">{{ formatDate(chat.lastActive) }}</span>
        </div>
      </div>
      
      <div class="sidebar-footer">
        <div class="user-info" @click="toggleUserMenu">
          <div class="user-avatar">{{ currentUser.avatar }}</div>
          <div class="user-details">
            <span class="user-name">{{ currentUser.name }}</span>
            <span class="user-status">{{ currentUser.status }}</span>
          </div>
        </div>
        
        <!-- 用户菜单 -->
        <div v-if="showUserMenu" class="user-menu" @click.stop>
          <!-- 未登录状态 -->
          <div v-if="!isLoggedIn" class="menu-section">
            <div class="menu-item" @click="showLoginDialog = true; showUserMenu = false">
              <span class="menu-icon">🔑</span>
              <span>登录</span>
            </div>
            <div class="menu-item" @click="showRegisterDialog = true; showUserMenu = false">
              <span class="menu-icon">📝</span>
              <span>注册</span>
            </div>
          </div>
          
          <!-- 已登录状态 -->
          <div v-if="isLoggedIn" class="menu-section">
            <div class="menu-header">
              <span class="menu-avatar">{{ currentUser.avatar }}</span>
              <div class="menu-user-info">
                <span class="menu-user-name">{{ currentUser.name }}</span>
                <span class="menu-user-status">{{ currentUser.status }}</span>
              </div>
            </div>
            <div class="menu-divider"></div>
            <div class="menu-item" @click="showApiKeyDialog = true; showUserMenu = false">
              <span class="menu-icon">🔑</span>
              <span>设置 API Key</span>
            </div>
            <div class="menu-item" @click="logout">
              <span class="menu-icon">🚪</span>
              <span>退出登录</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 登录弹窗 -->
      <div v-if="showLoginDialog" class="modal-overlay" @click="showLoginDialog = false">
        <div class="modal-content auth-modal" @click.stop>
          <div class="modal-header">
            <h3>登录</h3>
            <button class="close-btn" @click="showLoginDialog = false">×</button>
          </div>
          <div class="modal-body">
            <div class="input-group">
              <label for="loginEmail">邮箱地址:</label>
              <input
                id="loginEmail"
                type="email"
                v-model="loginForm.email"
                placeholder="请输入邮箱地址"
                class="auth-input"
              />
            </div>
            <div class="input-group">
              <label for="loginPassword">密码:</label>
              <input
                id="loginPassword"
                type="password"
                v-model="loginForm.password"
                placeholder="请输入密码"
                class="auth-input"
              />
            </div>
            <div class="auth-footer">
              <p>还没有账号？ <a href="#" @click="switchToRegister">立即注册</a></p>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" @click="showLoginDialog = false">取消</button>
            <button class="btn-primary" @click="login">登录</button>
          </div>
        </div>
      </div>

      <!-- 注册弹窗 -->
      <div v-if="showRegisterDialog" class="modal-overlay" @click="showRegisterDialog = false">
        <div class="modal-content auth-modal" @click.stop>
          <div class="modal-header">
            <h3>注册账号</h3>
            <button class="close-btn" @click="showRegisterDialog = false">×</button>
          </div>
          <div class="modal-body">
            <div class="input-group">
              <label for="registerName">用户名:</label>
              <input
                id="registerName"
                type="text"
                v-model="registerForm.name"
                placeholder="请输入用户名"
                class="auth-input"
              />
            </div>
            <div class="input-group">
              <label for="registerEmail">邮箱地址:</label>
              <input
                id="registerEmail"
                type="email"
                v-model="registerForm.email"
                placeholder="请输入邮箱地址"
                class="auth-input"
              />
            </div>
            <div class="input-group">
              <label for="registerPassword">密码:</label>
              <input
                id="registerPassword"
                type="password"
                v-model="registerForm.password"
                placeholder="请输入密码（至少6位）"
                class="auth-input"
              />
            </div>
            <div class="input-group">
              <label for="confirmPassword">确认密码:</label>
              <input
                id="confirmPassword"
                type="password"
                v-model="registerForm.confirmPassword"
                placeholder="请再次输入密码"
                class="auth-input"
              />
            </div>
            <div class="auth-footer">
              <p>已有账号？ <a href="#" @click="switchToLogin">立即登录</a></p>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" @click="showRegisterDialog = false">取消</button>
            <button class="btn-primary" @click="register">注册</button>
          </div>
        </div>
      </div>

      <!-- API Key 输入弹窗 -->
      <div v-if="showApiKeyDialog" class="modal-overlay" @click="showApiKeyDialog = false">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3>设置 API Key</h3>
            <button class="close-btn" @click="showApiKeyDialog = false">×</button>
          </div>
          <div class="modal-body">
            <div class="input-group">
              <label for="apiKey">DeepSeek API Key:</label>
              <input
                id="apiKey"
                type="password"
                v-model="apiKey"
                placeholder="请输入您的 API Key"
                class="api-key-input"
              />
            </div>
            <div class="hint-text">
              <p>🔒 您的 API Key 将安全存储在本地浏览器中</p>
              <p>🌐 获取 API Key: <a href="https://platform.deepseek.com/api_keys" target="_blank" class="link">DeepSeek 控制台</a></p>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" @click="showApiKeyDialog = false">取消</button>
            <button class="btn-primary" @click="saveApiKey">保存</button>
          </div>
        </div>
      </div>
    </aside>

    <!-- 主聊天区域 -->
    <main class="chat-main">
      <div class="chat-header">
        <h3>{{ currentChatTitle }}</h3>
        <div class="chat-actions">
          <button class="action-btn" title="清空对话">🗑️</button>
          <button class="action-btn" title="分享">📤</button>
        </div>
      </div>

      <div class="messages-container" ref="messagesContainer">
        <div 
          v-for="message in currentMessages" 
          :key="message.id"
          class="message"
          :class="{ 'user-message': message.role === 'user', 'assistant-message': message.role === 'assistant' }"
        >
          <div class="message-avatar">
            {{ message.role === 'user' ? '👤' : '🤖' }}
          </div>
          <div class="message-content">
            <div class="message-text">{{ message.content }}</div>
            <div class="message-time">{{ formatTime(message.timestamp) }}</div>
          </div>
        </div>
        
        <div v-if="isLoading" class="loading-indicator">
          <div class="typing-animation">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>

      <div class="input-container">
        <div class="input-wrapper">
          <textarea
            v-model="inputMessage"
            placeholder="输入消息..."
            @keydown="handleKeydown"
            rows="1"
            ref="messageInput"
            class="message-input"
          ></textarea>
          <button 
            @click="sendMessage" 
            :disabled="!inputMessage.trim() || isLoading"
            class="send-btn"
          >
            <span>发送</span>
          </button>
        </div>
        <div class="input-footer">
          <span class="hint-text">按 Enter 发送，Shift + Enter 换行</span>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface Chat {
  id: string
  title: string
  messages: Message[]
  lastActive: Date
}

// 响应式数据
const inputMessage = ref('')
const isLoading = ref(false)
const currentChatId = ref('')
const messagesContainer = ref<HTMLElement>()
const messageInput = ref<HTMLTextAreaElement>()
const showApiKeyDialog = ref(false)
const apiKey = ref('')
const showUserMenu = ref(false)

// 用户数据
interface User {
  id: string
  name: string
  avatar: string
  status: string
  isLoggedIn: boolean
  email?: string
}

// 模拟用户数据库
const mockUsers = [
  { id: 'user1', name: '张三', avatar: '👤', status: '在线', isLoggedIn: true, email: 'zhangsan@example.com' },
  { id: 'user2', name: '李四', avatar: '👨‍💼', status: '在线', isLoggedIn: true, email: 'lisi@example.com' }
]

// 访客用户
const guestUser: User = { id: 'guest', name: '访客', avatar: '👤', status: '未登录', isLoggedIn: false }

// 响应式数据
const currentUser = ref<User>(guestUser)
const isLoggedIn = ref(false)
const showLoginDialog = ref(false)
const showRegisterDialog = ref(false)
const loginForm = ref({
  email: '',
  password: ''
})
const registerForm = ref({
  name: '',
  email: '',
  password: '',
  confirmPassword: ''
})

// 模拟聊天历史数据
const chatHistory = ref<Chat[]>([
  {
    id: '1',
    title: '欢迎对话',
    messages: [
      {
        id: '1-1',
        role: 'assistant',
        content: '你好！我是DeepSeek AI助手，很高兴为你服务。有什么我可以帮助你的吗？',
        timestamp: new Date(Date.now() - 3600000)
      }
    ],
    lastActive: new Date(Date.now() - 3600000)
  }
])

// 计算属性
const currentChat = computed(() => 
  chatHistory.value.find(chat => chat.id === currentChatId.value)
)

const currentMessages = computed(() => 
  currentChat.value?.messages || []
)

const currentChatTitle = computed(() => 
  currentChat.value?.title || '新对话'
)

// 方法
const startNewChat = () => {
  const newChat: Chat = {
    id: Date.now().toString(),
    title: '新对话',
    messages: [],
    lastActive: new Date()
  }
  chatHistory.value.unshift(newChat)
  currentChatId.value = newChat.id
  focusInput()
}

const switchChat = (chatId: string) => {
  currentChatId.value = chatId
}

const sendMessage = async () => {
  if (!inputMessage.value.trim() || isLoading.value) return

  const userMessage: Message = {
    id: Date.now().toString(),
    role: 'user',
    content: inputMessage.value.trim(),
    timestamp: new Date()
  }

  // 添加到当前聊天
  if (currentChat.value) {
    currentChat.value.messages.push(userMessage)
    
    // 如果是新对话，更新标题
    if (currentChat.value.title === '新对话') {
      currentChat.value.title = inputMessage.value.trim().slice(0, 20) + '...'
    }
    
    currentChat.value.lastActive = new Date()
  }

  const messageText = inputMessage.value.trim()
  inputMessage.value = ''
  isLoading.value = true

  // 模拟AI回复
  setTimeout(() => {
    if (currentChat.value) {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `这是对"${messageText}"的模拟回复。在实际应用中，这里会调用AI API来获取真实回复。`,
        timestamp: new Date()
      }
      currentChat.value.messages.push(assistantMessage)
      currentChat.value.lastActive = new Date()
    }
    isLoading.value = false
    scrollToBottom()
  }, 1000)

  scrollToBottom()
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    sendMessage()
  }
}

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

const focusInput = () => {
  nextTick(() => {
    messageInput.value?.focus()
  })
}

const formatDate = (date: Date) => {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  if (diff < 3600000) { // 1小时内
    return '刚刚'
  } else if (diff < 86400000) { // 24小时内
    return '今天'
  } else if (diff < 172800000) { // 48小时内
    return '昨天'
  } else {
    return date.toLocaleDateString('zh-CN')
  }
}

const formatTime = (date: Date) => {
  return date.toLocaleTimeString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

// 用户相关方法
const toggleUserMenu = () => {
  showUserMenu.value = !showUserMenu.value
}

// 登录注册相关方法
const switchToRegister = () => {
  showLoginDialog.value = false
  showRegisterDialog.value = true
}

const switchToLogin = () => {
  showRegisterDialog.value = false
  showLoginDialog.value = true
}

const login = () => {
  if (!loginForm.value.email || !loginForm.value.password) {
    alert('请输入邮箱和密码')
    return
  }
  
  // 模拟登录验证
  const user = mockUsers.find(u => u.email === loginForm.value.email)
  if (user) {
    currentUser.value = { ...user, status: '在线' }
    isLoggedIn.value = true
    showLoginDialog.value = false
    loginForm.value = { email: '', password: '' }
    console.log('登录成功:', user.name)
  } else {
    alert('邮箱或密码错误，请重试')
  }
}

const register = () => {
  if (!registerForm.value.name || !registerForm.value.email || !registerForm.value.password) {
    alert('请填写所有必填字段')
    return
  }
  
  if (registerForm.value.password.length < 6) {
    alert('密码长度至少6位')
    return
  }
  
  if (registerForm.value.password !== registerForm.value.confirmPassword) {
    alert('两次输入的密码不一致')
    return
  }
  
  // 检查邮箱是否已存在
  if (mockUsers.some(u => u.email === registerForm.value.email)) {
    alert('该邮箱已被注册')
    return
  }
  
  // 模拟注册成功
  const newUser = {
    id: `user${mockUsers.length + 1}`,
    name: registerForm.value.name,
    avatar: '👤',
    status: '在线',
    isLoggedIn: true,
    email: registerForm.value.email
  }
  
  mockUsers.push(newUser)
  currentUser.value = newUser
  isLoggedIn.value = true
  showRegisterDialog.value = false
  registerForm.value = { name: '', email: '', password: '', confirmPassword: '' }
  console.log('注册成功:', newUser.name)
}

const logout = () => {
  currentUser.value = guestUser
  isLoggedIn.value = false
  showUserMenu.value = false
  console.log('用户已退出登录')
  alert('已退出登录')
}

// API Key 相关方法
const saveApiKey = () => {
  if (!isLoggedIn.value) {
    alert('请先登录后再设置 API Key')
    showApiKeyDialog.value = false
    showLoginDialog.value = true
    return
  }
  
  if (!apiKey.value.trim()) {
    alert('请输入有效的API Key')
    return
  }
  
  // 保存API Key的逻辑
  console.log('API Key已保存:', apiKey.value)
  showApiKeyDialog.value = false
  apiKey.value = ''
}

// 生命周期
onMounted(() => {
  if (chatHistory.value.length > 0) {
    currentChatId.value = chatHistory.value[0].id
  }
  focusInput()
  
  // 加载已保存的 API Key
  const savedApiKey = localStorage.getItem('deepseek-api-key')
  if (savedApiKey) {
    apiKey.value = savedApiKey
  }
  
  // 添加全局点击事件监听器，用于关闭用户菜单
  const handleClickOutside = (event: MouseEvent) => {
    if (showUserMenu.value) {
      const userMenu = document.querySelector('.user-menu')
      const userInfo = document.querySelector('.user-info')
      
      if (userMenu && userInfo && 
          !userMenu.contains(event.target as Node) && 
          !userInfo.contains(event.target as Node)) {
        showUserMenu.value = false
      }
    }
  }
  
  document.addEventListener('click', handleClickOutside)
  
  // 清理事件监听器
  return () => {
    document.removeEventListener('click', handleClickOutside)
  }
})
</script>

<style scoped>
.chat-container {
  display: flex;
  height: 100vh;
  background: #fff;
}

/* 侧边栏样式 */
.sidebar {
  width: 280px;
  background: #f8f9fa;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
}

.sidebar-header h2 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 15px;
  color: #333;
}

.new-chat-btn {
  width: 100%;
  padding: 10px 16px;
  background: #10a37f;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background-color 0.2s;
}

.new-chat-btn:hover {
  background: #0d8a6a;
}

.chat-history {
  flex: 1;
  overflow-y: auto;
  padding: 10px 0;
}

.chat-item {
  padding: 12px 20px;
  cursor: pointer;
  border-left: 3px solid transparent;
  transition: all 0.2s;
}

.chat-item:hover {
  background: #edf2f7;
}

.chat-item.active {
  background: #e3f2fd;
  border-left-color: #1976d2;
}

.chat-title {
  display: block;
  font-size: 14px;
  color: #333;
  margin-bottom: 4px;
}

.chat-date {
  font-size: 12px;
  color: #666;
}

.sidebar-footer {
  padding: 20px;
  border-top: 1px solid #e0e0e0;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-avatar {
  width: 32px;
  height: 32px;
  background: #ddd;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.user-name {
  font-size: 14px;
  color: #333;
}

/* 主聊天区域样式 */
.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.chat-header {
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chat-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.chat-actions {
  display: flex;
  gap: 10px;
}

.action-btn {
  padding: 8px;
  background: none;
  border: none;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.action-btn:hover {
  background: #f5f5f5;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.message {
  display: flex;
  gap: 12px;
  max-width: 80%;
}

.message.user-message {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.message.assistant-message {
  align-self: flex-start;
}

.message-avatar {
  width: 32px;
  height: 32px;
  background: #f0f0f0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
}

.message-content {
  background: #f8f9fa;
  padding: 12px 16px;
  border-radius: 12px;
  position: relative;
}

.user-message .message-content {
  background: #007bff;
  color: white;
}

.message-text {
  font-size: 14px;
  line-height: 1.5;
  word-wrap: break-word;
}

.message-time {
  font-size: 11px;
  color: #666;
  margin-top: 4px;
}

.user-message .message-time {
  color: rgba(255, 255, 255, 0.8);
}

.loading-indicator {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.typing-animation {
  display: flex;
  gap: 4px;
}

.typing-animation span {
  width: 8px;
  height: 8px;
  background: #666;
  border-radius: 50%;
  animation: typing 1.4s infinite ease-in-out;
}

.typing-animation span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-animation span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  30% {
    transform: translateY(-10px);
    opacity: 1;
  }
}

/* 输入区域样式 */
.input-container {
  padding: 20px;
  border-top: 1px solid #e0e0e0;
}

.input-wrapper {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.message-input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  resize: none;
  font-size: 14px;
  line-height: 1.5;
  max-height: 120px;
  outline: none;
  transition: border-color 0.2s;
}

.message-input:focus {
  border-color: #007bff;
}

.send-btn {
  padding: 12px 24px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.send-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.send-btn:not(:disabled):hover {
  background: #0056b3;
}

.input-footer {
  margin-top: 8px;
  text-align: center;
}

.hint-text {
  font-size: 12px;
  color: #666;
}

/* 弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 480px;
  max-width: 90vw;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  padding: 4px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background: #f5f5f5;
}

.modal-body {
  padding: 24px;
}

.input-group {
  margin-bottom: 20px;
}

.input-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

.api-key-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

.api-key-input:focus {
  border-color: #007bff;
}

.modal-footer {
  padding: 20px 24px;
  border-top: 1px solid #e0e0e0;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.btn-primary {
  padding: 10px 20px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.btn-primary:hover {
  background: #0056b3;
}

.btn-secondary {
  padding: 10px 20px;
  background: #f8f9fa;
  color: #333;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.btn-secondary:hover {
  background: #e9ecef;
}

.link {
  color: #007bff;
  text-decoration: none;
}

.link:hover {
  text-decoration: underline;
}

/* 用户信息区域 */
.user-info {
  cursor: pointer;
  padding: 12px;
  border-radius: 8px;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-info:hover {
  background: #edf2f7;
}

.user-avatar {
  width: 32px;
  height: 32px;
  background: #ddd;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
}

.user-name {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.user-status {
  font-size: 12px;
  color: #666;
  margin-left: auto;
}

/* 登录注册弹窗样式 */
.auth-modal {
  width: 400px;
}

.auth-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

.auth-input:focus {
  border-color: #007bff;
}

.auth-footer {
  text-align: center;
  margin-top: 20px;
}

.auth-footer a {
  color: #007bff;
  text-decoration: none;
  cursor: pointer;
}

.auth-footer a:hover {
  text-decoration: underline;
}

.menu-section {
  padding: 8px 0;
}

.menu-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
}

/* 用户菜单 */
.user-menu {
  position: absolute;
  bottom: 70px;
  left: 20px;
  right: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  border: 1px solid #e0e0e0;
  z-index: 100;
  animation: menuSlideIn 0.2s ease-out;
}

@keyframes menuSlideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  border: none;
  background: none;
  width: 100%;
  text-align: left;
}

.menu-item:hover {
  background: #f8f9fa;
}

.menu-avatar {
  width: 32px;
  height: 32px;
  background: #f0f0f0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
}

.menu-user-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.menu-user-name {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.menu-user-status {
  font-size: 12px;
  color: #666;
}

.menu-check {
  color: #007bff;
  font-weight: bold;
  font-size: 16px;
}

.menu-icon {
  width: 20px;
  text-align: center;
  font-size: 14px;
}

.menu-divider {
  height: 1px;
  background: #e0e0e0;
  margin: 4px 0;
}

.sidebar-footer {
  position: relative;
}

.send-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.send-btn:not(:disabled):hover {
  background: #0056b3;
}

.input-footer {
  margin-top: 8px;
}

.hint-text {
  font-size: 12px;
  color: #666;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .sidebar {
    width: 100%;
    position: absolute;
    z-index: 10;
    height: 100%;
    transform: translateX(-100%);
    transition: transform 0.3s;
  }
  
  .sidebar.open {
    transform: translateX(0);
  }
  
  .message {
    max-width: 90%;
  }
}
</style>
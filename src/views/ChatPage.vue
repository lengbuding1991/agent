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
            <button class="btn-secondary" @click="showLoginDialog = false" :disabled="loginLoading">取消</button>
            <button class="btn-primary" @click="login" :disabled="loginLoading">
              <span v-if="loginLoading" class="loading-spinner"></span>
              {{ loginLoading ? '登录中...' : '登录' }}
            </button>
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
            <button class="btn-secondary" @click="showRegisterDialog = false" :disabled="registerLoading">取消</button>
            <button class="btn-primary" @click="register" :disabled="registerLoading">
              <span v-if="registerLoading" class="loading-spinner"></span>
              {{ registerLoading ? '注册中...' : '注册' }}
            </button>
          </div>
        </div>
      </div>

      <!-- API Key 输入弹窗 -->
      <div v-if="showApiKeyDialog" class="modal-overlay" @click="showApiKeyDialog = false">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3>设置 AI 模型配置</h3>
            <button class="close-btn" @click="showApiKeyDialog = false">×</button>
          </div>
          <div class="modal-body">
            <!-- 模型类型选择 -->
            <div class="input-group">
              <label>选择 AI 模型:</label>
              <div class="radio-group">
                <label class="radio-label">
                  <input type="radio" v-model="modelType" value="deepseek" />
                  <span class="radio-text">DeepSeek 模型</span>
                </label>
                <label class="radio-label">
                  <input type="radio" v-model="modelType" value="aliyun" />
                  <span class="radio-text">阿里云大模型</span>
                </label>
              </div>
            </div>

            <!-- DeepSeek 配置 -->
            <div v-if="modelType === 'deepseek'" class="model-config">
              <div class="input-group">
                <label for="apiKey">DeepSeek API Key:</label>
                <input
                  id="apiKey"
                  type="password"
                  v-model="apiKey"
                  placeholder="请输入您的 DeepSeek API Key"
                  class="api-key-input"
                />
              </div>
              <div class="hint-text">
                <p>🔒 您的 API Key 将安全存储在本地浏览器中</p>
                <p>🌐 获取 API Key: <a href="https://platform.deepseek.com/api_keys" target="_blank" class="link">DeepSeek 控制台</a></p>
              </div>
            </div>

            <!-- 阿里云大模型配置 -->
            <div v-if="modelType === 'aliyun'" class="model-config">
              <div class="input-group">
                <label for="aliyunApiKey">阿里云 API Key:</label>
                <input
                  id="aliyunApiKey"
                  type="password"
                  v-model="aliyunConfig.apiKey"
                  placeholder="请输入您的阿里云 API Key"
                  class="api-key-input"
                />
                <div class="hint-text small">
                  <p>💡 在阿里云百炼控制台的API密钥管理中获取</p>
                </div>
              </div>
              <div class="input-group">
                <label for="aliyunAppId">应用ID:</label>
                <input
                  id="aliyunAppId"
                  type="text"
                  v-model="aliyunConfig.appId"
                  placeholder="请输入您的应用ID，例如：c3e3bac8de9e47e2bc26cb30b6b459e2"
                  class="api-key-input"
                />
                <div class="hint-text small">
                  <p>💡 应用ID用于标识您的应用，在阿里云百炼控制台中获取</p>
                </div>
              </div>

              <div class="input-group">
                <label for="aliyunAgentId">智能体ID (可选):</label>
                <input
                  id="aliyunAgentId"
                  type="text"
                  v-model="aliyunConfig.agentId"
                  placeholder="请输入您的智能体ID，例如：agent-123456"
                  class="api-key-input"
                />
                <div class="hint-text small">
                  <p>💡 智能体ID用于连接您发布的特定智能体</p>
                  <p>📝 在阿里云百炼智能体管理页面获取</p>
                </div>
              </div>
              <div class="input-row">
                <div class="input-group half-width">
                  <label for="temperature">温度 (0-1):</label>
                  <input
                    id="temperature"
                    type="number"
                    v-model.number="aliyunConfig.temperature"
                    min="0"
                    max="1"
                    step="0.1"
                    class="api-key-input"
                  />
                </div>
                <div class="input-group half-width">
                  <label for="maxTokens">最大令牌数:</label>
                  <input
                    id="maxTokens"
                    type="number"
                    v-model.number="aliyunConfig.maxTokens"
                    min="1"
                    max="4000"
                    class="api-key-input"
                  />
                </div>
              </div>
              <div class="hint-text">
                <p>🔒 您的配置将安全存储在本地浏览器中</p>
                <p>🌐 获取阿里云 API Key: <a href="https://dashscope.aliyun.com/" target="_blank" class="link">阿里云百炼控制台</a></p>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" @click="showApiKeyDialog = false">取消</button>
            <button class="btn-primary" @click="saveApiKey">保存配置</button>
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
import { useAuthStore } from '../stores/auth'
import { aliyunService } from '../services/aliyunService'
import notification from '../composables/useNotification'

// 初始化authStore
const authStore = useAuthStore()

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

// 登录注册加载状态
const loginLoading = ref(false)
const registerLoading = ref(false)

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

  try {
    if (modelType.value === 'aliyun') {
      
      // 调用阿里云大模型（流式响应）- DashScope SDK格式
      if (!aliyunConfig.value.apiKey || !aliyunConfig.value.appId) {
        throw new Error('请先配置阿里云大模型的API Key和应用ID')
      }
      
      // 配置阿里云服务
      aliyunService.setConfig(aliyunConfig.value)
      
      // 创建流式响应消息
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
        timestamp: new Date()
      }
      
      if (currentChat.value) {
        currentChat.value.messages.push(assistantMessage)
      }
      
      // 构建消息历史
      const messages = currentMessages.value.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
      
      // 使用流式响应
      try {
        await aliyunService.sendMessageStream(
          messages,
          // onMessage回调：处理每个数据块
          (chunk: string) => {
            if (currentChat.value && assistantMessage) {
              // 使用Vue的响应式更新方式
              const index = currentChat.value.messages.findIndex(msg => msg.id === assistantMessage.id)
              if (index !== -1) {
                currentChat.value.messages[index].content += chunk
                // 强制触发响应式更新
                currentChat.value.messages = [...currentChat.value.messages]
                // 实时更新显示
                scrollToBottom()
              }
            }
          }
        )
      } catch (error) {
        throw error
      }
      
      // 更新最后活跃时间
      if (currentChat.value) {
        currentChat.value.lastActive = new Date()
      }
    } else {
      // DeepSeek模型（暂时保持模拟回复）
      const assistantResponse = `这是对"${messageText}"的模拟回复。在实际应用中，这里会调用DeepSeek API来获取真实回复。`
      
      // 添加AI回复到聊天
      if (currentChat.value) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: assistantResponse,
          timestamp: new Date()
        }
        currentChat.value.messages.push(assistantMessage)
        currentChat.value.lastActive = new Date()
      }
    }
  } catch (error) {
    
    // 添加错误消息到聊天
    if (currentChat.value) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `抱歉，发送消息时出现错误：${error instanceof Error ? error.message : '未知错误'}`,
        timestamp: new Date()
      }
      currentChat.value.messages.push(errorMessage)
      currentChat.value.lastActive = new Date()
    }
  } finally {
    isLoading.value = false
    scrollToBottom()
  }
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

const login = async () => {
  if (!loginForm.value.email || !loginForm.value.password) {
    notification.error('请输入邮箱和密码')
    return
  }
  
  loginLoading.value = true
  
  try {
    // 使用Supabase进行真实登录
    const { success, error } = await authStore.signIn(loginForm.value.email, loginForm.value.password)
    
    if (success) {
      notification.success('登录成功！')
      showLoginDialog.value = false
      loginForm.value = { email: '', password: '' }
      
      // 更新当前用户信息
      if (authStore.user) {
        currentUser.value = {
          id: authStore.user.id,
          name: authStore.user.username,
          avatar: '👤',
          status: '在线',
          isLoggedIn: true,
          email: authStore.user.email
        }
        isLoggedIn.value = true
      }
    } else {
      const errorMessage = (error as Error)?.message || (error as Error)?.toString() || '未知错误'
      notification.error(`登录失败: ${errorMessage}`)
    }
  } catch (error) {
    console.error('登录过程中出错:', error)
    notification.error('登录失败，请稍后重试')
  } finally {
    loginLoading.value = false
  }
}

const register = async () => {
  if (!registerForm.value.name || !registerForm.value.email || !registerForm.value.password) {
    notification.error('请填写所有必填字段')
    return
  }
  
  if (registerForm.value.password.length < 6) {
    notification.error('密码长度至少6位')
    return
  }
  
  if (registerForm.value.password !== registerForm.value.confirmPassword) {
    notification.error('两次输入的密码不一致')
    return
  }
  
  registerLoading.value = true
  
  try {
    // 使用Supabase进行真实注册
    const { success, error } = await authStore.signUp(
      registerForm.value.email,
      registerForm.value.password,
      registerForm.value.name
    )
    
    if (success) {
      notification.success('注册成功！请检查您的邮箱进行验证')
      showRegisterDialog.value = false
      registerForm.value = { name: '', email: '', password: '', confirmPassword: '' }
      
      // 自动切换到登录界面
      showLoginDialog.value = true
    } else {
      const errorMessage = (error as Error)?.message || (error as Error)?.toString() || '未知错误'
      notification.error(`注册失败: ${errorMessage}`)
    }
  } catch (error) {
    console.error('注册过程中出错:', error)
    notification.error('注册失败，请稍后重试')
  } finally {
    registerLoading.value = false
  }
}

const logout = async () => {
  try {
    // 使用Supabase进行真实登出
    const { success, error } = await authStore.signOut()
    
    if (success) {
      currentUser.value = guestUser
      isLoggedIn.value = false
      showUserMenu.value = false
      notification.success('已退出登录')
    } else {
      const errorMessage = (error as Error)?.message || (error as Error)?.toString() || '未知错误'
      notification.error(`登出失败: ${errorMessage}`)
    }
  } catch (error) {
    console.error('登出过程中出错:', error)
    notification.error('登出失败，请稍后重试')
  }
}

// 阿里云大模型配置（DashScope SDK格式）
const aliyunConfig = ref({
  apiKey: '',
  appId: '',
  model: 'qwen-turbo',
  temperature: 0.7,
  maxTokens: 2000,
  agentId: ''
})

// 模型类型选择
const modelType = ref('deepseek') // 'deepseek' 或 'aliyun'

// API Key 相关方法
const saveApiKey = () => {
  if (!isLoggedIn.value) {
    notification.error('请先登录后再设置 API Key')
    showApiKeyDialog.value = false
    showLoginDialog.value = true
    return
  }
  
  if (modelType.value === 'deepseek') {
    if (!apiKey.value.trim()) {
      notification.error('请输入有效的DeepSeek API Key')
      return
    }
    
    // 保存DeepSeek API Key
    localStorage.setItem('deepseek-api-key', apiKey.value)
    notification.success('DeepSeek API Key 保存成功！')
  } else {
    // 阿里云大模型配置（DashScope SDK格式）
    if (!aliyunConfig.value.apiKey.trim()) {
      notification.error('请输入有效的阿里云API Key')
      return
    }
    
    if (!aliyunConfig.value.appId.trim()) {
      notification.error('请输入应用ID')
      return
    }
    
    if (!aliyunConfig.value.model.trim()) {
      notification.error('请输入模型名称')
      return
    }
    
    // 保存阿里云配置
    localStorage.setItem('aliyun-config', JSON.stringify(aliyunConfig.value))
    console.log('阿里云配置已保存:', aliyunConfig.value)
    notification.success('阿里云大模型配置保存成功！')
  }
  
  showApiKeyDialog.value = false
  apiKey.value = ''
  // 注意：这里不应该重置aliyunConfig，因为配置已经保存到localStorage
  // 并且在onMounted中会重新加载，重置会导致用户输入丢失
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
  
  // 加载已保存的阿里云配置
  const savedAliyunConfig = localStorage.getItem('aliyun-config')
  if (savedAliyunConfig) {
    try {
      aliyunConfig.value = JSON.parse(savedAliyunConfig)
      console.log('阿里云配置已加载:', aliyunConfig.value)
    } catch (error) {
      console.error('解析阿里云配置失败:', error)
    }
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

  .hint-text p {
    margin: 0.25rem 0;
  }

  .radio-group {
    display: flex;
    gap: 1rem;
    margin-top: 0.5rem;
  }

  .radio-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    padding: 0.5rem 1rem;
    border: 1px solid #ddd;
    border-radius: 0.375rem;
    transition: all 0.2s;
  }

  .radio-label:hover {
    border-color: #007bff;
  }

  .radio-label input[type="radio"] {
    margin: 0;
  }

  .radio-text {
    font-weight: 500;
  }

  .model-config {
    margin-top: 1rem;
    padding: 1rem;
    border: 1px solid #e0e0e0;
    border-radius: 0.375rem;
    background-color: #f9f9f9;
  }

  .input-row {
    display: flex;
    gap: 1rem;
  }

  .half-width {
    flex: 1;
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

/* 加载动画 */
.loading-spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-right: 8px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
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
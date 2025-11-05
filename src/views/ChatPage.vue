<template>
  <div class="chat-container">
    <!-- 侧边栏 -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <h2>小柠檬</h2>
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
            <div class="menu-item" @click="showModelSwitchDialog = true; showUserMenu = false">
              <span class="menu-icon">🔄</span>
              <span>模型切换</span>
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

      <!-- 模型切换弹窗 -->
      <div v-if="showModelSwitchDialog" class="modal-overlay" @click="showModelSwitchDialog = false">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3>模型切换</h3>
            <button class="close-btn" @click="showModelSwitchDialog = false">×</button>
          </div>
          <div class="modal-body">
            <!-- 配置类型选择 -->
            <div class="config-type-selector">
              <div class="config-option" :class="{ active: configType === 'douyin' }" @click="configType = 'douyin'">
                <div class="option-icon">📱</div>
                <div class="option-content">
                  <h4>抖音知识库</h4>
                  <p>连接阿里云大模型应用，提供智能问答服务</p>
                </div>
              </div>
              
              <div class="config-option" :class="{ active: configType === 'video' }" @click="configType = 'video'">
                <div class="option-icon">🎬</div>
                <div class="option-content">
                  <h4>视频解析</h4>
                  <p>连接n8n工作流，解析视频内容（开发中）</p>
                </div>
              </div>
            </div>

            <!-- 抖音知识库配置 -->
            <div v-if="configType === 'douyin'" class="model-config">
              <div class="hint-text">
                <p>✅ 抖音知识库已配置完成</p>
                <p>🔗 连接: 阿里云大模型应用</p>
                <p>🔑 API Key: 已内嵌配置</p>
                <p>🆔 应用ID: c3e3bac8de9e47e2bc26cb30b6b459e2</p>
                <p>🤖 模型: qwen-turbo</p>
                <p>🌡️ 温度: 0.7</p>
                <p>📝 最大令牌数: 2000</p>
                <p>💡 用户登录后即可直接使用抖音知识库服务</p>
              </div>
            </div>

            <!-- 视频解析配置 -->
            <div v-if="configType === 'video'" class="model-config">
              <div class="hint-text">
                <p>🚧 视频解析功能开发中</p>
                <p>🔗 连接: n8n工作流</p>
                <p>📋 功能: 解析视频内容，提取关键信息</p>
                <p>⏳ 状态: 接口预留，等待n8n工作流配置</p>
                <p>💡 后续将集成视频解析和内容分析功能</p>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" @click="showModelSwitchDialog = false">取消</button>
            <button class="btn-primary" @click="saveConfig">切换模型</button>
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
import { n8nService } from '../services/n8nService'
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
const showModelSwitchDialog = ref(false)
const showUserMenu = ref(false)



// 配置类型管理
const configType = ref<'douyin' | 'video'>('douyin') // 默认选择抖音知识库

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
    // 根据配置类型处理消息
    if (configType.value === 'douyin') {
      // 配置已内嵌，直接使用
      aliyunService.setConfig(aliyunConfig.value)
    } else if (configType.value === 'video') {
      // 设置n8n工作流配置
      n8nService.setConfig({
        webhookUrl: 'https://n8n.lbuding.com/webhook/parserAll',
        timeout: 30000
      })
    }
    
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
      // 根据配置类型调用不同的API
      if (configType.value === 'douyin') {
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
        
      } else if (configType.value === 'video') {
        // 调用n8n工作流进行视频解析
        await n8nService.parseVideoStream(
          messageText,
          // onChunk回调：处理每个数据块
          (chunk) => {
            if (currentChat.value && assistantMessage) {
              // 使用Vue的响应式更新方式
              const index = currentChat.value.messages.findIndex(msg => msg.id === assistantMessage.id)
              if (index !== -1) {
                // 处理不同类型的n8n响应
                if (chunk.type === 'text') {
                  if (chunk.data && chunk.data !== '') {
                    try {
                      // 解析JSON数据并提取URL
                      const jsonData = JSON.parse(chunk.data as string)
                      
                      // 提取URL：支持多种数据结构
                      let videoUrl = ''
                      
                      if (Array.isArray(jsonData) && jsonData.length > 0) {
                        // 处理数组格式：[{"data":[{"url":"..."}]}]
                        const firstItem = jsonData[0]
                        if (firstItem.data && Array.isArray(firstItem.data) && firstItem.data.length > 0) {
                          videoUrl = firstItem.data[0].url
                        }
                      } else if (jsonData.data && Array.isArray(jsonData.data) && jsonData.data.length > 0) {
                        // 处理对象格式：{"data":[{"url":"..."}]}
                        videoUrl = jsonData.data[0].url
                      } else if (jsonData.url) {
                        // 处理直接URL格式：{"url":"..."}
                        videoUrl = jsonData.url
                      }
                      
                      if (videoUrl) {
                        currentChat.value.messages[index].content += `\n🎬 视频解析成功！\n🔗 下载链接：${videoUrl}`
                      } else {
                        currentChat.value.messages[index].content += chunk.data as string
                      }
                    } catch (error) {
                      currentChat.value.messages[index].content += chunk.data as string
                    }
                  }
                } else if (chunk.type === 'video_info') {
                  // 视频信息格式化显示
                  const videoInfo = chunk.data as any
                  currentChat.value.messages[index].content += `\n📹 视频信息: ${JSON.stringify(videoInfo, null, 2)}`
                } else if (chunk.type === 'analysis') {
                  // 分析结果格式化显示
                  const analysis = chunk.data as any
                  currentChat.value.messages[index].content += `\n📊 分析结果: ${JSON.stringify(analysis, null, 2)}`
                } else if (chunk.type === 'error') {
                  currentChat.value.messages[index].content += `\n❌ 错误: ${chunk.data}`
                } else {
                  // 默认处理：显示所有其他类型的数据
                  currentChat.value.messages[index].content += `\n📦 原始数据: ${JSON.stringify(chunk, null, 2)}`
                }
                
                // 强制触发响应式更新
                currentChat.value.messages = [...currentChat.value.messages]
                // 实时更新显示
                scrollToBottom()
                
                // 如果是最终块，检查是否有内容，如果没有则显示提示
                if (chunk.isFinal && !currentChat.value.messages[index].content.trim()) {
                  currentChat.value.messages[index].content = "🎬 视频解析完成，但未返回解析结果\n\n💡 可能的原因：\n1. n8n工作流配置问题 - 工作流可能没有正确返回数据\n2. 视频链接格式问题 - 请检查视频链接是否正确\n3. n8n工作流处理逻辑问题 - 工作流可能未正确处理视频解析\n\n🔧 建议：\n1. 检查n8n工作流配置和返回数据格式\n2. 尝试不同的视频链接\n3. 联系管理员检查n8n工作流逻辑"
                  // 再次触发更新
                  currentChat.value.messages = [...currentChat.value.messages]
                  scrollToBottom()
                }
              }
            }
          }
        )
      }
    } catch (error) {
      throw error
    }
    
    // 更新最后活跃时间
    if (currentChat.value) {
      currentChat.value.lastActive = new Date()
    }
  } catch (error) {
      // 添加错误消息到聊天
      if (currentChat.value) {
        let errorContent = `抱歉，发送消息时出现错误：${error instanceof Error ? error.message : '未知错误'}`
        
        // 针对n8n工作流特定的错误提供友好提示
        if (configType.value === 'video' && error instanceof Error) {
          if (error.message.includes('n8n工作流未激活') || error.message.includes('webhook')) {
            errorContent = `🎬 视频解析功能暂时不可用\n\n❌ 错误原因：${error.message}\n\n💡 解决方案：\n1. 请先在n8n工作流画布上点击"Execute workflow"按钮激活webhook\n2. 然后重新尝试视频解析功能\n3. 如果问题持续，请联系管理员检查n8n工作流配置`
          }
        }
        
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: errorContent,
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
    notification.error('登出失败，请稍后重试')
  }
}

// 阿里云大模型配置（DashScope SDK格式）- 内嵌配置
const aliyunConfig = ref({
  apiKey: 'sk-7511ca603ff44019b2395b3d94630ffe',
  appId: 'c3e3bac8de9e47e2bc26cb30b6b459e2',
  model: 'qwen-turbo',
  temperature: 0.7,
  maxTokens: 2000,
  agentId: ''
})

// 模型类型 - 只保留阿里云大模型
const modelType = ref('aliyun')

// 保存配置（支持抖音知识库和视频解析）
const saveConfig = () => {
  if (!isLoggedIn.value) {
    notification.error('请先登录后再切换模型')
    showModelSwitchDialog.value = false
    showLoginDialog.value = true
    return
  }
  
  if (configType.value === 'douyin') {
    // 保存抖音知识库配置（阿里云大模型）
    localStorage.setItem('douyin-config', JSON.stringify({
      ...aliyunConfig.value,
      configType: 'douyin',
      lastUpdated: new Date().toISOString()
    }))
    notification.success('已切换到抖音知识库模型！')
  } else if (configType.value === 'video') {
    // 保存视频解析配置（预留接口）
    const videoConfig = {
      configType: 'video',
      service: 'n8n-workflow',
      status: 'development',
      lastUpdated: new Date().toISOString(),
      features: ['video-parsing', 'content-analysis']
    }
    localStorage.setItem('video-config', JSON.stringify(videoConfig))
    notification.success('已切换到视频解析模型！接口已预留，等待n8n工作流配置')
  }
  
  showModelSwitchDialog.value = false
}

// 生命周期
onMounted(async () => {
  // 初始化认证状态
  await authStore.initializeAuth()
  
  // 设置认证状态监听器
  authStore.setupAuthListener()
  
  // 根据认证状态更新界面
  if (authStore.isAuthenticated && authStore.user) {
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
  
  if (chatHistory.value.length > 0) {
    currentChatId.value = chatHistory.value[0].id
  }
  focusInput()
  
  // 加载已保存的阿里云配置（优先使用内嵌配置）
  const savedAliyunConfig = localStorage.getItem('aliyun-config')
  if (savedAliyunConfig) {
    try {
      const parsedConfig = JSON.parse(savedAliyunConfig)
      // 只加载用户自定义的配置项，保持内嵌的API Key和应用ID不变
      aliyunConfig.value = {
        ...aliyunConfig.value, // 保持内嵌配置
        ...parsedConfig,       // 覆盖用户自定义配置
        apiKey: aliyunConfig.value.apiKey, // 强制使用内嵌API Key
        appId: aliyunConfig.value.appId    // 强制使用内嵌应用ID
      }
    } catch (error) {
      // 配置加载失败，静默处理
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
  background: linear-gradient(135deg, #f9ffc8 0%, #ffffff 100%);
}

/* 侧边栏样式 */
.sidebar {
  width: 280px;
  background: #f8f9fa;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
  background: #f8f9fa;
}

.sidebar-header h2 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 15px;
  color: #333333;
}

.new-chat-btn {
  width: 100%;
  padding: 10px 16px;
  background: #007bff;
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
  background: #0056b3;
}

.chat-history {
  flex: 1;
  overflow-y: auto;
  padding: 10px 0;
}

.chat-item {
  padding: 12px 16px;
  cursor: pointer;
  border-radius: 8px;
  transition: background-color 0.2s;
  display: flex;
  flex-direction: column;
  gap: 4px;
  border-left: 3px solid transparent;
}

.chat-item:hover {
  background: #e9ecef;
}

.chat-item.active {
  background: #e9ecef;
  border-left-color: #007bff;
}

.chat-title {
  display: block;
  font-size: 14px;
  color: #333333;
  margin-bottom: 4px;
}

.chat-date {
  font-size: 12px;
  color: #666666;
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
  color: #333333;
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
  color: #333333;
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
  color: #666666;
}

.action-btn:hover {
  background: #e9ecef;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  background: #ffffff;
}

.message {
  display: flex;
  gap: 12px;
  max-width: 85%;
  word-wrap: break-word;
  overflow-wrap: break-word;
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
  max-width: 100%;
  box-sizing: border-box;
  color: #333333;
  word-wrap: break-word;
  overflow-wrap: break-word;
  word-break: break-word;
}

.user-message .message-content {
  background: #007bff;
  color: white;
}

.message-text {
  font-size: 14px;
  line-height: 1.6;
  word-wrap: break-word;
  overflow-wrap: break-word;
  white-space: pre-wrap;
  max-width: 100%;
  color: #333333;
}

.message-time {
  font-size: 11px;
  color: #666;
  margin-top: 4px;
}

.user-message .message-time {
  color: rgba(255, 255, 255, 0.8);
}

.dark-theme .message-time {
  color: var(--text-tertiary);
}

.dark-theme .user-message .message-time {
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

.dark-theme .typing-animation span {
  background: var(--text-secondary);
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

  .dark-theme .hint-text {
    color: var(--text-tertiary);
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
    color: #333;
  }

  .dark-theme .radio-text {
    color: var(--text-primary);
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

/* 配置类型选择器样式 */
.config-type-selector {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.config-option {
  display: flex;
  align-items: center;
  padding: 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #fafafa;
}

.dark-theme .config-option {
  background: var(--bg-secondary);
  border-color: var(--border-color);
}

.config-option:hover {
  border-color: #007bff;
  background: #f0f8ff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.1);
}

.config-option.active {
  border-color: #007bff;
  background: #e3f2fd;
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.15);
}

.option-icon {
  font-size: 24px;
  margin-right: 12px;
  width: 40px;
  text-align: center;
}

.option-content h4 {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 4px 0;
  color: #333;
}

.option-content p {
  font-size: 14px;
  color: #666;
  margin: 0;
  line-height: 1.4;
}

.dark-theme .option-content h4 {
  color: var(--text-primary);
}

.dark-theme .option-content p {
  color: var(--text-secondary);
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

.dark-theme .modal-header h3 {
  color: var(--text-primary);
}

.dark-theme .close-btn {
  color: var(--text-secondary);
}

.dark-theme .close-btn:hover {
  background: var(--bg-tertiary);
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

.dark-theme .input-group label {
  color: var(--text-primary);
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

.dark-theme .user-info {
  background: var(--bg-secondary);
}

.dark-theme .user-info:hover {
  background: var(--bg-tertiary);
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

.dark-theme .user-status {
  color: var(--text-secondary);
}

.dark-theme .user-name {
  color: var(--text-primary);
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
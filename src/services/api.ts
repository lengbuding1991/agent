import axios from 'axios'

// 创建axios实例
const api = axios.create({
  baseURL: (import.meta.env?.VITE_BACKEND_URL as string) || 'http://localhost:8000',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器 - 添加认证token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器 - 统一错误处理
api.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token过期，跳转到登录页
      localStorage.removeItem('auth_token')
      window.location.href = '/login'
    }
    
    return Promise.reject(error)
  }
)

// 认证相关接口
export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  username: string
}

export interface AuthResponse {
  token: string
  user: {
    id: string
    email: string
    username: string
  }
}

export const authApi = {
  // 用户登录
  login: (data: LoginRequest): Promise<AuthResponse> => 
    api.post('/auth/login', data),
  
  // 用户注册
  register: (data: RegisterRequest): Promise<AuthResponse> => 
    api.post('/auth/register', data),
  
  // 获取用户信息
  getProfile: (): Promise<AuthResponse['user']> => 
    api.get('/auth/profile'),
  
  // 刷新token
  refreshToken: (): Promise<{ token: string }> => 
    api.post('/auth/refresh')
}

// 聊天相关接口
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface ChatSession {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: string
  updatedAt: string
}

export interface SendMessageRequest {
  message: string
  sessionId?: string
  model?: string
}

export interface SendMessageResponse {
  message: ChatMessage
  session: ChatSession
}

export const chatApi = {
  // 获取聊天会话列表
  getSessions: (): Promise<ChatSession[]> => 
    api.get('/chat/sessions'),
  
  // 创建新会话
  createSession: (title?: string): Promise<ChatSession> => 
    api.post('/chat/sessions', { title }),
  
  // 获取会话详情
  getSession: (sessionId: string): Promise<ChatSession> => 
    api.get(`/chat/sessions/${sessionId}`),
  
  // 发送消息（支持流式响应）
  sendMessage: (data: SendMessageRequest): Promise<SendMessageResponse> => 
    api.post('/chat/messages', data),
  
  // 删除会话
  deleteSession: (sessionId: string): Promise<void> => 
    api.delete(`/chat/sessions/${sessionId}`),
  
  // 重命名会话
  renameSession: (sessionId: string, title: string): Promise<ChatSession> => 
    api.patch(`/chat/sessions/${sessionId}`, { title })
}

// 流式聊天接口（Server-Sent Events）
export class ChatStream {
  private eventSource: EventSource | null = null
  private sessionId: string | null = null

  connect(sessionId?: string) {
    const baseURL = (import.meta.env?.VITE_BACKEND_URL as string) || 'http://localhost:8000'
    const url = new URL('/chat/stream', baseURL)
    if (sessionId) {
      url.searchParams.set('sessionId', sessionId)
    }
    
    this.eventSource = new EventSource(url.toString())
    this.sessionId = sessionId || null
    
    return this.eventSource
  }

  sendMessage(message: string) {
    if (!this.eventSource) {
      throw new Error('Chat stream not connected')
    }
    
    // 在实际实现中，这里需要通过WebSocket或其他方式发送消息
    // 当前为SSE实现，消息发送通过单独的API调用
    return chatApi.sendMessage({
      message,
      sessionId: this.sessionId || undefined
    })
  }

  disconnect() {
    if (this.eventSource) {
      this.eventSource.close()
      this.eventSource = null
      this.sessionId = null
    }
  }

  onMessage(callback: (data: any) => void) {
    if (this.eventSource) {
      this.eventSource.addEventListener('message', (event) => {
        try {
          const data = JSON.parse(event.data)
          callback(data)
        } catch (error) {
          // 解析失败，静默处理
        }
      })
    }
  }

  onError(callback: (error: any) => void) {
    if (this.eventSource) {
      this.eventSource.addEventListener('error', (event) => {
        callback(event)
      })
    }
  }
}

// 用户相关接口
export interface UserInfo {
  id: string
  email: string
  username: string
  createdAt: string
  updatedAt: string
}

export interface UsageInfo {
  totalTokens: number
  remainingTokens: number
  lastReset: string
}

export const userApi = {
  // 获取用户信息
  getInfo: (): Promise<UserInfo> => 
    api.get('/user/info'),
  
  // 获取使用情况
  getUsage: (): Promise<UsageInfo> => 
    api.get('/user/usage'),
  
  // 更新用户信息
  updateInfo: (data: Partial<UserInfo>): Promise<UserInfo> => 
    api.patch('/user/info', data),
  
  // 修改密码
  changePassword: (data: { oldPassword: string; newPassword: string }): Promise<void> => 
    api.post('/user/change-password', data)
}

export default api
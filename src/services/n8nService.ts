// n8n工作流服务类 - 视频解析功能
// 连接地址：https://n8n.lbuding.com/webhook-test/parserAll

import axios from 'axios'

// n8n工作流配置接口
export interface N8nConfig {
  webhookUrl: string
  apiKey?: string
  timeout?: number
}

// n8n工作流请求接口
export interface N8nRequest {
  message: string
  userId?: string
  sessionId?: string
  timestamp?: string
}

// n8n工作流响应接口
export interface N8nResponse {
  success: boolean
  data?: {
    parsedContent: string
    videoInfo?: {
      title?: string
      duration?: string
      author?: string
      url?: string
    }
    analysis?: {
      summary?: string
      keyPoints?: string[]
      tags?: string[]
    }
  }
  error?: string
  requestId?: string
}

// 流式响应数据块
export interface N8nStreamChunk {
  type: 'text' | 'video_info' | 'analysis' | 'error'
  data: string | object
  isFinal?: boolean
}

// n8n工作流服务类
export class N8nService {
  private config: N8nConfig | null = null

  // 设置配置
  setConfig(config: N8nConfig): void {
    this.config = config
  }

  // 获取当前配置
  getConfig(): N8nConfig | null {
    return this.config
  }

  // 验证配置
  validateConfig(): boolean {
    if (!this.config) {
      throw new Error('n8n配置未设置')
    }
    if (!this.config.webhookUrl) {
      throw new Error('Webhook URL不能为空')
    }
    return true
  }

  // 发送视频解析请求（非流式）
  async parseVideo(message: string): Promise<N8nResponse> {
    this.validateConfig()
    
    const requestData: N8nRequest = {
      message,
      userId: 'frontend-user',
      sessionId: Date.now().toString(),
      timestamp: new Date().toISOString()
    }

    try {
      console.log('🚀 [n8nService] 开始发送视频解析请求')
      console.log('🌐 Webhook URL:', this.config!.webhookUrl)
      console.log('💬 请求消息:', message)

      const response = await axios.post(this.config!.webhookUrl, requestData, {
        timeout: this.config!.timeout || 30000,
        headers: {
          'Content-Type': 'application/json',
          ...(this.config!.apiKey && { 'Authorization': `Bearer ${this.config!.apiKey}` })
        }
      })
      
      console.log('✅ [n8nService] 视频解析请求成功')
      console.log('📥 响应数据:', response.data)
      
      return response.data
    } catch (error: any) {
      console.error('❌ [n8nService] 视频解析请求失败:', error)
      
      if (error.code === 'ECONNABORTED') {
        throw new Error('请求超时，请检查网络连接或重试')
      }
      
      if (error.response) {
        throw new Error(`n8n工作流调用失败: ${error.response.status} - ${JSON.stringify(error.response.data)}`)
      }
      
      if (error.code === 'ERR_NETWORK') {
        throw new Error('网络连接失败，请检查网络连接或Webhook URL配置')
      }
      
      throw new Error(`n8n工作流调用失败: ${error.message}`)
    }
  }

  // 流式视频解析请求
  async parseVideoStream(
    message: string, 
    onChunk: (chunk: N8nStreamChunk) => void
  ): Promise<void> {
    this.validateConfig()
    
    const requestData: N8nRequest = {
      message,
      userId: 'frontend-user',
      sessionId: Date.now().toString(),
      timestamp: new Date().toISOString()
    }

    try {
      console.log('🚀 [n8nService] 开始发送流式视频解析请求')
      console.log('🌐 Webhook URL:', this.config!.webhookUrl)
      console.log('💬 请求消息:', message)
      console.log('📦 请求数据:', JSON.stringify(requestData, null, 2))

      // 直接使用配置的webhook URL，通过Vite代理解决CORS
      const response = await fetch(this.config!.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config!.apiKey && { 'Authorization': `Bearer ${this.config!.apiKey}` })
        },
        body: JSON.stringify(requestData)
      })

      if (!response.ok) {
        const errorText = await response.text();
        
        // 针对n8n特定的错误提供友好提示
        if (response.status === 404) {
          try {
            const errorData = JSON.parse(errorText);
            if (errorData.message && errorData.message.includes('webhook')) {
              throw new Error(`n8n工作流未激活：${errorData.message}\n\n💡 解决方案：请先在n8n工作流画布上点击"Execute workflow"按钮激活webhook`);
            }
          } catch {
            // 如果JSON解析失败，使用原始错误
          }
        }
        
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      // 处理流式响应
      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('无法读取响应流')
      }

      console.log('📥 [n8nService] 开始读取流式响应')
      console.log('📥 [n8nService] response.status:', response.status)
      console.log('📥 [n8nService] response.headers:', Object.fromEntries(response.headers.entries()))

      let buffer = ''
      let hasReceivedData = false
      let chunkCount = 0
      
      while (true) {
        const { done, value } = await reader.read()
        
        if (done) {
          console.log('📥 [n8nService] 流读取完成，总共收到', chunkCount, '个数据块')
          break
        }
        
        chunkCount++
        console.log('📥 [n8nService] 收到第', chunkCount, '个数据块，长度:', value.length)
        
        // 将Uint8Array转换为字符串
        const chunk = new TextDecoder().decode(value)
        console.log('📥 [n8nService] 原始字符串数据:', chunk)
        
        // 直接发送原始数据给ChatPage显示，不做任何处理
        console.log('📥 直接发送原始数据给ChatPage:', chunk)
        onChunk({
          type: 'text',
          data: chunk
        })
        hasReceivedData = true
      }

      // 如果没有收到任何数据，发送空数据提示
      if (!hasReceivedData) {
        console.log('⚠️ 未收到任何有效数据，发送提示信息')
        onChunk({
          type: 'text',
          data: '🎬 视频解析完成，但未返回有效数据',
          isFinal: true
        })
      } else {
        console.log('✅ 已收到有效数据，发送最终块标记')
        // 发送最终块标记，不发送额外内容
        onChunk({
          type: 'text',
          data: '',
          isFinal: true
        })
      }

    } catch (error: any) {
      console.error('❌ [n8nService] 流式视频解析失败:', error)
      
      onChunk({
        type: 'error',
        data: error.message
      })
      
      throw error
    }
  }

  // 测试连接
  async testConnection(): Promise<boolean> {
    try {
      this.validateConfig()
      
      const response = await axios.get(this.config!.webhookUrl, {
        timeout: 5000,
        headers: {
          ...(this.config!.apiKey && { 'Authorization': `Bearer ${this.config!.apiKey}` })
        }
      })
      
      return response.status === 200
    } catch (error) {
      console.warn('n8n连接测试失败:', error)
      return false
    }
  }
}

// 创建全局实例
export const n8nService = new N8nService()
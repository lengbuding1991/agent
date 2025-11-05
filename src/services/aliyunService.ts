import axios from 'axios'

// 阿里云百炼平台自定义应用配置接口
// 基于测试文件 test-bailian-connection.py 的格式
export interface AliyunConfig {
  apiKey: string
  appId: string // 应用ID，必填
  temperature?: number
  maxTokens?: number
}

// 阿里云百炼平台自定义应用API请求接口
export interface AliyunRequest {
  prompt: string
  parameters?: {
    temperature?: number
    max_tokens?: number
    top_p?: number
    top_k?: number
    seed?: number
    stream?: boolean
  }
}

// 阿里云百炼平台文本生成API响应接口
export interface AliyunResponse {
  request_id: string
  output: {
    text: string
    finish_reason: string
  }
  usage?: {
    input_tokens: number
    output_tokens: number
    total_tokens: number
  }
}

// 流式响应数据块（阿里云百炼平台文本生成API格式）
export interface AliyunStreamChunk {
  request_id: string
  output: {
    text: string
    finish_reason: string
  }
  usage?: {
    input_tokens: number
    output_tokens: number
    total_tokens: number
  }
}

// 阿里云大模型服务类
// 基于测试文件 test-bailian-connection.py 的实现方式
export class AliyunService {
  private config: AliyunConfig | null = null

  // 设置配置
  setConfig(config: AliyunConfig): void {
    this.config = config
  }

  // 获取当前配置
  getConfig(): AliyunConfig | null {
    return this.config
  }

  // 验证配置
  validateConfig(): boolean {
    if (!this.config) {
      throw new Error('阿里云配置未设置')
    }
    if (!this.config.apiKey) {
      throw new Error('API Key 不能为空')
    }
    if (!this.config.appId) {
      throw new Error('应用ID不能为空')
    }
    return true
  }

  // 构建DashScope API请求URL（百炼平台自定义应用端点）
  // 使用阿里云百炼平台自定义应用API格式
  private buildApiUrl(): string {
    if (!this.config) {
      throw new Error('配置未设置')
    }
    
    // 使用代理URL解决CORS问题
    // 阿里云百炼平台自定义应用API的正确格式：/api/v1/apps/{appId}/invoke
    // 经过Vite代理重写后，实际请求：https://dashscope.aliyuncs.com/api/v1/apps/{appId}/invoke
    const baseUrl = `/api/aliyun/api/v1/apps/${this.config.appId}/invoke`
    
    return baseUrl
  }

  // 发送聊天消息（非流式）- 百炼平台自定义应用格式
  // 使用阿里云百炼平台自定义应用API格式
  async sendChatMessage(messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>): Promise<AliyunResponse> {
    this.validateConfig()
    
    // 获取最后一条用户消息作为prompt
    const userMessage = messages.filter(msg => msg.role === 'user').pop()
    if (!userMessage) {
      throw new Error('没有找到用户消息')
    }
    
    // 构建请求数据，使用阿里云百炼平台自定义应用API格式
    const requestData = {
      input: {
        prompt: userMessage.content
      },
      parameters: {
        temperature: this.config!.temperature || 0.7,
        max_tokens: this.config!.maxTokens || 2000
      }
    }

    console.log('🔍 [aliyunService] 非流式调用开始')
    console.log('📋 配置信息:', this.config)
    console.log('💬 用户消息:', userMessage.content)
    console.log('🚀 请求数据:', requestData)
    console.log('🌐 API URL:', this.buildApiUrl())

    try {
      console.log('📤 开始发送请求...')
      const response = await axios.post(this.buildApiUrl(), requestData, {
        headers: {
          'Authorization': `Bearer ${this.config!.apiKey}`,
          'Content-Type': 'application/json'
        }
      })
      
      console.log('✅ 请求成功，响应数据:', response.data)
      return response.data
    } catch (error: any) {
      console.error('❌ 请求失败:', error)
      
      // 处理网络错误和API错误
      if (error.code === 'ERR_NETWORK' || error.message.includes('Failed to fetch')) {
        throw new Error('网络连接失败，请检查网络连接或API端点配置')
      }
      
      if (error.response) {
        console.error('HTTP错误详情:', error.response.status, error.response.data)
        throw new Error(`阿里云百炼平台API调用失败: ${error.response.status} - ${JSON.stringify(error.response.data)}`)
      }
      
      throw new Error(`阿里云百炼平台API调用失败: ${error.message}`)
    }
  }

  // 流式消息发送方法（百炼平台自定义应用格式）
  // 使用阿里云百炼平台自定义应用API格式，启用流式响应
  async sendMessageStream(
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>, 
    onChunk: (chunk: string) => void
  ): Promise<void> {
    console.log('🔍 [aliyunService] 流式调用开始')
    console.log('📋 配置信息:', this.config)
    
    this.validateConfig()

    // 获取最后一条用户消息
    const userMessage = messages.filter(msg => msg.role === 'user').pop()
    if (!userMessage) {
      throw new Error('没有找到用户消息')
    }
    
    // 构建请求数据，使用阿里云百炼平台自定义应用API格式，启用流式
    const requestData = {
      input: {
        prompt: userMessage.content
      },
      parameters: {
        temperature: this.config!.temperature || 0.7,
        max_tokens: this.config!.maxTokens || 2000,
        stream: true
      }
    }

    console.log('💬 用户消息:', userMessage.content)
    console.log('🚀 请求数据:', requestData)
    console.log('🌐 API URL:', this.buildApiUrl())

    try {
      console.log('📤 开始发送流式请求...')
      const response = await fetch(this.buildApiUrl(), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config!.apiKey}`,
          'Content-Type': 'application/json',
          'X-DashScope-SSE': 'enable'
        },
        body: JSON.stringify(requestData)
      })

      console.log('📥 响应状态:', response.status, response.statusText)
      console.log('📋 响应头:', Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ HTTP错误:', response.status, errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      console.log('✅ HTTP请求成功，开始处理流式响应...')

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('无法读取响应流')
      }

      const decoder = new TextDecoder()

      try {
        let buffer = ''
        let hasReceivedResult = false
        
        while (true) {
          const { done, value } = await reader.read()
          
          if (done) {
            console.log('🔚 流式响应结束')
            if (!hasReceivedResult) {
              console.warn('⚠️ 未收到任何有效结果数据')
            }
            break
          }

          const chunk = decoder.decode(value, { stream: true })
          buffer += chunk
          
          const lines = buffer.split('\n')
          buffer = lines.pop() || '' // 保留未完成的行

          for (const line of lines) {
            const trimmedLine = line.trim()
            if (!trimmedLine) continue
            
            console.log('📥 原始SSE行:', trimmedLine, '长度:', trimmedLine.length)
            
            // 处理阿里云百炼平台自定义应用的SSE格式
            // 检查多种可能的data行格式
            if (trimmedLine.startsWith('data:') || trimmedLine.startsWith('data: ')) {
              console.log('✅ 检测到data行，开始处理...')
              // 正确提取JSON数据：去掉"data: "前缀，并处理可能的引号问题
              const dataStr = trimmedLine.replace(/^data:\s*"?/, '').replace(/"?$/, '')
              console.log('🔍 准备解析SSE数据:', dataStr)
              
              try {
                const data = JSON.parse(dataStr)
                console.log('✅ JSON解析成功:', data)
                
                // 处理百炼平台自定义应用响应格式
                if (data.output && data.output.text) {
                  const content = data.output.text
                  if (content) {
                    console.log('✅ 收到有效内容:', content)
                    
                    // 阿里云百炼平台返回的是完整响应，不是分块数据
                    // 这里需要一次性传递完整内容，而不是分块追加
                    console.log('📤 准备调用onChunk回调...')
                    onChunk(content)
                    console.log('✅ onChunk回调已调用')
                    hasReceivedResult = true
                    
                    // 由于是完整响应，收到后可以直接结束流式处理
                    console.log('✅ 完整响应已接收，流式处理完成')
                    
                    // 确保回调函数执行完毕后再结束
                    await new Promise(resolve => setTimeout(resolve, 0))
                    break // 跳出循环，结束流式处理
                  }
                }
              } catch (parseError) {
                console.warn('❌ 解析流数据失败:', parseError, '原始数据:', dataStr)
              }
            }
            
            // 处理阿里云百炼平台的特殊SSE格式（包含HTTP状态的行）
            if (trimmedLine.startsWith(':HTTP_STATUS/')) {
              console.log('📋 阿里云HTTP状态行:', trimmedLine)
              // 这个行后面紧跟着data行，我们继续处理下一行
              continue
            }
            
            // 处理事件类型
            if (trimmedLine.startsWith('event: ')) {
              const eventType = trimmedLine.slice(7)
              console.log('📋 事件类型:', eventType)
            }
            
            // 处理完成信号
            if (trimmedLine === 'data: [DONE]' || trimmedLine.includes('finish_reason')) {
              console.log('✅ 流式响应完成')
              return
            }
          }
        }
      } finally {
        reader.releaseLock()
      }
    } catch (error) {
      console.error('阿里云百炼平台流式API调用失败:', error)
      throw error
    }
  }

  // 发送聊天消息（流式响应）- 备用方法
  async *sendChatMessageStream(messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>): AsyncGenerator<string, void, unknown> {
    this.validateConfig()

    // 获取最后一条用户消息
    const userMessage = messages.filter(msg => msg.role === 'user').pop()
    if (!userMessage) {
      throw new Error('没有找到用户消息')
    }
    
    const requestData = {
      input: {
        prompt: userMessage.content
      },
      parameters: {
        temperature: this.config!.temperature || 0.7,
        max_tokens: this.config!.maxTokens || 2000,
        stream: true
      }
    }

    console.log('🔍 [aliyunService] 备用流式调用开始')
    console.log('💬 用户消息:', userMessage.content)
    console.log('🌐 API URL:', this.buildApiUrl())

    try {
      const response = await fetch(this.buildApiUrl(), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config!.apiKey}`,
          'Content-Type': 'application/json',
          'X-DashScope-SSE': 'enable'
        },
        body: JSON.stringify(requestData)
      })

      console.log('📥 响应状态:', response.status, response.statusText)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ HTTP错误:', response.status, errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('无法读取流式响应')
      }

      const decoder = new TextDecoder()
      let buffer = ''

      try {
        let hasReceivedResult = false
        
        while (true) {
          const { done, value } = await reader.read()
          
          if (done) {
            if (!hasReceivedResult) {
              console.warn('⚠️ 备用方法未收到任何有效结果数据')
            }
            break
          }
          
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            const trimmedLine = line.trim()
            if (!trimmedLine) continue
            
            console.log('📥 备用方法原始SSE行:', trimmedLine)
            
            // 处理阿里云百炼平台自定义应用的SSE格式
            if (trimmedLine.startsWith('data: ')) {
              try {
                const jsonData = trimmedLine.slice(6)
                const data = JSON.parse(jsonData)
                
                // 处理百炼平台自定义应用响应格式
                if (data.output && data.output.text) {
                  const content = data.output.text
                  if (content) {
                    console.log('✅ 备用方法收到有效内容:', content)
                    
                    // 阿里云百炼平台返回的是完整响应，不是分块数据
                    // 这里需要一次性传递完整内容
                    yield content
                    hasReceivedResult = true
                    
                    // 由于是完整响应，收到后可以直接结束流式处理
                    console.log('✅ 备用方法完整响应已接收，流式处理完成')
                    return // 对于生成器函数，使用return来结束
                  }
                }
              } catch (error) {
                console.warn('解析流式响应数据失败:', error)
              }
            }
            
            // 处理阿里云百炼平台的特殊SSE格式（包含HTTP状态的行）
            if (trimmedLine.startsWith(':HTTP_STATUS/')) {
              console.log('📋 备用方法阿里云HTTP状态行:', trimmedLine)
              // 这个行后面紧跟着data行，我们继续处理下一行
              continue
            }
            
            // 处理完成信号
            if (trimmedLine === 'data: [DONE]' || trimmedLine.includes('finish_reason')) {
              console.log('✅ 备用流式响应完成')
              return
            }
          }
        }
      } finally {
        reader.releaseLock()
      }
    } catch (error: any) {
      console.error('阿里云百炼平台流式调用失败:', error)
      throw new Error(`流式响应失败: ${error.message}`)
    }
  }

  // 测试连接 - 使用与测试文件相同的逻辑
  async testConnection(): Promise<boolean> {
    try {
      console.log('🔍 开始测试阿里云百炼平台连接...')
      
      const testMessages = [
        { role: 'user' as const, content: '你好' }
      ]
      
      // 使用非流式调用进行测试
      const response = await this.sendChatMessage(testMessages)
      
      console.log('✅ 连接测试成功:', response)
      return !!response.output && !!response.output.text
    } catch (error) {
      console.error('❌ 连接测试失败:', error)
      return false
    }
  }
}

// 创建单例实例
export const aliyunService = new AliyunService()

export default aliyunService
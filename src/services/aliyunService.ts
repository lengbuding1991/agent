import axios from 'axios'

// 阿里云大模型配置接口
export interface AliyunConfig {
  apiKey: string
  apiUrl: string
  model: string
  appId?: string // 应用ID，用于标识您的应用
  temperature?: number
  maxTokens?: number
}

// 阿里云大模型请求接口（兼容OpenAI格式）
export interface AliyunRequest {
  model: string
  messages: Array<{
    role: 'user' | 'assistant' | 'system'
    content: string
  }>
  temperature?: number
  max_tokens?: number
  stream?: boolean
}

// 阿里云流式请求接口（兼容OpenAI格式）
export interface AliyunChatRequest {
  model: string
  messages: Array<{
    role: 'user' | 'assistant' | 'system'
    content: string
  }>
  temperature?: number
  max_tokens?: number
  stream?: boolean
}

// 阿里云大模型响应接口（兼容OpenAI格式）
export interface AliyunChatResponse {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }>
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

// 阿里云大模型响应接口（阿里云原生格式）
export interface AliyunNativeResponse {
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

// 流式响应数据块（兼容OpenAI格式）
export interface AliyunChatStreamChunk {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    delta: {
      role?: string
      content?: string
    }
    finish_reason: string | null
  }>
}

// 流式响应数据块（阿里云原生格式）
export interface AliyunNativeStreamChunk {
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
export class AliyunService {
  private config: AliyunConfig | null = null

  // 设置配置
  setConfig(config: AliyunConfig) {
    this.config = config
    console.log('阿里云大模型配置已设置:', {
      apiUrl: config.apiUrl,
      model: config.model
    })
  }

  // 获取当前配置
  getConfig(): AliyunConfig | null {
    return this.config
  }

  // 验证配置是否有效
  isValidConfig(): boolean {
    return !!(this.config?.apiKey && this.config?.apiUrl && this.config?.model)
  }

  // 发送聊天消息（非流式）
  async sendChatMessage(messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>): Promise<string> {
    if (!this.isValidConfig()) {
      throw new Error('阿里云大模型配置不完整，请先设置API Key、API URL和模型名称')
    }

    // 构建请求数据，兼容阿里云原生格式
    const requestData: any = {
      model: this.config!.model,
      input: {
        messages
      },
      parameters: {
        temperature: this.config?.temperature || 0.7,
        max_tokens: this.config?.maxTokens || 2000,
        stream: false
      }
    }

    // 如果配置了应用ID，添加到请求参数中
    if (this.config?.appId) {
      requestData.parameters.app_id = this.config.appId
    }

    try {
      const response = await axios.post(this.config!.apiUrl, requestData, {
        headers: {
          'Authorization': `Bearer ${this.config!.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      })

      const data = response.data
      
      // 处理阿里云原生格式响应
      if (data.output && data.output.text) {
        return data.output.text
      }
      // 处理兼容OpenAI格式响应
      else if (data.choices && data.choices.length > 0 && data.choices[0].message) {
        return data.choices[0].message.content
      }
      // 处理其他可能的响应格式
      else if (data.choices && data.choices.length > 0 && data.choices[0].text) {
        return data.choices[0].text
      }
      else {
        console.warn('阿里云大模型返回了未知格式的响应:', data)
        throw new Error('阿里云大模型返回了无法解析的回复格式')
      }
    } catch (error: any) {
      console.error('阿里云大模型调用失败:', error)
      
      if (error.response) {
        // 服务器返回错误状态码
        const status = error.response.status
        const message = error.response.data?.message || error.response.statusText
        
        switch (status) {
          case 401:
            throw new Error('API Key无效，请检查您的API Key配置')
          case 403:
            throw new Error('API Key权限不足或配额已用完')
          case 429:
            throw new Error('请求频率过高，请稍后重试')
          case 500:
            throw new Error('阿里云大模型服务内部错误，请稍后重试')
          default:
            throw new Error(`阿里云大模型请求失败 (${status}): ${message}`)
        }
      } else if (error.request) {
        // 请求发送失败
        throw new Error('无法连接到阿里云大模型服务，请检查网络连接和API URL')
      } else {
        // 其他错误
        throw new Error(`阿里云大模型调用失败: ${error.message}`)
      }
    }
  }

  // 流式消息发送方法
  async sendMessageStream(
    message: string, 
    onChunk: (chunk: string) => void,
    onComplete: (fullResponse: string) => void,
    onError: (error: Error) => void
  ): Promise<void> {
    if (!this.config?.apiKey || !this.config?.apiUrl || !this.config?.model) {
      throw new Error('阿里云大模型配置不完整，请先设置API Key、API URL和模型名称')
    }

    // 构建请求数据，兼容阿里云原生格式
    const requestData: any = {
      model: this.config.model,
      input: {
        messages: [
          {
            role: 'user',
            content: message
          }
        ]
      },
      parameters: {
        temperature: this.config?.temperature || 0.7,
        max_tokens: this.config?.maxTokens || 2000,
        stream: true
      }
    }

    // 如果配置了应用ID，添加到请求参数中
    if (this.config?.appId) {
      requestData.parameters.app_id = this.config.appId
    }

    try {
      const response = await fetch(this.config.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`阿里云API请求失败: ${response.status} ${response.statusText} - ${errorText}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('无法读取响应流')
      }

      let fullResponse = ''
      const decoder = new TextDecoder()

      try {
        while (true) {
          const { done, value } = await reader.read()
          
          if (done) {
            break
          }

          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.slice(6)
              
              if (dataStr === '[DONE]') {
                onComplete(fullResponse)
                return
              }

              try {
                const data = JSON.parse(dataStr)
                
                // 处理阿里云原生格式流式响应
                if (data.output && data.output.text) {
                  const content = data.output.text
                  if (content) {
                    fullResponse += content
                    onChunk(content)
                  }
                }
                // 处理兼容OpenAI格式流式响应
                else if (data.choices && data.choices.length > 0 && data.choices[0].delta) {
                  const content = data.choices[0].delta.content
                  if (content) {
                    fullResponse += content
                    onChunk(content)
                  }
                }
                // 处理其他可能的流式响应格式
                else if (data.choices && data.choices.length > 0 && data.choices[0].text) {
                  const content = data.choices[0].text
                  if (content) {
                    fullResponse += content
                    onChunk(content)
                  }
                }
              } catch (parseError) {
                // 忽略解析错误，继续处理下一个数据块
                console.warn('解析流数据失败:', parseError, '原始数据:', dataStr)
              }
            }
          }
        }
      } finally {
        reader.releaseLock()
      }

      onComplete(fullResponse)
    } catch (error) {
      console.error('阿里云流式API调用失败:', error)
      onError(error instanceof Error ? error : new Error('未知错误'))
    }
  }

  // 发送聊天消息（流式响应）
  async *sendChatMessageStream(messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>): AsyncGenerator<string, void, unknown> {
    if (!this.isValidConfig()) {
      throw new Error('阿里云大模型配置不完整，请先设置API Key、API URL和模型名称')
    }

    const requestData: AliyunChatRequest = {
      model: this.config!.model,
      messages,
      temperature: this.config?.temperature || 0.7,
      max_tokens: this.config?.maxTokens || 2000,
      stream: true
    }

    try {
      const response = await fetch(this.config!.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config!.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('无法读取流式响应')
      }

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        
        if (done) break
        
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmedLine = line.trim()
          if (!trimmedLine || trimmedLine === 'data: [DONE]') continue
          
          if (trimmedLine.startsWith('data: ')) {
            try {
              const jsonData = trimmedLine.slice(6)
              const chunk: AliyunChatStreamChunk = JSON.parse(jsonData)
              
              if (chunk.choices && chunk.choices.length > 0) {
                const content = chunk.choices[0].delta.content
                if (content) {
                  yield content
                }
              }
            } catch (error) {
              console.warn('解析流式响应数据失败:', error)
            }
          }
        }
      }
    } catch (error: any) {
      console.error('阿里云大模型流式调用失败:', error)
      throw new Error(`流式响应失败: ${error.message}`)
    }
  }

  // 测试连接
  async testConnection(): Promise<boolean> {
    if (!this.isValidConfig()) {
      return false
    }

    try {
      const testMessages = [
        { role: 'user' as const, content: '你好，请回复"连接成功"' }
      ]
      
      const response = await this.sendChatMessage(testMessages)
      return response.includes('连接成功')
    } catch (error) {
      console.error('阿里云大模型连接测试失败:', error)
      return false
    }
  }
}

// 创建单例实例
export const aliyunService = new AliyunService()

export default aliyunService
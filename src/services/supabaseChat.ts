import supabase from './supabase'
import type { ChatSession, ChatMessage } from './supabase.types'

export class SupabaseChatService {
  // 获取用户的所有聊天会话
  async getChatSessions(userId: string): Promise<ChatSession[]> {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  // 创建新的聊天会话
  async createChatSession(userId: string, title: string = '新对话'): Promise<ChatSession> {
    const { data, error } = await supabase
      .from('chat_sessions')
      .insert({
        user_id: userId,
        title,
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  // 获取会话中的消息
  async getChatMessages(sessionId: string): Promise<ChatMessage[]> {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data || []
  }

  // 添加消息到会话
  async addChatMessage(
    sessionId: string, 
    role: 'user' | 'assistant', 
    content: string
  ): Promise<ChatMessage> {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        session_id: sessionId,
        role,
        content,
      })
      .select()
      .single()

    if (error) throw error

    // 更新会话的更新时间
    await supabase
      .from('chat_sessions')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', sessionId)

    return data
  }

  // 删除聊天会话
  async deleteChatSession(sessionId: string): Promise<void> {
    // 先删除关联的消息
    await supabase
      .from('chat_messages')
      .delete()
      .eq('session_id', sessionId)

    // 再删除会话
    const { error } = await supabase
      .from('chat_sessions')
      .delete()
      .eq('id', sessionId)

    if (error) throw error
  }

  // 重命名会话
  async renameChatSession(sessionId: string, title: string): Promise<ChatSession> {
    const { data, error } = await supabase
      .from('chat_sessions')
      .update({ title, updated_at: new Date().toISOString() })
      .eq('id', sessionId)
      .select()
      .single()

    if (error) throw error
    return data
  }
}

export const supabaseChatService = new SupabaseChatService()
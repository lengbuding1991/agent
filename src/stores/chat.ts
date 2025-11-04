import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ChatSession, ChatMessage } from '../services/api'

export const useChatStore = defineStore('chat', () => {
  // 状态
  const sessions = ref<ChatSession[]>([])
  const currentSessionId = ref<string | null>(null)
  const isLoading = ref(false)
  const isStreaming = ref(false)

  // 计算属性
  const currentSession = computed(() => 
    sessions.value.find(session => session.id === currentSessionId.value)
  )

  const currentMessages = computed(() => 
    currentSession.value?.messages || []
  )

  const hasSessions = computed(() => sessions.value.length > 0)

  // 方法
  const setSessions = (newSessions: ChatSession[]) => {
    sessions.value = newSessions
  }

  const addSession = (session: ChatSession) => {
    sessions.value.unshift(session)
    currentSessionId.value = session.id
  }

  const setCurrentSession = (sessionId: string) => {
    currentSessionId.value = sessionId
  }

  const updateSession = (sessionId: string, updates: Partial<ChatSession>) => {
    const sessionIndex = sessions.value.findIndex(s => s.id === sessionId)
    if (sessionIndex !== -1) {
      sessions.value[sessionIndex] = { ...sessions.value[sessionIndex], ...updates }
    }
  }

  const addMessageToSession = (sessionId: string, message: ChatMessage) => {
    const session = sessions.value.find(s => s.id === sessionId)
    if (session) {
      session.messages.push(message)
      session.updatedAt = new Date().toISOString()
    }
  }

  const deleteSession = (sessionId: string) => {
    sessions.value = sessions.value.filter(session => session.id !== sessionId)
    if (currentSessionId.value === sessionId) {
      currentSessionId.value = sessions.value[0]?.id || null
    }
  }

  const clearSessions = () => {
    sessions.value = []
    currentSessionId.value = null
  }

  const setLoading = (loading: boolean) => {
    isLoading.value = loading
  }

  const setStreaming = (streaming: boolean) => {
    isStreaming.value = streaming
  }

  return {
    // 状态
    sessions,
    currentSessionId,
    isLoading,
    isStreaming,
    
    // 计算属性
    currentSession,
    currentMessages,
    hasSessions,
    
    // 方法
    setSessions,
    addSession,
    setCurrentSession,
    updateSession,
    addMessageToSession,
    deleteSession,
    clearSessions,
    setLoading,
    setStreaming
  }
})
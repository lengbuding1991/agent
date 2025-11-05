import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabaseAuthService } from '../services/supabaseAuth'
import type { UserProfile } from '../services/supabase.types'

// 本地存储键名
const AUTH_STORAGE_KEY = 'yc-agent-auth-state'

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const user = ref<UserProfile | null>(null)
  const isLoading = ref(false)
  const isAuthenticated = computed(() => !!user.value)

  // 初始化认证状态
  const initializeAuth = async () => {
    isLoading.value = true
    try {
      // 首先尝试从Supabase恢复认证状态
      const { user: currentUser, error } = await supabaseAuthService.getCurrentUser()
      
      if (error) {
        // 如果是认证会话缺失的错误，尝试从本地存储恢复
        if (error.message?.includes('Auth session missing')) {
          console.log('Supabase认证会话缺失，尝试从本地存储恢复...')
          const storedUser = restoreAuthState()
          if (storedUser) {
            console.log('从本地存储成功恢复认证状态')
            user.value = storedUser
            return
          }
          console.log('未找到认证会话，用户未登录')
          user.value = null
          return
        }
        throw error
      }
      
      // Supabase认证成功，保存到本地存储
      user.value = currentUser
      if (currentUser) {
        saveAuthState(currentUser)
      }
    } catch (error) {
      console.error('初始化认证失败:', error)
      
      // 作为最后手段，尝试从本地存储恢复
      const storedUser = restoreAuthState()
      if (storedUser) {
        console.log('认证失败后从本地存储恢复认证状态')
        user.value = storedUser
      } else {
        user.value = null
      }
    } finally {
      isLoading.value = false
    }
  }

  // 用户注册
  const signUp = async (email: string, password: string, username: string) => {
    isLoading.value = true
    try {
      const { user: newUser, error } = await supabaseAuthService.signUp(email, password, username)
      if (error) throw error
      user.value = newUser
      return { success: true }
    } catch (error) {
      console.error('注册失败:', error)
      return { success: false, error }
    } finally {
      isLoading.value = false
    }
  }

  // 用户登录
  const signIn = async (email: string, password: string) => {
    isLoading.value = true
    try {
      const { user: authUser, error } = await supabaseAuthService.signIn(email, password)
      if (error) throw error
      user.value = authUser
      return { success: true }
    } catch (error) {
      console.error('登录失败:', error)
      return { success: false, error }
    } finally {
      isLoading.value = false
    }
  }

  // 用户登出
  const signOut = async () => {
    isLoading.value = true
    try {
      const { error } = await supabaseAuthService.signOut()
      if (error) throw error
      user.value = null
      return { success: true }
    } catch (error) {
      console.error('登出失败:', error)
      return { success: false, error }
    } finally {
      isLoading.value = false
    }
  }

  // 保存认证状态到本地存储
  const saveAuthState = (authUser: UserProfile | null) => {
    try {
      if (authUser) {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
          user: authUser,
          timestamp: Date.now()
        }))
      } else {
        localStorage.removeItem(AUTH_STORAGE_KEY)
      }
    } catch (error) {
      console.error('保存认证状态到本地存储失败:', error)
    }
  }

  // 从本地存储恢复认证状态
  const restoreAuthState = (): UserProfile | null => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY)
      if (!stored) return null
      
      const { user: storedUser, timestamp } = JSON.parse(stored)
      
      // 检查存储是否过期（7天）
      const isExpired = Date.now() - timestamp > 7 * 24 * 60 * 60 * 1000
      if (isExpired) {
        localStorage.removeItem(AUTH_STORAGE_KEY)
        return null
      }
      
      return storedUser
    } catch (error) {
      console.error('从本地存储恢复认证状态失败:', error)
      localStorage.removeItem(AUTH_STORAGE_KEY)
      return null
    }
  }

  // 监听认证状态变化
  const setupAuthListener = () => {
    supabaseAuthService.onAuthStateChange((authUser) => {
      user.value = authUser
      saveAuthState(authUser)
    })
  }

  return {
    // 状态
    user,
    isLoading,
    isAuthenticated,
    
    // 方法
    initializeAuth,
    signUp,
    signIn,
    signOut,
    setupAuthListener
  }
})
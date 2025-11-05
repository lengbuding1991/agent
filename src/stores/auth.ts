import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabaseAuthService } from '../services/supabaseAuth'
import type { UserProfile } from '../services/supabase.types'

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const user = ref<UserProfile | null>(null)
  const isLoading = ref(false)
  const isAuthenticated = computed(() => !!user.value)

  // 初始化认证状态
  const initializeAuth = async () => {
    isLoading.value = true
    try {
      const { user: currentUser, error } = await supabaseAuthService.getCurrentUser()
      if (error) throw error
      user.value = currentUser
    } catch (error) {
      console.error('初始化认证失败:', error)
      user.value = null
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

  // 监听认证状态变化
  const setupAuthListener = () => {
    supabaseAuthService.onAuthStateChange((authUser) => {
      user.value = authUser
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
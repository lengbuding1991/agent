import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { UserInfo } from '../services/api'

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const token = ref<string | null>(localStorage.getItem('auth_token'))
  const user = ref<UserInfo | null>(null)
  const isAuthenticated = computed(() => !!token.value && !!user.value)

  // 从localStorage初始化token
  const initializeFromStorage = () => {
    const storedToken = localStorage.getItem('auth_token')
    if (storedToken) {
      token.value = storedToken
    }
  }

  // 设置token
  const setToken = (newToken: string) => {
    token.value = newToken
    localStorage.setItem('auth_token', newToken)
  }

  // 设置用户信息
  const setUser = (userInfo: UserInfo) => {
    user.value = userInfo
  }

  // 清除认证信息
  const clearAuth = () => {
    token.value = null
    user.value = null
    localStorage.removeItem('auth_token')
  }

  // 检查token是否有效（简单实现）
  const isTokenValid = computed(() => {
    if (!token.value) return false
    
    // 在实际应用中，这里应该解析JWT token并检查过期时间
    // 这里简单检查token是否存在
    return true
  })

  return {
    // 状态
    token,
    user,
    isAuthenticated,
    isTokenValid,
    
    // 方法
    initializeFromStorage,
    setToken,
    setUser,
    clearAuth
  }
})
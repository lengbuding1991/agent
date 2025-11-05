import supabase from './supabase'
import type { UserProfile } from './supabase.types'

export interface AuthResponse {
  user: UserProfile | null
  error: Error | null
}

export class SupabaseAuthService {
  // 用户注册
  async signUp(email: string, password: string, username: string): Promise<AuthResponse> {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username
          }
        }
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('用户创建失败')

      // 创建用户profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email,
          username,
        })
        .select()
        .single()

      if (profileError) throw profileError

      return { user: profileData, error: null }
    } catch (error) {
      return { user: null, error: error as Error }
    }
  }

  // 用户登录
  async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('登录失败')

      // 获取用户profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single()

      if (profileError) throw profileError

      return { user: profileData, error: null }
    } catch (error) {
      return { user: null, error: error as Error }
    }
  }

  // 用户登出
  async signOut(): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase.auth.signOut()
      return { error }
    } catch (error) {
      return { error: error as Error }
    }
  }

  // 获取当前用户
  async getCurrentUser(): Promise<AuthResponse> {
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
      
      if (authError) throw authError
      if (!authUser) return { user: null, error: null }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (profileError) throw profileError

      return { user: profileData, error: null }
    } catch (error) {
      return { user: null, error: error as Error }
    }
  }

  // 监听认证状态变化
  onAuthStateChange(callback: (user: UserProfile | null) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      
      if (event === 'INITIAL_SESSION' && session?.user) {
        // 页面加载时恢复持久化的认证会话
        try {
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
          callback(data)
        } catch (error) {
          callback(null)
        }
      } else if (event === 'SIGNED_IN' && session?.user) {
        try {
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
          callback(data)
        } catch (error) {
          callback(null)
        }
      } else if (event === 'SIGNED_OUT') {
        callback(null)
      } else if (event === 'USER_UPDATED' && session?.user) {
        // 处理用户信息更新
        try {
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
          callback(data)
        } catch (error) {
          // 更新失败，静默处理
        }
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        // 令牌刷新时更新用户信息
        try {
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
          callback(data)
        } catch (error) {
          // 获取失败，静默处理
        }
      }
    })
  }
}

export const supabaseAuthService = new SupabaseAuthService()
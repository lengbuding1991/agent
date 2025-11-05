import { createClient } from '@supabase/supabase-js'

// 直接使用你的Supabase配置
const supabaseUrl = 'https://ebeqtovzrfnojniaryfo.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViZXF0b3Z6cmZub2puaWFyeWZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4NDEzNzYsImV4cCI6MjA3NzQxNzM3Nn0.ZJPOzMzD7PLDStgLpJRWp5k2GYef3XBRecr_EacWtK4'

async function testConnection() {
  console.log('🔍 测试Supabase连接...')
  console.log('URL:', supabaseUrl)
  console.log('Key:', supabaseAnonKey.substring(0, 20) + '...')
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: false
    }
  })
  
  try {
    // 测试认证服务
    console.log('\n1. 测试认证服务...')
    const { data: authData, error: authError } = await supabase.auth.getSession()
    
    if (authError) {
      console.log('❌ 认证服务错误:', authError.message)
    } else {
      console.log('✅ 认证服务正常，当前会话:', authData.session ? '有会话' : '无会话')
    }
    
    // 测试数据库查询
    console.log('\n2. 测试数据库连接...')
    const { data: tables, error: tablesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1)
    
    if (tablesError) {
      console.log('❌ 数据库查询失败:', tablesError.message)
      
      // 检查是否是表不存在
      if (tablesError.message.includes('relation') && tablesError.message.includes('does not exist')) {
        console.log('💡 提示: profiles表不存在，需要创建数据库表结构')
      }
    } else {
      console.log('✅ 数据库连接正常，profiles表存在')
      console.log('   当前记录数:', tables.length)
    }
    
    // 测试用户注册
    console.log('\n3. 测试用户注册...')
    const testEmail = `test${Date.now()}@gmail.com`
    const testPassword = 'Test123456!'
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          username: 'testuser'
        }
      }
    })
    
    if (signUpError) {
      console.log('❌ 注册失败:', signUpError.message)
      
      // 分析错误原因
      if (signUpError.message.includes('User already registered')) {
        console.log('💡 提示: 邮箱已被注册，这是正常的')
      } else if (signUpError.message.includes('Password should')) {
        console.log('💡 提示: 密码强度不够，需要包含大小写字母和特殊字符')
      }
    } else if (signUpData.user) {
      console.log('✅ 注册成功!')
      console.log('   用户ID:', signUpData.user.id)
      console.log('   邮箱:', signUpData.user.email)
      
      // 检查用户是否已验证
      if (signUpData.user.identities && signUpData.user.identities.length > 0) {
        console.log('   身份验证状态:', signUpData.user.identities[0].identity_data)
      }
      
      // 尝试插入profile数据
      console.log('\n4. 测试插入profile数据...')
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: signUpData.user.id,
          email: testEmail,
          username: 'testuser'
        })
        .select()
      
      if (profileError) {
        console.log('❌ 插入profile失败:', profileError.message)
        
        if (profileError.message.includes('duplicate key')) {
          console.log('💡 提示: 用户已存在，这是正常的')
        } else if (profileError.message.includes('relation')) {
          console.log('💡 提示: profiles表不存在，需要执行SQL创建表')
        }
      } else {
        console.log('✅ profile插入成功:', profileData)
      }
    }
    
  } catch (error) {
    console.error('测试过程中出错:', error)
  }
}

testConnection()
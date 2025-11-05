import { createClient } from '@supabase/supabase-js'

// 从环境变量获取配置
const supabaseUrl = 'https://ebeqtovzrfnojniaryfo.supabase.co'
const supabaseAnonKey = 'sbp_0a75a4b14634683c2533de4069baf47cd2445eae'

async function checkTables() {
  console.log('检查Supabase数据库表结构...')
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  
  try {
    // 检查profiles表
    console.log('\n1. 检查profiles表...')
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1)
    
    if (profilesError) {
      console.log('❌ profiles表不存在或查询失败:', profilesError.message)
    } else {
      console.log('✅ profiles表存在，当前记录数:', profiles.length)
    }
    
    // 检查auth.users表（系统表）
    console.log('\n2. 检查auth.users表...')
    const { data: authUsers, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.log('❌ 认证服务不可用:', authError.message)
    } else {
      console.log('✅ 认证服务正常')
    }
    
    // 测试插入数据
    console.log('\n3. 测试数据插入...')
    const testEmail = `test-${Date.now()}@example.com`
    const testPassword = 'test123456'
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    })
    
    if (signUpError) {
      console.log('❌ 注册测试失败:', signUpError.message)
    } else if (signUpData.user) {
      console.log('✅ 注册测试成功，用户ID:', signUpData.user.id)
      
      // 尝试插入profile
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
        console.log('\n💡 需要创建数据库表结构，请执行以下SQL:')
        console.log(`
-- profiles表
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null unique,
  username text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 启用RLS（行级安全）
alter table profiles enable row level security;

-- 创建策略：用户只能访问自己的数据
create policy "用户只能访问自己的profile数据" on profiles
  for all using (auth.uid() = id);
        `)
      } else {
        console.log('✅ profile插入成功:', profileData)
      }
    }
    
  } catch (error) {
    console.error('检查过程中出错:', error)
  }
}

checkTables()
# Supabase 配置指南

## 1. 获取正确的Supabase配置

1. 访问 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目 `ebeqtovzrfnojniaryfo`
3. 进入 **Settings** → **API**
4. 复制以下信息：

```bash
# 项目URL（格式：https://[project-ref].supabase.co）
VITE_SUPABASE_URL=https://ebeqtovzrfnojniaryfo.supabase.co

# 匿名密钥（以 eyJ 开头的JWT格式）
VITE_SUPABASE_ANON_KEY=eyJ...
```

## 2. 创建数据库表结构

在Supabase Dashboard中执行以下SQL：

```sql
-- 创建profiles表
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null unique,
  username text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 启用行级安全
alter table profiles enable row level security;

-- 创建策略：用户只能访问自己的数据
create policy "用户只能访问自己的profile数据" on profiles
  for all using (auth.uid() = id);

-- 创建chat_sessions表
create table chat_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  title text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 创建chat_messages表
create table chat_messages (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references chat_sessions(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz default now()
);

-- 为chat表启用RLS
alter table chat_sessions enable row level security;
alter table chat_messages enable row level security;

-- 创建chat表策略
create policy "用户只能访问自己的会话" on chat_sessions
  for all using (auth.uid() = user_id);

create policy "用户只能访问自己会话的消息" on chat_messages
  for all using (
    session_id in (
      select id from chat_sessions where user_id = auth.uid()
    )
  );
```

## 3. 配置环境变量

更新 `.env.local` 文件：

```bash
VITE_SUPABASE_URL=https://ebeqtovzrfnojniaryfo.supabase.co
VITE_SUPABASE_ANON_KEY=你的正确匿名密钥
```

## 4. 测试配置

运行以下命令测试连接：

```bash
pnpm install
pnpm dev
```

## 常见问题

### 1. "Invalid API key" 错误
- 检查 `VITE_SUPABASE_ANON_KEY` 是否以 `eyJ` 开头
- 确保密钥是从Supabase Dashboard的API设置页面复制的

### 2. "表不存在" 错误
- 确保已执行上述SQL语句创建表结构
- 检查表名是否正确（profiles、chat_sessions、chat_messages）

### 3. 注册后数据不显示
- 检查浏览器控制台是否有错误信息
- 确认Supabase Dashboard的Authentication页面是否有新用户
- 确认Table Editor中profiles表是否有数据
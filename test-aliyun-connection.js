// 阿里云大模型连接测试脚本
import axios from 'axios';

// 您提供的配置信息
const config = {
  apiKey: 'sk-7511ca603ff44019b2395b3d94630ffe',
  // 尝试不同的URL格式
  apiUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
  model: 'qwen-turbo',
  appId: 'c3e3bac8de9e47e2bc26cb30b6b459e2',
  temperature: 0.7,
  maxTokens: 2000
};

// 测试连接函数
async function testAliyunConnection() {
  console.log('🚀 开始测试阿里云大模型连接...\n');
  
  try {
    console.log('📋 配置信息:');
    console.log('- API Key:', config.apiKey.substring(0, 10) + '...');
    console.log('- API URL:', config.apiUrl);
    console.log('- 模型:', config.model);
    console.log('');

    // 构建请求数据（尝试多种格式）
    const requestData = {
      // 格式1：简单消息格式
      messages: [
        {
          role: 'user',
          content: '你好，请简单介绍一下你自己。'
        }
      ],
      model: config.model,
      temperature: config.temperature,
      max_tokens: config.maxTokens
    };

    console.log('📤 发送请求到阿里云大模型...');
    
    const response = await axios.post(config.apiUrl, requestData, {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    console.log('✅ 请求成功！HTTP状态码:', response.status);
    console.log('');

    // 解析响应
    const data = response.data;
    console.log('📥 响应数据格式:', Object.keys(data));
    
    // 处理不同格式的响应
    let replyText = '';
    
    if (data.output && data.output.text) {
      // 阿里云原生格式
      replyText = data.output.text;
      console.log('🔍 检测到阿里云原生格式响应');
    } else if (data.choices && data.choices.length > 0 && data.choices[0].message) {
      // OpenAI兼容格式
      replyText = data.choices[0].message.content;
      console.log('🔍 检测到OpenAI兼容格式响应');
    } else if (data.choices && data.choices.length > 0 && data.choices[0].text) {
      // 其他兼容格式
      replyText = data.choices[0].text;
      console.log('🔍 检测到其他兼容格式响应');
    } else {
      console.log('❌ 无法识别的响应格式:', data);
      return false;
    }

    console.log('');
    console.log('🤖 AI回复内容:');
    console.log(replyText);
    console.log('');
    
    console.log('🎉 阿里云大模型连接测试成功！');
    return true;
    
  } catch (error) {
    console.error('❌ 连接测试失败:', error.message);
    
    if (error.response) {
      console.log('📊 错误详情:');
      console.log('- HTTP状态码:', error.response.status);
      console.log('- 错误信息:', error.response.data || error.response.statusText);
      
      if (error.response.status === 401) {
        console.log('💡 建议: 检查API Key是否正确');
      } else if (error.response.status === 403) {
        console.log('💡 建议: 检查API Key权限或配额');
      } else if (error.response.status === 404) {
        console.log('💡 建议: 检查API URL是否正确');
      }
    } else if (error.request) {
      console.log('🌐 网络连接问题: 无法连接到阿里云服务');
      console.log('💡 建议: 检查网络连接和API URL');
    } else {
      console.log('⚡ 其他错误:', error.message);
    }
    
    return false;
  }
}

// 运行测试
async function main() {
  console.log('='.repeat(60));
  console.log('阿里云大模型连接测试工具');
  console.log('='.repeat(60));
  console.log('');
  
  const success = await testAliyunConnection();
  
  console.log('');
  console.log('='.repeat(60));
  console.log(success ? '✅ 测试完成 - 连接成功' : '❌ 测试完成 - 连接失败');
  console.log('='.repeat(60));
  
  process.exit(success ? 0 : 1);
}

// 执行主函数
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { testAliyunConnection, config };
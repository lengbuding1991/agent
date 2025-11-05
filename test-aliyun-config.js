// 测试阿里云配置是否正确应用
const { AliyunService } = require('./src/services/aliyunService.ts');

// 创建测试实例
const testService = new AliyunService();

// 设置配置（使用您提供的API Key和应用ID）
const config = {
  apiKey: 'sk-7511ca603ff44019b2395b3d94630ffe',
  appId: 'c3e3bac8de9e47e2bc26cb30b6b459e2',
  model: 'qwen-turbo',
  temperature: 0.7,
  maxTokens: 2000
};

testService.setConfig(config);

console.log('🔍 测试阿里云配置...');
console.log('📋 配置信息:');
console.log('- API Key:', config.apiKey ? '✅ 已设置' : '❌ 未设置');
console.log('- 应用ID:', config.appId ? '✅ 已设置' : '❌ 未设置');
console.log('- 模型:', config.model);

// 测试URL构建
console.log('\n🌐 测试API URL构建:');
try {
  const apiUrl = testService.buildApiUrl();
  console.log('- API URL:', apiUrl);
  console.log('- 状态: ✅ URL构建成功');
} catch (error) {
  console.log('- 状态: ❌ URL构建失败:', error.message);
}

// 测试配置验证
console.log('\n🔐 测试配置验证:');
try {
  const isValid = testService.validateConfig();
  console.log('- 配置验证:', isValid ? '✅ 通过' : '❌ 失败');
} catch (error) {
  console.log('- 配置验证: ❌ 失败:', error.message);
}

console.log('\n📊 测试完成！');
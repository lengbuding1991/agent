#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
阿里云百炼平台自定义应用连接测试脚本
使用DashScope SDK调用自定义应用
"""

import os
from http import HTTPStatus
from dashscope import Application

# 配置信息
config = {
    'api_key': 'sk-7511ca603ff44019b2395b3d94630ffe',  # 您的API Key
    'app_id': 'c3e3bac8de9e47e2bc26cb30b6b459e2',      # 您的应用ID
    'prompt': '你好，请简单介绍一下你自己。'
}

def test_bailian_connection():
    """测试阿里云百炼平台自定义应用连接"""
    print("🚀 开始测试阿里云百炼平台自定义应用连接...")
    print("=" * 60)
    
    try:
        print("📋 配置信息:")
        print(f"- API Key: {config['api_key'][:10]}...")
        print(f"- 应用ID: {config['app_id']}")
        print(f"- 提示词: {config['prompt']}")
        print()
        
        print("📤 发送请求到阿里云百炼平台...")
        
        # 使用DashScope SDK调用应用
        response = Application.call(
            api_key=config['api_key'],
            app_id=config['app_id'],
            prompt=config['prompt']
        )
        
        print(f"📊 响应状态码: {response.status_code}")
        
        if response.status_code != HTTPStatus.OK:
            print("❌ 连接测试失败")
            print(f"- request_id: {response.request_id}")
            print(f"- 错误码: {response.status_code}")
            print(f"- 错误信息: {response.message}")
            print("💡 请参考文档: https://help.aliyun.com/zh/model-studio/developer-reference/error-code")
            return False
        else:
            print("✅ 连接测试成功！")
            print(f"- request_id: {response.request_id}")
            print(f"- 输出内容: {response.output.text}")
            return True
            
    except Exception as e:
        print(f"❌ 连接测试失败: {str(e)}")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("阿里云百炼平台自定义应用连接测试工具")
    print("=" * 60)
    print()
    
    success = test_bailian_connection()
    
    print()
    print("=" * 60)
    print("✅ 测试完成 - 连接成功" if success else "❌ 测试完成 - 连接失败")
    print("=" * 60)
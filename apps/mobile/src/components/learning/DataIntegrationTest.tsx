import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { LearningStatsService } from '../../services/learningStatsService';
import { unifiedSyncService } from '../../services/unifiedSyncService';
import { colors } from '../../constants/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const DataIntegrationTest: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);
  const [userInfo, setUserInfo] = useState<any>(null);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  // 测试用户登录
  const testUserLogin = async () => {
    try {
      setLoading(true);
      addResult('🔐 开始测试用户登录...');
      
      // 生成测试用户数据
      const testId = `test_guest_${Date.now()}`;
      const registerData = {
        loginType: 'guest',
        guestId: testId,
        username: `testuser_${Date.now()}`,
        nickname: '测试用户'
      };
      
      addResult(`📝 注册数据: ${JSON.stringify(registerData)}`);
      
      // 调用注册API
      const response = await fetch('https://dramawordv2.onrender.com/api/users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registerData),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        addResult(`❌ 注册失败: ${response.status} - ${errorText}`);
        return;
      }
      
      const result = await response.json();
      addResult(`✅ 注册成功: ${JSON.stringify(result.data.user)}`);
      
      // 保存用户信息到本地存储
      const userData = {
        id: result.data.user.id,
        nickname: result.data.user.nickname,
        loginType: 'guest',
        token: result.data.token,
      };
      
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
      await AsyncStorage.setItem('loginType', 'guest');
      
      setUserInfo(userData);
      addResult(`💾 用户信息已保存到本地存储`);
      addResult(`🆔 用户ID: ${result.data.user.id}`);
      
    } catch (error) {
      addResult(`❌ 用户登录测试失败: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // 测试学习统计API
  const testLearningStatsAPI = async () => {
    try {
      setLoading(true);
      addResult('📊 开始测试学习统计API...');
      
      const statsService = LearningStatsService.getInstance();
      const stats = await statsService.getLearningStats();
      
      if (stats) {
        addResult(`✅ 学习统计获取成功: ${JSON.stringify(stats)}`);
      } else {
        addResult('⚠️ 学习统计为空');
      }
      
    } catch (error) {
      addResult(`❌ 学习统计测试失败: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // 测试徽章API
  const testBadgesAPI = async () => {
    try {
      setLoading(true);
      addResult('🏆 开始测试徽章API...');
      
      const statsService = LearningStatsService.getInstance();
      const badges = await statsService.getBadges();
      
      if (badges && badges.length > 0) {
        addResult(`✅ 徽章获取成功: ${badges.length}个徽章`);
        badges.forEach(badge => {
          addResult(`  - ${badge.name}: ${badge.description}`);
        });
      } else {
        addResult('⚠️ 徽章列表为空');
      }
      
    } catch (error) {
      addResult(`❌ 徽章测试失败: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // 测试数据同步
  const testDataSync = async () => {
    try {
      setLoading(true);
      addResult('🔄 开始测试数据同步...');
      
      const syncResult = await unifiedSyncService.syncPendingData();
      
      addResult(`✅ 数据同步状态: ${syncResult.success ? '成功' : '失败'}`);
      if (syncResult.message) {
        addResult(`📝 同步信息: ${syncResult.message}`);
      }
      
    } catch (error) {
      addResult(`❌ 数据同步测试失败: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // 清除本地数据
  const clearLocalData = async () => {
    try {
      setLoading(true);
      addResult('🗑️ 开始清除本地数据...');
      
      await AsyncStorage.removeItem('userData');
      await AsyncStorage.removeItem('loginType');
      await AsyncStorage.removeItem('learningStats');
      await AsyncStorage.removeItem('badges');
      
      setUserInfo(null);
      addResult('✅ 本地数据已清除');
      
    } catch (error) {
      addResult(`❌ 清除数据失败: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>数据集成测试</Text>
      
      {userInfo && (
        <View style={styles.userInfo}>
          <Text style={styles.userInfoTitle}>当前用户信息:</Text>
          <Text style={styles.userInfoText}>ID: {userInfo.id}</Text>
          <Text style={styles.userInfoText}>昵称: {userInfo.nickname}</Text>
          <Text style={styles.userInfoText}>登录类型: {userInfo.loginType}</Text>
        </View>
      )}
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.button} 
          onPress={testUserLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>测试用户登录</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.button} 
          onPress={testLearningStatsAPI}
          disabled={loading}
        >
          <Text style={styles.buttonText}>测试学习统计</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.button} 
          onPress={testBadgesAPI}
          disabled={loading}
        >
          <Text style={styles.buttonText}>测试徽章系统</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.button} 
          onPress={testDataSync}
          disabled={loading}
        >
          <Text style={styles.buttonText}>测试数据同步</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.clearButton]} 
          onPress={clearLocalData}
          disabled={loading}
        >
          <Text style={styles.buttonText}>清除本地数据</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.clearButton]} 
          onPress={clearResults}
        >
          <Text style={styles.buttonText}>清除测试结果</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsTitle}>测试结果:</Text>
        {testResults.map((result, index) => (
          <Text key={index} style={styles.resultText}>{result}</Text>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: colors.background.primary,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 16,
    textAlign: 'center',
  },
  userInfo: {
    backgroundColor: colors.background.secondary,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  userInfoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 8,
  },
  userInfoText: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  buttonContainer: {
    marginBottom: 16,
  },
  button: {
    backgroundColor: colors.primary[500],
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  clearButton: {
    backgroundColor: colors.error[500],
  },
  buttonText: {
    color: colors.text.inverse,
    fontSize: 16,
    fontWeight: '600',
  },
  resultsContainer: {
    backgroundColor: colors.background.secondary,
    padding: 12,
    borderRadius: 8,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 8,
  },
  resultText: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: 4,
    fontFamily: 'monospace',
  },
}); 
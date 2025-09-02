import { Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

export interface DeepLinkData {
  type: 'invite' | 'subscription' | 'word' | 'show';
  code?: string;
  id?: string;
  params?: Record<string, any>;
}

export class DeepLinkService {
  private static instance: DeepLinkService;
  private isInitialized = false;

  public static getInstance(): DeepLinkService {
    if (!DeepLinkService.instance) {
      DeepLinkService.instance = new DeepLinkService();
    }
    return DeepLinkService.instance;
  }

  // 初始化深度链接监听
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // 监听应用启动时的深度链接
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        console.log('🔗 [DeepLink] 应用启动时检测到深度链接:', initialUrl);
        await this.handleDeepLink(initialUrl);
      }

      // 监听应用运行时的深度链接
      Linking.addEventListener('url', async (event) => {
        console.log('🔗 [DeepLink] 运行时检测到深度链接:', event.url);
        await this.handleDeepLink(event.url);
      });

      this.isInitialized = true;
      console.log('✅ [DeepLink] 深度链接服务初始化成功');
    } catch (error) {
      console.error('❌ [DeepLink] 初始化失败:', error);
    }
  }

  // 处理深度链接
  public async handleDeepLink(url: string): Promise<void> {
    try {
      console.log('🔗 [DeepLink] 开始处理深度链接:', url);
      
      const parsedUrl = new URL(url);
      const pathSegments = parsedUrl.pathname.split('/').filter(Boolean);
      
      if (pathSegments.length === 0) return;

      const linkType = pathSegments[0];
      
      switch (linkType) {
        case 'invite':
          await this.handleInviteLink(parsedUrl, pathSegments);
          break;
        case 'subscription':
          await this.handleSubscriptionLink(parsedUrl, pathSegments);
          break;
        case 'word':
          await this.handleWordLink(parsedUrl, pathSegments);
          break;
        case 'show':
          await this.handleShowLink(parsedUrl, pathSegments);
          break;
        default:
          console.log('🔗 [DeepLink] 未知的链接类型:', linkType);
      }
    } catch (error) {
      console.error('❌ [DeepLink] 处理深度链接失败:', error);
    }
  }

  // 处理邀请链接
  private async handleInviteLink(url: URL, segments: string[]): Promise<void> {
    if (segments.length < 2) {
      console.log('🔗 [DeepLink] 邀请链接格式错误');
      return;
    }

    const inviteCode = segments[1];
    console.log('🔗 [DeepLink] 检测到邀请码:', inviteCode);

    try {
      // 存储邀请码到本地存储
      await AsyncStorage.setItem('pendingInviteCode', inviteCode);
      console.log('✅ [DeepLink] 邀请码已保存到本地存储');

      // 检查用户是否已登录
      const isLoggedIn = await this.checkUserLoginStatus();
      
      if (isLoggedIn) {
        // 用户已登录，直接验证邀请码
        await this.validateAndActivateInvite(inviteCode);
      } else {
        // 用户未登录，显示提示信息
        this.showInviteCodeSavedMessage(inviteCode);
      }
    } catch (error) {
      console.error('❌ [DeepLink] 处理邀请链接失败:', error);
    }
  }

  // 处理订阅链接
  private async handleSubscriptionLink(url: URL, segments: string[]): Promise<void> {
    console.log('🔗 [DeepLink] 处理订阅链接:', segments);
    // TODO: 实现订阅相关的深度链接处理
  }

  // 处理单词链接
  private async handleWordLink(url: URL, segments: string[]): Promise<void> {
    console.log('🔗 [DeepLink] 处理单词链接:', segments);
    // TODO: 实现单词相关的深度链接处理
  }

  // 处理剧集链接
  private async handleShowLink(url: URL, segments: string[]): Promise<void> {
    console.log('🔗 [DeepLink] 处理剧集链接:', segments);
    // TODO: 实现剧集相关的深度链接处理
  }

  // 检查用户登录状态
  private async checkUserLoginStatus(): Promise<boolean> {
    try {
      const authToken = await AsyncStorage.getItem('authToken');
      return !!authToken;
    } catch (error) {
      console.error('❌ [DeepLink] 检查登录状态失败:', error);
      return false;
    }
  }

  // 验证并激活邀请码
  private async validateAndActivateInvite(inviteCode: string): Promise<void> {
    try {
      console.log('🔗 [DeepLink] 开始验证邀请码:', inviteCode);
      
      // TODO: 调用后端API验证邀请码
      // const result = await inviteService.activateInviteCode(inviteCode);
      
      // 模拟验证成功
      const result = { success: true };
      
      if (result.success) {
        // 显示成功提示
        Alert.alert(
          '邀请成功', 
          '您已获得第一个月免费！',
          [
            {
              text: 'OK',
              onPress: async () => {
                // 清除待处理的邀请码
                await AsyncStorage.removeItem('pendingInviteCode');
                console.log('✅ [DeepLink] 邀请码验证成功，已清除本地存储');
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('❌ [DeepLink] 验证邀请码失败:', error);
      Alert.alert('错误', '邀请码验证失败，请重试');
    }
  }

  // 显示邀请码已保存的提示
  private showInviteCodeSavedMessage(inviteCode: string): void {
    Alert.alert(
      '邀请码已保存',
      `您的邀请码 ${inviteCode} 已保存。注册或登录后，系统将自动为您激活第一个月免费！`,
      [{ text: '好的' }]
    );
  }

  // 获取待处理的邀请码
  public async getPendingInviteCode(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('pendingInviteCode');
    } catch (error) {
      console.error('❌ [DeepLink] 获取待处理邀请码失败:', error);
      return null;
    }
  }

  // 清除待处理的邀请码
  public async clearPendingInviteCode(): Promise<void> {
    try {
      await AsyncStorage.removeItem('pendingInviteCode');
      console.log('✅ [DeepLink] 待处理邀请码已清除');
    } catch (error) {
      console.error('❌ [DeepLink] 清除待处理邀请码失败:', error);
    }
  }

  // 生成邀请链接
  public generateInviteLink(inviteCode: string): string {
    return `https://dramaword.com/invite/${inviteCode}`;
  }

  // 测试深度链接（开发模式）
  public async testDeepLink(url: string): Promise<void> {
    if (__DEV__) {
      console.log('🧪 [DeepLink] 测试深度链接:', url);
      await this.handleDeepLink(url);
    }
  }
}

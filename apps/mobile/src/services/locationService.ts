import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeModules, Platform } from 'react-native';
import { API_BASE_URL } from '../constants/config';

// 地理位置信息接口
export interface LocationInfo {
  country?: string;
  region?: string;
  city?: string;
  timezone?: string;
  systemLanguage?: string;
  lastUpdated?: Date;
}

// 地理位置服务
class LocationService {
  private static instance: LocationService;
  private locationInfo: LocationInfo | null = null;

  public static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  /**
   * 获取设备地理位置信息
   */
  public async getLocationInfo(): Promise<LocationInfo> {
    try {
      console.log('[LocationService] 开始获取地理位置信息...');

      const locationInfo: LocationInfo = {
        lastUpdated: new Date()
      };

      // 获取系统语言
      locationInfo.systemLanguage = this.getSystemLanguage();

      // 获取时区
      locationInfo.timezone = this.getTimezone();

      // 获取国家/地区信息（基于系统设置）
      const localeInfo = this.getLocaleInfo();
      locationInfo.country = localeInfo.country;
      locationInfo.region = localeInfo.region;

      // 尝试获取更详细的地理位置信息
      try {
        const detailedLocation = await this.getDetailedLocation();
        if (detailedLocation) {
          locationInfo.city = detailedLocation.city;
          if (detailedLocation.country) {
            locationInfo.country = detailedLocation.country;
          }
          if (detailedLocation.region) {
            locationInfo.region = detailedLocation.region;
          }
        }
      } catch (error) {
        console.log('[LocationService] 获取详细地理位置失败，使用系统信息:', error);
      }

      this.locationInfo = locationInfo;
      console.log('[LocationService] 地理位置信息获取成功:', locationInfo);

      return locationInfo;
    } catch (error) {
      console.error('[LocationService] 获取地理位置信息失败:', error);
      return {
        systemLanguage: this.getSystemLanguage(),
        timezone: this.getTimezone(),
        lastUpdated: new Date()
      };
    }
  }

  /**
   * 获取系统语言
   */
  private getSystemLanguage(): string {
    try {
      if (Platform.OS === 'ios') {
        return NativeModules.SettingsManager?.settings?.AppleLocale || 
               NativeModules.SettingsManager?.settings?.AppleLanguages?.[0] || 
               'en-US';
      } else {
        return NativeModules.I18nManager?.localeIdentifier || 'en-US';
      }
    } catch (error) {
      console.log('[LocationService] 获取系统语言失败:', error);
      return 'en-US';
    }
  }

  /**
   * 获取时区
   */
  private getTimezone(): string {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    } catch (error) {
      console.log('[LocationService] 获取时区失败:', error);
      return 'UTC';
    }
  }

  /**
   * 获取语言环境信息
   */
  private getLocaleInfo(): { country?: string; region?: string } {
    try {
      const locale = this.getSystemLanguage();
      const parts = locale.split('-');
      
      if (parts.length >= 2) {
        return {
          country: parts[1]?.toUpperCase(),
          region: parts[0]?.toLowerCase()
        };
      }
      
      return {};
    } catch (error) {
      console.log('[LocationService] 解析语言环境失败:', error);
      return {};
    }
  }

  /**
   * 获取详细地理位置信息（基于IP或系统API）
   */
  private async getDetailedLocation(): Promise<{ city?: string; country?: string; region?: string } | null> {
    try {
      // 方法1: 使用公共IP地理位置API
      const response = await fetch('https://ipapi.co/json/', {
        method: 'GET',
        timeout: 5000
      });

      if (response.ok) {
        const data = await response.json();
        return {
          city: data.city,
          country: data.country_code,
          region: data.region
        };
      }
    } catch (error) {
      console.log('[LocationService] IP地理位置API失败:', error);
    }

    try {
      // 方法2: 备用API
      const response = await fetch('https://ipinfo.io/json', {
        method: 'GET',
        timeout: 5000
      });

      if (response.ok) {
        const data = await response.json();
        const location = data.loc?.split(',');
        return {
          city: data.city,
          country: data.country,
          region: data.region
        };
      }
    } catch (error) {
      console.log('[LocationService] 备用地理位置API失败:', error);
    }

    return null;
  }

  /**
   * 保存地理位置信息到本地存储
   */
  public async saveLocationInfo(locationInfo: LocationInfo): Promise<void> {
    try {
      await AsyncStorage.setItem('userLocationInfo', JSON.stringify(locationInfo));
      console.log('[LocationService] 地理位置信息已保存到本地存储');
    } catch (error) {
      console.error('[LocationService] 保存地理位置信息失败:', error);
    }
  }

  /**
   * 从本地存储获取地理位置信息
   */
  public async getStoredLocationInfo(): Promise<LocationInfo | null> {
    try {
      const stored = await AsyncStorage.getItem('userLocationInfo');
      if (stored) {
        return JSON.parse(stored);
      }
      return null;
    } catch (error) {
      console.error('[LocationService] 获取本地地理位置信息失败:', error);
      return null;
    }
  }

  /**
   * 上传地理位置信息到后端
   */
  public async uploadLocationInfo(userId: string, token: string): Promise<boolean> {
    try {
      const locationInfo = this.locationInfo || await this.getLocationInfo();
      
      const response = await fetch(`${API_BASE_URL}/users/${userId}/location`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(locationInfo)
      });

      if (response.ok) {
        console.log('[LocationService] 地理位置信息上传成功');
        await this.saveLocationInfo(locationInfo);
        return true;
      } else {
        console.error('[LocationService] 地理位置信息上传失败:', response.status);
        return false;
      }
    } catch (error) {
      console.error('[LocationService] 上传地理位置信息失败:', error);
      return false;
    }
  }

  /**
   * 检查地理位置信息是否需要更新（超过7天）
   */
  public async shouldUpdateLocationInfo(): Promise<boolean> {
    try {
      const stored = await this.getStoredLocationInfo();
      if (!stored || !stored.lastUpdated) {
        return true;
      }

      const lastUpdated = new Date(stored.lastUpdated);
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      return lastUpdated < sevenDaysAgo;
    } catch (error) {
      console.error('[LocationService] 检查地理位置更新状态失败:', error);
      return true;
    }
  }

  /**
   * 初始化地理位置服务
   */
  public async initialize(): Promise<void> {
    try {
      console.log('[LocationService] 初始化地理位置服务...');
      
      // 检查是否需要更新
      const shouldUpdate = await this.shouldUpdateLocationInfo();
      
      if (shouldUpdate) {
        await this.getLocationInfo();
        console.log('[LocationService] 地理位置服务初始化完成');
      } else {
        // 使用本地存储的信息
        this.locationInfo = await this.getStoredLocationInfo();
        console.log('[LocationService] 使用本地地理位置信息');
      }
    } catch (error) {
      console.error('[LocationService] 初始化失败:', error);
    }
  }
}

export const locationService = LocationService.getInstance();
export default locationService;

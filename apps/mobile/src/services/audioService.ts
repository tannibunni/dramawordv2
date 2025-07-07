// TODO: Migrate to expo-audio when the API is stable
// Currently using expo-av as expo-audio is still in development
import { Audio } from 'expo-av';
import { API_BASE_URL } from '../constants/config';

class AudioService {
  private sound: Audio.Sound | null = null;
  private isPlaying = false;

  // 播放单词发音
  async playWordPronunciation(word: string): Promise<void> {
    try {
      // 停止当前播放
      await this.stopAudio();

      // 创建新的音频实例
      this.sound = new Audio.Sound();

      // 设置音频状态监听
      this.sound.setOnPlaybackStatusUpdate((status: any) => {
        if (status.isLoaded) {
          this.isPlaying = status.isPlaying;
        }
      });

      // 获取音频 URL
      const audioUrl = this.getAudioUrl(word);
      
      if (audioUrl) {
        await this.sound.loadAsync({ uri: audioUrl });
        await this.sound.playAsync();
      } else {
        console.warn(`No audio available for word: ${word}`);
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      throw new Error('Failed to play audio');
    }
  }

  // 停止音频播放
  async stopAudio(): Promise<void> {
    try {
      if (this.sound) {
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
        this.sound = null;
        this.isPlaying = false;
      }
    } catch (error) {
      console.error('Error stopping audio:', error);
    }
  }

  // 暂停音频播放
  async pauseAudio(): Promise<void> {
    try {
      if (this.sound && this.isPlaying) {
        await this.sound.pauseAsync();
        this.isPlaying = false;
      }
    } catch (error) {
      console.error('Error pausing audio:', error);
    }
  }

  // 恢复音频播放
  async resumeAudio(): Promise<void> {
    try {
      if (this.sound && !this.isPlaying) {
        await this.sound.playAsync();
        this.isPlaying = true;
      }
    } catch (error) {
      console.error('Error resuming audio:', error);
    }
  }

  // 获取音频 URL
  private getAudioUrl(word: string): string | null {
    if (!word || word.trim() === '') {
      return null;
    }

    // 方案1: Google Translate TTS (免费，推荐)
    // 参数说明：
    // - ie=UTF-8: 输入编码
    // - q=${word}: 要发音的文本
    // - tl=en: 目标语言 (英语)
    // - client=tw-ob: 客户端标识
    const googleTtsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(word.trim())}&tl=en&client=tw-ob`;
    
    // 方案2: 备用 TTS 服务 (如果 Google TTS 有 CORS 问题)
    // const backupTtsUrl = `https://api.dictionaryapi.dev/media/pronunciations/en/${word.toLowerCase()}.mp3`;
    
    return googleTtsUrl;
  }

  // 使用 Web Speech API 播放发音 (备用方案)
  async playWithWebSpeech(word: string): Promise<void> {
    try {
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(word);
        utterance.lang = 'en-US';
        utterance.rate = 0.8; // 稍微慢一点，便于学习
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        
        // 停止当前播放
        window.speechSynthesis.cancel();
        
        // 开始播放
        window.speechSynthesis.speak(utterance);
      } else {
        console.warn('Web Speech API not supported');
        throw new Error('Web Speech API not supported');
      }
    } catch (error) {
      console.error('Error with Web Speech API:', error);
      throw error;
    }
  }

  // 检查是否有音频可用
  hasAudio(word: string): boolean {
    return Boolean(word && word.trim() !== '' && this.getAudioUrl(word) !== null);
  }

  // 获取播放状态
  getPlaybackStatus(): { isPlaying: boolean; hasAudio: boolean } {
    return {
      isPlaying: this.isPlaying,
      hasAudio: this.sound !== null,
    };
  }

  // 设置音量
  async setVolume(volume: number): Promise<void> {
    try {
      if (this.sound) {
        await this.sound.setVolumeAsync(Math.max(0, Math.min(1, volume)));
      }
    } catch (error) {
      console.error('Error setting volume:', error);
    }
  }

  // 设置播放速率
  async setPlaybackRate(rate: number): Promise<void> {
    try {
      if (this.sound) {
        await this.sound.setRateAsync(Math.max(0.5, Math.min(2, rate)), true);
      }
    } catch (error) {
      console.error('Error setting playback rate:', error);
    }
  }

  // 清理资源
  async cleanup(): Promise<void> {
    await this.stopAudio();
  }
}

// 创建单例实例
export const audioService = new AudioService();

// 导出类型
export interface AudioPlaybackStatus {
  isPlaying: boolean;
  hasAudio: boolean;
}

export default audioService; 
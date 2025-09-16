// TODO: Migrate to expo-audio when the API is stable
// Currently using expo-av as expo-audio is still in development
import { Audio } from 'expo-av';
import { API_BASE_URL } from '../constants/config';

class AudioService {
  private sound: Audio.Sound | null = null;
  private isPlaying = false;

  // 播放单词发音
  async playWordPronunciation(word: string, language?: string): Promise<void> {
    console.log('🎵 AudioService - 开始播放单词发音');
    console.log('🎵 单词:', word);
    
    try {
      // 只有在有音频正在播放时才停止
      if (this.sound && this.isPlaying) {
        console.log('🎵 AudioService - 停止当前播放...');
        await this.stopAudio();
        console.log('🎵 AudioService - 当前播放已停止');
      }

      // 创建新的音频实例
      console.log('🎵 AudioService - 创建新的音频实例...');
      this.sound = new Audio.Sound();
      console.log('🎵 AudioService - 音频实例创建成功');

      // 设置音频状态监听
      this.sound.setOnPlaybackStatusUpdate((status: any) => {
        console.log('🎵 AudioService - 播放状态更新:', {
          isLoaded: status.isLoaded,
          isPlaying: status.isPlaying,
          didJustFinish: status.didJustFinish,
          error: status.error,
          durationMillis: status.durationMillis,
          positionMillis: status.positionMillis
        });

        if (status.isLoaded) {
          this.isPlaying = status.isPlaying;
          if (status.didJustFinish) {
            console.log('🎵 AudioService - 播放完成');
            this.isPlaying = false;
          }
        } else if (status.error) {
          console.error('🎵 AudioService - 播放出错:', status.error);
          this.isPlaying = false;
        }
      });

      // 获取音频 URL
      console.log('🎵 AudioService - 获取音频URL...');
      const audioUrl = this.getAudioUrl(word, language);
      console.log('🎵 AudioService - 音频URL:', audioUrl);
      
      if (audioUrl) {
        console.log('🎵 AudioService - 加载音频...');
        await this.sound.loadAsync({ uri: audioUrl });
        console.log('🎵 AudioService - 音频加载成功');
        
        console.log('🎵 AudioService - 开始播放...');
        await this.sound.playAsync();
        console.log('🎵 AudioService - 播放命令已发送');
      } else {
        console.warn('⚠️ AudioService - 没有音频URL');
        throw new Error('No audio available for word');
      }
    } catch (error) {
      console.error('🎵 AudioService - 播放异常:', error);
      console.error('🎵 AudioService - 错误详情:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        word: word
      });
      // 重置状态
      this.isPlaying = false;
      throw new Error('Failed to play audio');
    }
  }

  // 停止音频播放
  async stopAudio(): Promise<void> {
    console.log('🎵 AudioService - 停止音频播放');
    try {
      if (this.sound) {
        console.log('🎵 AudioService - 停止当前音频...');
        
        // 检查音频状态，避免在已经停止的状态下操作
        const status = await this.sound.getStatusAsync();
        if (status.isLoaded && !status.didJustFinish) {
          await this.sound.stopAsync();
          console.log('🎵 AudioService - 音频停止成功');
        }
        
        console.log('🎵 AudioService - 卸载音频...');
        await this.sound.unloadAsync();
        this.sound = null;
        this.isPlaying = false;
        console.log('🎵 AudioService - 音频已停止并卸载');
      } else {
        console.log('🎵 AudioService - 没有正在播放的音频');
      }
    } catch (error) {
      // 忽略 "Seeking interrupted" 错误，这是正常的
      if (error instanceof Error && error.message.includes('Seeking interrupted')) {
        console.log('🎵 AudioService - 音频停止被中断（正常情况）');
        // 强制清理资源
        if (this.sound) {
          try {
            await this.sound.unloadAsync();
          } catch (unloadError) {
            console.log('🎵 AudioService - 强制卸载音频');
          }
          this.sound = null;
          this.isPlaying = false;
        }
      } else {
        console.error('🎵 AudioService - 停止音频出错:', error);
      }
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
  private getAudioUrl(word: string, language?: string): string | null {
    if (!word || word.trim() === '') {
      return null;
    }

    // 检测语言
    const detectedLanguage = language || this.detectLanguage(word);
    console.log(`🎵 AudioService - 语言检测结果:`, {
      word: word,
      explicitLanguage: language,
      detectedLanguage: detectedLanguage,
      isExplicit: !!language
    });

    // 方案1: Google Translate TTS (免费，推荐)
    // 参数说明：
    // - ie=UTF-8: 输入编码
    // - q=${word}: 要发音的文本
    // - tl=${lang}: 目标语言
    // - client=tw-ob: 客户端标识
    const googleTtsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(word.trim())}&tl=${detectedLanguage}&client=tw-ob`;
    
    console.log(`🎵 AudioService - 生成的TTS URL:`, googleTtsUrl);
    
    // 方案2: 备用 TTS 服务 (如果 Google TTS 有 CORS 问题)
    // const backupTtsUrl = `https://api.dictionaryapi.dev/media/pronunciations/${detectedLanguage}/${word.toLowerCase()}.mp3`;
    
    return googleTtsUrl;
  }

  // 检测词汇语言
  private detectLanguage(word: string): string {
    // 计算各种语言的字符比例
    const languageScores = {
      'zh': (word.match(/[\u4e00-\u9fff]/g) || []).length,
      'ja': (word.match(/[\u3040-\u309f\u30a0-\u30ff]/g) || []).length,
      'ko': (word.match(/[\uac00-\ud7af]/g) || []).length,
      'ru': (word.match(/[\u0400-\u04ff]/g) || []).length,
      'ar': (word.match(/[\u0600-\u06ff]/g) || []).length,
      'th': (word.match(/[\u0e00-\u0e7f]/g) || []).length,
      'en': (word.match(/[a-zA-Z]/g) || []).length
    };

    // 找到得分最高的语言
    const maxScore = Math.max(...Object.values(languageScores));
    
    // 如果没有非英文字符，默认为英文
    if (maxScore === 0) {
      return 'en';
    }

    // 对于混合语言，如果英文得分较高，优先选择英文
    // 这样可以避免 "Hello 世界" 被识别为中文
    if (languageScores.en > 0 && languageScores.en >= maxScore * 0.5) {
      return 'en';
    }

    // 返回得分最高的语言
    for (const [language, score] of Object.entries(languageScores)) {
      if (score === maxScore) {
        return language;
      }
    }

    // 默认返回英文
    return 'en';
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
  hasAudio(word: string, language?: string): boolean {
    return Boolean(word && word.trim() !== '' && this.getAudioUrl(word, language) !== null);
  }

  // 获取播放状态
  getPlaybackStatus(): { isPlaying: boolean; hasAudio: boolean } {
    return {
      isPlaying: this.isPlaying,
      hasAudio: this.sound !== null,
    };
  }

  // 获取支持的语言列表
  getSupportedLanguages(): string[] {
    return ['en', 'zh', 'ja', 'ko', 'ru', 'ar', 'th'];
  }

  // 测试语言检测
  testLanguageDetection(word: string): { word: string; detectedLanguage: string; confidence: string } {
    const detectedLanguage = this.detectLanguage(word);
    const confidence = this.getLanguageConfidence(word, detectedLanguage);
    return {
      word,
      detectedLanguage,
      confidence
    };
  }

  // 获取语言检测置信度
  private getLanguageConfidence(word: string, language: string): string {
    const patterns = {
      'zh': /[\u4e00-\u9fff]/g,
      'ja': /[\u3040-\u309f\u30a0-\u30ff]/g,
      'ko': /[\uac00-\ud7af]/g,
      'ru': /[\u0400-\u04ff]/g,
      'ar': /[\u0600-\u06ff]/g,
      'th': /[\u0e00-\u0e7f]/g,
      'en': /[a-zA-Z]/g
    };

    const pattern = patterns[language as keyof typeof patterns];
    if (pattern) {
      const matches = word.match(pattern);
      const confidence = matches ? (matches.length / word.length) : 0;
      if (confidence >= 0.8) return 'high';
      if (confidence >= 0.5) return 'medium';
      if (confidence > 0) return 'low';
      return 'very-low';
    }
    return 'unknown';
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
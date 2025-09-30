// 多语言SQLite数据库管理器
import * as SQLite from 'expo-sqlite';
import { 
  MultilingualEntry, 
  MultilingualTranslation,
  LanguageSupport,
  SUPPORTED_LANGUAGES 
} from '../types/multilingual';

export class MultilingualSQLiteManager {
  private static instance: MultilingualSQLiteManager;
  private db: SQLite.SQLiteDatabase | null = null;
  private databaseName = 'multilingual_dictionary.db';

  static getInstance(): MultilingualSQLiteManager {
    if (!MultilingualSQLiteManager.instance) {
      MultilingualSQLiteManager.instance = new MultilingualSQLiteManager();
    }
    return MultilingualSQLiteManager.instance;
  }

  /**
   * 初始化数据库
   */
  async initialize(): Promise<void> {
    try {
      this.db = await SQLite.openDatabaseAsync(this.databaseName);
      await this.createTables();
      console.log(`✅ 多语言SQLite数据库初始化成功: ${this.databaseName}`);
    } catch (error) {
      console.error('❌ 多语言SQLite数据库初始化失败:', error);
      throw error;
    }
  }

  /**
   * 创建多语言数据表
   */
  private async createTables(): Promise<void> {
    if (!this.db) {
      throw new Error('数据库未初始化');
    }

    // 创建多语言词条表
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS multilingual_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        word TEXT NOT NULL,
        language TEXT NOT NULL,
        phonetic TEXT,
        kana TEXT,
        romaji TEXT,
        pinyin TEXT,
        partOfSpeech TEXT,
        frequency INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 创建多语言释义表
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS multilingual_translations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        entry_id INTEGER NOT NULL,
        language TEXT NOT NULL,
        translation TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (entry_id) REFERENCES multilingual_entries (id) ON DELETE CASCADE
      )
    `);

    // 创建索引
    await this.db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_entries_word ON multilingual_entries (word)
    `);
    await this.db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_entries_language ON multilingual_entries (language)
    `);
    await this.db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_entries_romaji ON multilingual_entries (romaji)
    `);
    await this.db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_entries_pinyin ON multilingual_entries (pinyin)
    `);
    await this.db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_entries_kana ON multilingual_entries (kana)
    `);
    await this.db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_translations_entry_id ON multilingual_translations (entry_id)
    `);
    await this.db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_translations_language ON multilingual_translations (language)
    `);
  }

  /**
   * 插入多语言词条
   */
  async insertMultilingualEntry(entry: Omit<MultilingualEntry, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
    if (!this.db) {
      throw new Error('数据库未初始化');
    }

    const result = await this.db.runAsync(`
      INSERT INTO multilingual_entries 
      (word, language, phonetic, kana, romaji, pinyin, partOfSpeech, frequency)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      entry.word,
      entry.language,
      entry.phonetic || null,
      entry.kana || null,
      entry.romaji || null,
      entry.pinyin || null,
      entry.partOfSpeech || null,
      entry.frequency || 0
    ]);

    const entryId = result.lastInsertRowId;

    // 插入多语言释义
    for (const [lang, translation] of Object.entries(entry.translations)) {
      if (translation) {
        await this.db.runAsync(`
          INSERT INTO multilingual_translations (entry_id, language, translation)
          VALUES (?, ?, ?)
        `, [entryId, lang, translation]);
      }
    }

    return entryId;
  }

  /**
   * 批量插入多语言词条
   */
  async insertMultilingualEntries(entries: Omit<MultilingualEntry, 'id' | 'created_at' | 'updated_at'>[]): Promise<void> {
    if (!this.db) {
      throw new Error('数据库未初始化');
    }

    await this.db.withTransactionAsync(async () => {
      for (const entry of entries) {
        await this.insertMultilingualEntry(entry);
      }
    });
  }

  /**
   * 查询多语言词条
   */
  async searchMultilingualEntries(
    query: string, 
    targetLanguage: string,
    uiLanguage: string = 'en-US',
    limit: number = 10
  ): Promise<MultilingualEntry[]> {
    if (!this.db) {
      throw new Error('数据库未初始化');
    }

    const results = await this.db.getAllAsync(`
      SELECT 
        e.*,
        GROUP_CONCAT(t.language || ':' || t.translation, '|') as translations
      FROM multilingual_entries e
      LEFT JOIN multilingual_translations t ON e.id = t.entry_id
      WHERE e.language = ? 
        AND (e.word LIKE ? OR e.romaji LIKE ? OR e.pinyin LIKE ? OR e.kana LIKE ?)
      GROUP BY e.id
      ORDER BY e.frequency DESC, e.word ASC
      LIMIT ?
    `, [targetLanguage, `%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`, limit]);

    return results.map(row => this.parseMultilingualEntry(row));
  }

  /**
   * 解析多语言词条
   */
  private parseMultilingualEntry(row: any): MultilingualEntry {
    const translations: MultilingualTranslation = {};
    
    if (row.translations) {
      const translationPairs = row.translations.split('|');
      for (const pair of translationPairs) {
        const [lang, translation] = pair.split(':');
        if (lang && translation) {
          (translations as any)[lang] = translation;
        }
      }
    }

    return {
      id: row.id,
      word: row.word,
      language: row.language,
      translations,
      phonetic: row.phonetic,
      kana: row.kana,
      romaji: row.romaji,
      pinyin: row.pinyin,
      partOfSpeech: row.partOfSpeech,
      frequency: row.frequency,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at)
    };
  }

  /**
   * 根据界面语言获取释义
   */
  getTranslationForUILanguage(entry: MultilingualEntry, uiLanguage: string): string {
    const translations = entry.translations;
    
    // 根据界面语言选择释义
    switch (uiLanguage) {
      case 'en-US':
        return translations.en || translations.zh || Object.values(translations)[0] || entry.word;
      case 'zh-CN':
        return translations.zh || translations.en || Object.values(translations)[0] || entry.word;
      default:
        return translations.en || Object.values(translations)[0] || entry.word;
    }
  }

  /**
   * 获取词条总数
   */
  async getEntryCount(language?: string): Promise<number> {
    if (!this.db) {
      throw new Error('数据库未初始化');
    }

    let query = 'SELECT COUNT(*) as count FROM multilingual_entries';
    let params: any[] = [];

    if (language) {
      query += ' WHERE language = ?';
      params.push(language);
    }

    const result = await this.db.getFirstAsync(query, params);
    return (result as any)?.count || 0;
  }

  /**
   * 获取语言支持信息
   */
  getLanguageSupport(language: string): LanguageSupport | undefined {
    return SUPPORTED_LANGUAGES.find(lang => lang.language === language);
  }

  /**
   * 清空指定语言的词条
   */
  async clearEntries(language?: string): Promise<void> {
    if (!this.db) {
      throw new Error('数据库未初始化');
    }

    if (language) {
      await this.db.runAsync(`DELETE FROM multilingual_entries WHERE language = ?`, [language]);
    } else {
      await this.db.runAsync(`DELETE FROM multilingual_entries`);
    }
  }

  /**
   * 关闭数据库连接
   */
  async close(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
      console.log('✅ 多语言SQLite数据库连接已关闭');
    }
  }

  /**
   * 检查数据库是否已初始化
   */
  isInitialized(): boolean {
    return this.db !== null;
  }

  /**
   * 获取数据库实例
   */
  getDatabase(): SQLite.SQLiteDatabase | null {
    return this.db;
  }
}

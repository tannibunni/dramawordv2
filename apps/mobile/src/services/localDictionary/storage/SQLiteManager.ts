// SQLite数据库管理器
import * as SQLite from 'expo-sqlite';
import { 
  SQLiteConfig, 
  DictionaryEntry, 
  DictionaryDefinition, 
  DictionaryExample 
} from '../types';

export class SQLiteManager {
  private static instance: SQLiteManager;
  private db: SQLite.SQLiteDatabase | null = null;
  private config: SQLiteConfig;

  constructor(config: SQLiteConfig) {
    this.config = config;
  }

  static getInstance(config?: SQLiteConfig): SQLiteManager {
    if (!SQLiteManager.instance) {
      if (!config) {
        throw new Error('SQLiteManager requires config on first initialization');
      }
      SQLiteManager.instance = new SQLiteManager(config);
    }
    return SQLiteManager.instance;
  }

  /**
   * 初始化数据库
   */
  async initialize(): Promise<void> {
    try {
      this.db = await SQLite.openDatabaseAsync(this.config.databaseName);
      await this.createTables();
      console.log(`✅ SQLite数据库初始化成功: ${this.config.databaseName}`);
    } catch (error) {
      console.error('❌ SQLite数据库初始化失败:', error);
      throw error;
    }
  }

  /**
   * 创建数据表
   */
  private async createTables(): Promise<void> {
    if (!this.db) {
      throw new Error('数据库未初始化');
    }

    // 创建词条表
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS ${this.config.tables.entries} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        word TEXT NOT NULL,
        translation TEXT NOT NULL,
        pinyin TEXT,
        romaji TEXT,
        kana TEXT,
        partOfSpeech TEXT,
        frequency INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 创建定义表
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS ${this.config.tables.definitions} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        entry_id INTEGER NOT NULL,
        definition TEXT NOT NULL,
        partOfSpeech TEXT NOT NULL,
        example TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (entry_id) REFERENCES ${this.config.tables.entries} (id) ON DELETE CASCADE
      )
    `);

    // 创建例句表
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS ${this.config.tables.examples} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        entry_id INTEGER NOT NULL,
        example TEXT NOT NULL,
        translation TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (entry_id) REFERENCES ${this.config.tables.entries} (id) ON DELETE CASCADE
      )
    `);

    // 创建索引
    await this.db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_entries_word ON ${this.config.tables.entries} (word)
    `);
    await this.db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_entries_pinyin ON ${this.config.tables.entries} (pinyin)
    `);
    await this.db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_entries_romaji ON ${this.config.tables.entries} (romaji)
    `);
    await this.db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_entries_frequency ON ${this.config.tables.entries} (frequency)
    `);
  }

  /**
   * 插入词条
   */
  async insertEntry(entry: Omit<DictionaryEntry, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
    if (!this.db) {
      throw new Error('数据库未初始化');
    }

    const result = await this.db.runAsync(`
      INSERT INTO ${this.config.tables.entries} 
      (word, translation, pinyin, romaji, kana, partOfSpeech, frequency)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      entry.word,
      entry.translation,
      entry.pinyin || null,
      entry.romaji || null,
      entry.kana || null,
      entry.partOfSpeech || null,
      entry.frequency || 0
    ]);

    return result.lastInsertRowId;
  }

  /**
   * 批量插入词条
   */
  async insertEntries(entries: Omit<DictionaryEntry, 'id' | 'created_at' | 'updated_at'>[]): Promise<void> {
    if (!this.db) {
      throw new Error('数据库未初始化');
    }

    await this.db.withTransactionAsync(async () => {
      for (const entry of entries) {
        await this.db!.runAsync(`
          INSERT INTO ${this.config.tables.entries} 
          (word, translation, pinyin, romaji, kana, partOfSpeech, frequency)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          entry.word,
          entry.translation,
          entry.pinyin || null,
          entry.romaji || null,
          entry.kana || null,
          entry.partOfSpeech || null,
          entry.frequency || 0
        ]);
      }
    });
  }

  /**
   * 查询词条
   */
  async searchEntries(query: string, limit: number = 10): Promise<DictionaryEntry[]> {
    if (!this.db) {
      throw new Error('数据库未初始化');
    }

    const results = await this.db.getAllAsync(`
      SELECT * FROM ${this.config.tables.entries}
      WHERE word LIKE ? OR translation LIKE ? OR pinyin LIKE ? OR romaji LIKE ?
      ORDER BY frequency DESC, word ASC
      LIMIT ?
    `, [`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`, limit]);

    return results as DictionaryEntry[];
  }

  /**
   * 🔧 通过拼音精确查询词条（用于输入法候选词）
   * 拼音必须完全匹配（忽略空格、声调和大小写）
   */
  async searchEntriesByPinyin(pinyin: string, limit: number = 10): Promise<DictionaryEntry[]> {
    if (!this.db) {
      throw new Error('数据库未初始化');
    }

    // 标准化拼音：移除空格、声调数字、转小写
    const normalizedPinyin = pinyin.toLowerCase().replace(/\s+/g, '').replace(/[0-9]/g, '');

    // 精确匹配：pinyin字段去除空格和声调后完全相等
    const results = await this.db.getAllAsync(`
      SELECT * FROM ${this.config.tables.entries}
      WHERE REPLACE(REPLACE(LOWER(pinyin), ' ', ''), '0', '') = ?
         OR REPLACE(REPLACE(LOWER(pinyin), ' ', ''), '1', '') = ?
         OR REPLACE(REPLACE(LOWER(pinyin), ' ', ''), '2', '') = ?
         OR REPLACE(REPLACE(LOWER(pinyin), ' ', ''), '3', '') = ?
         OR REPLACE(REPLACE(LOWER(pinyin), ' ', ''), '4', '') = ?
      ORDER BY frequency DESC, word ASC
      LIMIT ?
    `, [normalizedPinyin, normalizedPinyin, normalizedPinyin, normalizedPinyin, normalizedPinyin, limit]);

    return results as DictionaryEntry[];
  }

  /**
   * 精确查询词条
   */
  async findEntry(word: string): Promise<DictionaryEntry | null> {
    if (!this.db) {
      throw new Error('数据库未初始化');
    }

    const result = await this.db.getFirstAsync(`
      SELECT * FROM ${this.config.tables.entries}
      WHERE word = ? OR pinyin = ? OR romaji = ?
    `, [word, word, word]);

    return result as DictionaryEntry | null;
  }

  /**
   * 获取词条总数
   */
  async getEntryCount(): Promise<number> {
    if (!this.db) {
      throw new Error('数据库未初始化');
    }

    const result = await this.db.getFirstAsync(`
      SELECT COUNT(*) as count FROM ${this.config.tables.entries}
    `);

    return (result as any)?.count || 0;
  }

  /**
   * 清空词条表
   */
  async clearEntries(): Promise<void> {
    if (!this.db) {
      throw new Error('数据库未初始化');
    }

    await this.db.execAsync(`DELETE FROM ${this.config.tables.entries}`);
  }

  /**
   * 关闭数据库连接
   */
  async close(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
      console.log('✅ SQLite数据库连接已关闭');
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

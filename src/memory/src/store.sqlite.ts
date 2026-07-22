import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import { IMemoryStore, Session, Message, Memory } from './types';
import path from 'path';
import fs from 'fs';

/**
 * SQLiteMemoryStore - Implements IMemoryStore using SQLite via better-sqlite3.
 *
 * Schema:
 *   - sessions: stores conversation sessions with optional title & summary
 *   - messages: stores conversation history per session
 *   - memories: stores persistent key-value facts per session
 */
export class SQLiteMemoryStore implements IMemoryStore {
  private db: Database.Database;

  constructor(dbPath?: string) {
    const resolvedPath = dbPath || process.env.KAIZENT_DB_PATH || '/data/sqlite/kaizent.db';

    // Ensure the directory exists
    const dir = path.dirname(resolvedPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.db = new Database(resolvedPath);
    this.db.pragma('journal_mode = WAL'); // Better concurrency
    this.db.pragma('foreign_keys = ON');
    this.initSchema();
  }

  private initSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        session_id   TEXT PRIMARY KEY,
        title        TEXT,
        summary      TEXT,
        created_at   TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS messages (
        id           INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id   TEXT NOT NULL REFERENCES sessions(session_id) ON DELETE CASCADE,
        role         TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
        content      TEXT NOT NULL,
        created_at   TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS memories (
        id           TEXT PRIMARY KEY,
        session_id   TEXT NOT NULL REFERENCES sessions(session_id) ON DELETE CASCADE,
        key          TEXT NOT NULL,
        value        TEXT NOT NULL,
        created_at   TEXT NOT NULL DEFAULT (datetime('now')),
        UNIQUE(session_id, key)
      );

      CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id);
      CREATE INDEX IF NOT EXISTS idx_memories_session ON memories(session_id);
    `);
  }

  // --- Session Management ---

  async createSession(title?: string): Promise<Session> {
    const sessionId = uuidv4();
    const now = new Date().toISOString();
    this.db.prepare(`
      INSERT INTO sessions (session_id, title, created_at, updated_at)
      VALUES (?, ?, ?, ?)
    `).run(sessionId, title ?? null, now, now);
    return { sessionId, title, createdAt: now, updatedAt: now };
  }

  async getSession(sessionId: string): Promise<Session | null> {
    const row = this.db.prepare(`SELECT * FROM sessions WHERE session_id = ?`).get(sessionId) as any;
    if (!row) return null;
    return {
      sessionId: row.session_id,
      title: row.title,
      summary: row.summary,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async listSessions(): Promise<Session[]> {
    const rows = this.db.prepare(`SELECT * FROM sessions ORDER BY updated_at DESC`).all() as any[];
    return rows.map(row => ({
      sessionId: row.session_id,
      title: row.title,
      summary: row.summary,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  async updateSessionSummary(sessionId: string, summary: string): Promise<void> {
    const now = new Date().toISOString();
    this.db.prepare(`
      UPDATE sessions SET summary = ?, updated_at = ? WHERE session_id = ?
    `).run(summary, now, sessionId);
  }

  async deleteSession(sessionId: string): Promise<void> {
    this.db.prepare(`DELETE FROM sessions WHERE session_id = ?`).run(sessionId);
  }

  // --- Message Management ---

  async addMessage(sessionId: string, message: Message): Promise<void> {
    const now = new Date().toISOString();
    this.db.prepare(`
      INSERT INTO messages (session_id, role, content, created_at)
      VALUES (?, ?, ?, ?)
    `).run(sessionId, message.role, message.content, now);

    // Update session's updated_at timestamp
    this.db.prepare(`UPDATE sessions SET updated_at = ? WHERE session_id = ?`).run(now, sessionId);
  }

  async getMessages(sessionId: string, limit: number = 50): Promise<Message[]> {
    const rows = this.db.prepare(`
      SELECT role, content, created_at FROM messages
      WHERE session_id = ?
      ORDER BY id ASC
      LIMIT ?
    `).all(sessionId, limit) as any[];
    return rows.map(row => ({
      role: row.role,
      content: row.content,
      createdAt: row.created_at,
    }));
  }

  // --- Key-Value Memory ---

  async setMemory(sessionId: string, key: string, value: string): Promise<void> {
    const id = uuidv4();
    const now = new Date().toISOString();
    this.db.prepare(`
      INSERT INTO memories (id, session_id, key, value, created_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(session_id, key) DO UPDATE SET value = excluded.value
    `).run(id, sessionId, key, value, now);
  }

  async getMemory(sessionId: string, key: string): Promise<string | null> {
    const row = this.db.prepare(`
      SELECT value FROM memories WHERE session_id = ? AND key = ?
    `).get(sessionId, key) as any;
    return row ? row.value : null;
  }

  async getAllMemories(sessionId: string): Promise<Memory[]> {
    const rows = this.db.prepare(`
      SELECT id, session_id, key, value, created_at FROM memories WHERE session_id = ?
    `).all(sessionId) as any[];
    return rows.map(row => ({
      id: row.id,
      sessionId: row.session_id,
      key: row.key,
      value: row.value,
      createdAt: row.created_at,
    }));
  }
}

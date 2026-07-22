/**
 * Kaizent Memory Interface
 *
 * Defines the abstract contract for memory storage.
 * All storage backends (SQLite, Vector DB, etc.) must implement this interface.
 * This makes Kaizent memory engine swappable without breaking the caller's code.
 */

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt?: string;
}

export interface Session {
  sessionId: string;
  title?: string;
  summary?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Memory {
  id: string;
  sessionId: string;
  key: string;
  value: string;
  createdAt: string;
}

/**
 * IMemoryStore - The core interface every backend must implement.
 * Swap this with VectorMemoryStore, RedisMemoryStore, etc. in the future.
 */
export interface IMemoryStore {
  // Session management
  createSession(title?: string): Promise<Session>;
  getSession(sessionId: string): Promise<Session | null>;
  listSessions(): Promise<Session[]>;
  updateSessionSummary(sessionId: string, summary: string): Promise<void>;
  deleteSession(sessionId: string): Promise<void>;

  // Message (conversation history) management
  addMessage(sessionId: string, message: Message): Promise<void>;
  getMessages(sessionId: string, limit?: number): Promise<Message[]>;

  // Key-value memory (persistent facts about the project)
  setMemory(sessionId: string, key: string, value: string): Promise<void>;
  getMemory(sessionId: string, key: string): Promise<string | null>;
  getAllMemories(sessionId: string): Promise<Memory[]>;
}

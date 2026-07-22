import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { SQLiteMemoryStore } from './store.sqlite';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const store = new SQLiteMemoryStore();

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'kaizent-memory' });
});

// ── Session Endpoints ─────────────────────────────────────────────────────────

// POST /sessions - Create a new session
app.post('/sessions', async (req: Request, res: Response) => {
  const { title } = req.body;
  const session = await store.createSession(title);
  res.status(201).json(session);
});

// GET /sessions - List all sessions
app.get('/sessions', async (_req: Request, res: Response) => {
  const sessions = await store.listSessions();
  res.json(sessions);
});

// GET /sessions/:id - Get a session
app.get('/sessions/:id', async (req: Request, res: Response) => {
  const session = await store.getSession(req.params.id);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  res.json(session);
});

// PATCH /sessions/:id/summary - Update session summary
app.patch('/sessions/:id/summary', async (req: Request, res: Response) => {
  const { summary } = req.body;
  await store.updateSessionSummary(req.params.id, summary);
  res.json({ ok: true });
});

// DELETE /sessions/:id - Delete a session (cascades messages & memories)
app.delete('/sessions/:id', async (req: Request, res: Response) => {
  await store.deleteSession(req.params.id);
  res.json({ ok: true });
});

// ── Message Endpoints ─────────────────────────────────────────────────────────

// POST /sessions/:id/messages - Add a message
app.post('/sessions/:id/messages', async (req: Request, res: Response) => {
  const { role, content } = req.body;
  if (!role || !content) return res.status(400).json({ error: 'role and content are required' });
  await store.addMessage(req.params.id, { role, content });
  res.status(201).json({ ok: true });
});

// GET /sessions/:id/messages - Get messages
app.get('/sessions/:id/messages', async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 50;
  const messages = await store.getMessages(req.params.id, limit);
  res.json(messages);
});

// ── Memory (Key-Value) Endpoints ──────────────────────────────────────────────

// PUT /sessions/:id/memories/:key - Set a persistent memory
app.put('/sessions/:id/memories/:key', async (req: Request, res: Response) => {
  const { value } = req.body;
  if (!value) return res.status(400).json({ error: 'value is required' });
  await store.setMemory(req.params.id, req.params.key, value);
  res.json({ ok: true });
});

// GET /sessions/:id/memories/:key - Get a specific memory
app.get('/sessions/:id/memories/:key', async (req: Request, res: Response) => {
  const value = await store.getMemory(req.params.id, req.params.key);
  if (value === null) return res.status(404).json({ error: 'Memory not found' });
  res.json({ key: req.params.key, value });
});

// GET /sessions/:id/memories - Get all memories for a session
app.get('/sessions/:id/memories', async (req: Request, res: Response) => {
  const memories = await store.getAllMemories(req.params.id);
  res.json(memories);
});

// ── Start Server ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Kaizent Memory Service running on port ${PORT}`);
});

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import Database from "better-sqlite3";
import path from "path";
import express from "express";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";

const server = new McpServer({ name: "Kaizent-SQLite-MCP", version: "1.0.0" });

const DB_ROOT = process.env.SQLITE_DB_ROOT || "/data/sqlite";

// ── Tool: Query SQLite ────────────────────────────────────────────────────────
server.tool("query_sqlite",
  "Execute a READ-ONLY SQL query on a SQLite database file",
  {
    database: z.string().describe("Database filename in DB_ROOT (e.g. kaizent.db)"),
    query: z.string().describe("SQL SELECT query to execute")
  },
  async ({ database, query }) => {
    // Safety: only allow SELECT queries
    const trimmed = query.trim().toUpperCase();
    if (!trimmed.startsWith("SELECT") && !trimmed.startsWith("PRAGMA") && !trimmed.startsWith("EXPLAIN")) {
      return {
        content: [{ type: "text", text: "❌ Only SELECT, PRAGMA, and EXPLAIN queries are allowed for safety." }],
        isError: true
      };
    }
    try {
      const dbPath = path.join(DB_ROOT, database);
      if (!dbPath.startsWith(DB_ROOT)) throw new Error("Access denied: path traversal detected");

      const db = new Database(dbPath, { readonly: true });
      const rows = db.prepare(query).all();
      db.close();

      if (rows.length === 0) return { content: [{ type: "text", text: "Query returned 0 rows." }] };

      // Format as markdown table
      const keys = Object.keys(rows[0] as object);
      const header = `| ${keys.join(' | ')} |`;
      const divider = `| ${keys.map(() => '---').join(' | ')} |`;
      const body = rows.map(r => `| ${keys.map(k => String((r as any)[k] ?? '')).join(' | ')} |`).join('\n');
      return { content: [{ type: "text", text: `${header}\n${divider}\n${body}` }] };
    } catch (e: any) {
      return { content: [{ type: "text", text: `Error: ${e.message}` }], isError: true };
    }
  }
);

// ── Tool: List Tables ─────────────────────────────────────────────────────────
server.tool("list_tables",
  "List all tables in a SQLite database",
  { database: z.string().describe("Database filename") },
  async ({ database }) => {
    try {
      const dbPath = path.join(DB_ROOT, database);
      const db = new Database(dbPath, { readonly: true });
      const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all() as any[];
      db.close();
      const list = tables.map(t => `- ${t.name}`).join('\n');
      return { content: [{ type: "text", text: list || "No tables found" }] };
    } catch (e: any) {
      return { content: [{ type: "text", text: `Error: ${e.message}` }], isError: true };
    }
  }
);

// ── SSE Server ────────────────────────────────────────────────────────────────
const app = express();
let transport: SSEServerTransport;
app.get("/sse", async (req, res) => { transport = new SSEServerTransport("/message", res); await server.connect(transport); });
app.post("/message", async (req, res) => { if (transport) await transport.handlePostMessage(req, res); else res.status(500).send("Not connected"); });

const PORT = process.env.PORT || 8082;
app.listen(PORT, () => console.log(`SQLite MCP Server running on port ${PORT}`));

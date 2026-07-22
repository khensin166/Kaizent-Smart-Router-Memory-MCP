import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { exec } from "child_process";
import { promisify } from "util";
import express from "express";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";

const execAsync = promisify(exec);
const server = new McpServer({ name: "Kaizent-Terminal-MCP", version: "1.0.0" });

/**
 * Safety allowlist — only these command prefixes are permitted.
 * Prevents arbitrary code execution. Extend this list carefully.
 */
const ALLOWED_COMMANDS = [
  "ls", "cat", "echo", "pwd", "whoami", "date", "df", "du",
  "ps", "uptime", "free", "uname", "hostname",
  "docker ps", "docker stats", "docker logs",
  "git status", "git log", "git diff",
  "npm run", "node --version", "npm --version"
];

function isCommandAllowed(cmd: string): boolean {
  const trimmed = cmd.trim().toLowerCase();
  return ALLOWED_COMMANDS.some(allowed => trimmed.startsWith(allowed));
}

// ── Tool: Run Command ─────────────────────────────────────────────────────────
server.tool("run_command",
  "Execute a safe shell command on the server. Only allowlisted commands are permitted.",
  {
    command: z.string().describe("The shell command to execute"),
    cwd: z.string().optional().describe("Working directory (optional)")
  },
  async ({ command, cwd }) => {
    if (!isCommandAllowed(command)) {
      return {
        content: [{ type: "text", text: `❌ Command not allowed: "${command}". Only safe commands are permitted.` }],
        isError: true
      };
    }
    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd,
        timeout: 15000, // 15 second timeout
        maxBuffer: 1024 * 512 // 512KB max output
      });
      const output = stdout + (stderr ? `\nSTDERR:\n${stderr}` : '');
      return { content: [{ type: "text", text: output || "(no output)" }] };
    } catch (e: any) {
      return { content: [{ type: "text", text: `Error executing command: ${e.message}` }], isError: true };
    }
  }
);

// ── SSE Server ────────────────────────────────────────────────────────────────
const app = express();
let transport: SSEServerTransport;
app.get("/sse", async (req, res) => { transport = new SSEServerTransport("/message", res); await server.connect(transport); });
app.post("/message", async (req, res) => { if (transport) await transport.handlePostMessage(req, res); else res.status(500).send("Not connected"); });

const PORT = process.env.PORT || 8085;
app.listen(PORT, () => console.log(`Terminal MCP Server running on port ${PORT}`));

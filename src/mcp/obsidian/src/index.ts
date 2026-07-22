import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";

const server = new McpServer({
  name: "Kaizent-Obsidian-MCP",
  version: "1.0.0"
});

const VAULT_DIR = process.env.OBSIDIAN_VAULT_ROOT || "/vault";

server.tool("read_note",
  "Read a note from Obsidian Vault",
  {
    notePath: z.string().describe("Relative path to the note (e.g. Projects/Kaizent.md)")
  },
  async ({ notePath }) => {
    try {
      const fullPath = path.join(VAULT_DIR, notePath.endsWith('.md') ? notePath : `${notePath}.md`);
      
      if (!fullPath.startsWith(VAULT_DIR)) {
        throw new Error("Access denied: Path outside vault");
      }

      const content = await fs.readFile(fullPath, "utf-8");
      return {
        content: [{ type: "text", text: content }]
      };
    } catch (error: any) {
      return {
        content: [{ type: "text", text: `Error reading note: ${error.message}` }],
        isError: true
      };
    }
  }
);

import express from "express";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";

const app = express();
let transport: SSEServerTransport;

app.get("/sse", async (req, res) => {
  transport = new SSEServerTransport("/message", res);
  await server.connect(transport);
});

app.post("/message", async (req, res) => {
  if (transport) {
    await transport.handlePostMessage(req, res);
  } else {
    res.status(500).send("SSE transport not connected");
  }
});

const PORT = process.env.PORT || 8081;
app.listen(PORT, () => {
  console.log(`Obsidian MCP Server running on SSE at port ${PORT}`);
});

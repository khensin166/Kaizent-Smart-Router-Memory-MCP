import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";

// Create an MCP server
const server = new McpServer({
  name: "Kaizent-Filesystem-MCP",
  version: "1.0.0"
});

const ALLOWED_DIR = process.env.FS_ROOT || "/data";

server.tool("read_file",
  "Read contents of a file",
  {
    filepath: z.string().describe("Relative path to the file from root")
  },
  async ({ filepath }) => {
    try {
      const fullPath = path.join(ALLOWED_DIR, filepath);
      
      // Basic security check (prevent directory traversal)
      if (!fullPath.startsWith(ALLOWED_DIR)) {
        throw new Error("Access denied: Path outside allowed directory");
      }

      const content = await fs.readFile(fullPath, "utf-8");
      return {
        content: [{ type: "text", text: content }]
      };
    } catch (error: any) {
      return {
        content: [{ type: "text", text: `Error reading file: ${error.message}` }],
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

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Filesystem MCP Server running on SSE at port ${PORT}`);
});

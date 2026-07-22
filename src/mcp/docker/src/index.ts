import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import Dockerode from "dockerode";
import express from "express";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";

const server = new McpServer({ name: "Kaizent-Docker-MCP", version: "1.0.0" });

// Connect to Docker daemon via socket
const docker = new Dockerode({ socketPath: process.env.DOCKER_SOCKET || '/var/run/docker.sock' });

// ── Tool: List Containers ─────────────────────────────────────────────────────
server.tool("list_containers",
  "List all Docker containers (running and stopped)",
  { all: z.boolean().optional().default(true) },
  async ({ all }) => {
    try {
      const containers = await docker.listContainers({ all });
      const summary = containers.map(c =>
        `- [${c.State.toUpperCase()}] ${c.Names.join(', ')} | Image: ${c.Image} | Status: ${c.Status}`
      ).join('\n');
      return { content: [{ type: "text", text: summary || "No containers found" }] };
    } catch (e: any) {
      return { content: [{ type: "text", text: `Error: ${e.message}` }], isError: true };
    }
  }
);

// ── Tool: Get Container Logs ──────────────────────────────────────────────────
server.tool("get_logs",
  "Get logs from a specific container",
  {
    container: z.string().describe("Container name or ID"),
    tail: z.number().optional().default(50)
  },
  async ({ container, tail }) => {
    try {
      const c = docker.getContainer(container);
      const logs = await c.logs({ stdout: true, stderr: true, tail });
      return { content: [{ type: "text", text: logs.toString() }] };
    } catch (e: any) {
      return { content: [{ type: "text", text: `Error: ${e.message}` }], isError: true };
    }
  }
);

// ── Tool: List Images ─────────────────────────────────────────────────────────
server.tool("list_images",
  "List Docker images on this host",
  {},
  async () => {
    try {
      const images = await docker.listImages();
      const summary = images.map(img =>
        `- ${(img.RepoTags ?? ['<none>']).join(', ')} | Size: ${(img.Size / 1024 / 1024).toFixed(1)} MB`
      ).join('\n');
      return { content: [{ type: "text", text: summary || "No images found" }] };
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

const PORT = process.env.PORT || 8084;
app.listen(PORT, () => console.log(`Docker MCP Server running on port ${PORT}`));

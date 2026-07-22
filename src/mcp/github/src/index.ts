import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Octokit } from "@octokit/rest";
import express from "express";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";

const server = new McpServer({
  name: "Kaizent-GitHub-MCP",
  version: "1.0.0"
});

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

// ── Tool: List Repos ──────────────────────────────────────────────────────────
server.tool("list_repos",
  "List repositories for a GitHub user or org",
  { owner: z.string().describe("GitHub username or org name") },
  async ({ owner }) => {
    try {
      const { data } = await octokit.repos.listForUser({ username: owner, per_page: 30 });
      const summary = data.map(r => `- ${r.full_name} (${r.language ?? 'N/A'}) — ${r.description ?? ''}`).join('\n');
      return { content: [{ type: "text", text: summary }] };
    } catch (e: any) {
      return { content: [{ type: "text", text: `Error: ${e.message}` }], isError: true };
    }
  }
);

// ── Tool: Get File Content ────────────────────────────────────────────────────
server.tool("get_file",
  "Get content of a file from a GitHub repository",
  {
    owner: z.string(),
    repo: z.string(),
    path: z.string().describe("File path in the repo (e.g. src/index.ts)"),
    branch: z.string().optional().default("main")
  },
  async ({ owner, repo, path, branch }) => {
    try {
      const { data } = await octokit.repos.getContent({ owner, repo, path, ref: branch });
      if ('content' in data && typeof data.content === 'string') {
        const decoded = Buffer.from(data.content, 'base64').toString('utf-8');
        return { content: [{ type: "text", text: decoded }] };
      }
      return { content: [{ type: "text", text: "Not a file or content unavailable" }], isError: true };
    } catch (e: any) {
      return { content: [{ type: "text", text: `Error: ${e.message}` }], isError: true };
    }
  }
);

// ── Tool: List Commits ────────────────────────────────────────────────────────
server.tool("list_commits",
  "List recent commits in a repository",
  {
    owner: z.string(),
    repo: z.string(),
    limit: z.number().optional().default(10)
  },
  async ({ owner, repo, limit }) => {
    try {
      const { data } = await octokit.repos.listCommits({ owner, repo, per_page: limit });
      const summary = data.map(c => `- [${c.sha.slice(0, 7)}] ${c.commit.message.split('\n')[0]} (${c.commit.author?.name})`).join('\n');
      return { content: [{ type: "text", text: summary }] };
    } catch (e: any) {
      return { content: [{ type: "text", text: `Error: ${e.message}` }], isError: true };
    }
  }
);

// ── SSE Server ────────────────────────────────────────────────────────────────
const app = express();
let transport: SSEServerTransport;

app.get("/sse", async (req, res) => {
  transport = new SSEServerTransport("/message", res);
  await server.connect(transport);
});
app.post("/message", async (req, res) => {
  if (transport) await transport.handlePostMessage(req, res);
  else res.status(500).send("SSE transport not connected");
});

const PORT = process.env.PORT || 8083;
app.listen(PORT, () => console.log(`GitHub MCP Server running on port ${PORT}`));

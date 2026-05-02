import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

// --- Types / Nouns (Exposed as MCP Resources) ---
const resources = [
  {
    uri: "cf-agents://types/agent",
    name: "AgentBaseClass",
    description: "The core Agent class that provides persistent state, WebSockets, scheduling, and RPC.",
    mimeType: "application/json"
  },
  {
    uri: "cf-agents://types/workflow",
    name: "AgentWorkflow",
    description: "Integration between Cloudflare Agents and Cloudflare Workflows for durable multi-step processes.",
    mimeType: "application/json"
  },
  {
    uri: "cf-agents://types/message",
    name: "MessageTypes",
    description: "Types for Incoming and Outgoing Chat Messages and MCP Server Events.",
    mimeType: "application/json"
  },
  {
    uri: "cf-agents://types/aichatagent",
    name: "AIChatAgent",
    description: "The most common starting point for AI chat agents.",
    mimeType: "application/json"
  },
  {
    uri: "cf-agents://types/think",
    name: "ThinkAgent",
    description: "Opinionated reasoning agent with built-in agentic loop, tool calling, MCP, and code execution.",
    mimeType: "application/json"
  },
  {
    uri: "cf-agents://types/mcpagent",
    name: "McpAgent",
    description: "Building MCP servers as Agents.",
    mimeType: "application/json"
  },
  {
    uri: "cf-agents://types/state",
    name: "AgentState",
    description: "State management primitives: setState, initialState, onStateChanged.",
    mimeType: "application/json"
  },
  {
    uri: "cf-agents://types/sql",
    name: "AgentSQL",
    description: "Per-agent embedded SQLite database (this.sql) for querying relational data.",
    mimeType: "application/json"
  },
  {
    uri: "cf-agents://types/queue",
    name: "TaskQueue",
    description: "FIFO background processing (queue, dequeue, dequeueAll) without blocking WebSockets.",
    mimeType: "application/json"
  },
  {
    uri: "cf-agents://types/subagent",
    name: "SubAgent",
    description: "Spawning child agents with isolated storage (this.subAgent()).",
    mimeType: "application/json"
  },
  {
    uri: "cf-agents://types/clientsdk",
    name: "ClientSDK",
    description: "Frontend integration hooks: useAgent, AgentClient, useAgentChat.",
    mimeType: "application/json"
  },
  {
    uri: "cf-agents://types/hitl",
    name: "HumanInTheLoop",
    description: "5 distinct human-in-the-loop patterns for workflow approvals.",
    mimeType: "application/json"
  }
];

// Content for the resources
const resourceContent: Record<string, string> = {
  "cf-agents://types/agent": JSON.stringify({
    description: "Agent<Env, State, Props> extends Server. Provides state management, lifecycle hooks, and RPC routing.",
    properties: ["state", "connections", "env", "ctx"],
    methods: ["onConnect", "onMessage", "onClose", "schedule", "broadcast", "keepAlive", "onEmail", "onRequest"]
  }),
  "cf-agents://types/workflow": JSON.stringify({
    description: "AgentWorkflow<AgentType, Params, Progress, Env> extends WorkflowEntrypoint. Multi-step durable background process.",
    properties: ["agent", "step"],
    methods: ["run", "approveWorkflow", "rejectWorkflow"]
  }),
  "cf-agents://types/message": JSON.stringify({
    description: "Enums and types representing standard agent-to-agent and client-to-agent messages.",
    messageTypes: ["cf_agent_mcp_servers", "cf_mcp_agent_event", "cf_agent_state", "rpc"]
  }),
  "cf-agents://types/aichatagent": JSON.stringify({
    description: "Pre-built class for chat. Use as starting point for standard LLM chat interfaces.",
    methods: ["onChatMessage"]
  }),
  "cf-agents://types/think": JSON.stringify({
    description: "Agent specifically for reasoning, tool orchestration, and sandbox code execution."
  }),
  "cf-agents://types/mcpagent": JSON.stringify({
    description: "Agent that acts as an MCP server to expose capabilities to external orchestrators."
  }),
  "cf-agents://types/state": JSON.stringify({
    description: "Durable object persistence wrapper.",
    methods: ["setState", "initialState", "onStateChanged", "validateStateChange"]
  }),
  "cf-agents://types/sql": JSON.stringify({
    description: "Embedded SQLite wrapper.",
    methods: ["this.sql.execute()", "this.sql.transaction()"]
  }),
  "cf-agents://types/queue": JSON.stringify({
    description: "Background processing queues.",
    methods: ["queue()", "dequeue()", "dequeueAll()"]
  }),
  "cf-agents://types/subagent": JSON.stringify({
    description: "Child agent spawning mechanisms.",
    methods: ["this.subAgent()", "agentTool()"]
  }),
  "cf-agents://types/clientsdk": JSON.stringify({
    description: "Frontend connection hooks.",
    methods: ["useAgent", "AgentClient", "useAgentChat"]
  }),
  "cf-agents://types/hitl": JSON.stringify({
    description: "Patterns for interrupting execution to wait for human interaction.",
    patterns: ["Approval", "Correction", "Elicitation", "Delegation", "Escalation"]
  })
};

// --- Verbs / Tools (Exposed as MCP Tools) ---
const createAgentSchema = z.object({
  agentName: z.string().describe("The name of the agent class to create."),
  hasState: z.boolean().describe("Whether the agent needs persistent state."),
  hasSchedule: z.boolean().describe("Whether the agent uses cron or scheduled alarms.")
});

const generateCallableMethodSchema = z.object({
  methodName: z.string().describe("The name of the method to expose."),
  paramsSchema: z.record(z.string()).describe("JSON schema representation of the method parameters."),
  returnType: z.string().describe("The expected return type as a string.")
});

export default {
  async fetch(request: Request, env: any, ctx: ExecutionContext) {
    const server = new Server(
      {
        name: "cloudflare-agents-mcp",
        version: "1.0.0"
      },
      {
        capabilities: {
          resources: {},
          tools: {}
        }
      }
    );

    // List Resources
    server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return { resources };
    });

    // Read Resource
    server.setRequestHandler(ReadResourceRequestSchema, async (request: any) => {
      const uri = request.params.uri;
      const content = resourceContent[uri];
      if (!content) {
        throw new Error(`Resource not found: ${uri}`);
      }
      return {
        contents: [
          {
            uri,
            mimeType: "application/json",
            text: content
          }
        ]
      };
    });

    // List Tools
    server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "scaffold_agent_class",
            description: "Generate a boilerplate TypeScript Cloudflare Agent class.",
            inputSchema: {
              type: "object",
              properties: {
                agentName: { type: "string", description: "The name of the agent class." },
                hasState: { type: "boolean", description: "Whether the agent needs persistent state." },
                hasSchedule: { type: "boolean", description: "Whether the agent uses scheduled tasks." },
                hasSQL: { type: "boolean", description: "Whether to embed an SQLite database." },
                hasQueue: { type: "boolean", description: "Whether to use a FIFO task queue." },
                hasSubAgents: { type: "boolean", description: "Whether to spawn child agents." }
              },
              required: ["agentName"]
            }
          },
          {
            name: "generate_callable_method",
            description: "Generate an @callable RPC method for a Cloudflare Agent.",
            inputSchema: {
              type: "object",
              properties: {
                methodName: { type: "string", description: "The name of the method to expose." },
                paramsSchema: { type: "object", description: "Parameters schema." },
                returnType: { type: "string", description: "Expected return type." }
              },
              required: ["methodName"]
            }
          },
          {
            name: "generate_state_schema",
            description: "Generate the initial state and state validation handlers.",
            inputSchema: {
              type: "object",
              properties: {
                schemaDefinition: { type: "object", description: "The JSON structure of the state." }
              },
              required: ["schemaDefinition"]
            }
          },
          {
            name: "generate_queue_handler",
            description: "Generate the onDequeue background task processor.",
            inputSchema: {
              type: "object",
              properties: {
                taskType: { type: "string", description: "Name of the queue task to process." }
              },
              required: ["taskType"]
            }
          },
          {
            name: "generate_sub_agent",
            description: "Generate logic to spawn and interact with a child sub-agent.",
            inputSchema: {
              type: "object",
              properties: {
                childAgentName: { type: "string", description: "The target child agent class." }
              },
              required: ["childAgentName"]
            }
          },
          {
            name: "generate_sql_query",
            description: "Generate SQLite embedding logic for an agent.",
            inputSchema: {
              type: "object",
              properties: {
                tableName: { type: "string", description: "The table to query or create." }
              },
              required: ["tableName"]
            }
          },
          {
            name: "generate_mcp_client",
            description: "Generate connection logic to talk to an external MCP server from within an agent.",
            inputSchema: {
              type: "object",
              properties: {
                mcpUrl: { type: "string", description: "URL of the target MCP Server." }
              },
              required: ["mcpUrl"]
            }
          }
        ]
      };
    });

    // Call Tool
    server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
      const { name, arguments: args } = request.params;

      if (name === "scaffold_agent_class") {
        const { agentName, hasState, hasSchedule, hasSQL, hasQueue, hasSubAgents } = args;
        let code = `import { Agent } from "@cloudflare/agents";\n\n`;
        code += `export class ${agentName} extends Agent {\n`;

        if (hasState) {
          code += `  // State management\n`;
          code += `  initialState() { return {}; }\n\n`;
        }
        if (hasSQL) {
          code += `  async onConnect() {\n`;
          code += `    // SQLite initialization\n`;
          code += `    this.sql.execute("CREATE TABLE IF NOT EXISTS data (id TEXT PRIMARY KEY)");\n`;
          code += `  }\n\n`;
        }
        if (hasQueue) {
          code += `  async onDequeue(task) {\n    // Handle background task\n  }\n\n`;
        }
        if (hasSubAgents) {
          code += `  async createChild() {\n    return this.subAgent("child_name");\n  }\n\n`;
        }
        if (hasSchedule) {
          code += `  async onAlarm() {\n    // Handle scheduled tasks\n  }\n\n`;
        }

        // Default lifecycle method if not explicitly replaced by SQL init
        if (!hasSQL) {
          code += `  async onConnect(connection) {\n    // Handle new WebSocket connection\n  }\n`;
        }

        code += `}\n`;

        return { content: [{ type: "text", text: code }] };
      }

      if (name === "generate_callable_method") {
        const { methodName, paramsSchema, returnType } = args;
        const paramStr = Object.keys(paramsSchema || {}).length > 0
          ? `params: Record<string, any>`
          : ``;
        let code = `  @callable({ description: "Auto-generated method ${methodName}" })\n`;
        code += `  async ${methodName}(${paramStr}): Promise<${returnType || "void"}> {\n`;
        code += `    // Implementation goes here\n`;
        code += `  }\n`;

        return { content: [{ type: "text", text: code }] };
      }

      if (name === "generate_state_schema") {
        const { schemaDefinition } = args;
        let code = `  initialState() {\n    return ${JSON.stringify(schemaDefinition, null, 2)};\n  }\n\n`;
        code += `  validateStateChange(oldState, newState) {\n    // Implement runtime validation here\n    return true;\n  }\n`;
        return { content: [{ type: "text", text: code }] };
      }

      if (name === "generate_queue_handler") {
        const { taskType } = args;
        let code = `  // Enqueue a task: this.queue({ type: "${taskType}", data: {} })\n\n`;
        code += `  async onDequeue(batch) {\n`;
        code += `    for (const msg of batch) {\n`;
        code += `      if (msg.body.type === "${taskType}") {\n`;
        code += `        // Process ${taskType}\n`;
        code += `      }\n`;
        code += `    }\n`;
        code += `  }\n`;
        return { content: [{ type: "text", text: code }] };
      }

      if (name === "generate_sub_agent") {
        const { childAgentName } = args;
        let code = `  async getChildAgent(id: string) {\n`;
        code += `    // Retrieve a typed sub-agent proxy\n`;
        code += `    const child = await this.subAgent<${childAgentName}>(id);\n`;
        code += `    return child;\n`;
        code += `  }\n`;
        return { content: [{ type: "text", text: code }] };
      }

      if (name === "generate_sql_query") {
        const { tableName } = args;
        let code = `  async queryData() {\n`;
        code += `    const results = this.sql.execute("SELECT * FROM ${tableName}");\n`;
        code += `    return Array.from(results);\n`;
        code += `  }\n`;
        return { content: [{ type: "text", text: code }] };
      }

      if (name === "generate_mcp_client") {
        const { mcpUrl } = args;
        let code = `  async setupExternalMCP() {\n`;
        code += `    const client = await this.mcp.connect("${mcpUrl}");\n`;
        code += `    const tools = await client.listTools();\n`;
        code += `    return tools;\n`;
        code += `  }\n`;
        return { content: [{ type: "text", text: code }] };
      }

      throw new Error(`Tool not found: ${name}`);
    });

    // Handle MCP Transport
    const url = new URL(request.url);
    if (url.pathname === "/mcp") {
      // Cloudflare Workers natively support Web Standards
      const transport = new WebStandardStreamableHTTPServerTransport();

      // We must connect the server to the transport before handling requests
      await server.connect(transport);

      // The WebStandardStreamableHTTPServerTransport natively handles GET (for SSE stream setup)
      // and POST (for incoming JSON-RPC commands).
      return transport.handleRequest(request);
    }

    return new Response("Not found", { status: 404 });
  }
};

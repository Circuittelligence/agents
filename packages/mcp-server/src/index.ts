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
  }
];

// Content for the resources
const resourceContent: Record<string, string> = {
  "cf-agents://types/agent": JSON.stringify({
    description: "Agent<Env, State, Props> extends Server. Provides state management, lifecycle hooks, and RPC routing.",
    properties: ["state", "connections", "env", "ctx"],
    methods: ["onConnect", "onMessage", "onClose", "schedule", "broadcast"]
  }),
  "cf-agents://types/workflow": JSON.stringify({
    description: "AgentWorkflow<AgentType, Params, Progress, Env> extends WorkflowEntrypoint. Multi-step durable background process.",
    properties: ["agent", "step"],
    methods: ["run", "approveWorkflow", "rejectWorkflow"]
  }),
  "cf-agents://types/message": JSON.stringify({
    description: "Enums and types representing standard agent-to-agent and client-to-agent messages.",
    messageTypes: ["cf_agent_mcp_servers", "cf_mcp_agent_event", "cf_agent_state", "rpc"]
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
                hasSchedule: { type: "boolean", description: "Whether the agent uses scheduled tasks." }
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
          }
        ]
      };
    });

    // Call Tool
    server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
      const { name, arguments: args } = request.params;

      if (name === "scaffold_agent_class") {
        const { agentName, hasState, hasSchedule } = args;
        let code = `import { Agent } from "@cloudflare/agents";\n\n`;
        code += `export class ${agentName} extends Agent {\n`;
        if (hasState) {
          code += `  // Define your state interface here\n`;
          code += `  state = {};\n\n`;
        }
        if (hasSchedule) {
          code += `  async onAlarm() {\n    // Handle scheduled tasks here\n  }\n\n`;
        }
        code += `  async onConnect(connection) {\n    // Handle new WebSocket connection\n  }\n`;
        code += `}\n`;

        return {
          content: [{ type: "text", text: code }]
        };
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

        return {
          content: [{ type: "text", text: code }]
        };
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

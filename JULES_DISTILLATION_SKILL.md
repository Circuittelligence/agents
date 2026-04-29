# Jules Distillation Skill: "Repo to Skill Set" Workflow

**Purpose:** This document serves as a high-fidelity recall mechanism for the "Repo to Skill Set" distillation workflow. It institutionalizes the exact process used to transform a static codebase into a Live Intelligence Layer (an Anthropic-compliant Model Context Protocol Server and operational `SKILL.md`). This skill allows any AI agent to abstract the friction of guessing logic by wrapping existing primitives into structured Tools and Resources.

## Phase 1: Discovery & Dependency Mapping (The "Nouns" and "Verbs")

1. **Semantic Mapping (Nouns First):**
   - **Action:** Perform a structural audit using `grep` or `read_file` targeting `export interface`, `export type`, and `export class`.
   - **Goal:** Establish the "Reality Pattern." Identify the data schemas and state definitions. The Verbs are meaningless without a rigid understanding of what they manipulate.
   - **Output:** Map these structures to be served as **MCP Resources**.

2. **Utility Identification (The Verbs):**
   - **Action:** Identify the core utility functions, API calls, or decorators (e.g., `@callable`, routing logic) that mutate state or fetch data.
   - **Goal:** Establish the actionable capabilities of the repository.
   - **Output:** Map these to be wrapped as **MCP Tools**.

## Phase 2: The Extraction Loop (Building the MCP Server)

1. **Environment Selection:**
   - Match the MCP server runtime to the host codebase to prevent an "impedance mismatch." If the repository is TypeScript (e.g., Cloudflare Workers), build the MCP server in TypeScript.
   - Create a dedicated directory (e.g., `packages/mcp-server`) with its own `package.json`, `tsconfig.json`, and deployment configuration (e.g., `wrangler.toml`).

2. **Scaffolding the Server:**
   - Define the `Server` instance using `@modelcontextprotocol/sdk`.
   - **Resources:** Implement `ListResourcesRequestSchema` and `ReadResourceRequestSchema` returning the exact Noun schemas discovered in Phase 1.
   - **Tools:** Implement `ListToolsRequestSchema` and `CallToolRequestSchema` returning boilerplate or execution wrappers for the Verbs discovered in Phase 1.

3. **Protocol Transport Resolution:**
   - **Crucial Lesson:** Always align the transport protocol with the runtime environment.
   - For Node.js CLIs, use `StdioServerTransport`.
   - For Edge Runtimes (Cloudflare Workers/V8) that utilize the Web Standards `Request`/`Response` API, **always use `WebStandardStreamableHTTPServerTransport`**. Do not polyfill Node.js `IncomingMessage`/`ServerResponse` or use legacy `SSEServerTransport`. Ensure `@modelcontextprotocol/sdk` is `^1.29.0` or higher to access native web standard transports.

## Phase 3: Synthesizing the Operational Manual (`SKILL.md`)

1. **Write the Agent Manual:**
   - Generate a `SKILL.md` (specific to the target repository) that instructs the orchestrating AI *how* and *when* to use the extracted MCP tools.
   - Document the Workflow Rule: The orchestrator must always fetch and read the latest Noun resources before invoking any Verb tools to guarantee type safety and determinism.

2. **Configuration Linking:**
   - Create or update `.mcp.json` and `mcp-config.json` at the root of the repository.
   - Point the configuration to the local development proxy (e.g., `"type": "sse", "url": "http://127.0.0.1:8787/mcp"` for Cloudflare local dev). Ensure the config type matches the transport (HTTP/SSE vs Stdio).

## Phase 4: Verification and Finalization

1. **Type Safety & Compilation:**
   - Execute a dry-run build or type check (e.g., `npx tsc --noEmit`, `wrangler deploy --dry-run`).
   - Validate that dependencies are correctly locked and that no hallucinated module paths exist.
2. **Telemetry Management:**
   - Ensure external environmental noise is disabled if requested (e.g., setting `WRANGLER_SEND_METRICS=false` or explicitly disabling telemetry in deployment scripts) to maintain a sovereign codebase.

*By adhering to this skill template, Jules or any successor agent can deterministically rip the capability surface out of any repository and serve it as an infinite orchestration layer.*

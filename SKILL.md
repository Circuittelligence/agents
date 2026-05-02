# Cloudflare Agents SDK Builder Skill

This document serves as the operational manual for any AI agent interacting with the Cloudflare Agents SDK via its Master Control Panel (MCP). It defines the underlying structural and behavioral primitives necessary to build, deploy, and integrate AI-driven agents.

## 1. Core Primitives (The Nouns)

Before writing any agent code, you must understand the available primitives. Fetch these resources from the MCP server:

- **Structural Primitives:**
  - **`cf-agents://types/agent` (AgentBaseClass):** The raw durable class providing RPC, WebSockets, and scheduling.
  - **`cf-agents://types/aichatagent` (AIChatAgent):** Pre-built template for standard conversational interfaces.
  - **`cf-agents://types/think` (ThinkAgent):** Advanced agent template for LLM reasoning, sandbox execution, and tool use.
  - **`cf-agents://types/mcpagent` (McpAgent):** Pre-built template for acting as an MCP server.

- **Behavioral & Data Primitives:**
  - **`cf-agents://types/state` (AgentState):** Native state management (`initialState`, `setState`).
  - **`cf-agents://types/sql` (AgentSQL):** Embedded relational database capability (`this.sql`).
  - **`cf-agents://types/queue` (TaskQueue):** FIFO background processing (`onDequeue`).
  - **`cf-agents://types/subagent` (SubAgent):** Mechanism to spawn and coordinate multi-agent architectures (`this.subAgent()`).
  - **`cf-agents://types/hitl` (HumanInTheLoop):** 5 defined patterns for pausing workflows for human input.

- **Orchestration Primitives:**
  - **`cf-agents://types/workflow` (AgentWorkflow):** Multi-step, durable background execution that can wait for human interaction.
  - **`cf-agents://types/message` (MessageTypes):** Standard message structures.
  - **`cf-agents://types/clientsdk` (ClientSDK):** Frontend hooks (`useAgent`, `useAgentChat`) for integration.

**Workflow rule:** Always fetch and read the latest resource schemas to understand the context before invoking tools.

## 2. Operations (The Verbs)

Use these tools to securely execute logic and scaffold your project:

- **`scaffold_agent_class`:**
  Initializes a new Agent. Use flags (`hasState`, `hasSQL`, `hasQueue`, `hasSubAgents`) to inject complex behavioral scaffolding directly into the boilerplate.
- **`generate_callable_method`:**
  Generates a type-safe `@callable` RPC method.
- **`generate_state_schema`:**
  Builds the `initialState` payload and state validation logic.
- **`generate_queue_handler`:**
  Creates the `onDequeue` handler for background tasks.
- **`generate_sub_agent`:**
  Writes the logic needed to connect to and spawn child agents.
- **`generate_sql_query`:**
  Writes the `this.sql.execute` logic for embedded database manipulation.
- **`generate_mcp_client`:**
  Scaffolds the code needed for an agent to connect to an external MCP server (`this.mcp.connect`).

## 3. Interaction & Deployment Strategy

1. **Discovery:** Read the relevant resources (`ListResources`, `ReadResource`) to understand which primitive fits your use case (e.g., Should I use an `AIChatAgent` or a raw `Agent`?).
2. **Scaffolding:** Call `scaffold_agent_class` with the necessary structural flags (e.g., `hasSQL=true`).
3. **Enhancement:** Iteratively add behavior using specialized tools (`generate_state_schema`, `generate_queue_handler`).
4. **Verification:** Validate the TypeScript types.
5. **Deployment:** Deploy the code via Cloudflare Workers (`wrangler`).

By following this skill guide, you transform the Cloudflare Agents codebase into a live intelligence layer, capturing both structural definitions and complex behavioral state.

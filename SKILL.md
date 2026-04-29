# Cloudflare Agents SDK Builder Skill

This document serves as the operational manual for any AI agent interacting with the Cloudflare Agents SDK via its Master Control Panel (MCP). The purpose of this skill is to provide a comprehensive understanding of the underlying primitives (Nouns) and actions (Verbs) necessary to build, deploy, and interact with robust AI-driven agents on the Cloudflare infrastructure.

## 1. Core Primitives (The Nouns)

Before manipulating the system, the agent must understand the foundational data structures and models exposed as **MCP Resources**. These are available by fetching resources from the MCP server:

- **`cf-agents://types/agent` (AgentBaseClass):**
  The fundamental unit of the framework. Agents are Durable Objects that hold persistent state across connections. They provide native support for WebSockets, Remote Procedure Calls (RPC), and alarm-driven task scheduling. Use this resource to understand the exact properties (`state`, `env`) and lifecycle methods (`onConnect`, `onMessage`, `schedule`) you need to implement.

- **`cf-agents://types/workflow` (AgentWorkflow):**
  Agents often require long-running, multi-step processes that outlive a single request. Workflows define these durable sequences. They enable human-in-the-loop approvals, sleep cycles, and fault-tolerant background execution.

- **`cf-agents://types/message` (MessageTypes):**
  The communication schema defining the exact message structure (Incoming, Outgoing, MCP server events) necessary for client-agent or agent-agent interactions.

**Workflow rule:** Always fetch and read the latest resource schemas before generating new code.

## 2. Operations (The Verbs)

The MCP exposes tools to safely execute business logic and scaffold projects. Ensure strict type compliance based on the Nouns above.

- **`scaffold_agent_class`:**
  Generates the necessary boilerplate for a new Agent.
  - *Parameters:* `agentName` (string), `hasState` (boolean), `hasSchedule` (boolean).
  - *Usage:* Invoke this when you are tasked with creating a new specialized agent (e.g., `CustomerSupportAgent`, `DataProcessorAgent`).

- **`generate_callable_method`:**
  Generates a type-safe RPC method using the `@callable` decorator. This exposes a function on the Agent that can be securely triggered by clients or other agents.
  - *Parameters:* `methodName` (string), `paramsSchema` (object), `returnType` (string).
  - *Usage:* Invoke this when an agent needs to perform an explicit action or computation (e.g., `fetchUserData`, `approveTransaction`).

## 3. Interaction & Deployment Strategy

When utilizing this skill, follow this strict deterministic workflow:

1. **Discovery:** Read the relevant resources (`ListResources`, `ReadResource`) to ensure you are operating with the correct types and context.
2. **Scaffolding:** Call the `scaffold_agent_class` tool to initialize your class structure.
3. **Enhancement:** Iteratively add functionality using `generate_callable_method` for RPC, or implement Workflows based on the workflow resource definitions.
4. **Verification:** Ensure your types align and the code compiles without missing imports.
5. **Deployment:** The generated code is designed to be bundled and deployed via Cloudflare Workers (`wrangler`).

By following this skill guide, you transform the Cloudflare Agents codebase into a live intelligence layer, abstracting friction and ensuring safe, predictable code generation.

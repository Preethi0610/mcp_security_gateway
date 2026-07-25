# MCP Security Gateway

<img width="410" height="536" alt="Screenshot 2026-07-25 at 16 23 45" src="https://github.com/user-attachments/assets/2550f453-8748-4889-8a88-1cafb2c1e46b" />
<img width="1634" height="737" alt="Screenshot 2026-07-25 at 16 23 16" src="https://github.com/user-attachments/assets/5e6bb6b2-1c5f-409a-819b-e5be6bb2b8bf" />
<img width="1637" height="805" alt="Screenshot 2026-07-25 at 16 23 29" src="https://github.com/user-attachments/assets/e0274e64-d5fc-4e46-a791-902f347477b8" />
<img width="1636" height="805" alt="Screenshot 2026-07-25 at 16 22 32" src="https://github.com/user-attachments/assets/ed117a24-14dd-469d-b29f-96076c24c896" />


A standalone proxy that sits between an AI agent and its tool calls, catching prompt injection, confused-deputy attacks, and credential exfiltration before they ever reach the agent.

## Why I built this

Most AI portfolio projects are RAG apps or agent demos. Almost nobody builds the security layer underneath even though it's exactly what companies like Multifactor are hiring for right now ("build the security layer for the agentic web"). So I built one from scratch.

## The problem

When an AI agent calls a tool reads a calendar, opens a file, checks an inbox whatever that tool returns gets fed straight back into the model's context, treated as trustworthy. An attacker doesn't need to talk to your chatbot at all. They just need to plant malicious instructions somewhere your agent will read as part of a normal task a calendar invite, a file, an email. This is called indirect prompt injection, and most agent demos have zero protection against it.

## The demo

There are two agents here:

1. A deliberately unprotected agent (`vulnerable-agent/`) calls tools directly, no checks, no gateway. Reads a poisoned calendar event and, depending on the model's own resistance, may act on the injected instruction.
2. The same agent, routed through the gateway (`gateway/`) every tool call gets intercepted, checked against a policy, and every tool output gets scanned for injection before the agent ever sees it.

Run the same attack against both. One gets through, or partially resisted. The other gets blocked, logged, and explained every time, deterministically, regardless of which model is behind the agent.

## Architecture

Agent sends a request to the Gateway, which then talks to the real tools (calendar, file, email).

Inside the gateway, each request goes through five steps:

1. Policy check - is this agent allowed to use this tool?
2. Run the real tool
3. Layer 1 - pattern and keyword check on the tool's output
4. Layer 2 - LLM classifier check, catches paraphrased attacks
5. Log the decision to Supabase, return the result or a block reason

The gateway acts as both a server (from the agent's point of view) and a client (from the tools' point of view) a proxy sitting in the middle, so neither side needs to change.

## Tech stack

- Agent: Python, OpenAI function calling (tool use)
- Gateway: FastAPI, Pydantic
- Detection: keyword and pattern matching, plus a GPT-4o-mini classifier
- Storage: Supabase (Postgres) audit log and policy table
- Dashboard: Next.js, TypeScript, Tailwind CSS
- Deployment: Render for the backend, Vercel for the frontend

## The dashboard

- Overview - live feed of every tool call, stat tiles, updates every 3 seconds
- Call Inspector - click any row for full detail: input args, which detection layer flagged it, output snippet, timestamp
- Policy Manager - toggle which tools each agent can use, persists to Supabase, takes effect immediately
- Attack Simulator - three buttons, each fires a real pre-scripted attack straight at the gateway and shows the block live


## What I'd build next

- Move policy definitions into a proper RBAC system with agent-level API keys instead of a plain string name
- Add rate limiting per agent
- Expand the injection detector's test corpus and measure precision and recall properly instead of eyeballing a handful of examples
- Real MCP protocol support, client and server over JSON-RPC, instead of the simplified HTTP request/response the gateway currently uses

# MCP Security Gateway

A standalone proxy that sits between an AI agent and its tool calls, catching prompt injection, confused-deputy attacks, and credential exfiltration before they ever reach the agent.

## Why I built this

Most AI portfolio projects are RAG apps or agent demos. Almost nobody builds the security layer underneath even though it's exactly what companies like Multifactor are hiring for right now ("build the security layer for the agentic web"). So I built one from scratch.

## The problem

When an AI agent calls a tool reads a calendar, opens a file, checks an inbox whatever that tool returns gets fed straight back into the model's context, treated as trustworthy. An attacker doesn't need to talk to your chatbot at all. They just need to plant malicious instructions somewhere your agent will read as part of a normal task a calendar invite, a file, an email. This is called **indirect prompt injection**, and most agent demos have zero protection against it.

## The demo

There are two agents here:

1. **A deliberately unprotected agent** (`vulnerable-agent/`) - calls tools directly, no checks, no gateway. Reads a poisoned calendar event and (depending on the model's own resistance) may act on the injected instruction.
2. **The same agent, routed through the gateway** (`gateway/`) - every tool call gets intercepted, checked against a policy, and every tool *output* gets scanned for injection before the agent ever sees it.

Run the same attack against both. One gets through (or partially resisted, since even the base model has some defenses). The other gets blocked, logged, and explained every time, deterministically, regardless of which model is behind the agent.

## Architecture

```
Agent → Gateway → Real Tools (calendar / file / email)

Inside the gateway, each request goes through:
1. Policy check — is this agent allowed to use this tool?
2. Run the real tool
3. Layer 1 — pattern/keyword check on the tool's output
4. Layer 2 — LLM classifier check (catches paraphrased attacks)
5. Log the decision to Supabase, return result or block reason
```

The gateway acts as both an MCP-style server (from the agent's point of view) and a client (from the tools' point of view) — a proxy sitting in the middle, so neither side needs to change.

## Tech stack

| Layer | Tech |
|---|---|
| Agent | Python, OpenAI function calling (tool use) |
| Gateway | FastAPI, Pydantic |
| Detection | Keyword/pattern matching + GPT-4o-mini classifier |
| Storage | Supabase (Postgres) - audit log + policy table |
| Dashboard | Next.js, TypeScript, Tailwind CSS |
| Deployment | Render (backend), Vercel (frontend) |

## The dashboard

- **Overview** — live feed of every tool call, stat tiles, updates every 3 seconds
- **Call Inspector** — click any row for full detail: input args, which detection layer flagged it, output snippet, timestamp
- **Policy Manager** — toggle which tools each agent can use, persists to Supabase, takes effect immediately
- **Attack Simulator** — three buttons, each fires a real pre-scripted attack straight at the gateway and shows the block live

## Running it locally

You'll need: Python 3.12+, Node.js, an OpenAI API key, and a Supabase project.

**1. Gateway**
\```bash
cd gateway
python -m venv gate
source gate/bin/activate
pip install -r requirements.txt
# add .env with OPENAI_API_KEY, SUPABASE_URL, SUPABASE_KEY
python -m uvicorn main:app --reload
\```

**2. Vulnerable agent**
\```bash
cd vulnerable-agent
python -m venv agentvenv
source agentvenv/bin/activate
pip install openai python-dotenv requests
# add .env with OPENAI_API_KEY
python agents.py
\```

**3. Dashboard**
\```bash
cd dashboard
npm install
npm run dev
# visit localhost:3000
\```

## What I'd build next-

- Move policy definitions into a proper RBAC system with agent-level API keys instead of a plain string name
- Add rate limiting per agent
- Expand the injection detector's test corpus and measure precision/recall properly instead of eyeballing a handful of examples
- Real MCP protocol support (client/server over JSON-RPC) instead of the simplified HTTP request/response the gateway currently uses
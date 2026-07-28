
  # MCP Security Gateway

![Python](https://img.shields.io/badge/Python-3.11-3776AB?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-Gateway-009688?logo=fastapi&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-Dashboard-000000?logo=next.js&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Postgres-3ECF8E?logo=supabase&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o--mini-412991?logo=openai&logoColor=white)
![Status](https://img.shields.io/badge/status-active-brightgreen)

<table>
<tr>
<td width="50%">
  <img src="https://github.com/user-attachments/assets/2550f453-8748-4889-8a88-1cafb2c1e46b" alt="Architecture diagram" width="100%">
</td>
<td width="50%">

**A security checkpoint for AI agents.**

The MCP Security Gateway sits between an AI agent and every tool it calls (calendars, files, inboxes, anything) and inspects what comes back before the agent ever sees it. It catches prompt injection, confused-deputy attacks, and credential exfiltration in real time, and it does this deterministically, without relying on the underlying model to "know better."

In plain terms: if someone hides a malicious instruction inside a file or calendar invite your AI assistant is going to read, this stops the assistant from following it, and logs exactly what happened.

</td>
</tr>
</table>

<img width="1600" height="700" alt="Screenshot 2026-07-25 at 16 23 16" src="https://github.com/user-attachments/assets/5e6bb6b2-1c5f-409a-819b-e5be6bb2b8bf" />
<img width="1600" height="700" alt="Screenshot 2026-07-25 at 16 23 29" src="https://github.com/user-attachments/assets/e0274e64-d5fc-4e46-a791-902f347477b8" />
<img width="1600" height="700" alt="Screenshot 2026-07-25 at 16 22 32" src="https://github.com/user-attachments/assets/ed117a24-14dd-469d-b29f-96076c24c896" />

## Why I built this

Most AI portfolio projects are chatbots or RAG demos wired on top of a model. Very few people are building the layer that actually makes agents *safe to deploy*, even though that's precisely the problem companies like Multifactor are hiring for right now, under the banner of "securing the agentic web." So instead of building another agent, I built the thing that watches the agent.

## The problem, in one sentence

**An AI agent doesn't just take instructions from the person using it. It takes instructions from anything it reads.**

When an agent calls a tool (checks a calendar, opens a file, reads an inbox), whatever that tool returns gets fed straight back into the model's context and treated as trustworthy, the same as a direct request from the user. An attacker never needs to talk to your chatbot at all. They just need to plant a hidden instruction somewhere the agent will read during a normal task: a calendar invite, a shared document, an email signature.

This is called **indirect prompt injection**, and almost no agent demo has any real defense against it. This project does.

## The demo: same attack, two outcomes

Two versions of the same agent are included so you can watch the difference live:

1. **`vulnerable-agent/`**: calls tools directly with no checks and no gateway in between. When it reads a poisoned calendar event, it may act on the injected instruction, depending purely on how resistant that particular model happens to be.
2. **`gateway/`**: the identical agent, but every tool call now routes through the gateway. Every request is checked against policy on the way out, and every tool response is scanned for injected instructions on the way back in, before the agent ever sees it.

Run the same attack against both. The unprotected agent gets fooled, or gets lucky. The protected one blocks it, logs it, and explains why, every time, regardless of which model is behind it.

## How it works

The agent never talks to the real tools directly. It talks to the gateway, and the gateway talks to the real tools (calendar, file, email) on its behalf: a proxy sitting in the middle that neither side has to be aware of.

Every request passes through five checkpoints:

1. **Policy check**: is this agent even allowed to use this tool?
2. **Execute**: the real tool runs, and returns its raw output.
3. **Layer 1, pattern match**: fast keyword and pattern scanning on the tool's output.
4. **Layer 2, LLM classifier**: a second model checks for paraphrased or disguised attacks that slip past pattern matching.
5. **Log and respond**: the decision is written to the audit log, and either the result or a clear block reason is returned to the agent.
<img width="5204" height="5435" alt="diagram" src="https://github.com/user-attachments/assets/2a8a9807-d3a3-4c0a-850a-184517a7108c" />


## Tech stack

**Agent**
![Python](https://img.shields.io/badge/Python-3776AB?logo=python&logoColor=white) ![OpenAI](https://img.shields.io/badge/OpenAI_function_calling-412991?logo=openai&logoColor=white)

**Gateway**
![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white) ![Pydantic](https://img.shields.io/badge/Pydantic-E92063?logo=pydantic&logoColor=white)

**Detection**
![Keyword Matching](https://img.shields.io/badge/Layer_1-Pattern_%26_keyword_match-orange) ![GPT-4o-mini](https://img.shields.io/badge/Layer_2-GPT--4o--mini_classifier-412991?logo=openai&logoColor=white)

**Storage**
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?logo=supabase&logoColor=white) ![Postgres](https://img.shields.io/badge/Postgres-4169E1?logo=postgresql&logoColor=white)

**Dashboard**
![Next.js](https://img.shields.io/badge/Next.js-000000?logo=next.js&logoColor=white) ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white) ![Tailwind](https://img.shields.io/badge/Tailwind_CSS-06B6D4?logo=tailwindcss&logoColor=white)

**Deployment**
![Render](https://img.shields.io/badge/Render-Backend-46E3B7?logo=render&logoColor=white) ![Vercel](https://img.shields.io/badge/Vercel-Frontend-000000?logo=vercel&logoColor=white)

## The dashboard

- **Overview**: a live feed of every tool call, with stat tiles refreshing every 3 seconds.
- **Call Inspector**: click any row to see full detail: input arguments, which detection layer flagged it, the output snippet, and a timestamp.
- **Policy Manager**: toggle which tools each agent is allowed to use; changes persist to Supabase and take effect immediately, no redeploy.
- **Attack Simulator**: three buttons, each firing a real, pre-scripted attack straight at the gateway, with the block shown live on screen.

## What I'd build next

- Move policy definitions into a proper RBAC system, with agent-level API keys instead of plain string names.
- Add per-agent rate limiting.
- Expand the injection detector's test corpus and measure precision/recall formally, rather than spot-checking examples by hand.
- Add native MCP protocol support (JSON-RPC, client and server) in place of the simplified HTTP request/response the gateway currently uses.




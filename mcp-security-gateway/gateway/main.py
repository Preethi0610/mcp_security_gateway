import os
import json
from dotenv import load_dotenv
from openai import OpenAI
from logger import log_decision, supabase

from fastapi import FastAPI
from pydantic import BaseModel

from tools import TOOL_IMPLEMENTATIONS
from logger import log_decision
from detector import contains_suspicious_pattern, classify_with_llm
from fastapi.middleware.cors import CORSMiddleware
from policy import is_allowed, get_all_policies, set_policy


app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

class ToolCallRequest(BaseModel):
    agent_name: str
    tool_name: str
    tool_args: dict

class PolicyUpdateRequest(BaseModel):
    agent_name: str
    tool_name: str
    allowed: bool

@app.get("/")
def root():
    return {"message": "Gateway is running"}

@app.get("/policies")
def list_policies():
    return {"policies": get_all_policies()}


@app.post("/policies")
def update_policy(request: PolicyUpdateRequest):
    set_policy(request.agent_name, request.tool_name, request.allowed)
    return {"status": "updated"}

@app.post("/check-tool-call")
def check_tool_call(request: ToolCallRequest):
    #policy check
    allowed = is_allowed(request.agent_name, request.tool_name)

    if not allowed:
        log_decision(
            agent_name=request.agent_name,
            tool_name=request.tool_name,
            tool_args=request.tool_args,
            decision="blocked",
            reason=f"{request.agent_name} is not permitted to use {request.tool_name}.",
        )
        return {
            "decision": "blocked",
            "reason": f"{request.agent_name} is not permitted to use {request.tool_name}.",
        }

    # Step 2: run the real tool
    tool_fn = TOOL_IMPLEMENTATIONS[request.tool_name]
    result = tool_fn(**request.tool_args)

    # NEW: injection check on the tool's output
    print("[LAYER 1] Running injection check on tool output...")
    if contains_suspicious_pattern(result):
        log_decision(
            agent_name=request.agent_name,
            tool_name=request.tool_name,
            tool_args=request.tool_args,
            decision="blocked",
            reason="Tool output contained a suspicious injection pattern.",
            layer1_flagged=True,
            result_snippet=result[:200],
        )
        return {
            "decision": "blocked",
            "reason": "Tool output contained a suspicious injection pattern.",
        }
    # Layer 2: LLM classifier check
    print("[LAYER 2] Running LLM classifier check...")
    if classify_with_llm(result, client):
        log_decision(
            agent_name=request.agent_name,
            tool_name=request.tool_name,
            tool_args=request.tool_args,
            decision="blocked",
            reason="Tool output flagged as suspicious by LLM classifier.",
            layer2_flagged=True,
            result_snippet=result[:200],
        )
        return {
            "decision": "blocked",
            "reason": "Tool output flagged as suspicious by LLM classifier.",
        }

    log_decision(
        agent_name=request.agent_name,
        tool_name=request.tool_name,
        tool_args=request.tool_args,
        decision="allowed",
        layer1_flagged=False,
        layer2_flagged=False,
        result_snippet=result[:200],
    )
    return {
        "decision": "allowed",
        "result": result,
    }

@app.get("/audit-log")
def get_audit_log(limit: int = 50):
    response = (
        supabase.table("audit_log")
        .select("*")
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    return {"logs": response.data}
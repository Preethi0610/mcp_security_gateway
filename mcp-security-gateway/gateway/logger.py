import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv(override=True)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)


def log_decision(
    agent_name: str,
    tool_name: str,
    tool_args: dict,
    decision: str,
    reason: str = None,
    layer1_flagged: bool = None,
    layer2_flagged: bool = None,
    result_snippet: str = None,
):
    supabase.table("audit_log").insert({
        "agent_name": agent_name,
        "tool_name": tool_name,
        "tool_args": tool_args,
        "decision": decision,
        "reason": reason,
        "layer1_flagged": layer1_flagged,
        "layer2_flagged": layer2_flagged,
        "result_snippet": result_snippet,
    }).execute()


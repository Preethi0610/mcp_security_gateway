from logger import supabase


def is_allowed(agent_name: str, tool_name: str) -> bool:
    response = (
        supabase.table("policies")
        .select("allowed")
        .eq("agent_name", agent_name)
        .eq("tool_name", tool_name)
        .execute()
    )

    if not response.data:
        return False

    return response.data[0]["allowed"]


def get_all_policies():
    response = supabase.table("policies").select("*").execute()
    return response.data


def set_policy(agent_name: str, tool_name: str, allowed: bool):
    supabase.table("policies").upsert(
        {"agent_name": agent_name, "tool_name": tool_name, "allowed": allowed},
        on_conflict="agent_name,tool_name",
    ).execute()
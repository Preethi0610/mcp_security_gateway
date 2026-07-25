import os
import json
import requests
from dotenv import load_dotenv
from openai import OpenAI
from tools import TOOL_SCHEMAS, SENT_EMAILS

load_dotenv(override=True)

openapi_key = os.getenv("OPENAI_API_KEY")
if not openapi_key:
    raise ValueError("OPENAI_API_KEY environment variable is not set")

# object creation
client = OpenAI(api_key=openapi_key)
MODEL = "gpt-4o-mini"

GATEWAY_URL = "http://localhost:8000/check-tool-call"


def run_agent(user_message: str, max_turns: int = 5):
    messages = [
        {"role": "system", "content": "You are a helpful personal assistant with access to calendar, file, and email tools. Use them as needed to help the user."},
        {"role": "user", "content": user_message},
    ]

    for turns in range(max_turns):
        print(f"\n--- Turn {turns + 1} ---")

        response = client.chat.completions.create(
            model=MODEL,
            messages=messages,
            tools=TOOL_SCHEMAS,
        )
        msg = response.choices[0].message  # msg is a Pydantic model

        # Case 1: model decided it's done, just gave a final text answer
        if not msg.tool_calls:
            return f"Agent finished after {turns + 1} turns. Final answer:\n{msg.content}"

        # Case 2: model wants to call one or more tools
        messages.append(msg.model_dump())

        for tool_call in msg.tool_calls:
            tool_name = tool_call.function.name
            tool_args = json.loads(tool_call.function.arguments)

            print(f"[TOOL CALL] {tool_name}({tool_args})")

            # Instead of calling the tool directly, ask the gateway
            gateway_http_response = requests.post(
                GATEWAY_URL,
                json={
                    "agent_name": "personal-assistant",
                    "tool_name": tool_name,
                    "tool_args": tool_args,
                },
            )
            gateway_response = gateway_http_response.json()

            if gateway_response["decision"] == "blocked":
                result = f"[BLOCKED BY GATEWAY] {gateway_response['reason']}"
            else:
                result = gateway_response["result"]

            print(f"[TOOL RESULT] {result[:200]}")

            messages.append({
                "role": "tool",
                "tool_call_id": tool_call.id,
                "content": result,
            })

    print("\n[STOPPED] Hit max turns without a final answer.")
    return None


if __name__ == "__main__":
    print("=" * 60)
    print("AGENT (NOW ROUTED THROUGH GATEWAY)")
    print("=" * 60)

    result = run_agent("What's on my calendar today (2026-07-22)?")
    print(f"\n{result}")

    print("\n" + "=" * 60)
    print(f"SENT EMAILS: {SENT_EMAILS}")
    print("=" * 60)
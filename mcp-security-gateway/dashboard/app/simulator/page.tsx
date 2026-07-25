"use client";

import { useState } from "react";

const GATEWAY_URL = "https://mcp-security-gateway.onrender.com";

type AttackResult = {
  decision: string;
  reason?: string;
  result?: string;
};

const ATTACKS = [
  {
    label: "Simulate Prompt Injection in Tool Output",
    description: "Reads a poisoned calendar event containing obvious injected instructions.",
    payload: {
      agent_name: "personal-assistant",
      tool_name: "read_calendar",
      tool_args: { date: "2026-07-22" },
    },
  },
  {
    label: "Simulate Confused-Deputy Attack",
    description: "SDR Agent attempts to call delete_file, a tool it's not permitted to use.",
    payload: {
      agent_name: "sdr-agent",
      tool_name: "delete_file",
      tool_args: {},
    },
  },
  {
    label: "Simulate Credential Exfiltration (paraphrased injection)",
    description: "Reads a subtly poisoned calendar event with no obvious keywords -- tests the LLM classifier layer.",
    payload: {
      agent_name: "personal-assistant",
      tool_name: "read_calendar",
      tool_args: { date: "2026-07-23" },
    },
  },
];

export default function SimulatorPage() {
  const [results, setResults] = useState<Record<number, AttackResult>>({});
  const [loadingIndex, setLoadingIndex] = useState<number | null>(null);

  async function runAttack(index: number) {
    setLoadingIndex(index);
    const res = await fetch(`${GATEWAY_URL}/check-tool-call`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ATTACKS[index].payload),
    });
    const data = await res.json();
    setResults((prev) => ({ ...prev, [index]: data }));
    setLoadingIndex(null);
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <h1 className="text-2xl font-bold mb-2">Attack Simulator</h1>
      <p className="text-gray-400 mb-8">
        Fire pre-scripted attacks live through the gateway and watch them get blocked.
      </p>

      <div className="space-y-4">
        {ATTACKS.map((attack, index) => {
          const result = results[index];
          return (
            <div key={index} className="bg-gray-900 rounded-lg p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-semibold">{attack.label}</h2>
                  <p className="text-gray-400 text-sm mt-1">{attack.description}</p>
                </div>
                <button
                  onClick={() => runAttack(index)}
                  disabled={loadingIndex === index}
                  className="shrink-0 bg-red-600 hover:bg-red-500 disabled:bg-gray-700 px-4 py-2 rounded-md text-sm font-semibold"
                >
                  {loadingIndex === index ? "Running..." : "Fire Attack"}
                </button>
              </div>

              {result && (
                <div
                  className={`mt-4 rounded-md p-3 text-sm ${
                    result.decision === "blocked"
                      ? "bg-red-950 border border-red-800"
                      : "bg-yellow-950 border border-yellow-800"
                  }`}
                >
                  <div className="font-semibold">
                    {result.decision === "blocked" ? "BLOCKED" : "ALLOWED (attack succeeded!)"}
                  </div>
                  {result.reason && <div className="text-gray-300 mt-1">{result.reason}</div>}
                  {result.result && (
                    <div className="text-gray-300 mt-1 break-words">{result.result}</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
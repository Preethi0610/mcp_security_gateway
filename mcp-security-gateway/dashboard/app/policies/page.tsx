"use client";

import { useEffect, useState } from "react";

const GATEWAY_URL = "http://localhost:8000";

type Policy = {
  id: number;
  agent_name: string;
  tool_name: string;
  allowed: boolean;
};

export default function PolicyManagerPage() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchPolicies() {
    const res = await fetch(`${GATEWAY_URL}/policies`);
    const data = await res.json();
    setPolicies(data.policies);
    setLoading(false);
  }

  useEffect(() => {
    fetchPolicies();
  }, []);

  async function togglePolicy(policy: Policy) {
    const newValue = !policy.allowed;

    setPolicies((prev) =>
      prev.map((p) => (p.id === policy.id ? { ...p, allowed: newValue } : p))
    );

    await fetch(`${GATEWAY_URL}/policies`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agent_name: policy.agent_name,
        tool_name: policy.tool_name,
        allowed: newValue,
      }),
    });
  }

  if (loading) {
    return <div className="p-8 text-white">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <h1 className="text-2xl font-bold mb-2">Policy Manager</h1>
      <p className="text-gray-400 mb-8">
        Toggle which tools each agent is allowed to use. Changes take effect immediately.
      </p>

      <div className="bg-gray-900 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-800 text-left text-gray-400">
            <tr>
              <th className="p-3">Agent</th>
              <th className="p-3">Tool</th>
              <th className="p-3">Allowed</th>
            </tr>
          </thead>
          <tbody>
            {policies.map((policy) => (
              <tr key={policy.id} className="border-t border-gray-800">
                <td className="p-3">{policy.agent_name}</td>
                <td className="p-3">{policy.tool_name}</td>
                <td className="p-3">
                  <button
                    onClick={() => togglePolicy(policy)}
                    className={`w-12 h-6 rounded-full transition-colors relative ${
                      policy.allowed ? "bg-green-600" : "bg-gray-700"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                        policy.allowed ? "translate-x-6" : ""
                      }`}
                    />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
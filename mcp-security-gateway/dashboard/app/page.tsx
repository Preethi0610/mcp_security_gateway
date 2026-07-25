"use client";

import { useEffect, useState } from "react";

const GATEWAY_URL = "http://localhost:8000";

type LogEntry = {
  id: number;
  agent_name: string;
  tool_name: string;
  tool_args: Record<string, unknown>;
  layer1_flagged: boolean | null;
  layer2_flagged: boolean | null;
  decision: string;
  reason: string | null;
  result_snippet: string | null;
  created_at: string;
};

export default function DashboardPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);

  useEffect(() => {
    async function fetchLogs() {
      const res = await fetch(`${GATEWAY_URL}/audit-log`);
      const data = await res.json();
      setLogs(data.logs);
      setLoading(false);
    }

    fetchLogs();
    const interval = setInterval(fetchLogs, 3000);
    return () => clearInterval(interval);
  }, []);

  const totalCalls = logs.length;
  const blockedCount = logs.filter((l) => l.decision === "blocked").length;

  if (loading) {
    return <div className="p-8 text-white">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8 flex gap-6">
      <div className="flex-1">
        <h1 className="text-2xl font-bold mb-6">MCP Security Gateway</h1>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-900 rounded-lg p-4">
            <div className="text-gray-400 text-sm">Total Calls</div>
            <div className="text-3xl font-bold">{totalCalls}</div>
          </div>
          <div className="bg-gray-900 rounded-lg p-4">
            <div className="text-gray-400 text-sm">Blocked</div>
            <div className="text-3xl font-bold text-red-400">{blockedCount}</div>
          </div>
          <div className="bg-gray-900 rounded-lg p-4">
            <div className="text-gray-400 text-sm">Allowed</div>
            <div className="text-3xl font-bold text-green-400">
              {totalCalls - blockedCount}
            </div>
          </div>
        </div>

        <div className="bg-gray-900 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-800 text-left text-gray-400">
              <tr>
                <th className="p-3">Time</th>
                <th className="p-3">Agent</th>
                <th className="p-3">Tool</th>
                <th className="p-3">Decision</th>
                <th className="p-3">Reason</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr
                  key={log.id}
                  onClick={() => setSelectedLog(log)}
                  className={`border-t border-gray-800 cursor-pointer hover:bg-gray-800 transition-colors ${
                    selectedLog?.id === log.id ? "bg-gray-800" : ""
                  }`}
                >
                  <td className="p-3 text-gray-400">
                    {new Date(log.created_at).toLocaleTimeString()}
                  </td>
                  <td className="p-3">{log.agent_name}</td>
                  <td className="p-3">{log.tool_name}</td>
                  <td className="p-3">
                    <span
                      className={
                        log.decision === "blocked"
                          ? "text-red-400 font-semibold"
                          : "text-green-400 font-semibold"
                      }
                    >
                      {log.decision.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-3 text-gray-400">{log.reason ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedLog && (
        <div className="w-96 shrink-0 bg-gray-900 rounded-lg p-5 h-fit sticky top-8">
          <div className="flex justify-between items-start mb-4">
            <h2 className="font-bold text-lg">Call Details</h2>
            <button
              onClick={() => setSelectedLog(null)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="space-y-3 text-sm">
            <div>
              <div className="text-gray-400">Agent</div>
              <div>{selectedLog.agent_name}</div>
            </div>
            <div>
              <div className="text-gray-400">Tool</div>
              <div>{selectedLog.tool_name}</div>
            </div>
            <div>
              <div className="text-gray-400">Input Arguments</div>
              <pre className="bg-gray-950 rounded p-2 mt-1 overflow-x-auto text-xs">
                {JSON.stringify(selectedLog.tool_args, null, 2)}
              </pre>
            </div>
            <div>
              <div className="text-gray-400">Decision</div>
              <div
                className={
                  selectedLog.decision === "blocked"
                    ? "text-red-400 font-semibold"
                    : "text-green-400 font-semibold"
                }
              >
                {selectedLog.decision.toUpperCase()}
              </div>
            </div>
            {selectedLog.reason && (
              <div>
                <div className="text-gray-400">Reason</div>
                <div>{selectedLog.reason}</div>
              </div>
            )}
            <div>
              <div className="text-gray-400">Detection Layers</div>
              <div className="flex gap-2 mt-1">
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    selectedLog.layer1_flagged
                      ? "bg-red-950 text-red-400"
                      : "bg-gray-800 text-gray-400"
                  }`}
                >
                  Layer 1: {selectedLog.layer1_flagged === null ? "n/a" : selectedLog.layer1_flagged ? "flagged" : "clean"}
                </span>
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    selectedLog.layer2_flagged
                      ? "bg-red-950 text-red-400"
                      : "bg-gray-800 text-gray-400"
                  }`}
                >
                  Layer 2: {selectedLog.layer2_flagged === null ? "n/a" : selectedLog.layer2_flagged ? "flagged" : "clean"}
                </span>
              </div>
            </div>
            {selectedLog.result_snippet && (
              <div>
                <div className="text-gray-400">Output Snippet</div>
                <div className="bg-gray-950 rounded p-2 mt-1 text-xs break-words">
                  {selectedLog.result_snippet}
                </div>
              </div>
            )}
            <div>
              <div className="text-gray-400">Timestamp</div>
              <div>{new Date(selectedLog.created_at).toLocaleString()}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
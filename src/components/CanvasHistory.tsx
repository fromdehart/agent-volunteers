import { useState } from "react";
import { parseDiff } from "@/lib/diffUtils";

interface Revision {
  _id: string;
  fullContent: string;
  diff: string;
  createdAt: number;
  agentName: string;
}

interface CanvasHistoryProps {
  revisions: Revision[];
  onClose: () => void;
}

function formatTime(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function CanvasHistory({ revisions, onClose }: CanvasHistoryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [viewMode, setViewMode] = useState<"full" | "diff">("full");

  if (revisions.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-gray-800">Revision History</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>
        <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
          No history yet
        </div>
      </div>
    );
  }

  const selected = revisions[selectedIndex];
  const diffLines = parseDiff(selected.diff);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b shrink-0">
        <h3 className="font-semibold text-gray-800">Revision History</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: revision list */}
        <div className="w-48 border-r overflow-y-auto shrink-0">
          {revisions.map((rev, idx) => (
            <button
              key={rev._id}
              onClick={() => setSelectedIndex(idx)}
              className={`w-full text-left px-3 py-3 border-b hover:bg-gray-50 transition-colors ${
                idx === selectedIndex ? "bg-blue-50 border-l-2 border-l-blue-500" : ""
              }`}
            >
              <div className="text-xs font-medium text-gray-700">
                Rev {revisions.length - idx}
              </div>
              <div className="text-xs text-gray-500 truncate">{rev.agentName}</div>
              <div className="text-xs text-gray-400">{formatTime(rev.createdAt)}</div>
            </button>
          ))}
        </div>

        {/* Right: content panel */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2 border-b bg-gray-50 shrink-0">
            <button
              onClick={() => setViewMode("full")}
              className={`px-3 py-1 text-xs rounded font-medium transition-colors ${
                viewMode === "full"
                  ? "bg-blue-600 text-white"
                  : "bg-white border border-gray-300 text-gray-600 hover:bg-gray-50"
              }`}
            >
              Full
            </button>
            <button
              onClick={() => setViewMode("diff")}
              className={`px-3 py-1 text-xs rounded font-medium transition-colors ${
                viewMode === "diff"
                  ? "bg-blue-600 text-white"
                  : "bg-white border border-gray-300 text-gray-600 hover:bg-gray-50"
              }`}
            >
              Diff
            </button>
          </div>

          <div className="flex-1 overflow-auto p-4">
            {viewMode === "full" ? (
              <pre className="font-mono text-xs text-gray-800 whitespace-pre-wrap break-words">
                {selected.fullContent || "(empty)"}
              </pre>
            ) : (
              <div className="font-mono text-xs">
                {diffLines.length === 0 ? (
                  <span className="text-gray-400">(no diff available)</span>
                ) : (
                  diffLines.map((dl, i) => (
                    <div
                      key={i}
                      className={`px-2 py-0.5 whitespace-pre-wrap break-words ${
                        dl.type === "add"
                          ? "bg-green-100 text-green-800"
                          : dl.type === "remove"
                          ? "bg-red-100 text-red-800"
                          : "text-gray-700"
                      }`}
                    >
                      <span className="select-none mr-2 text-gray-400">
                        {dl.type === "add" ? "+" : dl.type === "remove" ? "-" : " "}
                      </span>
                      {dl.line}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

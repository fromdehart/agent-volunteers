import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { CanvasHistory } from "./CanvasHistory";

interface CollaborativeCanvasProps {
  opportunityId: Id<"opportunities">;
  agentKey: string | null;
}

export function CollaborativeCanvas({ opportunityId, agentKey }: CollaborativeCanvasProps) {
  const current = useQuery(api.canvas.getCurrentContent, {
    opportunityId,
    canvasType: "collaborative",
  });
  const revisions = useQuery(api.canvas.listRevisions, {
    opportunityId,
    canvasType: "collaborative",
  });

  const [editorContent, setEditorContent] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const httpUrl = import.meta.env.VITE_CONVEX_HTTP_URL ?? "";

  useEffect(() => {
    if (!isDirty && current !== undefined) {
      setEditorContent(current?.fullContent ?? "");
    }
  }, [current, isDirty]);

  const handleSave = async () => {
    if (!agentKey || !isDirty || saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(
        `${httpUrl}/api/opportunities/${opportunityId}/canvas`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${agentKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content: editorContent }),
        }
      );
      if (res.status === 429) {
        setSaveError("Rate limit exceeded — try again in a moment.");
      } else if (res.status === 401 || res.status === 403) {
        setSaveError("Auth failed — check your API key.");
      } else if (!res.ok) {
        setSaveError("Failed to save.");
      } else {
        setIsDirty(false);
      }
    } catch {
      setSaveError("Network error — please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full relative">
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50 shrink-0">
        <span className="font-semibold text-gray-800 text-sm">Collaborative Canvas</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">{editorContent.length} chars</span>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`px-3 py-1.5 text-xs rounded border font-medium transition-colors ${
              showHistory
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
            }`}
          >
            History {revisions ? `(${revisions.length})` : ""}
          </button>
          <button
            onClick={() => void handleSave()}
            disabled={!isDirty || !agentKey || saving}
            className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {saveError && (
        <div className="px-4 py-2 bg-red-50 border-b border-red-200 text-red-600 text-xs">
          {saveError}
        </div>
      )}

      <div className="flex-1 overflow-hidden relative">
        {agentKey ? (
          <textarea
            value={editorContent}
            onChange={(e) => {
              setEditorContent(e.target.value);
              setIsDirty(true);
            }}
            className="w-full h-full p-4 font-mono text-sm resize-none focus:outline-none border-0"
            placeholder="Start writing the collaborative document here..."
          />
        ) : (
          <pre className="w-full h-full p-4 font-mono text-sm overflow-auto whitespace-pre-wrap text-gray-700">
            {editorContent || (
              <span className="text-gray-400">No content yet. Register to contribute.</span>
            )}
          </pre>
        )}

        {showHistory && (
          <div className="absolute inset-0 bg-white border-l shadow-lg flex flex-col">
            <CanvasHistory
              revisions={revisions ?? []}
              onClose={() => setShowHistory(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

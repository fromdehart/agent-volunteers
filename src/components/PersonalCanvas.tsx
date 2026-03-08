import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { CanvasHistory } from "./CanvasHistory";

interface PersonalCanvasProps {
  opportunityId: Id<"opportunities">;
  volunteer: { _id: Id<"agentVolunteers">; agentName: string };
  isOwner: boolean;
  agentKey: string | null;
}

export function PersonalCanvas({ opportunityId, volunteer, isOwner, agentKey }: PersonalCanvasProps) {
  const current = useQuery(api.canvas.getCurrentContent, {
    opportunityId,
    canvasType: "personal",
    agentVolunteerId: volunteer._id,
  });
  const revisions = useQuery(api.canvas.listRevisions, {
    opportunityId,
    canvasType: "personal",
    agentVolunteerId: volunteer._id,
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
    if (!agentKey || !isDirty || saving || !isOwner) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(
        `${httpUrl}/api/opportunities/${opportunityId}/personal-canvas`,
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
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b">
        <div>
          <span className="font-semibold text-sm text-gray-800">{volunteer.agentName}</span>
          <span className="text-xs text-gray-500 ml-2">Personal Canvas</span>
          {isOwner && (
            <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
              you
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`px-2 py-1 text-xs rounded border font-medium transition-colors ${
              showHistory
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
            }`}
          >
            History {revisions ? `(${revisions.length})` : ""}
          </button>
          {isOwner && agentKey && (
            <button
              onClick={() => void handleSave()}
              disabled={!isDirty || saving}
              className="px-2 py-1 text-xs bg-blue-600 text-white rounded font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          )}
        </div>
      </div>

      {saveError && (
        <div className="px-4 py-2 bg-red-50 border-b border-red-200 text-red-600 text-xs">
          {saveError}
        </div>
      )}

      {showHistory && revisions && (
        <div className="h-64 border-b">
          <CanvasHistory
            revisions={revisions}
            onClose={() => setShowHistory(false)}
          />
        </div>
      )}

      <div className="p-0">
        {isOwner && agentKey ? (
          <textarea
            value={editorContent}
            onChange={(e) => {
              setEditorContent(e.target.value);
              setIsDirty(true);
            }}
            rows={8}
            className="w-full p-4 font-mono text-sm resize-none focus:outline-none border-0"
            placeholder="Start drafting your personal notes, observations, or plans here..."
          />
        ) : (
          <pre className="p-4 font-mono text-sm whitespace-pre-wrap break-words text-gray-700 min-h-[6rem]">
            {editorContent || (
              <span className="text-gray-400 not-italic">No entries yet.</span>
            )}
          </pre>
        )}
      </div>
    </div>
  );
}

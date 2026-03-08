import { useEffect, useRef, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface DiscussionThreadProps {
  opportunityId: Id<"opportunities">;
  agentKey: string | null;
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

export function DiscussionThread({ opportunityId, agentKey }: DiscussionThreadProps) {
  const messages = useQuery(api.discussion.listMessages, { opportunityId });
  const [newMessage, setNewMessage] = useState("");
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const httpUrl = import.meta.env.VITE_CONVEX_HTTP_URL ?? "";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages?.length]);

  const handlePost = async () => {
    if (!newMessage.trim() || !agentKey || posting) return;
    setPosting(true);
    setPostError(null);
    try {
      const res = await fetch(
        `${httpUrl}/api/opportunities/${opportunityId}/discussion`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${agentKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content: newMessage }),
        }
      );
      if (res.status === 429) {
        setPostError("Rate limit — wait a moment before posting again.");
      } else if (res.status === 401 || res.status === 403) {
        setPostError("Auth failed — check your API key.");
      } else if (!res.ok) {
        setPostError("Failed to post message.");
      } else {
        setNewMessage("");
      }
    } catch {
      setPostError("Network error — please try again.");
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[500px] min-h-[200px]">
        {messages === undefined ? (
          <div className="text-gray-400 text-sm text-center py-8">Loading...</div>
        ) : messages.length === 0 ? (
          <div className="text-gray-400 text-sm text-center py-8">
            No messages yet — be the first to post.
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg._id} className="group">
              <div className="flex items-baseline justify-between mb-0.5">
                <span className="font-semibold text-sm text-gray-800">{msg.agentName}</span>
                <span className="text-xs text-gray-400">{formatTime(msg.createdAt)}</span>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {msg.content}
              </p>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t p-4 shrink-0">
        {agentKey ? (
          <div className="space-y-2">
            <div className="relative">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Write a message..."
                rows={3}
                maxLength={4000}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    void handlePost();
                  }
                }}
              />
              <span className="absolute bottom-2 right-2 text-xs text-gray-400">
                {newMessage.length}/4000
              </span>
            </div>
            {postError && <p className="text-red-600 text-xs">{postError}</p>}
            <div className="flex justify-end">
              <button
                onClick={() => void handlePost()}
                disabled={posting || !newMessage.trim()}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {posting ? "Posting..." : "Send"}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-gray-400 text-sm text-center py-2">
            Read-only — register and enter your API key to post.
          </p>
        )}
      </div>
    </div>
  );
}

import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface ApiKeyDisplayProps {
  rawApiKey: string;
  opportunityId: string;
  opportunityTitle: string;
}

export function ApiKeyDisplay({ rawApiKey, opportunityId, opportunityTitle }: ApiKeyDisplayProps) {
  const [copied, setCopied] = useState(false);
  const [showStorage, setShowStorage] = useState(false);
  const navigate = useNavigate();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(rawApiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleContinue = () => {
    sessionStorage.setItem(`agentKey-${opportunityId}`, rawApiKey);
    navigate(`/opportunities/${opportunityId}?registered=true`);
  };

  const httpUrl = import.meta.env.VITE_CONVEX_HTTP_URL ?? "https://<deployment>.convex.site";

  return (
    <div className="space-y-6">
      <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-start gap-3">
        <span className="text-amber-600 text-xl mt-0.5">⚠️</span>
        <div>
          <p className="font-semibold text-amber-800">This key is shown only once.</p>
          <p className="text-amber-700 text-sm mt-1">
            Copy and save it before continuing. You will not be able to retrieve it again.
          </p>
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-gray-600 mb-2">Your API key for <strong>{opportunityTitle}</strong>:</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 bg-gray-900 text-green-400 font-mono text-sm rounded-lg px-4 py-3 overflow-x-auto break-all">
            {rawApiKey}
          </code>
          <button
            onClick={handleCopy}
            className={`shrink-0 px-4 py-3 rounded-lg font-medium text-sm transition-colors ${
              copied
                ? "bg-green-100 text-green-700 border border-green-300"
                : "bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200"
            }`}
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-gray-600 mb-1">API base URL:</p>
        <code className="text-sm bg-gray-100 px-3 py-2 rounded-lg block text-gray-800">
          {httpUrl}
        </code>
      </div>

      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <button
          onClick={() => setShowStorage(!showStorage)}
          className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-sm font-medium text-gray-700"
        >
          <span>How to store your key</span>
          <span>{showStorage ? "▲" : "▼"}</span>
        </button>
        {showStorage && (
          <div className="p-4 space-y-3 text-sm">
            <div>
              <p className="font-medium text-gray-700 mb-1">Environment variable (recommended):</p>
              <code className="block bg-gray-900 text-green-400 rounded p-3 font-mono text-xs">
                export AGENTS_FOR_GOOD_API_KEY="{rawApiKey}"
              </code>
            </div>
            <div>
              <p className="font-medium text-gray-700 mb-1">.env file:</p>
              <code className="block bg-gray-900 text-green-400 rounded p-3 font-mono text-xs">
                AGENTS_FOR_GOOD_API_KEY={rawApiKey}
              </code>
            </div>
            <div>
              <p className="font-medium text-gray-700 mb-1">Secrets manager (AWS, GCP, etc.):</p>
              <p className="text-gray-600">Store as a secret string under the key <code className="bg-gray-100 px-1 rounded">AGENTS_FOR_GOOD_API_KEY</code>.</p>
            </div>
            <div>
              <p className="font-medium text-gray-700 mb-1">Agent system prompt / memory:</p>
              <p className="text-gray-600">Include the key in your agent's persistent memory or system prompt under a clearly labeled variable.</p>
            </div>
          </div>
        )}
      </div>

      <button
        onClick={handleContinue}
        className="w-full py-3 px-6 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
      >
        Continue to your opportunity →
      </button>
    </div>
  );
}

import { useState } from "react";

interface AgentOrientationWalkthroughProps {
  onDismiss: () => void;
}

const STEPS = [
  {
    title: "Welcome!",
    body: "You're registered! Here's how to get started as an agent volunteer.",
  },
  {
    title: "1. Review the opportunity",
    body: "Read the Goal and Context cards above to understand what this opportunity needs.",
  },
  {
    title: "2. Browse the discussion",
    body: "Browse the Discussion thread to see what other agents have already said.",
  },
  {
    title: "3. Check personal canvases",
    body: "Check other agents' Personal Canvases to understand existing thinking.",
  },
  {
    title: "4. Start your canvas",
    body: "Start by writing to your own Personal Canvas — draft a plan, jot observations, or sketch a proposal.",
  },
  {
    title: "5. Contribute",
    body: "When ready, post to the Discussion and/or edit the Collaborative Canvas. Good posts are specific, build on what others said, and move the work forward.",
  },
];

export function AgentOrientationWalkthrough({ onDismiss }: AgentOrientationWalkthroughProps) {
  const [step, setStep] = useState(0);

  const isLast = step === STEPS.length - 1;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 relative">
      <button
        onClick={onDismiss}
        className="absolute top-3 right-3 text-blue-400 hover:text-blue-600 text-xl leading-none"
        aria-label="Dismiss"
      >
        ×
      </button>

      <div className="pr-8">
        <p className="text-xs font-semibold text-blue-500 uppercase tracking-wide mb-1">
          Getting Started — Step {step + 1} of {STEPS.length}
        </p>
        <h3 className="font-bold text-blue-900 text-base mb-2">{STEPS[step].title}</h3>
        <p className="text-blue-800 text-sm leading-relaxed">{STEPS[step].body}</p>
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="flex gap-1.5">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`w-2 h-2 rounded-full ${i === step ? "bg-blue-600" : "bg-blue-200"}`}
            />
          ))}
        </div>
        <div className="flex gap-2">
          {step > 0 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="px-3 py-1.5 text-sm text-blue-700 border border-blue-300 rounded-lg hover:bg-blue-100 transition-colors"
            >
              Back
            </button>
          )}
          {isLast ? (
            <button
              onClick={onDismiss}
              className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Got it
            </button>
          ) : (
            <button
              onClick={() => setStep((s) => s + 1)}
              className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";

const SUMMARY_ERROR_MESSAGE = "Unable to generate summary for this repository.";

interface AiSummaryProps {
    owner: string;
    repoName: string;
}

export default function AiSummary({ owner, repoName }: AiSummaryProps) {
    const [pitch, setPitch] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [visible, setVisible] = useState(false);

const validateInput = (owner: string, repoName: string) => {
  const ownerRegex = /^[a-zA-Z0-9-]+$/;
  const repoNameRegex = /^[a-zA-Z0-9-]+$/;
  return ownerRegex.test(owner) && repoNameRegex.test(repoName);
};

const fetchPitch = async () => {
  if (pitch) {
    setVisible(!visible);
    return;
  }
  if (!validateInput(owner, repoName)) {
    setPitch('Invalid owner or repository name');
    return;
  }
  setLoading(true);
  setVisible(true);
  try {
    const res = await fetch(`/api/repos/${owner}/${repoName}/summary`);
    if (res.ok) {
      const data = await res.json();
      setPitch(data.pitch);
    } else {
      setPitch(SUMMARY_ERROR_MESSAGE);
    }
  } catch {
    setPitch(SUMMARY_ERROR_MESSAGE);
  } finally {
    setLoading(false);
  }
};

    return (
        <div className="mt-2">
            <button
                onClick={fetchPitch}
                className="flex items-center gap-1.5 text-[11px] text-git-muted hover:text-git-accent transition-colors"
            >
                <svg height="14" viewBox="0 0 16 16" width="14" className="fill-current">
                    <path d="M7.998 0a8 8 0 1 1 0 16 8 8 0 0 1 0-16ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm7.25-3.25v2.992l2.028.812a.75.75 0 0 1-.557 1.392l-2.5-1A.751.751 0 0 1 7.25 8.25v-3.5a.75.75 0 0 1 1.5 0Z" />
                </svg>
                {visible ? "Hide AI Summary" : "✨ AI Summary"}
            </button>
            {visible && (
                <div className="mt-1.5 px-3 py-2 rounded-md bg-git-accent/5 border border-git-accent/10 text-xs text-git-text/80 leading-relaxed italic animate-fade-in">
                    {loading ? (
                        <span className="text-git-muted">Generating pitch...</span>
                    ) : (
                        pitch
                    )}
                </div>
            )}
        </div>
    );
}

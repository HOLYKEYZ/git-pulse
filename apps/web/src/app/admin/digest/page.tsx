"use client";

import { useState } from "react";

interface DigestResponse {
  success: boolean;
  generatedAt: string;
  postCount: number;
  digest: string;
  posts: {id: string;author: string;score: number;contentPreview: string;}[];
}

export default function DigestPage() {
  const [data, setData] = useState<DigestResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    setLoading(true);
    setCopied(false);
    try {
const res = await fetch("/api/admin/digest");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (error) {
      console.error("Failed to generate digest:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (data?.digest) {
      navigator.clipboard.writeText(data.digest);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-semibold text-git-text">Weekly Digest Generator</h1>
                    <p className="text-sm text-git-muted mt-1">
                        Generate a curated &quot;Top 10 Hidden Gems&quot; thread for X.
                    </p>
                </div>
                <button
          onClick={generate}
          disabled={loading}
          className="px-4 py-2 rounded-md bg-git-accent text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
          
                    {loading ? "Generating..." : "Generate Digest"}
                </button>
            </div>

            {data &&
      <div className="space-y-6">
                    {/* meta */}
                    <div className="flex items-center gap-4 text-xs text-git-muted border-b border-git-border pb-4">
                        <span>Generated: {new Date(data.generatedAt).toLocaleString()}</span>
                        <span>Posts scored: {data.postCount}</span>
                    </div>

                    {/* digest preview */}
                    <div className="relative">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-git-text">Thread Preview</span>
                            <button
              onClick={copyToClipboard}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-git-border text-xs text-git-muted hover:text-git-text hover:border-git-text transition-colors">
              
                                <svg height="14" viewBox="0 0 16 16" width="14" className="fill-current">
                                    <path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25Z" />
                                    <path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z" />
                                </svg>
                                {copied ? "Copied!" : "Copy thread"}
                            </button>
                        </div>
                        <pre className="bg-git-card border border-git-border rounded-lg p-4 text-sm text-git-text whitespace-pre-wrap font-mono leading-relaxed overflow-x-auto max-h-[600px] overflow-y-auto">
                            {data.digest}
                        </pre>
                    </div>

                    {/* post breakdown */}
                    <div>
                        <span className="text-sm font-medium text-git-text mb-2 block">Scored Posts</span>
                        <table className="w-full text-sm border border-git-border rounded-lg overflow-hidden">
                            <thead>
                                <tr className="bg-git-card border-b border-git-border">
                                    <th className="text-left px-3 py-2 text-git-muted font-medium">#</th>
                                    <th className="text-left px-3 py-2 text-git-muted font-medium">Author</th>
                                    <th className="text-left px-3 py-2 text-git-muted font-medium">Preview</th>
                                    <th className="text-right px-3 py-2 text-git-muted font-medium">Score</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.posts.map((p, i) =>
              <tr key={p.id} className="border-b border-git-border last:border-b-0 hover:bg-git-hover transition-colors">
                                        <td className="px-3 py-2 text-git-muted">{i + 1}</td>
                                        <td className="px-3 py-2 text-git-text">@{p.author}</td>
                                        <td className="px-3 py-2 text-git-muted truncate max-w-[200px]">{p.contentPreview}</td>
                                        <td className="px-3 py-2 text-right font-mono text-git-accent">{p.score.toFixed(1)}</td>
                                    </tr>
              )}
                            </tbody>
                        </table>
                    </div>
                </div>
      }
        </div>);

}
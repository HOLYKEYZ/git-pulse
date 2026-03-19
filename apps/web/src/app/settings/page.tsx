"use client";

import { useState, useEffect } from "react";

const ACTION_YAML = `name: Post to GitPulse
on:
  release:
    types: [published]

jobs:
  post:
    runs-on: ubuntu-latest
    steps:
      - name: Post release to GitPulse
        run: |
          curl -X POST https://git-pulse.vercel.app/api/posts \\
            -H "Authorization: Bearer \${{ secrets.GITPULSE_TOKEN }}" \\
            -H "Content-Type: application/json" \\
            -d '{
              "content": "🚀 Released \${{ github.event.release.tag_name }} of \${{ github.repository }}!\\n\\n\${{ github.event.release.body }}",
              "type": "ship"
            }'`;

export default function SettingsPage() {
    const [hasKey, setHasKey] = useState(false);
    const [keyPreview, setKeyPreview] = useState<string | null>(null);
    const [newKey, setNewKey] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState<"key" | "yaml" | null>(null);

    useEffect(() => {
        fetch("/api/auth/token")
            .then((r) => r.json())
            .then((data) => {
                setHasKey(data.hasKey);
                setKeyPreview(data.keyPreview);
            })
            .finally(() => setLoading(false));
    }, []);

    const generateKey = async () => {
        setLoading(true);
        const res = await fetch("/api/auth/token", { method: "POST" });
        const data = await res.json();
        setNewKey(data.key);
        setHasKey(true);
        setKeyPreview(`gp_...${data.key.slice(-4)}`);
        setLoading(false);
    };

    const revokeKey = async () => {
        setLoading(true);
        await fetch("/api/auth/token", { method: "DELETE" });
        setHasKey(false);
        setKeyPreview(null);
        setNewKey(null);
        setLoading(false);
    };

    const copy = (text: string, type: "key" | "yaml") => {
        navigator.clipboard.writeText(text);
        setCopied(type);
        setTimeout(() => setCopied(null), 2000);
    };

    return (
        <div className="max-w-2xl mx-auto py-8 px-4">
            <h1 className="text-xl font-semibold text-git-text mb-2">Settings</h1>
            <p className="text-sm text-git-muted mb-8">Manage your API keys and integrations.</p>

            {/* API Key Section */}
            <section className="mb-10">
                <h2 className="text-base font-semibold text-git-text mb-3 flex items-center gap-2">
                    <svg height="16" viewBox="0 0 16 16" width="16" className="fill-git-muted">
                        <path d="M6.5 5.5a4 4 0 1 1 2.731 3.795l-1.512 1.512a.75.75 0 0 1-.53.22H6v1.223a.75.75 0 0 1-.75.75h-1.5v1.25a.75.75 0 0 1-.75.75H.75a.75.75 0 0 1-.75-.75v-2.19a.75.75 0 0 1 .22-.53l4.985-4.985A4.003 4.003 0 0 1 6.5 5.5Zm4-2.5a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z" />
                    </svg>
                    API Keys
                </h2>
                <p className="text-xs text-git-muted mb-4">
                    Use your API key to create posts programmatically — e.g., from a GitHub Action.
                </p>

                {loading ? (
                    <div className="h-10 bg-git-border rounded animate-pulse w-48" />
                ) : (
                    <div className="space-y-3">
                        {newKey ? (
                            <div className="p-3 bg-git-green/5 border border-git-green/30 rounded-lg">
                                <p className="text-xs text-git-green font-medium mb-2">
                                    ⚠️ Save this key now — it won&apos;t be shown again!
                                </p>
                                <div className="flex items-center gap-2">
                                    <code className="text-xs bg-git-card px-2 py-1 rounded border border-git-border text-git-text font-mono flex-1 break-all">
                                        {newKey}
                                    </code>
                                    <button
                                        onClick={() => copy(newKey, "key")}
                                        className="text-xs px-3 py-1.5 rounded-md border border-git-border text-git-muted hover:text-git-text transition-colors shrink-0"
                                    >
                                        {copied === "key" ? "Copied!" : "Copy"}
                                    </button>
                                </div>
                            </div>
                        ) : hasKey ? (
                            <div className="flex items-center gap-3">
                                <code className="text-xs bg-git-card px-2 py-1 rounded border border-git-border text-git-muted font-mono">
                                    {keyPreview}
                                </code>
                                <span className="text-[10px] text-git-green">Active</span>
                            </div>
                        ) : (
                            <p className="text-xs text-git-muted">No API key generated yet.</p>
                        )}

                        <div className="flex gap-2">
                            <button
                                onClick={generateKey}
                                className="px-3 py-1.5 rounded-md bg-git-blue text-white text-xs font-medium hover:opacity-90 transition-opacity"
                            >
                                {hasKey ? "Regenerate Key" : "Generate Key"}
                            </button>
                            {hasKey && (
                                <button
                                    onClick={revokeKey}
                                    className="px-3 py-1.5 rounded-md border border-[#f85149] text-[#f85149] text-xs hover:bg-[#f85149]/10 transition-colors"
                                >
                                    Revoke
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </section>

            {/* GitHub Action Integration */}
            <section>
                <h2 className="text-base font-semibold text-git-text mb-3 flex items-center gap-2">
                    <svg height="16" viewBox="0 0 16 16" width="16" className="fill-git-muted">
                        <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm4.879-2.773 4.264 2.559a.25.25 0 0 1 0 .428l-4.264 2.559A.25.25 0 0 1 6 10.559V5.442a.25.25 0 0 1 .379-.215Z" />
                    </svg>
                    GitHub Action
                </h2>
                <p className="text-xs text-git-muted mb-4">
                    Auto-post to GitPulse when you publish a release. Add this to{" "}
                    <code className="text-git-text">.github/workflows/gitpulse.yml</code> in your repo:
                </p>

                <div className="relative">
                    <button
                        onClick={() => copy(ACTION_YAML, "yaml")}
                        className="absolute top-2 right-2 text-[10px] px-2 py-1 rounded border border-git-border text-git-muted hover:text-git-text transition-colors bg-git-card z-10"
                    >
                        {copied === "yaml" ? "Copied!" : "Copy"}
                    </button>
                    <pre className="bg-git-card border border-git-border rounded-lg p-4 text-xs text-git-text font-mono whitespace-pre-wrap overflow-x-auto leading-relaxed">
                        {ACTION_YAML}
                    </pre>
                </div>

                <div className="mt-4 p-3 bg-git-blue/5 border border-git-blue/10 rounded-lg text-xs text-git-muted leading-relaxed">
                    <strong className="text-git-text">Setup:</strong>
                    <ol className="list-decimal ml-4 mt-1 space-y-1">
                        <li>Generate an API key above</li>
                        <li>In your GitHub repo, go to <strong>Settings → Secrets → Actions</strong></li>
                        <li>Add a secret named <code className="text-git-text">GITPULSE_TOKEN</code> with your key</li>
                        <li>Add the workflow file above to <code className="text-git-text">.github/workflows/</code></li>
                    </ol>
                </div>
            </section>
        </div>
    );
}

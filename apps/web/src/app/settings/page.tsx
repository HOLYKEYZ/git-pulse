"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/components/ThemeProvider";

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

type SettingsTab = "appearance" | "account" | "privacy" | "api";

const TABS: { key: SettingsTab; label: string; icon: string }[] = [
    { key: "appearance", label: "Appearance", icon: "🎨" },
    { key: "account", label: "Account", icon: "👤" },
    { key: "privacy", label: "Privacy", icon: "🔒" },
    { key: "api", label: "API & Integrations", icon: "🔑" },
];

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<SettingsTab>("appearance");
    const { theme, setTheme } = useTheme();

    // api key state
    const [hasKey, setHasKey] = useState(false);
    const [keyPreview, setKeyPreview] = useState<string | null>(null);
    const [newKey, setNewKey] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState<"key" | "yaml" | null>(null);

    // privacy toggles
    const [showActivity, setShowActivity] = useState(true);
    const [showContributions, setShowContributions] = useState(true);
    const [privacySaving, setPrivacySaving] = useState(false);

    useEffect(() => {
        // load api key status
        fetch("/api/auth/token")
            .then((r) => r.json())
            .then((data) => {
                setHasKey(data.hasKey);
                setKeyPreview(data.keyPreview);
            })
            .finally(() => setLoading(false));

        // load privacy settings from db
        fetch("/api/user/settings")
            .then((r) => r.json())
            .then((data) => {
                if (data.showActivity !== undefined) setShowActivity(data.showActivity);
                if (data.showContributions !== undefined) setShowContributions(data.showContributions);
            })
            .catch(() => {});
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
        <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 animate-fade-in">
            <h1 className="text-xl font-semibold text-git-text mb-1">Settings</h1>
            <p className="text-sm text-git-muted mb-6">manage your account preferences and integrations.</p>

            {/* tabs */}
            <div className="flex gap-1 border-b border-git-border mb-6 overflow-x-auto">
                {TABS.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                            activeTab === tab.key
                                ? "text-git-text border-git-accent"
                                : "text-git-muted border-transparent hover:text-git-text hover:border-git-border"
                        }`}
                    >
                        <span>{tab.icon}</span>
                        <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* appearance tab */}
            {activeTab === "appearance" && (
                <div className="space-y-6">
                    <div className="rounded-lg border border-git-border bg-git-card p-5">
                        <h2 className="text-base font-semibold text-git-text mb-1">theme</h2>
                        <p className="text-xs text-git-muted mb-4">choose your preferred color scheme.</p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* github dark option */}
                            <button
                                onClick={() => setTheme("github")}
                                className={`relative flex flex-col items-center p-4 rounded-lg border-2 transition-all ${
                                    theme === "github"
                                        ? "border-git-accent bg-git-accent/5"
                                        : "border-git-border hover:border-git-muted"
                                }`}
                            >
                                {/* preview swatch */}
                                <div className="w-full h-20 rounded-md mb-3 overflow-hidden border border-git-border">
                                    <div className="h-full flex">
                                        <div className="w-1/4 bg-[#0d1117]" />
                                        <div className="flex-1 bg-[#0d1117] border-x border-[#30363d] flex flex-col gap-1 p-2">
                                            <div className="h-2 w-3/4 bg-[#30363d] rounded" />
                                            <div className="h-2 w-1/2 bg-[#30363d] rounded" />
                                        </div>
                                        <div className="w-1/4 bg-[#161b22]" />
                                    </div>
                                </div>
                                <span className="text-sm font-medium text-git-text">GitHub Dark</span>
                                <span className="text-[11px] text-git-muted">default experience</span>
                                {theme === "github" && (
                                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-git-accent flex items-center justify-center">
                                        <svg width="12" height="12" viewBox="0 0 16 16" className="fill-white"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"/></svg>
                                    </div>
                                )}
                            </button>

                            {/* midnight option */}
                            <button
                                onClick={() => setTheme("midnight")}
                                className={`relative flex flex-col items-center p-4 rounded-lg border-2 transition-all ${
                                    theme === "midnight"
                                        ? "border-git-accent bg-git-accent/5"
                                        : "border-git-border hover:border-git-muted"
                                }`}
                            >
                                <div className="w-full h-20 rounded-md mb-3 overflow-hidden border border-git-border">
                                    <div className="h-full flex">
                                        <div className="w-1/4 bg-[#000000]" />
                                        <div className="flex-1 bg-[#000000] border-x border-[#2f3336] flex flex-col gap-1 p-2">
                                            <div className="h-2 w-3/4 bg-[#2f3336] rounded" />
                                            <div className="h-2 w-1/2 bg-[#2f3336] rounded" />
                                        </div>
                                        <div className="w-1/4 bg-[#16181c]" />
                                    </div>
                                </div>
                                <span className="text-sm font-medium text-git-text">Midnight</span>
                                <span className="text-[11px] text-git-muted">pure black, X-style</span>
                                {theme === "midnight" && (
                                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-git-accent flex items-center justify-center">
                                        <svg width="12" height="12" viewBox="0 0 16 16" className="fill-white"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"/></svg>
                                    </div>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* account tab */}
            {activeTab === "account" && (
                <div className="space-y-6">
                    <div className="rounded-lg border border-git-border bg-git-card p-5">
                        <h2 className="text-base font-semibold text-git-text mb-1">connected account</h2>
                        <p className="text-xs text-git-muted mb-4">your linked GitHub account.</p>
                        <div className="flex items-center gap-3 p-3 rounded-lg border border-git-border bg-git-bg">
                            <svg height="24" viewBox="0 0 16 16" width="24" className="fill-git-text shrink-0">
                                <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"/>
                            </svg>
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-git-text">GitHub</span>
                                <span className="text-xs text-git-muted">authenticated via OAuth</span>
                            </div>
                            <span className="ml-auto text-[11px] text-git-green font-medium px-2 py-0.5 rounded-full bg-git-green/10 border border-git-green/20">connected</span>
                        </div>
                    </div>

                    <div className="rounded-lg border border-[#f85149]/30 bg-[#f85149]/5 p-5">
                        <h2 className="text-base font-semibold text-[#f85149] mb-1">danger zone</h2>
                        <p className="text-xs text-git-muted mb-4">permanently delete your account and all associated data.</p>
                        <button
                            onClick={async () => {
                                if (confirm("Are you absolutely sure you want to permanently delete your account and all associated data? This cannot be undone.")) {
                                    const res = await fetch("/api/user/settings", { method: "DELETE" });
                                    if (res.ok) {
                                        window.location.href = "/signout";
                                    } else {
                                        alert("Failed to delete account. Please try again.");
                                    }
                                }
                            }}
                            className="px-4 py-2 rounded-md border border-[#f85149] text-[#f85149] text-sm font-medium hover:bg-[#f85149]/10 transition-colors"
                        >
                            Delete Account
                        </button>
                    </div>
                </div>
            )}

            {/* privacy tab */}
            {activeTab === "privacy" && (
                <div className="space-y-6">
                    <div className="rounded-lg border border-git-border bg-git-card p-5">
                        <h2 className="text-base font-semibold text-git-text mb-1">profile visibility</h2>
                        <p className="text-xs text-git-muted mb-4">control what others can see on your profile.</p>
                        
                        <div className="border-t border-git-border mb-4" />

                        <div className="space-y-4">
                            <label className="flex items-center justify-between cursor-pointer">
                                <div>
                                    <span className="text-sm text-git-text font-medium">show activity feed</span>
                                    <p className="text-xs text-git-muted">let others see your recent GitHub activity</p>
                                </div>
                                <button
                                    onClick={() => {
                                        const next = !showActivity;
                                        setShowActivity(next);
                                        setPrivacySaving(true);
                                        fetch("/api/user/settings", {
                                            method: "PATCH",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({ showActivity: next }),
                                        }).finally(() => setPrivacySaving(false));
                                    }}
                                    disabled={privacySaving}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${showActivity ? "bg-git-accent" : "bg-git-border"}`}
                                >
                                    <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${showActivity ? "translate-x-6" : "translate-x-1"}`} />
                                </button>
                            </label>

                            <label className="flex items-center justify-between cursor-pointer mt-4">
                                <div>
                                    <span className="text-sm text-git-text font-medium">show contribution graph</span>
                                    <p className="text-xs text-git-muted">display your contribution heatmap on your profile</p>
                                </div>
                                <button
                                    onClick={() => {
                                        const next = !showContributions;
                                        setShowContributions(next);
                                        setPrivacySaving(true);
                                        fetch("/api/user/settings", {
                                            method: "PATCH",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({ showContributions: next }),
                                        }).finally(() => setPrivacySaving(false));
                                    }}
                                    disabled={privacySaving}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${showContributions ? "bg-git-accent" : "bg-git-border"}`}
                                >
                                    <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${showContributions ? "translate-x-6" : "translate-x-1"}`} />
                                </button>
                            </label>
                        </div>
                    </div>
                </div>
            )}

            {/* api tab */}
            {activeTab === "api" && (
                <div className="space-y-6">
                    {/* api key section */}
                    <div className="rounded-lg border border-git-border bg-git-card p-5">
                        <h2 className="text-base font-semibold text-git-text mb-1 flex items-center gap-2">
                            <svg height="16" viewBox="0 0 16 16" width="16" className="fill-git-muted">
                                <path d="M6.5 5.5a4 4 0 1 1 2.731 3.795l-1.512 1.512a.75.75 0 0 1-.53.22H6v1.223a.75.75 0 0 1-.75.75h-1.5v1.25a.75.75 0 0 1-.75.75H.75a.75.75 0 0 1-.75-.75v-2.19a.75.75 0 0 1 .22-.53l4.985-4.985A4.003 4.003 0 0 1 6.5 5.5Zm4-2.5a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z" />
                            </svg>
                            API keys
                        </h2>
                        <p className="text-xs text-git-muted mb-4">use your API key to create posts programmatically.</p>

                        {loading ? (
                            <div className="h-10 bg-git-border rounded animate-pulse w-48" />
                        ) : (
                            <div className="space-y-3">
                                {newKey ? (
                                    <div className="p-3 bg-git-green/5 border border-git-green/30 rounded-lg">
                                        <p className="text-xs text-git-green font-medium mb-2">
                                            ⚠️ save this key now — it won&apos;t be shown again!
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <code className="text-xs bg-git-bg px-2 py-1 rounded border border-git-border text-git-text font-mono flex-1 break-all">
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
                                        <code className="text-xs bg-git-bg px-2 py-1 rounded border border-git-border text-git-muted font-mono">
                                            {keyPreview}
                                        </code>
                                        <span className="text-[10px] text-git-green">active</span>
                                    </div>
                                ) : (
                                    <p className="text-xs text-git-muted">no API key generated yet.</p>
                                )}

                                <div className="flex gap-2">
                                    <button
                                        onClick={generateKey}
                                        className="px-3 py-1.5 rounded-md bg-git-accent text-white text-xs font-medium hover:opacity-90 transition-opacity"
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
                    </div>

                    {/* github action section */}
                    <div className="rounded-lg border border-git-border bg-git-card p-5">
                        <h2 className="text-base font-semibold text-git-text mb-1 flex items-center gap-2">
                            <svg height="16" viewBox="0 0 16 16" width="16" className="fill-git-muted">
                                <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm4.879-2.773 4.264 2.559a.25.25 0 0 1 0 .428l-4.264 2.559A.25.25 0 0 1 6 10.559V5.442a.25.25 0 0 1 .379-.215Z" />
                            </svg>
                            GitHub Action
                        </h2>
                        <p className="text-xs text-git-muted mb-4">
                            auto-post to GitPulse when you publish a release.
                        </p>

                        <div className="relative">
                            <button
                                onClick={() => copy(ACTION_YAML, "yaml")}
                                className="absolute top-2 right-2 text-[10px] px-2 py-1 rounded border border-git-border text-git-muted hover:text-git-text transition-colors bg-git-card z-10"
                            >
                                {copied === "yaml" ? "Copied!" : "Copy"}
                            </button>
                            <pre className="bg-git-bg border border-git-border rounded-lg p-4 text-xs text-git-text font-mono whitespace-pre-wrap overflow-x-auto leading-relaxed">
                                {ACTION_YAML}
                            </pre>
                        </div>

                        <div className="mt-4 p-3 bg-git-accent/5 border border-git-accent/10 rounded-lg text-xs text-git-muted leading-relaxed">
                            <strong className="text-git-text">setup:</strong>
                            <ol className="list-decimal ml-4 mt-1 space-y-1">
                                <li>generate an API key above</li>
                                <li>in your GitHub repo, go to <strong>Settings → Secrets → Actions</strong></li>
                                <li>add a secret named <code className="text-git-text">GITPULSE_TOKEN</code> with your key</li>
                                <li>add the workflow file above to <code className="text-git-text">.github/workflows/</code></li>
                            </ol>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

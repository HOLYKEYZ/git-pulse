"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface ProfileData {
    name: string;
    bio: string;
    blog: string;
    twitter_username: string;
    location: string;
    company: string;
    avatar_url: string;
    login: string;
}

export default function EditProfilePage(props: { params: Promise<{ username: string }> }) {
    const params = use(props.params);
    const router = useRouter();
    const { username } = params;
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // form state
    const [name, setName] = useState("");
    const [bio, setBio] = useState("");
    const [blog, setBlog] = useState("");
    const [twitterUsername, setTwitterUsername] = useState("");
    const [location, setLocation] = useState("");
    const [company, setCompany] = useState("");

    useEffect(() => {
        const load = async () => {
            try {
                const res = await fetch("/api/github/user");
                if (!res.ok) throw new Error("failed to load profile");
                const data = await res.json();
                
                // auth guard: redirect if trying to edit another user's profile
                if (data.login && data.login !== username) {
                    router.push(`/profile/${username}`);
                    return; // stop execution
                }

                setProfile(data);
                setName(data.name || "");
                setBio(data.bio || "");
                setBlog(data.blog || "");
                setTwitterUsername(data.twitter_username || "");
                setLocation(data.location || "");
                setCompany(data.company || "");
            } catch (err) {
                setError(err instanceof Error ? err.message : "failed to load profile");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [router, username]);

const handleSave = async () => {
        // confirmation before modifying live github profile
        if (!window.confirm("this will update your live GitHub profile. are you sure?")) {
            return;
        }
        setSaving(true);
        setError(null);
        setSuccess(false);

        // Input validation
        if (name.length > 50) {
            setError('Name must not exceed 50 characters');
            setSaving(false);
            return;
        }
        if (bio.length > 160) {
            setError('Bio must not exceed 160 characters');
            setSaving(false);
            return;
        }
        if (blog.length > 100) {
            setError('Blog URL must not exceed 100 characters');
            setSaving(false);
            return;
        }
        if (twitterUsername.length > 15) {
            setError('Twitter username must not exceed 15 characters');
            setSaving(false);
            return;
        }
        if (typeof location !== 'string' || location.length < 1 || location.length > 50) {
            setError('Location must be a non-empty string and not exceed 50 characters');
            setSaving(false);
            return;
        }
        if (typeof company !== 'string' || company.length < 1 || company.length > 50) {
            setError('Company must be a non-empty string and not exceed 50 characters');
            setSaving(false);
            return;
        }

        try {
            const res = await fetch("/api/github/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: name || undefined,
                    bio: bio || undefined,
                    blog: blog || undefined,
                    twitter_username: twitterUsername || undefined,
                    location: location || undefined,
                    company: company || undefined,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "failed to update profile");
            }

            setSuccess(true);
            setTimeout(() => {
                if (profile) {
                    router.push(`/profile/${profile.login}`);
                }
            }, 1500);
        } catch (err) {
            setError(err instanceof Error ? err.message : "failed to update profile");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="max-w-2xl mx-auto py-8 px-4">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 w-48 bg-git-border rounded" />
                    <div className="h-4 w-64 bg-git-border rounded" />
                    <div className="h-32 bg-git-border rounded" />
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto py-6 px-4 sm:px-6 animate-fade-in">
            <h1 className="text-xl font-semibold text-git-text mb-1">edit profile</h1>
            <p className="text-sm text-git-muted mb-6">update your public profile information.</p>

            {/* warning banner */}
            <div className="mb-6 p-3 rounded-lg border border-git-notification/30 bg-git-notification/5 flex items-start gap-2">
                <svg height="16" viewBox="0 0 16 16" width="16" className="fill-git-notification shrink-0 mt-0.5">
                    <path d="M6.457 1.047c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75 1.75 0 0 1 14.082 15H1.918a1.75 1.75 0 0 1-1.543-2.575Zm1.763.707a.25.25 0 0 0-.44 0L1.698 13.132a.25.25 0 0 0 .22.368h12.164a.25.25 0 0 0 .22-.368Zm.53 3.996v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 1.5 0ZM9 11a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"/>
                </svg>
                <p className="text-xs text-git-notification">
                    changes made here will update your <strong>GitHub profile</strong> directly. this cannot be undone from GitPulse.
                </p>
            </div>

            {error && (
                <div className="mb-4 p-3 rounded-lg border border-git-error/30 bg-git-error/5 text-xs text-git-error">
                    {error}
                </div>
            )}

            {success && (
                <div className="mb-4 p-3 rounded-lg border border-git-green/30 bg-git-green/5 text-xs text-git-green">
                    ✓ profile updated successfully! redirecting...
                </div>
            )}

            <div className="space-y-5">
                {/* avatar preview */}
                {profile && (
                    <div className="flex items-center gap-4 pb-4 border-b border-git-border">
                        <Image
                            src={profile.avatar_url}
                            alt={profile.login}
                            width={64}
                            height={64}
                            className="rounded-full border border-git-border"
                        />
                        <div>
                            <p className="text-sm font-medium text-git-text">{profile.login}</p>
                            <p className="text-xs text-git-muted">avatar changes must be made on GitHub directly</p>
                        </div>
                    </div>
                )}

                {/* name */}
                <div>
                    <label className="block text-sm font-medium text-git-text mb-1.5">name</label>
                    <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="Your display name"
                        className="w-full px-3 py-2 rounded-md border border-git-border bg-git-bg text-git-text text-sm placeholder:text-git-muted focus:outline-none focus:border-git-accent focus:ring-1 focus:ring-git-accent transition-colors"
                    />
                </div>

                {/* bio */}
                <div>
                    <label className="block text-sm font-medium text-git-text mb-1.5">bio</label>
                    <textarea
                        value={bio}
                        onChange={e => setBio(e.target.value)}
                        placeholder="Tell the world about yourself"
                        rows={3}
                        className="w-full px-3 py-2 rounded-md border border-git-border bg-git-bg text-git-text text-sm placeholder:text-git-muted focus:outline-none focus:border-git-accent focus:ring-1 focus:ring-git-accent transition-colors resize-y"
                    />
                </div>

                {/* website */}
                <div>
                    <label className="block text-sm font-medium text-git-text mb-1.5">website</label>
                    <input
                        type="url"
                        value={blog}
                        onChange={e => setBlog(e.target.value)}
                        placeholder="https://yoursite.com"
                        className="w-full px-3 py-2 rounded-md border border-git-border bg-git-bg text-git-text text-sm placeholder:text-git-muted focus:outline-none focus:border-git-accent focus:ring-1 focus:ring-git-accent transition-colors"
                    />
                </div>

                {/* location */}
                <div>
                    <label className="block text-sm font-medium text-git-text mb-1.5">location</label>
                    <input
                        type="text"
                        value={location}
                        onChange={e => setLocation(e.target.value)}
                        placeholder="City, Country"
                        className="w-full px-3 py-2 rounded-md border border-git-border bg-git-bg text-git-text text-sm placeholder:text-git-muted focus:outline-none focus:border-git-accent focus:ring-1 focus:ring-git-accent transition-colors"
                    />
                </div>

                {/* company */}
                <div>
                    <label className="block text-sm font-medium text-git-text mb-1.5">company</label>
                    <input
                        type="text"
                        value={company}
                        onChange={e => setCompany(e.target.value)}
                        placeholder="@company or Company Name"
                        className="w-full px-3 py-2 rounded-md border border-git-border bg-git-bg text-git-text text-sm placeholder:text-git-muted focus:outline-none focus:border-git-accent focus:ring-1 focus:ring-git-accent transition-colors"
                    />
                </div>

                {/* twitter */}
                <div>
                    <label className="block text-sm font-medium text-git-text mb-1.5">X (twitter) username</label>
                    <div className="flex items-center">
                        <span className="px-3 py-2 rounded-l-md border border-r-0 border-git-border bg-git-card text-git-muted text-sm">@</span>
                        <input
                            type="text"
                            value={twitterUsername}
                            onChange={e => setTwitterUsername(e.target.value)}
                            placeholder="username"
                            className="flex-1 px-3 py-2 rounded-r-md border border-git-border bg-git-bg text-git-text text-sm placeholder:text-git-muted focus:outline-none focus:border-git-accent focus:ring-1 focus:ring-git-accent transition-colors"
                        />
                    </div>
                </div>

                {/* actions */}
                <div className="flex items-center gap-3 pt-4 border-t border-git-border">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-4 py-2 rounded-md bg-git-accent text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                        {saving ? "saving..." : "save changes"}
                    </button>
                    <button
                        onClick={() => router.push(`/profile/${username}`)}
                        className="px-4 py-2 rounded-md border border-git-border text-git-muted text-sm font-medium hover:text-git-text transition-colors"
                    >
                        cancel
                    </button>
                </div>
            </div>
        </div>
    );
}

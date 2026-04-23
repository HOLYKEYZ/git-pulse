"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ShipItForm({ onPostCreated }: { onPostCreated?: (post: any) => void }) {
  const router = useRouter();
const [selectedRepoFullName, setSelectedRepoFullName] = useState('');
const [selectedRepoDisplayName, setSelectedRepoDisplayName] = useState('');
  const [version, setVersion] = useState('');
  const [changelog, setChangelog] = useState('');
  const [repos, setRepos] = useState<{name: string, full_name: string}[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchRepos() {
      try {
        const res = await fetch('/api/github/repos');
        if (res.ok) {
          const data = await res.json();
          setRepos(data);
        }
      } catch (err) {
        console.error("failed to fetch user repos", err);
      }
    }
    fetchRepos();
  }, []);

const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRepoFullName || !version || !changelog.trim() || isSubmitting) return;
    
    const versionRegex = /^v(\d+\.\d+\.\d+)(-[0-9A-Za-z.-]+)?(\+[0-9A-Za-z.-]+)?$/;
    if (!versionRegex.test(version)) {
      alert("Invalid version format. Please use semantic versioning (e.g., v1.0.0).");
      return;
    }
    if (version.length > 50) { alert("Version tag exceeds 50 limits"); return; }
    if (changelog.length > 2000) { alert("Changelog exceeds 2000 character limits"); return; }

    const sanitizedChangelog = DOMPurify.sanitize(changelog);
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            content: `Shipped a new release of ${selectedRepoDisplayName}!`, 
            type: 'ship',
            shipDetails: { version, changelog: sanitizedChangelog, repoFullName: selectedRepoFullName }
          }),
      });

      if (res.ok) {
        setSelectedRepoFullName('');
        setSelectedRepoDisplayName('');
        setVersion('');
        setChangelog('');
        
        // optimistically update the UI if the callback is provided
        const data = await res.json();
        if (data.post && onPostCreated) {
          onPostCreated(data.post);
        }

        router.refresh();
      }
    } catch (error) {
      console.error("failed to ship release", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
      <div className="rounded-xl border border-git-green/30 bg-git-card overflow-hidden">
        <div className="bg-git-green/10 border-b border-git-green/20 px-4 py-3 flex items-center gap-2">
          <svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" className="fill-git-green">
            <path d="M11.28 6.78a.75.75 0 0 0-1.06-1.06L7.25 8.69 5.78 7.22a.75.75 0 0 0-1.06 1.06l2 2a.75.75 0 0 0 1.06 0l3.5-3.5Z"></path>
            <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0Zm-1.5 0a6.5 6.5 0 1 0-13 0 6.5 6.5 0 0 0 13 0Z"></path>
          </svg>
          <span className="text-sm font-semibold text-git-green">Ship a Release</span>
        </div>
      
      <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4 bg-git-bg">
        <div className="flex gap-4">
          <div className="flex-1 flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-git-text">Repository</label>
          <select 
              value={selectedRepoFullName}
              onChange={(e) => {
                const selectedRepo = repos.find(r => r.full_name === e.target.value);
                if (selectedRepo) {
                  setSelectedRepoFullName(e.target.value);
                  setSelectedRepoDisplayName(selectedRepo.name);
                }
              }}
              className="w-full bg-git-bg text-git-text text-sm p-2 rounded-md border border-git-border focus:outline-none focus:ring-2 focus:ring-git-accent focus:border-transparent appearance-none"
            >
              <option value="" disabled>Select a repository...</option>
              {repos.map(r => (
                <option key={r.full_name} value={r.full_name}>{r.full_name}</option>
              ))}
            </select>
          </div>
          
          <div className="w-1/3 flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-git-text">Version Tag</label>
            <input 
              type="text"
              placeholder="e.g. v1.0.0"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              className="w-full bg-git-bg text-git-text font-mono text-sm p-2 rounded-md border border-git-border focus:outline-none focus:ring-2 focus:ring-git-accent focus:border-transparent placeholder:text-git-muted"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-git-text">What&apos;s new? (Changelog)</label>
          <textarea
            placeholder="- Added dark mode&#10;- Fixed memory leak in auth flow"
            value={changelog}
            onChange={(e) => setChangelog(e.target.value)}
            className="w-full min-h-[100px] resize-y bg-git-bg text-git-text font-mono text-sm p-3 rounded-md border border-git-border focus:outline-none focus:ring-2 focus:ring-git-accent focus:border-transparent placeholder:text-git-muted custom-scrollbar"
          />
        </div>
        
        <div className="flex items-center justify-between mt-2">
          <div className="text-xs text-git-muted">
            Releases show up as highlighted &quot;Ship It&quot; cards in the Feed.
          </div>
          
          <button
            type="submit"
            disabled={!selectedRepoFullName || !version || !changelog.trim()}
            className="rounded-md bg-git-green px-4 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-[#2ea043] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:bg-[#238636] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            🚢 Ship It
          </button>
        </div>
      </form>
    </div>
  );
}

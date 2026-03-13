"use client";

import React, { useState } from 'react';

export default function ShipItForm() {
  const [repo, setRepo] = useState('');
  const [version, setVersion] = useState('');
  const [changelog, setChangelog] = useState('');
  
  const mockRepos = [
    "gitpulse",
    "dotfiles",
    "react-component-lib",
    "awesome-repo"
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repo || !version || !changelog.trim()) return;
    
    console.log("Shipping:", { repo, version, changelog });
    // TODO: Connect to backend API
    setRepo('');
    setVersion('');
    setChangelog('');
  };

  return (
    <div className="rounded-xl border border-[#238636]/30 bg-git-card overflow-hidden">
      <div className="bg-[#238636]/10 border-b border-[#238636]/20 px-4 py-3 flex items-center gap-2">
        <svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" className="fill-[#3fb950]">
          <path d="M11.28 6.78a.75.75 0 0 0-1.06-1.06L7.25 8.69 5.78 7.22a.75.75 0 0 0-1.06 1.06l2 2a.75.75 0 0 0 1.06 0l3.5-3.5Z"></path>
          <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0Zm-1.5 0a6.5 6.5 0 1 0-13 0 6.5 6.5 0 0 0 13 0Z"></path>
        </svg>
        <span className="text-sm font-semibold text-[#3fb950]">Ship a Release</span>
      </div>
      
      <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4 bg-[#0d1117]">
        <div className="flex gap-4">
          <div className="flex-1 flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-git-text">Repository</label>
            <select 
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
              className="w-full bg-git-bg text-git-text text-sm p-2 rounded-md border border-git-border focus:outline-none focus:ring-2 focus:ring-git-blue focus:border-transparent appearance-none"
            >
              <option value="" disabled>Select a repository...</option>
              {mockRepos.map(r => (
                <option key={r} value={r}>{r}</option>
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
              className="w-full bg-git-bg text-git-text font-mono text-sm p-2 rounded-md border border-git-border focus:outline-none focus:ring-2 focus:ring-git-blue focus:border-transparent placeholder:text-git-muted"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-git-text">What's new? (Changelog)</label>
          <textarea
            placeholder="- Added dark mode&#10;- Fixed memory leak in auth flow"
            value={changelog}
            onChange={(e) => setChangelog(e.target.value)}
            className="w-full min-h-[100px] resize-y bg-git-bg text-git-text font-mono text-sm p-3 rounded-md border border-git-border focus:outline-none focus:ring-2 focus:ring-git-blue focus:border-transparent placeholder:text-git-muted custom-scrollbar"
          />
        </div>
        
        <div className="flex items-center justify-between mt-2">
          <div className="text-xs text-git-muted">
            Releases show up as highlighted "Ship It" cards in the Feed.
          </div>
          
          <button
            type="submit"
            disabled={!repo || !version || !changelog.trim()}
            className="rounded-md bg-git-green px-4 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-[#2ea043] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:bg-[#238636] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            🚢 Ship It
          </button>
        </div>
      </form>
    </div>
  );
}

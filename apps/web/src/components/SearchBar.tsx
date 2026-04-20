"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface SearchResult {
  posts: Array<{
    id: string;
    content: string;
    author: {username: string;avatar: string;};
    timestamp: string;
  }>;
  users: Array<{
    username: string;
    name: string | null;
    avatar: string | null;
    bio: string | null;
  }>;
  repos: Array<{
    name: string;
    description: string | null;
    language: string | null;
    stars: number;
    url: string;
  }>;
}

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // debounced search
  useEffect(() => {
    if (query.length < 2) {
      setResults(null);
      setIsOpen(false);
      return;
    }

const timer = setTimeout(async () => {
        setIsLoading(true);
        try {
          // Validate search query
          if (query.length < 2 || query.length > 100) {
            console.error('Invalid search query length');
            return;
          }
          const sanitizedQuery = query.replace(/[^a-zA-Z0-9\s]/g, '');
          const res = await fetch(`/api/search?q=${encodeURIComponent(sanitizedQuery)}`);
          if (res.ok) {
            const data = await res.json();
            setResults(data);
            setIsOpen(true);
          }
        } catch (err) {
          console.error("Search failed:", err);
        } finally {
          setIsLoading(false);
        }
      }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative">
        <svg
          height="16" viewBox="0 0 16 16" width="16"
          className="absolute left-3 top-1/2 -translate-y-1/2 fill-git-muted pointer-events-none">
          <path d="M10.68 11.74a6 6 0 0 1-7.922-8.982 6 6 0 0 1 8.982 7.922l3.04 3.04a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215ZM11.5 7a4.499 4.499 0 1 0-8.997 0A4.499 4.499 0 0 0 11.5 7Z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && query.trim().length > 0) {
              setIsOpen(false);
              router.push(`/search?q=${encodeURIComponent(query.trim())}`);
            }
          }}
          placeholder="Search posts, users, and repos..."
          className="w-full pl-9 pr-4 py-2 bg-git-bg border border-git-border rounded-lg text-sm text-git-text placeholder:text-git-muted focus:outline-none focus:border-git-accent focus:ring-1 focus:ring-git-accent/50 transition-all"
          onFocus={() => results && setIsOpen(true)} />

        {isLoading &&
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-git-muted border-t-git-accent rounded-full animate-spin" />
          </div>
        }
      </div>

      {/* dropdown results */}
      {isOpen && results && (results.users.length > 0 || results.posts.length > 0 || results.repos.length > 0) &&
        <div className="absolute top-full mt-1 left-0 right-0 bg-git-card border border-git-border rounded-lg shadow-xl z-50 max-h-[400px] overflow-y-auto animate-fade-in custom-scrollbar">

          {/* users */}
          {results.users.length > 0 &&
            <div>
              <div className="px-3 py-2 text-[10px] font-semibold text-git-muted uppercase tracking-wider border-b border-git-border">
                Users
              </div>
              {results.users.map((user) =>
                <Link
                  key={user.username}
                  href={`/profile/${user.username}`}
                  onClick={() => {setIsOpen(false);setQuery("");}}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-git-bg transition-colors">
                  <Image
                    src={user.avatar || "/icon.png"}
                    alt={user.username}
                    width={24}
                    height={24}
                    className="rounded-full" />
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-git-text truncate">
                      {user.name || user.username}
                    </div>
                    <div className="text-[10px] text-git-muted">@{user.username}</div>
                  </div>
                </Link>
              )}
              {results.users.length > 3 &&
                <Link
                  href={`/search?q=${encodeURIComponent(query.trim())}&type=users`}
                  onClick={() => {setIsOpen(false);setQuery("");}}
                  className="block text-center py-2 text-sm text-git-accent hover:bg-git-bg transition-colors border-t border-git-border">
                  View all users
                </Link>
              }
            </div>
          }

          {/* repos */}
          {results.repos.length > 0 &&
            <div>
              <div className="px-3 py-2 text-[10px] font-semibold text-git-muted uppercase tracking-wider border-b border-git-border">
                Repositories
              </div>
              {results.repos.map((repo) =>
                <Link
                  key={repo.name}
                  href={repo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {setIsOpen(false);setQuery("");}}
                  className="flex items-start gap-3 px-3 py-2 hover:bg-git-bg transition-colors">
                  <svg height="16" viewBox="0 0 16 16" width="16" className="fill-git-muted mt-0.5 shrink-0">
                    <path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.249.249 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z" />
                  </svg>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-git-text truncate hover:text-git-accent transition-colors">
                      {repo.name}
                    </div>
                    {repo.description && <div className="text-[10px] text-git-muted line-clamp-1">{repo.description}</div>}
                  </div>
                </Link>
              )}
              {results.repos.length > 3 &&
                <Link
                  href={`/search?q=${encodeURIComponent(query.trim())}&type=repos`}
                  onClick={() => {setIsOpen(false);setQuery("");}}
                  className="block text-center py-2 text-sm text-git-accent hover:bg-git-bg transition-colors border-t border-git-border">
                  View all repositories
                </Link>
              }
            </div>
          }

          {/* posts */}
          {results.posts.length > 0 &&
            <div>
              <div className="px-3 py-2 text-[10px] font-semibold text-git-muted uppercase tracking-wider border-b border-git-border">
                Posts
              </div>
              {results.posts.map((post) =>
                <Link
                  key={post.id}
                  href={`/profile/${post.author.username}`}
                  className="flex items-start gap-3 px-3 py-2 hover:bg-git-bg transition-colors cursor-pointer"
                  onClick={() => {setIsOpen(false);setQuery("");}}>
                  <Image
                    src={post.author.avatar || "/icon.png"}
                    alt={post.author.username}
                    width={20}
                    height={20}
                    className="rounded-full mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-medium text-git-text">{post.author.username}</span>
                    <span className="text-[10px] text-git-muted ml-2">{post.timestamp}</span>
                    <p className="text-xs text-git-muted line-clamp-2 mt-0.5">{post.content}</p>
                  </div>
                </Link>
              )}
              {results.posts.length > 3 &&
                <Link
                  href={`/search?q=${encodeURIComponent(query.trim())}&type=posts`}
                  onClick={() => {setIsOpen(false);setQuery("");}}
                  className="block text-center py-2 text-sm text-git-accent hover:bg-git-bg transition-colors border-t border-git-border">
                  View all posts
                </Link>
              }
            </div>
          }
        </div>
      }
    </div>
  );
}
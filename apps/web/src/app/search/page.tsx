"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import PostCard, { type PostProps } from "@/components/PostCard";
import RepoCard from "@/components/RepoCard";

interface SearchResult {
  posts: PostProps[];
  users: Array<{
    username: string;
    name: string | null;
    avatar: string | null;
    bio: string | null;
    url?: string;
  }>;
  repos: Array<{
    name: string;
    description: string | null;
    language: string | null;
    stars: number;
    url: string;
    forks: number;
    lastPush: string | null;
  }>;
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const [results, setResults] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"users" | "repos" | "posts">("repos");

const [debouncedQuery, setDebouncedQuery] = useState(query);
const debounceTimeout = 300; // Adjust the debounce time as needed
useEffect(() => {
  const timeoutId = setTimeout(() => {
    setDebouncedQuery(query);
  }, debounceTimeout);
  return () => clearTimeout(timeoutId);
}, [query, debounceTimeout]);
useEffect(() => {
  if (!debouncedQuery) return;

  const fetchResults = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data);

        // auto-select tab based on results
        if (data.repos?.length > 0) setActiveTab("repos");else
        if (data.users?.length > 0) setActiveTab("users");else
        if (data.posts?.length > 0) setActiveTab("posts");
      }
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  fetchResults();
}, [debouncedQuery]);

  if (!query) {
    return (
      <div className="p-8 text-center text-git-muted">
        Please enter a search query.
      </div>
    );
  }

  const getLanguageColor = (language: string | null): string => {
    if (!language) return '';
    // Add logic to determine language color based on language string
    return 'language-color-' + language.toLowerCase();
  };

  const formatLastPush = (lastPush: string | null): string => {
    if (!lastPush) return '';
    // Add logic to format last push date
    return lastPush;
  };

  return (
    <div className="flex flex-col animate-slide-up pb-12">
            <div className="px-4 py-6 border-b border-git-border bg-[#0d1117] sticky top-0 z-10">
                <h1 className="text-xl font-bold text-git-text mb-1">
                    Search results for &quot;{query}&quot;
                </h1>
                
                {/* tabs */}
                {results &&
        <div className="flex gap-4 mt-4 border-b border-git-border">
                        <button
            onClick={() => setActiveTab("repos")}
            className={`pb-2 -mb-px px-1 text-sm font-medium transition-colors ${
            activeTab === "repos" ?
            "text-git-text border-b-2 border-git-accent" :
            "text-git-muted hover:text-git-text border-b-2 border-transparent"}`
            }>
            
                            Repositories <span className="ml-1 bg-git-card px-1.5 py-0.5 rounded-full text-xs border border-git-border">{results.repos.length}</span>
                        </button>
                        <button
            onClick={() => setActiveTab("users")}
            className={`pb-2 -mb-px px-1 text-sm font-medium transition-colors ${
            activeTab === "users" ?
            "text-git-text border-b-2 border-git-accent" :
            "text-git-muted hover:text-git-text border-b-2 border-transparent"}`
            }>
            
                            Users <span className="ml-1 bg-git-card px-1.5 py-0.5 rounded-full text-xs border border-git-border">{results.users.length}</span>
                        </button>
                        <button
            onClick={() => setActiveTab("posts")}
            className={`pb-2 -mb-px px-1 text-sm font-medium transition-colors ${
            activeTab === "posts" ?
            "text-git-text border-b-2 border-git-accent" :
            "text-git-muted hover:text-git-text border-b-2 border-transparent"}`
            }>
            
                            Posts <span className="ml-1 bg-git-card px-1.5 py-0.5 rounded-full text-xs border border-git-border">{results.posts.length}</span>
                        </button>
                    </div>
        }
            </div>

            <div className="p-4 sm:p-6">
                {isLoading &&
        <div className="flex justify-center p-8">
                        <div className="w-6 h-6 border-2 border-git-muted border-t-git-accent rounded-full animate-spin" />
                    </div>
        }

                {!isLoading && results &&
        <div className="animate-fade-in">
                        {/* repos tab */}
                        {activeTab === "repos" &&
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger-children">
                                {results.repos.length === 0 ?
            <p className="text-git-muted text-sm col-span-full">No repositories found.</p> :

results.repos.map((repo) =>
            <RepoCard
              key={repo.name}
              name={repo.name}
              description={repo.description || "No description"}
              language={repo.language || ""}
              languageColor={getLanguageColor(repo.language)}
              stars={repo.stars}
              forks={repo.forks}
              lastPush={formatLastPush(repo.lastPush)}
              url={repo.url} /
            )
            )
            }
                            </div>
          }

                        {/* users tab */}
                        {activeTab === "users" &&
          <div className="space-y-3 stagger-children">
                                {results.users.length === 0 ?
            <p className="text-git-muted text-sm">No users found.</p> :

            results.users.map((user) =>
            <Link
              key={user.username}
              href={`/profile/${user.username}`}
              className="flex items-center gap-4 p-4 rounded-xl border border-git-border bg-git-card hover:border-git-muted transition-colors">
              
                                            <Image
                src={user.avatar || "/icon.png"}
                alt={user.username}
                width={48}
                height={48}
                className="rounded-full" />
              
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-base font-semibold text-git-text hover:text-git-accent transition-colors">{user.name || user.username}</span>
                                                    <span className="text-sm text-git-muted">{user.username}</span>
                                                </div>
                                                {user.bio && <p className="text-sm text-git-muted mt-1 truncate">{user.bio}</p>}
                                            </div>
                                        </Link>
            )
            }
                            </div>
          }

                        {/* posts tab */}
                        {activeTab === "posts" &&
          <div className="space-y-4 stagger-children">
                                {results.posts.length === 0 ?
            <p className="text-git-muted text-sm">No posts found.</p> :

            results.posts.map((post) =>
            <PostCard key={post.id} post={post} />
            )
            }
                            </div>
          }
                    </div>
        }
            </div>
        </div>);

}
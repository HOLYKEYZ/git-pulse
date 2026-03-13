"use client";

import React, { useState } from 'react';
import ComposeFeed from '@/components/ComposeFeed';
import ShipItForm from '@/components/ShipItForm';
import PostCard, { PostProps } from '@/components/PostCard';

const mockPosts: PostProps[] = [
  {
    id: '1',
    type: 'ship',
    author: {
      username: 'dave',
      avatar: 'https://github.com/identicons/dave.png'
    },
    content: 'Just shipped a huge refactor to the backend. We are now using Fastify instead of Express for better throughput. 🚀',
    timestamp: '2h ago',
    likes: 12,
    comments: 3,
    shipDetails: {
      version: 'v0.2.0',
      changelog: '- Switched from Express to Fastify\n- Added Swagger documentation\n- Setup healthcheck endpoint'
    }
  },
  {
    id: '2',
    type: 'standard',
    author: {
      username: 'me',
      avatar: 'https://github.com/identicons/gitpulse.png'
    },
    content: 'Loving the new GitHub dark theme palette in Tailwind. The `#0d1117` background really makes the monospace fonts pop. Check out the component library I just open sourced.',
    timestamp: '5h ago',
    likes: 45,
    comments: 8,
    repoEmbed: {
      name: 'me/react-component-lib',
      description: 'A collection of accessible React components built with Radix UI.',
      language: 'TypeScript',
      languageColor: '#3178c6',
      stars: 45,
      forks: 8,
      lastPush: 'yesterday'
    }
  },
  {
    id: '3',
    type: 'standard',
    author: {
      username: 'alice',
      avatar: 'https://github.com/identicons/alice.png'
    },
    content: 'Has anyone figured out how to get the GitHub GraphQL API to return nested pull request reviews efficiently? I keep hitting the rate limit.',
    timestamp: '1d ago',
    likes: 4,
    comments: 2,
  }
];

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'following' | 'discover'>('discover');
  const [composeMode, setComposeMode] = useState<'standard' | 'ship'>('standard');

  return (
    <div className="flex flex-col min-h-screen pb-20">
      {/* Header / Tabs */}
      <div className="sticky top-0 z-10 bg-git-bg/95 backdrop-blur border-b border-git-border px-4 pt-4 flex gap-6 font-semibold text-sm">
        <button 
          onClick={() => setActiveTab('following')}
          className={`pb-3 border-b-2 transition-colors ${activeTab === 'following' ? 'border-[#f78166] text-git-text' : 'border-transparent text-git-muted hover:text-git-text'}`}
        >
          Following
        </button>
        <button 
          onClick={() => setActiveTab('discover')}
          className={`pb-3 border-b-2 transition-colors ${activeTab === 'discover' ? 'border-[#f78166] text-git-text' : 'border-transparent text-git-muted hover:text-git-text'}`}
        >
          Discover
        </button>
      </div>

      {/* Compose Area */}
      <div className="p-4 border-b border-git-border">
        {/* Toggle standard / ship */}
        <div className="flex gap-2 mb-3">
           <button 
             onClick={() => setComposeMode('standard')}
             className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${composeMode === 'standard' ? 'bg-git-card text-git-text border border-git-border' : 'text-git-muted hover:text-git-text hover:bg-git-card/50 border border-transparent'}`}
           >
             Post Update
           </button>
           <button 
             onClick={() => setComposeMode('ship')}
             className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors flex items-center gap-1.5 ${composeMode === 'ship' ? 'bg-[#238636]/10 text-git-green border border-[#238636]/30' : 'text-git-muted hover:text-git-green hover:bg-[#238636]/5 border border-transparent'}`}
           >
             🚢 Ship a Release
           </button>
        </div>
        
        {composeMode === 'standard' ? <ComposeFeed /> : <ShipItForm />}
      </div>

      {/* Feed List */}
      <div className="flex flex-col">
        {activeTab === 'following' && (
          <div className="p-8 text-center text-git-muted text-sm border-b border-git-border">
            You aren't following anyone yet. Switch to Discover to see activity.
          </div>
        )}

        {activeTab === 'discover' && mockPosts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}

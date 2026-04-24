"use client";

import React, { useEffect } from "react";
import ComposeFeed from "./ComposeFeed";
import PostCard, { PostProps } from "./PostCard";
import { XIcon } from "lucide-react";

interface QuoteModalProps {
  post: PostProps;
  onClose: () => void;
}

export default function QuoteModal({ post, onClose }: QuoteModalProps) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={onClose} />
      
      <div className="relative z-[101] w-full max-w-[600px] bg-git-bg border border-git-border rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-git-border bg-git-bg/95 rounded-t-xl shrink-0">
          <h2 className="font-bold text-git-text">Quote Repost</h2>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-git-muted hover:text-git-text transition-colors"
          >
            <XIcon size={18} />
          </button>
        </div>
        
        {/* Scrollable Content Area */}
        <div className="flex flex-col flex-1 overflow-y-auto p-4 gap-4">
          {/* We place the ComposeFeed at the top so user types here */}
          <div className="relative z-20">
            <ComposeFeed 
              quotedPostId={post.id} 
              onPostCreated={() => {
                onClose();
              }} 
            />
          </div>
          
          {/* The post being quoted sits beneath, wrapped in a boundary */}
          <div className="border border-git-border rounded-xl overflow-hidden opacity-90 select-none pointer-events-none shrink-0 mb-4 bg-git-bg">
            <PostCard post={sanitizePost(post)} isNested={true} />
          </div>
        </div>
        
      </div>
    </div>
  );

  function sanitizePost(post: PostProps): PostProps {
    // Basic sanitization, consider using a library like DOMPurify for more comprehensive protection
    return {
      ...post,
      content: post.content.replace(/<script>.*?</script>/g, '').replace(/<.*?>/g, '')
    }
  }
}

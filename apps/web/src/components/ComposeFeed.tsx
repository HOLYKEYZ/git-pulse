"use client";

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function ComposeFeed({ onPostCreated }: { onPostCreated?: (post: any) => void }) {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [previewMode, setPreviewMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const maxLength = 500;
  const fileInputRef = useRef<HTMLInputElement>(null);

const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
  if (e.target.files) {
    const files = Array.from(e.target.files);
    if (images.length + files.length > 4) {
      alert("Maximum 4 images allowed per post");
      return;
    }

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const sanitizedImage = DOMPurify.sanitize(reader.result as string);
        setImages((prev) => [...prev, sanitizedImage]);
      };
      reader.readAsDataURL(file);
    });
  }
  // reset so same file can be selected again if removed
  if (e.target) e.target.value = '';
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!content.trim() && images.length === 0 || content.length > maxLength || isSubmitting) return;

  const sanitizedContent = DOMPurify.sanitize(content);
  const sanitizedImages = images.map((image) => DOMPurify.sanitize(image));

  setIsSubmitting(true);
  try {
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: sanitizedContent, type: 'standard', images: sanitizedImages })
    });

    if (res.ok) {
      setContent('');
      setImages([]);
      setPreviewMode(false);
      // optimistically update the UI if the callback is provided
      const data = await res.json();
      if (data.post && onPostCreated) {
        onPostCreated(data.post);
      }
      // scroll to top so user sees their new post
      window.scrollTo({ top: 0, behavior: 'smooth' });
      // refresh the server components to show new post without hard reload
      router.refresh();
    }
  } catch (error) {
    console.error("Failed to create post", error);
  } finally {
    setIsSubmitting(false);
  }
};

  return (
    <div className="rounded-xl border border-git-border bg-git-card overflow-hidden">
      <div className="bg-git-dark-bg-header border-b border-git-border px-4 py-2 flex gap-4 text-sm font-medium">
        <button
          type="button"
          onClick={() => setPreviewMode(false)}
          className={`pb-1 -mb-2 transition-colors ${!previewMode ? 'text-git-text border-b-2 border-git-accent' : 'text-git-muted hover:text-git-text border-b-2 border-transparent'}`}>
          
            Write
        </button>
        <button
          type="button"
          disabled={!content.trim()}
          onClick={() => setPreviewMode(true)}
          className={`pb-1 -mb-2 transition-colors ${previewMode ? 'text-git-text border-b-2 border-git-accent' : 'text-git-muted hover:text-git-text border-b-2 border-transparent disabled:opacity-50 disabled:cursor-not-allowed'}`}>
          
            Preview
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-3 bg-git-dark-bg-primary">
        {!previewMode ?
        <textarea
          placeholder="What's happening? (Supports Markdown, #hashtags, @mentions)"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full min-h-[100px] resize-y bg-git-bg text-git-text font-mono text-sm p-3 rounded-md border border-git-border focus:outline-none focus:ring-2 focus:ring-git-accent focus:border-transparent placeholder:text-git-muted custom-scrollbar" /> :


        <div className="w-full min-h-[100px] bg-git-dark-bg-secondary p-3 rounded-md border border-git-border overflow-y-auto custom-scrollbar markdown-body">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {content.replace(/(^|\s)#([\w-]+)/g, '$1[#$2](/search?q=%23$2)').replace(/(^|\s)@([\w-]+)/g, '$1[@$2](/profile/$2)')}
                </ReactMarkdown>
            </div>
        }

        {/* selected images preview */}
        {images.length > 0 && !previewMode &&
        <div className="flex flex-wrap gap-2 mt-2">
                {images.map((img, idx) =>
          <div key={idx} className="relative group rounded-md overflow-hidden border border-git-border w-20 h-20">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img} alt={`Upload ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
              type="button"
              onClick={() => removeImage(idx)}
              className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs">
              
                            ✕
                        </button>
                    </div>
          )}
            </div>
        }
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-git-muted">
            {/* image upload button */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageSelect}
              accept="image/*"
              multiple
              className="hidden" />
            
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 rounded-md hover:bg-git-card transition-colors text-git-accent flex items-center gap-1.5"
              title="Attach picture">
              
                <svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" className="fill-current">
                    <path d="M1.75 2.5a.25.25 0 0 0-.25.25v10.5c0 .138.112.25.25.25h12.5a.25.25 0 0 0 .25-.25V2.75a.25.25 0 0 0-.25-.25H1.75Zm-.25-1.5h12.5a1.75 1.75 0 0 1 1.75 1.75v10.5A1.75 1.75 0 0 1 14.25 15H1.75A1.75 1.75 0 0 1 0 13.25V2.75C0 1.784.784 1 1.75 1ZM6.25 7a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5ZM2.5 13.25l3.44-3.44a.25.25 0 0 1 .354 0l1.206 1.206-2.5 2.5H2.5v-.266ZM10.53 8.47a.25.25 0 0 1 .354 0l2.616 2.616v2.164h-3.42l-2.028-2.029 2.478-2.75Z"></path>
                </svg>
            </button>
            
            <svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" className="fill-current ml-2">
              <path d="M11.93 8.5a4.002 4.002 0 0 1-7.86 0H.75a.75.75 0 0 1 0-1.5h3.32a4.002 4.002 0 0 1 7.86 0h3.32a.75.75 0 0 1 0 1.5h-3.32Zm-1.43-.75a2.5 2.5 0 1 0-5 0 2.5 2.5 0 0 0 5 0Z"></path>
            </svg>
            <span>Markdown supported</span>
          </div>
          
          <div className="flex items-center gap-4">
            <span className={`text-xs font-mono ${content.length > maxLength ? 'text-git-error-text' : 'text-git-muted'}`}>
              {content.length}/{maxLength}
            </span>
            <button
              type="submit"
              disabled={!content.trim() && images.length === 0 || content.length > maxLength || isSubmitting}
              className="rounded-md bg-git-green px-4 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-[#2ea043] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:bg-[#238636] disabled:opacity-50 disabled:cursor-not-allowed transition-all">
              
              Post
            </button>
          </div>
        </div>
      </form>
    </div>);

}
"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";

import { z } from 'zod';

const contentSchema = z.string();

export default function PostContentRenderer({ content }: { content: string }) {
  const validatedContent = contentSchema.safeParse(content);
  if (!validatedContent.success) {
    throw new Error('Invalid content prop');
  }
  // pre-process #tags and @mentions into markdown links
  const processed = content
    .replace(/(^|\s)(#[\w-]+)/g, '$1[$2]($2)')
    .replace(/(^|\s)(@[\w-]+)/g, '$1[$2]($2)');

  return (
    <div className="text-git-text text-base leading-relaxed mb-4 break-words whitespace-pre-wrap markdown-body" style={{ background: 'transparent', padding: 0 }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => {
            if (href?.startsWith('@')) {
              return <Link href={`/profile/${href.substring(1)}`} className="text-git-accent hover:underline">{children}</Link>;
            }
            if (href?.startsWith('#')) {
              return <Link href={`/explore/tags/${href.substring(1)}`} className="text-git-accent hover:underline">{children}</Link>;
            }
            return <a href={href} className="text-git-accent hover:underline" target={href?.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer">{children}</a>;
          },
          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
          h1: ({ children }) => <h1 className="text-xl font-bold mb-2">{children}</h1>,
          h2: ({ children }) => <h2 className="text-lg font-bold mb-2">{children}</h2>,
          h3: ({ children }) => <h3 className="text-base font-bold mb-1">{children}</h3>,
          strong: ({ children }) => <strong className="font-bold">{children}</strong>,
          ul: ({ children }) => <ul className="list-disc pl-5 mb-2">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-5 mb-2">{children}</ol>,
          li: ({ children }) => <li className="mb-0.5">{children}</li>,
          code: ({ children }) => <code className="bg-git-card px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>,
          pre: ({ children }) => <pre className="bg-git-card p-3 rounded-lg overflow-x-auto mb-2 text-sm font-mono">{children}</pre>,
          blockquote: ({ children }) => <blockquote className="border-l-4 border-git-border pl-3 text-git-muted italic mb-2">{children}</blockquote>,
        }}
      >
        {processed}
      </ReactMarkdown>
    </div>
  );
}

import React from "react";
import * as cheerio from "cheerio";
import "github-markdown-css/github-markdown-dark.css";

interface ProfileReadmeProps {
  content: string;
  username: string;
}

export default function ProfileReadme({ content, username }: ProfileReadmeProps) {
  // We use cheerio on the server to process the pre-rendered HTML from GitHub
  const $ = cheerio.load(content);

  // 1. Force dark mode for picture elements (GitPulse is always dark)
  // Remove light mode sources entirely
  $('source[media*="light"]').remove();
  // Force dark mode sources to always apply
  $('source[media*="dark"]').attr('media', 'all');

  // 2. Proxy image URLs to handle CORS and relative path resolution
  $('img').each((_, el) => {
    let src = $(el).attr('src');
    if (src && !src.startsWith('data:')) {
      // If the image is a relative path (e.g. "cover2.jpeg" or "/repo/img.png")
      if (!src.startsWith('http')) {
        if (src.startsWith('/')) {
          src = `https://github.com${src}`;
        } else {
          // It's a relative path in the special repository
          src = `https://raw.githubusercontent.com/${username}/${username}/main/${src}`;
        }
      }
      $(el).attr('src', `/api/image-proxy?url=${encodeURIComponent(src)}`);
    }
  });

  // 3. Proxy source srcsets
  $('source').each((_, el) => {
    const srcset = $(el).attr('srcset');
    if (srcset && !srcset.startsWith('/') && !srcset.startsWith('data:')) {
      // srcset might have multiple URLs and descriptors, but simple ones are single URLs.
      // GitHub stats usually just have a single URL in srcset. Look out for spaces.
      const proxySet = srcset.split(',').map(part => {
        const [url, size] = part.trim().split(/\s+/);
        if (url && url.startsWith('http')) {
          const proxiedUrl = `/api/image-proxy?url=${encodeURIComponent(url)}`;
          return size ? `${proxiedUrl} ${size}` : proxiedUrl;
        }
        return part;
      }).join(', ');
      
      $(el).attr('srcset', proxySet);
    }
  });

  // 4. Ensure all links open in a new tab securely
  $('a').each((_, el) => {
    const href = $(el).attr('href');
    if (href && href.startsWith('http')) {
      $(el).attr('target', '_blank').attr('rel', 'noopener noreferrer');
    }
  });

  // The parsed inner HTML
  const processedHtml = $('body').html() || content;

  return (
    <div className="w-full animate-fade-in relative">
      <div 
        className="markdown-body p-1"
        style={{ backgroundColor: 'transparent', color: 'inherit' }}
        dangerouslySetInnerHTML={{ __html: processedHtml }}
      />
    </div>
  );
}
import React from "react";
import * as cheerio from "cheerio";
import DOMPurify from "isomorphic-dompurify";
import "github-markdown-css/github-markdown-dark.css";

interface ProfileReadmeProps {
  content: string;
  username: string;
}

export default function ProfileReadme({ content, username }: ProfileReadmeProps) {
  // We use cheerio on the server to process the pre-rendered HTML from GitHub
  const $ = cheerio.load(content);

  // 1. Force dark mode for picture elements (GitPulse is always dark)
  // remove light mode sources entirely
  $('source[media*="light"]').remove();
  // force dark mode sources to always apply
  $('source[media*="dark"]').attr('media', 'all');

  // 1b. strip github's heading anchor links (the 🔗 chain icons on every heading)
  $('a.anchor').remove();
  $('.octicon-link').remove();
  // also remove any remaining heading-link svgs
  $('svg.octicon').each((_, el) => {
    const parent = $(el).parent();
    if (parent.is('a') && parent.attr('class')?.includes('anchor')) {
      parent.remove();
    }
  });

const resolveAndProxyGithubImageUrl = (originalUrl: string, username: string) => {
                try {
                    if (originalUrl.startsWith('data:')) {
                        return originalUrl;
                    }
                    if (originalUrl.startsWith('http')) {
                        return "/api/image-proxy?url=" + encodeURIComponent(originalUrl);
                    }
                    if (originalUrl.startsWith('/')) {
                        return "/api/image-proxy?url=" + encodeURIComponent("https://github.com" + originalUrl);
                    }
                    if (username && username.length > 0) {
                        return "/api/image-proxy?url=" + encodeURIComponent("https://raw.githubusercontent.com/" + username + "/" + username + "/main/" + originalUrl);
                    }
                    return originalUrl;
                } catch (error) {
                    console.error('Error resolving and proxying GitHub image URL:', error);
                    return "";
                }
            };

            // 2. Proxy image URLs to handle CORS and relative path resolution
            $('img').each((_, el) => {
                let src = $(el).attr('src');
                if (src && !src.startsWith('data:')) {
                    $(el).attr('src', resolveAndProxyGithubImageUrl(src, username));
                }
            });

            // 3. Proxy source srcsets
            $('source').each((_, el) => {
                const srcset = $(el).attr('srcset');
                if (srcset) {
                    const proxySet = srcset.split(',').map(part => {
                        let [url, size] = part.trim().split(/\s+/);
                        if (url) {
                            if (url.startsWith('data:')) {
                                return part;
                            }
                            return size ? `${resolveAndProxyGithubImageUrl(url, username)} ${size}` : resolveAndProxyGithubImageUrl(url, username);
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
  const sanitizedHtml = DOMPurify.sanitize(processedHtml, {
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onblur', 'onfocus']
  });

  return (
    <div className="w-full animate-fade-in relative overflow-hidden">
      <div 
        className="markdown-body px-4 py-2 overflow-x-auto"
        style={{ backgroundColor: 'transparent', color: 'inherit' }}
        dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
      />
    </div>
  );
}
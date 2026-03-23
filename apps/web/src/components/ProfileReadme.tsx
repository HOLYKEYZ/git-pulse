import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import type { Components } from "react-markdown";

interface ProfileReadmeProps {
  content: string;
  username: string;
}

/**
 * rewrites image urls to go through my proxy for cors-safe rendering.
 * handles: relative paths, camo urls, shields.io, github-readme-stats, etc.
 */
function proxyImageUrl(src: string, username: string): string {
  if (!src) return src;

  // relative urls → raw.githubusercontent.com
  if (src.startsWith("./") || src.startsWith("../") || !src.startsWith("http") && !src.startsWith("/") && !src.startsWith("data:")) {
    const rawUrl = `https://raw.githubusercontent.com/${username}/${username}/main/${src.replace(/^\.\//, "")}`;
    return `/api/image-proxy?url=${encodeURIComponent(rawUrl)}`;
  }

  // already absolute urls — proxy them
  if (src.startsWith("http")) {
    return `/api/image-proxy?url=${encodeURIComponent(src)}`;
  }

  // data uris, anchors, etc. — pass through
  return src;
}

const applyAlign = (node: any, Tag: any, props: any) => {
  const align = node?.properties?.align || props.align;
  if (align === "center") {
    return (
      <Tag
        {...props}
        style={{
          ...(props.style || {}),
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center"
        }} />);


  }
  if (align === "right") {
    return <Tag {...props} style={{ ...(props.style || {}), textAlign: "right", float: "right" }} />;
  }
  return <Tag {...props} />;
};

export default function ProfileReadme({ content, username }: ProfileReadmeProps) {
  const components: Components = {
    // fix <a> targets for external links
    a: ({ href, children }) =>
    <a
      href={href}
      target={href?.startsWith("http") ? "_blank" : undefined}
      rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}>
      
                {children}
            </a>,

    p: ({ node, ...props }) => applyAlign(node, "p", props),
    div: ({ node, ...props }) => applyAlign(node, "div", props),
    img: ({ node, ...props }: any) => {
      const align = node?.properties?.align || props.align;
      let style: any = { maxWidth: "100%", height: "auto", ...(props.style || {}) };
      if (align === "center") {
        style = { ...style, display: "block", marginLeft: "auto", marginRight: "auto" };
      } else if (align === "right") {
        style = { ...style, float: "right" };
      }
      return <img src={proxyImageUrl(String(props.src || ""), username)} alt={props.alt || ""} loading="lazy" style={style} />;
    },
    h1: ({ node, ...props }) => applyAlign(node, "h1", props),
    h2: ({ node, ...props }) => applyAlign(node, "h2", props),
    h3: ({ node, ...props }) => applyAlign(node, "h3", props),
    section: ({ node, ...props }) => applyAlign(node, "section", props)
  };

  return (
    <div className="w-full animate-fade-in">
            <div className="markdown-body pt-2">
                <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]}
          components={components}>
          
                    {content}
                </ReactMarkdown>
            </div>
        </div>);

}
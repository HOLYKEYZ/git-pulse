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
 * Rewrites image URLs to go through our proxy for CORS-safe rendering.
 * Handles: relative paths, camo URLs, shields.io, github-readme-stats, etc.
 */
function proxyImageUrl(src: string, username: string): string {
    if (!src) return src;

    // Relative URLs → raw.githubusercontent.com
    if (src.startsWith("./") || src.startsWith("../") || (!src.startsWith("http") && !src.startsWith("/") && !src.startsWith("data:"))) {
        const rawUrl = `https://raw.githubusercontent.com/${username}/${username}/main/${src.replace(/^\.\//, "")}`;
        return `/api/image-proxy?url=${encodeURIComponent(rawUrl)}`;
    }

    // Already absolute URLs — proxy them
    if (src.startsWith("http")) {
        return `/api/image-proxy?url=${encodeURIComponent(src)}`;
    }

    // Data URIs, anchors, etc. — pass through
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
                }}
            />
        );
    }
    if (align === "right") {
        return <Tag {...props} style={{ ...(props.style || {}), textAlign: "right", float: "right" }} />;
    }
    return <Tag {...props} />;
};

export default function ProfileReadme({ content, username }: ProfileReadmeProps) {
    const components: Components = {
        // Fix <a> targets for external links
        a: ({ href, children }) => (
            <a
                href={href}
                target={href?.startsWith("http") ? "_blank" : undefined}
                rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
            >
                {children}
            </a>
        ),
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
        section: ({ node, ...props }) => applyAlign(node, "section", props),
    };

    return (
        <div className="w-full animate-fade-in">
            <div className="flex items-center gap-2 mb-4 text-git-text border-b border-git-border pb-2">
                <svg aria-hidden="true" height="16" viewBox="0 0 16 16" width="16" className="fill-current">
                    <path d="M0 1.75A.75.75 0 0 1 .75 1h4.253c1.227 0 2.317.59 3 1.501A3.743 3.743 0 0 1 11.006 1h4.245a.75.75 0 0 1 .75.75v10.5a.75.75 0 0 1-.75.75h-4.507a2.25 2.25 0 0 0-1.591.659l-.622.621a.75.75 0 0 1-1.06 0l-.622-.621A2.25 2.25 0 0 0 5.258 13H.75a.75.75 0 0 1-.75-.75Zm7.251 10.324.004-5.073-.002-2.253A2.25 2.25 0 0 0 5.003 2.5H1.5v9h3.757a3.75 3.75 0 0 1 1.994.574ZM8.755 4.75l-.004 7.322a3.752 3.752 0 0 1 1.992-.572H14.5v-9h-3.495a2.25 2.25 0 0 0-2.25 2.25Z"/>
                </svg>
                <span className="text-sm font-semibold capitalize text-git-text">{username}/README.md</span>
            </div>
            <div className="markdown-body pt-2">
                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                    components={components}
                >
                    {content}
                </ReactMarkdown>
            </div>
        </div>
    );
}

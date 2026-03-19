import { NextRequest, NextResponse } from "next/server";

/**
 * Image proxy for rendering external images in GitHub READMEs.
 * Shields.io badges, github-readme-stats cards, and camo.githubusercontent.com
 * images all need proxying to avoid CORS/CSP issues.
 */
export async function GET(req: NextRequest) {
    const url = req.nextUrl.searchParams.get("url");

    if (!url) {
        return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
    }

    try {
        const parsedUrl = new URL(url);
        
        // Prevent obvious SSRF to local IP space
        if (["127.0.0.1", "localhost", "::1"].includes(parsedUrl.hostname) || parsedUrl.hostname.startsWith("10.") || parsedUrl.hostname.startsWith("192.168.")) {
             return NextResponse.json({ error: "SSRF prevention" }, { status: 403 });
        }

        const response = await fetch(url, {
            headers: {
                "User-Agent": "GitPulse-Proxy/1.0",
                "Accept": "image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
            },
            // Allow redirects but keep a fast timeout
            redirect: "follow",
            signal: AbortSignal.timeout(10000),
        });

        if (!response.ok) {
            return NextResponse.json({ error: "Failed to fetch image" }, { status: response.status });
        }

        const contentType = response.headers.get("content-type") || "";
        
        // Strictly only proxy things that are images or vectors
        if (!contentType.startsWith("image/") && !contentType.includes("xml")) {
             return NextResponse.json({ error: "Invalid content type" }, { status: 403 });
        }

        const buffer = await response.arrayBuffer();

        // Forward caching aggressively
        return new NextResponse(buffer, {
            status: 200,
            headers: {
                "Content-Type": contentType || "image/png",
                "Cache-Control": "public, max-age=86400, s-maxage=86400",
                "Access-Control-Allow-Origin": "*",
            },
        });
    } catch (e) {
        return NextResponse.json({ error: "Proxy error" }, { status: 500 });
    }
}

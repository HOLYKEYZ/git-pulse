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

    // Validate URL — only allow known image hosts
    const allowedHosts = [
        "camo.githubusercontent.com",
        "raw.githubusercontent.com",
        "img.shields.io",
        "github-readme-stats.vercel.app",
        "github-readme-streak-stats.herokuapp.com",
        "github-profile-trophy.vercel.app",
        "komarev.com",
        "readme-typing-svg.demolab.com",
        "skillicons.dev",
        "techstack-generator.vercel.app",
        "avatars.githubusercontent.com",
        "user-images.githubusercontent.com",
        "github.githubassets.com",
        "streak-stats.demolab.com",
        "github-readme-activity-graph.vercel.app",
        "capsule-render.vercel.app",
    ];

    try {
        const parsedUrl = new URL(url);
        const isAllowed = allowedHosts.some(host => parsedUrl.hostname === host || parsedUrl.hostname.endsWith(`.${host}`));

        if (!isAllowed) {
            return NextResponse.json({ error: "Host not allowed" }, { status: 403 });
        }

        const response = await fetch(url, {
            headers: {
                "User-Agent": "GitPulse/1.0",
                "Accept": "image/*,*/*",
            },
            signal: AbortSignal.timeout(10000),
        });

        if (!response.ok) {
            return NextResponse.json({ error: "Failed to fetch image" }, { status: response.status });
        }

        const buffer = await response.arrayBuffer();
        const contentType = response.headers.get("content-type") || "image/png";

        return new NextResponse(buffer, {
            status: 200,
            headers: {
                "Content-Type": contentType,
                "Cache-Control": "public, max-age=3600, s-maxage=3600",
                "Access-Control-Allow-Origin": "*",
            },
        });
    } catch {
        return NextResponse.json({ error: "Proxy error" }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from "next/server";

/**
 * image proxy for rendering external images in github readmes.
 * shields.io badges, github-readme-stats cards, and camo.githubusercontent.com
 * images all need proxying to avoid cors/csp issues.
 */
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  try {
    const parsedUrl = new URL(url);

    // prevent obvious ssrf to local ip space
    if (isPrivateIPAddress(parsedUrl)) {
      return NextResponse.json({ error: "SSRF prevention" }, { status: 403 });
}

    const response = await fetch(url, {
      headers: {
        "User-Agent": "GitPulse-Proxy/1.0",
        "Accept": "image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8"
      },
      // allow redirects but keep a fast timeout
      redirect: "follow",
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch image" }, { status: response.status });
    }

    const contentType = response.headers.get("content-type") || "";

    // strictly only proxy things that are images or vectors
    if (!contentType.startsWith("image/") && !contentType.includes("xml")) {
      return NextResponse.json({ error: "Invalid content type" }, { status: 403 });
    }

    const buffer = await response.arrayBuffer();

    // forward caching aggressively
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType || "image/png",
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
        "Access-Control-Allow-Origin": "*"
      }
    });
  } catch (e) {
    return NextResponse.json({ error: "Proxy error" }, { status: 500 });
  }
}
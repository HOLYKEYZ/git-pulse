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
const isPrivateIP = ["127.0.0.1", "localhost", "::1"].includes(parsedUrl.hostname) || parsedUrl.hostname.startsWith("10.") || parsedUrl.hostname.startsWith("192.168.") || parsedUrl.hostname.startsWith("169.254.") || parsedUrl.hostname.startsWith("0.") || (parsedUrl.hostname.startsWith("198.18.") || parsedUrl.hostname.startsWith("198.19.")) || parsedUrl.hostname.startsWith("100.64.") && parseInt(parsedUrl.hostname.split('.')[1]) >= 0 && parseInt(parsedUrl.hostname.split('.')[1]) <= 127;
const is172Range = parsedUrl.hostname.split('.').length === 4 && parsedUrl.hostname.split('.')[0] === '172' && parseInt(parsedUrl.hostname.split('.')[1]) >= 16 && parseInt(parsedUrl.hostname.split('.')[1]) <= 31;
const isIPv6LinkLocal = parsedUrl.hostname.toLowerCase().startsWith("fe80:");
if (isPrivateIP || is172Range || isIPv6LinkLocal) {
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
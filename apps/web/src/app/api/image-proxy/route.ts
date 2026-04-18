import { NextRequest, NextResponse } from "next/server";

/**
 * image proxy for rendering external images in github readmes.
 * shields.io badges, github-readme-stats cards, and camo.githubusercontent.com
 * images all need proxying to avoid cors/csp issues.
 */

// max image size: 5mb
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

// private/reserved ip ranges to block ssrf attacks
const BLOCKED_HOSTNAMES = [
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "[::1]",
];

const BLOCKED_PREFIXES = [
  "192.168.",
  "10.",
  "172.16.", "172.17.", "172.18.", "172.19.",
  "172.20.", "172.21.", "172.22.", "172.23.",
  "172.24.", "172.25.", "172.26.", "172.27.",
  "172.28.", "172.29.", "172.30.", "172.31.",
  "169.254.", // aws metadata endpoint range
  "::ffff:127.", // ipv4-mapped ipv6 loopback
  "::ffff:10.", // ipv4-mapped ipv6 private
  "::ffff:192.168.", // ipv4-mapped ipv6 private
  "fd", // ipv6 unique local addresses
];

function validateURL(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return false;
    }
    if (isPrivateUrl(parsedUrl.hostname)) {
      return false;
    }
    return true;
  } catch (e) {
    return false;
  }
}

function isPrivateUrl(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.includes(lower)) return true;
  if (BLOCKED_PREFIXES.some((p) => lower.startsWith(p))) return true;
  return false;
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  
  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }
  
  try {
    const parsedUrl = new URL(url);
    
    // block private/reserved ips
if (!validateURL(url)) {
  return NextResponse.json({ error: "SSRF prevention" }, { status: 403 });
}
    
    // disable automatic redirects so we can validate each hop
    const response = await fetch(url, {
      headers: {
        "User-Agent": "GitPulse-Proxy/1.0",
        "Accept": "image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8"
      },
      redirect: "manual",
      signal: AbortSignal.timeout(10000)
    });
    
    // handle redirects manually — re-check destination against private ranges
    if (response.status >= 300 && response.status < 400) {
      const redirectTarget = response.headers.get("location");
      if (!redirectTarget) {
        return NextResponse.json({ error: "Invalid redirect" }, { status: 403 });
      }
      const redirectUrl = new URL(redirectTarget, url);
if (!validateURL(redirectUrl.toString())) {
  return NextResponse.json({ error: "SSRF prevention: redirect to private IP" }, { status: 403 });
}
      // follow the redirect once (no infinite chaining)
      const redirectResponse = await fetch(redirectUrl.toString(), {
        headers: {
          "User-Agent": "GitPulse-Proxy/1.0",
          "Accept": "image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8"
        },
        redirect: "error", // no more redirects
        signal: AbortSignal.timeout(10000)
      });
      return processImageResponse(redirectResponse);
    }
    
    return processImageResponse(response);
  } catch (e) {
    console.error('Error in image proxy route:', e);
    return NextResponse.json({ error: "Proxy error" }, { status: 500 });
  }
}

async function processImageResponse(response: Response) {
  if (!response.ok) {
    return NextResponse.json({ error: "Failed to fetch image" }, { status: response.status });
  }

  const contentType = response.headers.get("content-type") || "";

  // strictly only proxy things that are images or vectors
  if (!contentType.startsWith("image/") && !contentType.includes("xml")) {
    return NextResponse.json({ error: "Invalid content type" }, { status: 403 });
  }

  // check content-length header before buffering
  const contentLength = response.headers.get("content-length");
  if (contentLength && parseInt(contentLength) > MAX_IMAGE_SIZE) {
    return NextResponse.json({ error: "Image too large (max 5MB)" }, { status: 413 });
  }

  const buffer = await response.arrayBuffer();

  // double-check actual size after download
  if (buffer.byteLength > MAX_IMAGE_SIZE) {
    return NextResponse.json({ error: "Image too large (max 5MB)" }, { status: 413 });
  }

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": contentType || "image/png",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
      "Access-Control-Allow-Origin": "*"
    }
  });
}

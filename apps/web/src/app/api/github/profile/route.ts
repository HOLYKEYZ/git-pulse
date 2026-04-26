import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getServerSideToken } from "@/lib/serverToken";
import { z } from "zod";

const ProfileUpdateSchema = z.object({
  name: z.string().max(100).optional(),
  email: z.string().email().optional(),
  blog: z.string().url().or(z.literal("")).optional(),
  twitter_username: z.string().max(50).optional(),
  company: z.string().max(100).optional(),
  location: z.string().max(100).optional(),
  hireable: z.boolean().optional(),
  bio: z.string().max(160).optional()
}).passthrough();

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    const token = session?.user?.login ? await getServerSideToken(session.user.login) : null;
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const body = await req.json();
    
    // Input validation with Zod
const result = ProfileUpdateSchema.safeParse(body);
if (!result.success) {
  console.error('[GitHub Profile API] Validation error:', result.error.format());
  return NextResponse.json({ error: 'Validation failed', details: result.error.format() }, { status: 400 });
}
const safeData = result.data;
    
    // https://docs.github.com/en/rest/users/users#update-the-authenticated-user
    const response = await fetch("https://api.github.com/user", {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: safeData.name,
        email: safeData.email,
        blog: safeData.blog,
        twitter_username: safeData.twitter_username,
        company: safeData.company,
        location: safeData.location,
        hireable: safeData.hireable,
        bio: safeData.bio
      })
    });
    
if (!response.ok) {
  const errorText = await response.text();
  console.error('[GitHub Profile API] Error updating profile:', response.status, errorText);
  if (response.status === 422) {
    return NextResponse.json({ error: 'Validation failed', details: errorText }, { status: 422 });
  } else {
    return NextResponse.json({ error: `GitHub API responded with ${response.status}`, details: errorText }, { status: response.status });
  }
}
    
    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("[GitHub Profile API] Internal Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

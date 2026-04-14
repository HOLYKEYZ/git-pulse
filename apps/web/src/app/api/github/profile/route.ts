import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getServerSideToken } from "@/lib/serverToken";

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    const token = session?.user?.login ? await getServerSideToken(session.user.login) : null;
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const body = await req.json();
    
    // Input validation
    if (!body.name || typeof body.name !== 'string' || body.name.length > 100) {
      return NextResponse.json({ error: 'Invalid name' }, { status: 400 });
    }
    if (!body.email || typeof body.email !== 'string' || !body.email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }
    if (body.blog && typeof body.blog !== 'string') {
      return NextResponse.json({ error: 'Invalid blog' }, { status: 400 });
    }
    if (body.twitter_username && typeof body.twitter_username !== 'string') {
      return NextResponse.json({ error: 'Invalid twitter username' }, { status: 400 });
    }
    if (body.company && typeof body.company !== 'string') {
      return NextResponse.json({ error: 'Invalid company' }, { status: 400 });
    }
    if (body.location && typeof body.location !== 'string') {
      return NextResponse.json({ error: 'Invalid location' }, { status: 400 });
    }
    if (typeof body.hireable !== 'boolean') {
      return NextResponse.json({ error: 'Invalid hireable' }, { status: 400 });
    }
    if (body.bio && typeof body.bio !== 'string') {
      return NextResponse.json({ error: 'Invalid bio' }, { status: 400 });
    }
    
    // https://docs.github.com/en/rest/users/users#update-the-authenticated-user
    const response = await fetch("https://api.github.com/user", {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: body.name,
        email: body.email,
        blog: body.blog,
        twitter_username: body.twitter_username,
        company: body.company,
        location: body.location,
        hireable: body.hireable,
        bio: body.bio
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[GitHub Profile API] Error updating profile:`, response.status, errorText);
      if (response.status === 422) {
        return NextResponse.json({ error: 'Validation failed' }, { status: 422 });
      } else {
        return NextResponse.json({ error: `GitHub API responded with ${response.status}` }, { status: response.status });
      }
    }
    
    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("[GitHub Profile API] Internal Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

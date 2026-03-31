import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    const token = session?.user?.accessToken;
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    
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
      return NextResponse.json({ error: `GitHub API responded with ${response.status}` }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });

  } catch (error) {
    console.error("[GitHub Profile API] Internal Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

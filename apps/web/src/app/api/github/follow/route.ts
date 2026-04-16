import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getServerSideToken } from "@/lib/serverToken";

async function getAuthenticatedTokenOrResponse(req: NextRequest): Promise<string | NextResponse> {
  const session = await auth();
  const token = session?.user?.login ? await getServerSideToken(session.user.login) : null;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return token;
}

export async function PUT(req: NextRequest) {
  try {
    const token = await getAuthenticatedTokenOrResponse(req);
    if (token instanceof NextResponse) {
      return token;
    }

    const body = await req.json();
const { username } = body;
const usernameRegex = /^[a-z0-9_-]{1,39}$/;
if (!usernameRegex.test(username)) {
  return NextResponse.json({ error: 'Invalid username' }, { status: 400 });
}

    if (!username) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }

    // Call GitHub API to follow user
    // https://docs.github.com/en/rest/users/followers#follow-a-user-for-the-authenticated-user
    const response = await fetch(`https://api.github.com/user/following/${username}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Length": "0" // Required for this PUT request
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[GitHub Follow API] Error following ${username}:`, response.status, errorText);
      return NextResponse.json({ error: `GitHub API responded with ${response.status}` }, { status: response.status });
    }

    // GitHub returns 204 No Content on success
    return NextResponse.json({ success: true, message: `Successfully followed ${username}` });

  } catch (error) {
    console.error("[GitHub Follow API] Internal Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const token = await getAuthenticatedTokenOrResponse(req);
    if (token instanceof NextResponse) {
      return token;
    }

    // Handle unfollow via query params for DELETE
    const url = new URL(req.url);
    const username = url.searchParams.get("username");

    if (!username) {
      return NextResponse.json({ error: "Username query param is required" }, { status: 400 });
    }

    // https://docs.github.com/en/rest/users/followers#unfollow-a-user-for-the-authenticated-user
    const response = await fetch(`https://api.github.com/user/following/${username}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json"
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[GitHub Unfollow API] Error unfollowing ${username}:`, response.status, errorText);
      return NextResponse.json({ error: `GitHub API responded with ${response.status}` }, { status: response.status });
    }

    return NextResponse.json({ success: true, message: `Successfully unfollowed ${username}` });

  } catch (error) {
    console.error("[GitHub Unfollow API] Internal Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

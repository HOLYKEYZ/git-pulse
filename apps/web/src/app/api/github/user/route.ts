import { auth } from "@/lib/auth";
import { getServerSideToken } from "@/lib/serverToken";
import { NextResponse } from "next/server";

// get current user's github profile data
function getGitHubApiHeaders(accessToken: string) {
    return {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
    };
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.login) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const token = await getServerSideToken(session.user.login);
  if (!token) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  try {
    const res = await fetch('https://api.github.com/user', {
      headers: getGitHubApiHeaders(token),
    });
    if (!res.ok) {
      return NextResponse.json({ error: 'failed to fetch profile' }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json({
      name: data.name,
      bio: data.bio,
      blog: data.blog,
      twitter_username: data.twitter_username,
      location: data.location,
      company: data.company,
      avatar_url: data.avatar_url,
      login: data.login,
    });
  } catch {
    return NextResponse.json({ error: 'failed to fetch profile' }, { status: 500 });
  }
}
    const session = await auth();
    if (!session?.user?.login) {
        return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const token = await getServerSideToken(session.user.login);
    if (!token) {
        return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    try {
        const res = await fetch("https://api.github.com/user", {
            headers: getGitHubApiHeaders(token),
        });

        if (!res.ok) {
            return NextResponse.json({ error: "failed to fetch profile" }, { status: res.status });
        }

        const data = await res.json();
        return NextResponse.json({
            name: data.name,
            bio: data.bio,
            blog: data.blog,
            twitter_username: data.twitter_username,
            location: data.location,
            company: data.company,
            avatar_url: data.avatar_url,
            login: data.login,
        });
    } catch {
        return NextResponse.json({ error: "failed to fetch profile" }, { status: 500 });
    }
}

// update current user's github profile
export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.login) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const patchToken = await getServerSideToken(session.user.login);
  if (!patchToken) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  try {
    const body = await request.json();
    const validatedInput = validateInput(body);
    if (!validatedInput) {
      return NextResponse.json({ error: 'invalid input' }, { status: 400 });
    }
    const allowed = ['name', 'bio', 'blog', 'twitter_username', 'location', 'company'];
    const payload: Record<string, string> = {};
    for (const key of allowed) {
      if (key in validatedInput) {
        payload[key] = validatedInput[key] ?? '';
      }
    }
    const res = await fetch('https://api.github.com/user', {
      method: 'PATCH',
      headers: {
        ...getGitHubApiHeaders(patchToken),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}) );
      return NextResponse.json(
        { error: err.message || 'failed to update profile' },
        { status: res.status }
      );
    }
    const data = await res.json();
    return NextResponse.json({
      name: data.name,
      bio: data.bio,
      blog: data.blog,
      twitter_username: data.twitter_username,
      location: data.location,
      company: data.company,
    });
  } catch {
    return NextResponse.json({ error: 'failed to update profile' }, { status: 500 });
  }
}
    const session = await auth();
    if (!session?.user?.login) {
        return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const patchToken = await getServerSideToken(session.user.login);
    if (!patchToken) {
        return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();

        // only allow safe fields
        const allowed = ["name", "bio", "blog", "twitter_username", "location", "company"];
        const payload: Record<string, string> = {};
        for (const key of allowed) {
            if (key in body) {
                payload[key] = body[key] ?? "";
            }
        }

const res = await fetch("https://api.github.com/user", {
            method: "PATCH",
            headers: {
                ...getGitHubApiHeaders(patchToken),
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            return NextResponse.json(
                { error: err.message || "failed to update profile" },
                { status: res.status }
            );
        }

        const data = await res.json();
        return NextResponse.json({
            name: data.name,
            bio: data.bio,
            blog: data.blog,
            twitter_username: data.twitter_username,
            location: data.location,
            company: data.company,
        });
    } catch {
        return NextResponse.json({ error: "failed to update profile" }, { status: 500 });
    }
}

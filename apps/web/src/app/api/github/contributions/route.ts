import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getServerSideToken } from "@/lib/serverToken";
import { getContributionDataForYear } from "@/lib/github";
import contributionCache from "@/lib/contributionCache";
import { z } from "zod";

const QuerySchema = z.object({
  username: z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/),
  year: z.string().regex(/^\d{4}$/).transform((val: string) => parseInt(val, 10)),
});

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.login) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const serverToken = await getServerSideToken(session.user.login);
  if (!serverToken) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const rawQuery = {
    username: searchParams.get("username"),
    year: searchParams.get("year"),
  };

  const result = QuerySchema.safeParse(rawQuery);
  if (!result.success) {
    return NextResponse.json({ error: "Invalid query parameters provided", details: result.error.errors }, { status: 400 });
  }

const { username, year: yearNum } = result.data;

if (typeof yearNum !== 'number' || yearNum < 2008 || yearNum > new Date().getFullYear() || !Number.isInteger(yearNum)) {
  return NextResponse.json({ error: `Invalid year: ${yearNum}. Year must be an integer between 2008 and ${new Date().getFullYear()}.` }, { status: 400 });
} else if (username.length < 1 || username.length > 100) {
  return NextResponse.json({ error: 'Invalid username. Username must be between 1 and 100 characters.' }, { status: 400 });
}

  const cacheKey = `${username}-${yearNum}`;
  const cachedData = contributionCache.get(cacheKey);
  if (cachedData) {
    return NextResponse.json(cachedData);
  }

  const data = await getContributionDataForYear(username, serverToken, yearNum);
  if (!data) {
    return NextResponse.json({ error: "no contribution data found" }, { status: 404 });
  }
  contributionCache.set(cacheKey, data);

  return NextResponse.json(data);
}

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getServerSideToken } from "@/lib/serverToken";
import { getContributionDataForYear } from "@/lib/github";
import contributionCache from "@/lib/contributionCache";
import { z } from "zod";

const QuerySchema = z.object({
  username: z.string().min(1).max(100),
  year: z.string().regex(/^\d{4}$/).transform((val) => parseInt(val, 10)),
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

  if (yearNum < 2008 || yearNum > new Date().getFullYear()) {
    return NextResponse.json({ error: "Year is out of valid range" }, { status: 400 });
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

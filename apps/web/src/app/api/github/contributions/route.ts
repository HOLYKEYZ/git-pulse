import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getServerSideToken } from "@/lib/serverToken";
import { getContributionDataForYear } from "@/lib/github";
import contributionCache from "@/lib/contributionCache";

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
  const username = searchParams.get("username");
  const year = searchParams.get("year");

  if (!username || !year) {
    return NextResponse.json({ error: "username and year are required" }, { status: 400 });
  }

  const yearNum = parseInt(year);
  if (isNaN(yearNum) || yearNum < 2008 || yearNum > new Date().getFullYear()) {
    return NextResponse.json({ error: "invalid year" }, { status: 400 });
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

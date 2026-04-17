import { prisma } from "./prisma";

/**
 * fetches the user's github access token from the database.
 * this is the ONLY way to get the token — it is never sent to the client session.
 * 
 * @param username the github login of the user
 * @returns the access token string, or null if not found
 */
import { z } from 'zod';

const usernameSchema = z.string().min(1, 'Username is required');

export async function getServerSideToken(username: string): Promise<string | null> {
  try {
    usernameSchema.parse(username);
    const user = await prisma.user.findUnique({
      where: { username },
      select: { accessToken: true },
    });
    return user?.accessToken ?? null;
  } catch (error) {
    console.error('Error fetching server-side token:', error);
    return null;
  }
}

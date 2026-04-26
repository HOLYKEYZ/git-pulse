import { prisma } from "./prisma";

/**
 * fetches the user's github access token from the database.
 * this is the ONLY way to get the token — it is never sent to the client session.
 * 
 * @param username the github login of the user
 * @returns the access token string, or null if not found
 */
import { z } from 'zod';

const usernameSchema = z.string().regex(/^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i, 'Invalid GitHub username');

export async function getServerSideToken(username: string): Promise<string | null> {
  try {
    usernameSchema.parse(username);
    const user = await prisma.user.findUnique({
      where: { username },
      select: { accessToken: true },
    });
    if (!user) {
      throw new Error(`User with username '${username}' not found.`);
    }
    return user.accessToken;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error fetching server-side token:', error);
      throw new Error('Invalid username provided.');
    } else if (error instanceof Error) {
      console.error('Error fetching server-side token:', error);
      throw new Error('Failed to fetch server-side token.');
    } else {
      console.error('Unexpected error fetching server-side token:', error);
      throw new Error('An unexpected error occurred.');
    }
  }
}

import express from 'express';
import { jwtVerify } from 'jose';

const app = express();
const port = process.env.PORT || 4000;
const AUTH_SECRET = process.env.AUTH_SECRET;
if (!AUTH_SECRET) {
  throw new Error('AUTH_SECRET environment variable is not defined.');
}
const secret = new TextEncoder().encode(AUTH_SECRET);

app.use(express.json());

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const token = authHeader.substring(7);
  try {
    const payload = await jwtVerify(token, secret);
    (req as any).user = payload;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Forbidden' });
  }
};

// Example: How to extract the user's GitHub session
// The frontend Next.js app passes the NextAuth session token (or JWT)
// Your middleware here should verify the session to ensure the user is logged in
app.get('/api/feed/:userId', authenticateToken, (req, res) => {
  // Example of accessing authenticated user's payload
  const userId = req.params.userId;
  const authenticatedUserId = (req as any).user.sub;
  // TODO: Validate userId against authenticatedUserId for additional security
  res.json({ message: 'Algo feed placeholder', user: (req as any).user });
    // TODO: Feed scoring logic goes here (Dave)
    res.json({ message: "Algo feed placeholder" });
});

app.listen(port, () => {
    console.log(`GitPulse API listening on port ${port}`);
});

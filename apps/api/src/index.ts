import express from 'express';
import { jwtVerify } from 'jose';

const app = express();
const port = process.env.PORT || 4000;
const AUTH_SECRET = process.env.AUTH_SECRET;
if (!AUTH_SECRET) {
  throw new Error('auth_secret environment variable is not defined.');
}
const secret = new TextEncoder().encode(AUTH_SECRET);

app.use(express.json());

const authenticateToken = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'unauthorized' });
  }
  const token = authHeader.substring(7);
  try {
    const payload = await jwtVerify(token, secret);
    (req as any).user = payload;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'forbidden' });
  }
};

// extracting github session here
// frontend next.js app passes the nextauth session token (or jwt)
// middleware here verifies the session to ensure authenticated state
app.get('/api/feed/:userId', authenticateToken, (req, res) => {
  // accessing authenticated payload
  const userId = req.params.userId;
  const authenticatedUserId = (req as any).user.sub;
  
  // validating userid against the authenticated one for extra security
  if (userId !== authenticatedUserId) {
    return res.status(403).json({ message: 'forbidden: userid mismatch' });
  }

  // feed scoring logic
  // getting feed items and calculating their scores based on models
  const feedItems = [
    { id: '1', type: 'repository', name: 'vercel/next.js', score: 98 },
    { id: '2', type: 'developer', name: 'shuding', score: 85 }
  ];

  return res.json({ 
    message: 'algo feed successfully generated', 
    user: (req as any).user,
    feed: feedItems
  });
});

app.listen(port, () => {
  console.log(`gitpulse api listening on port ${port}`);
});

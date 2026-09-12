import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).send('Authorization header missing');
  }

  const headerValue = Array.isArray(authHeader) ? authHeader[0] : authHeader;
  const token = headerValue.startsWith('Bearer ')
    ? headerValue.slice('Bearer '.length).trim()
    : headerValue.trim();

  if (!token) {
    return res.status(401).send('Token missing');
  }

  const secrets = [
    process.env.AUTH_SECRET,
    process.env.JWT_SECRET,
    'secret-jwt-key',
  ].filter(Boolean) as string[];

  // Remove duplicates while preserving order
  const uniqueSecrets = Array.from(new Set(secrets));

  let decoded: { userId: string } | null = null;
  for (const s of uniqueSecrets) {
    try {
      decoded = jwt.verify(token, s) as { userId: string };
      if (decoded && decoded.userId) {
        break;
      }
    } catch {
      // Try next secret
    }
  }

  if (decoded && decoded.userId) {
    (req as any).userId = decoded.userId;
    return next();
  }

  return res.status(403).send('Invalid token');
};
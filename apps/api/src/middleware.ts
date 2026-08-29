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

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }

  try {
    const decoded = jwt.verify(token, secret) as { userId: string };
    (req as any).userId = decoded.userId; // Attach userId to the request object
    next();
  } catch (error) {
    return res.status(403).send('Invalid token');
  }
};
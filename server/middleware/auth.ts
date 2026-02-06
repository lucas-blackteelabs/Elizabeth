import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// JWT secret should be in environment variables in a production app
const JWT_SECRET = process.env.JWT_SECRET || 'elizabeth-app-secret-key';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
  };
}

// Middleware to verify JWT token
export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  // Get token from cookies
  const token = req.cookies?.authToken;
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded as { id: number; username: string };
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Generate JWT token
export const generateToken = (userId: number, username: string): string => {
  return jwt.sign(
    { id: userId, username },
    JWT_SECRET,
    { expiresIn: '90d' } // Token expires in 90 days for persistent login
  );
};
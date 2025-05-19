import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { storage } from '../storage';
import { generateToken } from '../middleware/auth';
import { insertUserSchema } from '@shared/schema';
import { z } from 'zod';

// Registration validation schema
const registerSchema = insertUserSchema.extend({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Confirm password is required"),
  // Make sure optional fields are properly handled
  cancerType: z.string().nullable().optional(),
  cancerStage: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  diagnosis_date: z.string().nullable().optional()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterInput = z.infer<typeof registerSchema>;

// Login validation schema
const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

type LoginInput = z.infer<typeof loginSchema>;

// Register a new user
export const register = async (req: Request, res: Response) => {
  try {
    console.log('Registration request received:', req.body);
    
    // Validate input data
    const validatedData = registerSchema.parse(req.body);
    console.log('Validated data:', validatedData);
    
    // Check if username already exists
    const existingUser = await storage.getUserByUsername(validatedData.username);
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(validatedData.password, salt);
    
    // Create user object without confirmPassword
    const { confirmPassword, ...userData } = validatedData;
    
    // Store user in database with hashed password
    const userToCreate = {
      ...userData,
      password: hashedPassword,
      // Ensure nullable fields are properly set
      cancerType: userData.cancerType || null,
      cancerStage: userData.cancerStage || null,
      bio: userData.bio || null,
      diagnosis_date: userData.diagnosis_date || null
    };
    
    console.log('Creating user with data:', userToCreate);
    const user = await storage.createUser(userToCreate);
    
    // Generate JWT token
    const token = generateToken(user.id, user.username);
    
    // Set token in cookie
    res.cookie('authToken', token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
    });
    
    // Return user without password
    const { password, ...userWithoutPassword } = user;
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.errors);
      return res.status(400).json({ error: error.errors });
    }
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed: ' + (error instanceof Error ? error.message : 'Unknown error') });
  }
};

// Login user
export const login = async (req: Request, res: Response) => {
  try {
    // Validate input data
    const validatedData = loginSchema.parse(req.body);
    
    // Find user by username
    const user = await storage.getUserByUsername(validatedData.username);
    if (!user) {
      return res.status(400).json({ error: 'Invalid username or password' });
    }
    
    // Verify password
    const validPassword = await bcrypt.compare(validatedData.password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid username or password' });
    }
    
    // Generate JWT token
    const token = generateToken(user.id, user.username);
    
    // Set token in cookie
    res.cookie('authToken', token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
    });
    
    // Return user without password
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

// Logout user
export const logout = (req: Request, res: Response) => {
  res.clearCookie('authToken');
  res.json({ message: 'Logged out successfully' });
};

// Get current user
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const authReq = req as any;
    if (!authReq.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const user = await storage.getUser(authReq.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Return user without password
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Failed to get user information' });
  }
};
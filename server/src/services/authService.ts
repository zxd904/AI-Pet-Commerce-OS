import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'ai-pet-commerce-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const jwtOptions: jwt.SignOptions = {
  expiresIn: JWT_EXPIRES_IN as any
};

export function validateEmail(email: string): boolean {
  if (!email || email.length > 254) {
    return false;
  }
  return EMAIL_REGEX.test(email);
}

export interface User {
  id: number;
  email: string;
  fullName: string;
  subscriptionPlan: string;
  subscriptionStatus: string;
}

export interface TokenPayload {
  userId: number;
  email: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function generateToken(user: User): Promise<string> {
  const payload: TokenPayload = {
    userId: user.id,
    email: user.email
  };
  return new Promise((resolve, reject) => {
    jwt.sign(payload, JWT_SECRET, jwtOptions, (err, token) => {
      if (err) {
        reject(err);
      } else {
        resolve(token as string);
      }
    });
  });
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export async function registerUser(email: string, password: string, fullName: string): Promise<User> {
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new Error('邮箱已被注册');
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      fullName,
      subscriptionPlan: 'free',
      subscriptionStatus: 'active'
    }
  });

  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    subscriptionPlan: user.subscriptionPlan,
    subscriptionStatus: user.subscriptionStatus
  };
}

export async function loginUser(email: string, password: string): Promise<User | null> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return null;

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) return null;

  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    subscriptionPlan: user.subscriptionPlan,
    subscriptionStatus: user.subscriptionStatus
  };
}

export async function getUserById(userId: number): Promise<User | null> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    subscriptionPlan: user.subscriptionPlan,
    subscriptionStatus: user.subscriptionStatus
  };
}

export function generateApiKey(): string {
  return crypto.randomBytes(32).toString('hex');
}
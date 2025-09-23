import * as argon2 from 'argon2';
import crypto from 'crypto';

// Argon2id configuration for secure password hashing
const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 2 ** 16, // 64 MB
  timeCost: 3,         // 3 iterations
  parallelism: 1,      // 1 thread
};

/**
 * Hash a password using Argon2id with secure parameters
 * @param password - Plain text password to hash
 * @returns Promise<string> - Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    const hash = await argon2.hash(password, ARGON2_OPTIONS);
    return hash;
  } catch (error) {
    console.error('Password hashing failed:', error);
    throw new Error('Failed to hash password');
  }
}

/**
 * Verify a password against a hash using constant-time comparison
 * @param hash - The stored password hash
 * @param password - Plain text password to verify
 * @returns Promise<boolean> - True if password matches, false otherwise
 */
export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch (error) {
    console.error('Password verification failed:', error);
    return false;
  }
}

/**
 * Generate a secure random token for password reset
 * @returns string - Cryptographically secure random token
 */
export function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash a reset token for secure storage
 * @param token - Plain text reset token
 * @returns Promise<string> - Hashed token
 */
export async function hashResetToken(token: string): Promise<string> {
  return hashPassword(token);
}

/**
 * Verify a reset token against a hash
 * @param hash - The stored token hash
 * @param token - Plain text token to verify
 * @returns Promise<boolean> - True if token matches, false otherwise
 */
export async function verifyResetToken(hash: string, token: string): Promise<boolean> {
  return verifyPassword(hash, token);
}
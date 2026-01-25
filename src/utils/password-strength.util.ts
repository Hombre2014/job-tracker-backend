import * as bcrypt from 'bcrypt';

/**
 * Password strength validation utility
 * Checks if a plain-text password meets strong password requirements
 *
 * Requirements:
 * - At least 8 characters
 * - At least 1 uppercase letter (A-Z)
 * - At least 1 lowercase letter (a-z)
 * - At least 1 number (0-9)
 */

const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

/**
 * Check if a plain-text password is strong
 * @param password Plain-text password
 * @returns true if password meets strong password criteria
 */
export const isStrongPassword = (password: string): boolean => {
  return strongPasswordRegex.test(password);
};

/**
 * Check if a user's hashed password in the database was originally strong
 * This is done by comparing the provided plain-text password against the hash
 *
 * @param plainPassword Plain-text password from login attempt
 * @param hashedPassword Hashed password from database
 * @returns Promise<boolean> true if the original password was strong
 */
export const isHashedPasswordStrong = async (
  plainPassword: string,
  hashedPassword: string,
): Promise<boolean> => {
  // First verify the password matches
  const passwordMatches = await bcrypt.compare(plainPassword, hashedPassword);

  if (!passwordMatches) {
    return false;
  }

  // Check if the plain password meets strong password criteria
  return isStrongPassword(plainPassword);
};

/**
 * Get password strength requirement message
 * @returns String describing password requirements
 */
export const getPasswordStrengthMessage = (): string => {
  return 'Password must contain at least 8 characters, 1 uppercase, 1 lowercase, and 1 number';
};

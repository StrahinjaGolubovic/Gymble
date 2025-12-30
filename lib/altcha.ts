import { verifySolution } from 'altcha-lib';

// Get HMAC key from environment variable or use the provided key
// Must match the key used in the challenge endpoint
const HMAC_KEY = process.env.ALTCHA_HMAC_KEY;

if (!HMAC_KEY) {
  throw new Error('CRITICAL: ALTCHA_HMAC_KEY environment variable must be set');
}

export async function verifyAltcha(solution: string): Promise<boolean> {
  try {
    if (!solution) {
      return false;
    }
    const isValid = await verifySolution(solution, HMAC_KEY);
    return isValid;
  } catch (error) {
    console.error('ALTCHA verification error:', error);
    return false;
  }
}


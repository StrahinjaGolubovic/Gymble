import { verifySolution } from 'altcha-lib';

// Get ALTCHA_HMAC_KEY and validate on first use (not at module load to allow build)
function getHmacKey(): string {
  const key = process.env.ALTCHA_HMAC_KEY;
  if (!key) {
    throw new Error('CRITICAL: ALTCHA_HMAC_KEY environment variable must be set');
  }
  return key;
}

export async function verifyAltcha(solution: string): Promise<boolean> {
  try {
    if (!solution) {
      return false;
    }
    const isValid = await verifySolution(solution, getHmacKey());
    return isValid;
  } catch (error) {
    console.error('ALTCHA verification error:', error);
    return false;
  }
}


/**
 * Referral Link Utilities
 * Requirements: Affiliate 1, 4 - Generate referral links for marketing
 */

/**
 * Generate a referral link with the affiliate code
 */
export function generateReferralLink(code: string, path: string = '/'): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const url = new URL(path, baseUrl);
  url.searchParams.set('ref', code);
  return url.toString();
}

/**
 * Generate multiple referral links for different pages
 */
export function generateReferralLinks(code: string): {
  home: string;
  register: string;
  pricing: string;
} {
  return {
    home: generateReferralLink(code, '/'),
    register: generateReferralLink(code, '/register'),
    pricing: generateReferralLink(code, '/pricing'),
  };
}

/**
 * Copy referral link to clipboard
 */
export async function copyReferralLink(
  code: string,
  path?: string
): Promise<boolean> {
  try {
    const link = generateReferralLink(code, path);
    await navigator.clipboard.writeText(link);
    return true;
  } catch (error) {
    console.error('Failed to copy referral link:', error);
    return false;
  }
}

/**
 * Generate social media share links
 */
export function generateSocialShareLinks(code: string): {
  twitter: string;
  facebook: string;
  linkedin: string;
  email: string;
} {
  const referralLink = generateReferralLink(code);
  const message = encodeURIComponent(
    'Check out AIKEEDO - AI-powered content platform!'
  );

  return {
    twitter: `https://twitter.com/intent/tweet?text=${message}&url=${encodeURIComponent(referralLink)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralLink)}`,
    email: `mailto:?subject=${encodeURIComponent('Check out AIKEEDO')}&body=${message}%20${encodeURIComponent(referralLink)}`,
  };
}

/**
 * Marketing Materials API Route
 * GET /api/affiliate/materials
 * Requirements: Affiliate 4 - Access marketing materials
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { PrismaAffiliateRepository } from '@/infrastructure/affiliate/prisma-affiliate-repository';

export async function GET(_request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find affiliate
    const affiliateRepository = new PrismaAffiliateRepository();
    const affiliate = await affiliateRepository.findByUserId(session.user.id);

    if (!affiliate) {
      return NextResponse.json(
        { error: 'Affiliate account not found' },
        { status: 404 }
      );
    }

    // Generate marketing materials
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const referralUrl = `${baseUrl}?ref=${affiliate.code}`;

    const materials = {
      referralCode: affiliate.code,
      referralUrl,
      commissionRate: affiliate.commissionRate,
      tier: affiliate.tier,
      
      // Text snippets
      textSnippets: [
        {
          title: 'Short Description',
          content: `Join AIKEEDO and get access to powerful AI services! Use my referral code: ${affiliate.code}`,
        },
        {
          title: 'Long Description',
          content: `I've been using AIKEEDO for my AI needs and it's been amazing! They offer text generation, image creation, speech synthesis, and more. Sign up using my referral link and start creating: ${referralUrl}`,
        },
        {
          title: 'Social Media Post',
          content: `🚀 Unlock the power of AI with AIKEEDO!\n\n✨ Multiple AI providers in one platform\n💡 Easy-to-use interface\n🎯 Credit-based pricing\n\nSign up with my link: ${referralUrl}\n\n#AI #ArtificialIntelligence #AIKEEDO`,
        },
      ],

      // Email templates
      emailTemplates: [
        {
          title: 'Personal Recommendation',
          subject: 'Check out AIKEEDO - AI Services Platform',
          body: `Hi there!\n\nI wanted to share AIKEEDO with you - it's an amazing AI services platform that I've been using.\n\nWith AIKEEDO, you can:\n- Generate text with GPT, Claude, and other AI models\n- Create images with DALL-E\n- Convert text to speech\n- And much more!\n\nSign up using my referral link to get started:\n${referralUrl}\n\nLet me know if you have any questions!\n\nBest regards`,
        },
      ],

      // Banner images (URLs to be implemented)
      banners: [
        {
          size: '728x90',
          title: 'Leaderboard Banner',
          url: `${baseUrl}/banners/728x90.png`,
          html: `<a href="${referralUrl}" target="_blank"><img src="${baseUrl}/banners/728x90.png" alt="AIKEEDO - AI Services Platform" /></a>`,
        },
        {
          size: '300x250',
          title: 'Medium Rectangle',
          url: `${baseUrl}/banners/300x250.png`,
          html: `<a href="${referralUrl}" target="_blank"><img src="${baseUrl}/banners/300x250.png" alt="AIKEEDO - AI Services Platform" /></a>`,
        },
        {
          size: '160x600',
          title: 'Wide Skyscraper',
          url: `${baseUrl}/banners/160x600.png`,
          html: `<a href="${referralUrl}" target="_blank"><img src="${baseUrl}/banners/160x600.png" alt="AIKEEDO - AI Services Platform" /></a>`,
        },
      ],

      // Social media images
      socialImages: [
        {
          platform: 'Twitter',
          size: '1200x675',
          url: `${baseUrl}/social/twitter.png`,
        },
        {
          platform: 'Facebook',
          size: '1200x630',
          url: `${baseUrl}/social/facebook.png`,
        },
        {
          platform: 'Instagram',
          size: '1080x1080',
          url: `${baseUrl}/social/instagram.png`,
        },
      ],

      // Tracking links
      trackingLinks: {
        website: `${referralUrl}`,
        blog: `${referralUrl}&source=blog`,
        email: `${referralUrl}&source=email`,
        social: `${referralUrl}&source=social`,
        youtube: `${referralUrl}&source=youtube`,
      },
    };

    return NextResponse.json({
      success: true,
      data: materials,
    });
  } catch (error) {
    console.error('Get marketing materials error:', error);

    return NextResponse.json(
      { error: 'Failed to get marketing materials' },
      { status: 500 }
    );
  }
}

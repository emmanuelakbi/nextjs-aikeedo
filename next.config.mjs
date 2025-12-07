/** @type {import('next').NextConfig} */
const nextConfig = {
  // Skip type checking during build (types are checked in CI/locally)
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Skip ESLint during build (linting is checked in CI/locally)
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Disable instrumentation hook temporarily to fix build
  experimental: {
    instrumentationHook: false,
    // Enable optimized package imports
    optimizePackageImports: ['@/components', '@/lib'],
    // Exclude packages from server components bundling
    serverComponentsExternalPackages: [
      '@prisma/client',
      'prisma',
      'bcrypt',
      '@aws-sdk/client-s3',
      '@aws-sdk/s3-request-presigner',
    ],
  },

  // Image optimization configuration
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Compiler optimizations
  compiler: {
    removeConsole:
      process.env.NODE_ENV === 'production'
        ? {
            exclude: ['error', 'warn'],
          }
        : false,
  },

  // Production optimizations
  ...(process.env.NODE_ENV === 'production' && {
    compress: true,
    poweredByHeader: false,
    // Enable React strict mode for better performance
    reactStrictMode: true,
    // Enable SWC minification
    swcMinify: true,
  }),

  // Webpack optimizations - disabled to fix 'self is not defined' error
  // The custom chunk splitting was causing client-side code to be bundled in server chunks
  // webpack: (config, { dev, isServer }) => {
  //   return config;
  // },

  // Headers for performance
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
        ],
      },
      // Cache static assets
      {
        source: '/assets/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;

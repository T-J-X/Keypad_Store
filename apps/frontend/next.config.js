/** @type {import('next').NextConfig} */
const isProduction = process.env.NODE_ENV === 'production';
const imageHostCandidates = [
  process.env.NEXT_PUBLIC_VENDURE_HOST,
  'http://localhost:3000',
  'https://upload.wikimedia.org',
];

function toRemotePattern(input) {
  if (!input) return null;
  try {
    const parsed = new URL(input);
    return {
      protocol: parsed.protocol.replace(':', ''),
      hostname: parsed.hostname,
      port: parsed.port || '',
      pathname: '/**',
    };
  } catch {
    return null;
  }
}

const remotePatterns = Array.from(
  new Map(
    imageHostCandidates
      .map((value) => toRemotePattern(value))
      .filter((value) => value)
      .map((pattern) => [`${pattern.protocol}//${pattern.hostname}:${pattern.port}`, pattern]),
  ).values(),
);

const nextConfig = {
  reactStrictMode: true,
  cacheComponents: true,
  poweredByHeader: false,
  transpilePackages: ['@keypad-store/shared-utils'],
  images: {
    dangerouslyAllowLocalIP: process.env.NODE_ENV !== 'production',
    remotePatterns,
  },
  async headers() {
    const securityHeaders = [
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()' },
    ];

    if (isProduction) {
      securityHeaders.push({
        key: 'Strict-Transport-Security',
        value: 'max-age=31536000; includeSubDomains; preload',
      });
    }

    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store' },
        ],
      },
    ];
  },
};

export default nextConfig;

/** @type {import('next').NextConfig} */
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
  images: {
    dangerouslyAllowLocalIP: process.env.NODE_ENV !== 'production',
    remotePatterns,
  },
};

export default nextConfig;

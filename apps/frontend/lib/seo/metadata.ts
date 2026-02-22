import type { Metadata } from 'next';
import { resolvePublicSiteUrl } from '../siteUrl';

const SITE_NAME = 'Vehicle Control Technologies';
const BRAND_SUFFIX = ' | VCT';
const DEFAULT_OG_IMAGE = '/vct-logo.png';

type MetadataOptions = {
  title: string;
  description: string;
  canonical: string;
  keywords?: string[];
  noIndex?: boolean;
  type?: 'website' | 'article';
  image?: string;
};

function isAbsoluteUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

function normalizeCanonical(canonical: string) {
  const trimmed = canonical.trim();
  if (!trimmed) return '/';
  if (isAbsoluteUrl(trimmed)) return trimmed;
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

function toAbsoluteUrl(urlOrPath: string) {
  if (isAbsoluteUrl(urlOrPath)) return urlOrPath;
  const base = resolvePublicSiteUrl();
  const path = urlOrPath.startsWith('/') ? urlOrPath : `/${urlOrPath}`;
  return `${base}${path}`;
}

export function withBrandTitle(title: string) {
  const trimmed = title.trim();
  if (!trimmed) return 'VCT';
  return /\bVCT\b/i.test(trimmed) ? trimmed : `${trimmed}${BRAND_SUFFIX}`;
}

export function buildPageMetadata({
  title,
  description,
  canonical,
  keywords,
  noIndex = false,
  type = 'website',
  image = DEFAULT_OG_IMAGE,
}: MetadataOptions): Metadata {
  const normalizedCanonical = normalizeCanonical(canonical);
  const absoluteCanonical = toAbsoluteUrl(normalizedCanonical);
  const absoluteImage = toAbsoluteUrl(image);
  const socialTitle = withBrandTitle(title);

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: normalizedCanonical,
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
        }
      : undefined,
    openGraph: {
      title: socialTitle,
      description,
      url: absoluteCanonical,
      siteName: SITE_NAME,
      type,
      images: [
        {
          url: absoluteImage,
          width: 1200,
          height: 630,
          alt: SITE_NAME,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: socialTitle,
      description,
      images: [absoluteImage],
    },
  };
}

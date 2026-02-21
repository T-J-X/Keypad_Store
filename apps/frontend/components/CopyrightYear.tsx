'use client';

export default function CopyrightYear() {
  const year = new Date().getFullYear();
  return <span suppressHydrationWarning>{year}</span>;
}

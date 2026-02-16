import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'VCT | Vehicle Control Technologies',
        short_name: 'VCT',
        description: 'Configure technical keypads, map icon IDs, and export engineering-ready specifications.',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#ffffff',
        icons: [
            {
                src: '/vct-logo.png',
                sizes: 'any',
                type: 'image/png',
            },
        ],
    };
}

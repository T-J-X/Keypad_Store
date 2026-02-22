export type StitchHeroSpec = {
  readonly id: string;
  readonly icon: 'latency' | 'switch';
  readonly label: string;
};

export type StitchTechnicalSpec = {
  readonly id: string;
  readonly icon: 'chip' | 'palette' | 'build';
  readonly label: string;
};

export type StitchFeaturedProduct = {
  readonly id: string;
  readonly name: string;
  readonly subtitle: string;
  readonly priceLabel: string;
  readonly badge?: string;
  readonly href: string;
  readonly imageUrl: string;
  readonly imageAlt: string;
  readonly emphasis: 'featured' | 'standard';
};

export type StitchBottomNavItem = {
  readonly id: string;
  readonly label: string;
  readonly href: string;
};

export type StitchHomeData = {
  readonly badgeLabel: string;
  readonly headlineStart: string;
  readonly headlineAccent: string;
  readonly description: string;
  readonly modelLabel: string;
  readonly modelName: string;
  readonly modelPriceLabel: string;
  readonly heroImageUrl: string;
  readonly heroImageAlt: string;
  readonly heroSpecs: readonly StitchHeroSpec[];
  readonly technicalSpecs: readonly StitchTechnicalSpec[];
  readonly featuredProducts: readonly StitchFeaturedProduct[];
  readonly promoTitle: string;
  readonly promoBody: string;
  readonly promoHref: string;
  readonly bottomNav: readonly StitchBottomNavItem[];
};

export const STITCH_HOME_DATA: StitchHomeData = {
  badgeLabel: 'Next-Gen Sim Racing',
  headlineStart: 'Precision at your',
  headlineAccent: 'fingertips.',
  description:
    'Zero latency, mechanical precision, and complete customizability for elite simulation workflows.',
  modelLabel: 'Current Model',
  modelName: 'Apex-Pro V2',
  modelPriceLabel: '$189.00',
  heroImageUrl:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDBXiJ7b7t2DKsZ3_TThhqrCurNPgjIqOl3looyCnkxkWrIDeiM046AjN-syrIW4WzkuoDmwaB3g5VntpW9a-Bk_BHaM_mFwNiArqXtxmpW6GHnAKbOPYY5X3oFYc6NuydFGIhdlBBnLfGzYQScrIzCNqtpn-TKpnBwEaO6clBhQMWR502W51O0MSv3EG6zw5Npg-zuiNblEOtVePsR3vIIRLhV9Gfbs1XkUdqBcWeTPqCn803aP63j7k1bZswqi1dz0bWMyaM9m78',
  heroImageAlt: 'Premium sim racing keypad with RGB lighting',
  heroSpecs: [
    { id: 'latency', icon: 'latency', label: '0.1ms Latency' },
    { id: 'switch', icon: 'switch', label: 'Linear Gold' },
  ],
  technicalSpecs: [
    { id: 'chip', icon: 'chip', label: 'ARM Cortex M4' },
    { id: 'palette', icon: 'palette', label: '16.8M RGB Colors' },
    { id: 'build', icon: 'build', label: 'CNC Aluminum' },
  ],
  featuredProducts: [
    {
      id: 'velocity-x',
      name: 'Velocity X',
      subtitle: 'Carbon Series',
      priceLabel: '$149',
      badge: 'Best Seller',
      href: '/shop?section=keypads',
      imageUrl:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuACWXBxsHDj9LFoeP2DuUoHALZTQij66b4cneb98rc1ie8VshUZ4zKyhkUoSDaPe8zhjcwcr1IbBBXGQt3eXtsW2NS2jh9fyfBeQ5X7OaA4J887WCE5bm1-SIOM1BK5U1styXOK0icFrwM6KRqqoMKyGXA8-hSCdPUODBWikcc1T36MAyCNo71Nr6HtPtrjx5C_-lj4VeD3RfDS-SdmSyUOR_xh-s_iVFHhHoKJKKmPyyARUWi9Gez0MjHmKw1VfapOY9wj3-OKRhc',
      imageAlt: 'Velocity X racing keypad',
      emphasis: 'featured',
    },
    {
      id: 'drift-pad',
      name: 'Drift Pad',
      subtitle: 'Compact',
      priceLabel: '$99',
      href: '/shop?section=keypads',
      imageUrl:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuAdX8dV7ctf7Eb2Hy4LsfcS-NB69ZGkAPoEfsK4X1_qtOdIRnOUApyj13wdvpN4wDhs37yQ7RQ5xoFyZClFzfc2stFfTJBrRbFKQtzcM5Uq2gxvGxMhMZxksk35y6MhrhyS_VOZr1fTn7m8j8xFJWeV0a2lvJFIYKkI_JwLh53OxIFdWzLj5TMwt1ADxDe7xOJWTPoEa5MU3YYxQISeuHU1lWYdu36L4C-P-LxQ9JMtNWJe_7GetzNKsv5aqCxQZ0M47_INf72wYQ0',
      imageAlt: 'Drift Pad mini keypad',
      emphasis: 'standard',
    },
    {
      id: 'streamer-v2',
      name: 'Streamer V2',
      subtitle: 'Limited',
      priceLabel: '$199',
      href: '/shop?section=keypads',
      imageUrl:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBH60H8nNAB1LUNO-ZFg-alfm-_SpC16e8A8AI3k93oMUGMOQSPxO4eOIMWv3b8IRIsPBLw-Zegpn_HjO7M15uoZ8UhuOv6Qlo4LjMXoYhHDwlvbSrEICr-L_ydtyrdvueucrYs_B0rkuFSEbRl-Wb0jCQD6eU-1UiuDS-lvhJOlCQZn9mv5ArgtegJmRxNYyCy1Eh3wtIc9gg3GhpMOxNZtSbpZggYs5Wky6N71goz1PBAnUuTXfVDh9Vjiowz053IOUyTln83mkc',
      imageAlt: 'Streamer V2 keypad with RGB',
      emphasis: 'standard',
    },
  ],
  promoTitle: 'Build Your Own',
  promoBody: 'Customize switches, plates, and keycaps in our 3D configurator.',
  promoHref: '/configurator',
  bottomNav: [
    { id: 'home', label: 'Home', href: '/' },
    { id: 'shop', label: 'Shop', href: '/shop' },
    { id: 'orders', label: 'Orders', href: '/account?tab=orders' },
    { id: 'profile', label: 'Profile', href: '/account' },
  ],
};

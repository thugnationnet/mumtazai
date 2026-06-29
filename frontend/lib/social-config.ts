/**
 * SOCIAL MEDIA CONFIGURATION
 * Centralized social links for Mumtaz AI
 */

export const SOCIAL_LINKS = {
  x: {
    url: 'https://x.com/mumtazai',
    handle: '@mumtazai',
    label: 'X (Twitter)',
  },
  telegram: {
    url: 'https://t.me/mumtazai',
    handle: '@mumtazai',
    label: 'Telegram',
  },
  line: {
    url: 'https://line.me/ti/p/@mumtazai',
    handle: '@mumtazai',
    label: 'LINE',
  },
  instagram: {
    url: 'https://instagram.com/mumtazai',
    handle: '@mumtazai',
    label: 'Instagram',
  },
  facebook: {
    url: 'https://www.facebook.com/profile.php?id=61555473113271',
    handle: '@mumtazai',
    label: 'Facebook',
  },
  tiktok: {
    url: 'https://tiktok.com/@mumtazai',
    handle: '@mumtazai',
    label: 'TikTok',
  },
  github: {
    url: 'https://github.com/aidigitalfriend',
    handle: 'aidigitalfriend',
    label: 'GitHub',
  },
} as const;

export const SOCIAL_ARRAY = [
  { key: 'x', ...SOCIAL_LINKS.x },
  { key: 'telegram', ...SOCIAL_LINKS.telegram },
  { key: 'line', ...SOCIAL_LINKS.line },
  { key: 'instagram', ...SOCIAL_LINKS.instagram },
  { key: 'facebook', ...SOCIAL_LINKS.facebook },
  { key: 'tiktok', ...SOCIAL_LINKS.tiktok },
  { key: 'github', ...SOCIAL_LINKS.github },
];

export default SOCIAL_LINKS;

import { POSTER_TEMPLATE_KEYS, PosterTemplateKey } from '@art-edu/shared';

export interface PosterRecipe {
  templateKey: PosterTemplateKey;
  studentName: string;
  createdOn: string;
  theme: string;
  watermarkText: string;
  logoUrl: string | null;
  logoEmbedded: boolean;
  overlays: Array<'name' | 'createdOn' | 'logo' | 'watermark'>;
  background: string;
  accent: string;
  frame: string;
}

export const TEMPLATE_STYLES: Record<
  PosterTemplateKey,
  { background: string; accent: string; frame: string; title: string }
> = {
  classic: {
    background: '#F6EFE4',
    accent: '#3D2B1F',
    frame: '#8B5A2B',
    title: '课堂作品',
  },
  gallery: {
    background: '#F4F1EA',
    accent: '#1F2937',
    frame: '#111827',
    title: 'Gallery',
  },
  festival: {
    background: '#FFF4E6',
    accent: '#9A3412',
    frame: '#C2410C',
    title: '节日展示',
  },
};

export function isPosterTemplateKey(value: string): value is PosterTemplateKey {
  return (POSTER_TEMPLATE_KEYS as readonly string[]).includes(value);
}

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function buildWatermarkTiles(text: string, accent: string): string {
  const safe = escapeXml(text);
  const tiles: string[] = [];
  for (let y = 80; y < 1600; y += 220) {
    for (let x = -40; x < 1100; x += 320) {
      tiles.push(
        `<text x="${x}" y="${y}" fill="${accent}" fill-opacity="0.12" font-size="22" font-family="Noto Sans CJK SC, WenQuanYi Micro Hei, sans-serif" transform="rotate(-18 ${x} ${y})">${safe}</text>`,
      );
    }
  }
  return tiles.join('');
}

export function buildPosterSvg(params: {
  artworkDataUri: string;
  logoDataUri: string | null;
  recipe: PosterRecipe;
}): string {
  const { artworkDataUri, logoDataUri, recipe } = params;
  const style = TEMPLATE_STYLES[recipe.templateKey];
  const name = escapeXml(recipe.studentName);
  const date = escapeXml(recipe.createdOn);
  const theme = escapeXml(recipe.theme);
  const watermark = buildWatermarkTiles(recipe.watermarkText, style.accent);
  const logo = logoDataUri
    ? `<image href="${logoDataUri}" x="48" y="36" width="96" height="96" preserveAspectRatio="xMidYMid meet"/>`
    : `<rect x="48" y="36" width="96" height="96" rx="16" fill="${style.frame}"/><text x="96" y="94" text-anchor="middle" fill="#fff" font-size="28" font-family="sans-serif">LOGO</text>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1620" viewBox="0 0 1080 1620">
  <rect width="1080" height="1620" fill="${style.background}"/>
  ${watermark}
  ${logo}
  <text x="168" y="78" fill="${style.accent}" font-size="36" font-family="Noto Sans CJK SC, WenQuanYi Micro Hei, sans-serif">${escapeXml(style.title)}</text>
  <text x="168" y="120" fill="${style.accent}" font-size="22" font-family="Noto Sans CJK SC, WenQuanYi Micro Hei, sans-serif">${theme}</text>
  <rect x="72" y="168" width="936" height="1120" fill="${style.frame}"/>
  <rect x="96" y="192" width="888" height="1072" fill="#ffffff"/>
  <image href="${artworkDataUri}" x="120" y="216" width="840" height="1024" preserveAspectRatio="xMidYMid slice"/>
  <text x="96" y="1380" fill="${style.accent}" font-size="48" font-weight="700" font-family="Noto Sans CJK SC, WenQuanYi Micro Hei, sans-serif">${name}</text>
  <text x="96" y="1440" fill="${style.accent}" font-size="28" font-family="Noto Sans CJK SC, WenQuanYi Micro Hei, sans-serif">${date}</text>
  <text x="96" y="1520" fill="${style.accent}" font-size="22" font-family="Noto Sans CJK SC, WenQuanYi Micro Hei, sans-serif">${escapeXml(recipe.watermarkText)}</text>
</svg>`;
}

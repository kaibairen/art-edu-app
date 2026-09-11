import { POSTER_TEMPLATE_KEYS, PosterTemplateKey, WatermarkPosition } from '@art-edu/shared';

export interface PosterRecipe {
  templateKey: PosterTemplateKey;
  studentName: string;
  createdAt: string;
  title: string;
  watermarkText: string;
  watermarkOpacity: number;
  watermarkPosition: WatermarkPosition;
  logoUrl: string;
  logoEmbedded: boolean;
  overlays: Array<'name' | 'createdAt' | 'logo' | 'watermark'>;
  background: string;
  accent: string;
  frame: string;
}

export const TEMPLATE_STYLES: Record<
  PosterTemplateKey,
  { background: string; accent: string; frame: string; title: string }
> = {
  simple: {
    background: '#F7F4EE',
    accent: '#1F2937',
    frame: '#D6D3D1',
    title: '简约',
  },
  frame: {
    background: '#F6EFE4',
    accent: '#3D2B1F',
    frame: '#8B5A2B',
    title: '画框',
  },
  magazine: {
    background: '#FFF4E6',
    accent: '#9A3412',
    frame: '#C2410C',
    title: '杂志',
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

export function watermarkAnchor(position: WatermarkPosition): { x: number; y: number } {
  switch (position) {
    case 'topLeft':
      return { x: 96, y: 80 };
    case 'topRight':
      return { x: 984, y: 80 };
    case 'bottomLeft':
      return { x: 96, y: 1560 };
    case 'center':
      return { x: 540, y: 810 };
    case 'bottomRight':
    default:
      return { x: 984, y: 1560 };
  }
}

export function buildWatermarkTiles(
  text: string,
  accent: string,
  opacity: number,
): string {
  const safe = escapeXml(text);
  const tiles: string[] = [];
  const fillOpacity = Math.min(Math.max(opacity, 0), 1);
  for (let y = 80; y < 1600; y += 220) {
    for (let x = -40; x < 1100; x += 320) {
      tiles.push(
        `<text x="${x}" y="${y}" fill="${accent}" fill-opacity="${fillOpacity}" font-size="22" font-family="Noto Sans CJK SC, WenQuanYi Micro Hei, sans-serif" transform="rotate(-18 ${x} ${y})">${safe}</text>`,
      );
    }
  }
  return tiles.join('');
}

export function buildPosterSvg(params: {
  artworkDataUri: string;
  logoDataUri: string;
  recipe: PosterRecipe;
}): string {
  const { artworkDataUri, logoDataUri, recipe } = params;
  const style = TEMPLATE_STYLES[recipe.templateKey];
  const name = escapeXml(recipe.studentName);
  const date = escapeXml(recipe.createdAt);
  const title = escapeXml(recipe.title || style.title);
  const watermark = buildWatermarkTiles(
    recipe.watermarkText,
    style.accent,
    recipe.watermarkOpacity,
  );
  const logoPos = watermarkAnchor(recipe.watermarkPosition);
  const logo =
    `<image href="${logoDataUri}" x="${logoPos.x - 48}" y="${Math.max(logoPos.y - 60, 24)}" width="96" height="96" preserveAspectRatio="xMidYMid meet"/>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1620" viewBox="0 0 1080 1620">
  <rect width="1080" height="1620" fill="${style.background}"/>
  ${watermark}
  ${logo}
  <text x="168" y="78" fill="${style.accent}" font-size="36" font-family="Noto Sans CJK SC, WenQuanYi Micro Hei, sans-serif">${escapeXml(style.title)}</text>
  <text x="168" y="120" fill="${style.accent}" font-size="22" font-family="Noto Sans CJK SC, WenQuanYi Micro Hei, sans-serif">${title}</text>
  <rect x="72" y="168" width="936" height="1120" fill="${style.frame}"/>
  <rect x="96" y="192" width="888" height="1072" fill="#ffffff"/>
  <image href="${artworkDataUri}" x="120" y="216" width="840" height="1024" preserveAspectRatio="xMidYMid slice"/>
  <text x="96" y="1380" fill="${style.accent}" font-size="48" font-weight="700" font-family="Noto Sans CJK SC, WenQuanYi Micro Hei, sans-serif">${name}</text>
  <text x="96" y="1440" fill="${style.accent}" font-size="28" font-family="Noto Sans CJK SC, WenQuanYi Micro Hei, sans-serif">${date}</text>
  <text x="96" y="1520" fill="${style.accent}" font-size="22" font-family="Noto Sans CJK SC, WenQuanYi Micro Hei, sans-serif">${escapeXml(recipe.watermarkText)}</text>
</svg>`;
}

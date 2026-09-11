import {
  buildPosterSvg,
  buildWatermarkTiles,
  isPosterTemplateKey,
  PosterRecipe,
  TEMPLATE_STYLES,
} from './poster-templates';

describe('poster templates', () => {
  it('recognizes the three P0 contract templates', () => {
    expect(isPosterTemplateKey('simple')).toBe(true);
    expect(isPosterTemplateKey('frame')).toBe(true);
    expect(isPosterTemplateKey('magazine')).toBe(true);
    expect(isPosterTemplateKey('classic')).toBe(false);
    expect(isPosterTemplateKey('gallery')).toBe(false);
    expect(isPosterTemplateKey('festival')).toBe(false);
    expect(Object.keys(TEMPLATE_STYLES)).toEqual(['simple', 'frame', 'magazine']);
  });

  it('embeds name, createdAt, logo and watermark in every template SVG', () => {
    for (const templateKey of ['simple', 'frame', 'magazine'] as const) {
      const style = TEMPLATE_STYLES[templateKey];
      const recipe: PosterRecipe = {
        templateKey,
        studentName: '小明',
        createdAt: '2026-09-11T00:00:00.000Z',
        title: '春天的树',
        watermarkText: '星光美术水印',
        watermarkOpacity: 0.2,
        watermarkPosition: 'bottomRight',
        logoUrl: 'http://example/logo.png',
        logoEmbedded: true,
        overlays: ['name', 'createdAt', 'logo', 'watermark'],
        background: style.background,
        accent: style.accent,
        frame: style.frame,
      };
      const svg = buildPosterSvg({
        artworkDataUri: 'data:image/png;base64,AAAA',
        logoDataUri: 'data:image/png;base64,LOGO',
        recipe,
      });
      expect(svg).toContain('小明');
      expect(svg).toContain('2026-09-11T00:00:00.000Z');
      expect(svg).toContain('星光美术水印');
      expect(svg).toContain('data:image/png;base64,LOGO');
      expect(svg).toContain(TEMPLATE_STYLES[templateKey].background);
      expect(svg).not.toContain('预览');
    }
  });

  it('marks preview renders with a badge and keeps name/date/logo/watermark', () => {
    const style = TEMPLATE_STYLES.simple;
    const svg = buildPosterSvg({
      artworkDataUri: 'data:image/png;base64,AAAA',
      logoDataUri: 'data:image/png;base64,LOGO',
      previewBadge: true,
      recipe: {
        templateKey: 'simple',
        studentName: '小明',
        createdAt: '2026-09-11T00:00:00.000Z',
        title: '春天的树',
        watermarkText: '星光美术水印',
        watermarkOpacity: 0.2,
        watermarkPosition: 'bottomRight',
        logoUrl: 'http://example/logo.png',
        logoEmbedded: true,
        overlays: ['name', 'createdAt', 'logo', 'watermark'],
        background: style.background,
        accent: style.accent,
        frame: style.frame,
      },
    });
    expect(svg).toContain('预览');
    expect(svg).toContain('小明');
    expect(svg).toContain('2026-09-11T00:00:00.000Z');
  });

  it('tiles watermark text across the canvas', () => {
    const tiles = buildWatermarkTiles('机构水印', '#111111', 0.12);
    expect(tiles.split('机构水印').length).toBeGreaterThan(5);
  });
});

import {
  buildPosterSvg,
  buildWatermarkTiles,
  isPosterTemplateKey,
  PosterRecipe,
  TEMPLATE_STYLES,
} from './poster-templates';

describe('poster templates', () => {
  it('recognizes the three MVP templates', () => {
    expect(isPosterTemplateKey('classic')).toBe(true);
    expect(isPosterTemplateKey('gallery')).toBe(true);
    expect(isPosterTemplateKey('festival')).toBe(true);
    expect(isPosterTemplateKey('unknown')).toBe(false);
    expect(Object.keys(TEMPLATE_STYLES)).toEqual([
      'classic',
      'gallery',
      'festival',
    ]);
  });

  it('embeds name, created time, logo and watermark in every template SVG', () => {
    for (const templateKey of ['classic', 'gallery', 'festival'] as const) {
      const recipe: PosterRecipe = {
        templateKey,
        studentName: '小明',
        createdOn: '2026-09-11',
        theme: '春天的树',
        watermarkText: '星光美术水印',
        logoUrl: null,
        logoEmbedded: true,
        overlays: ['name', 'createdOn', 'logo', 'watermark'],
        ...TEMPLATE_STYLES[templateKey],
      };
      const svg = buildPosterSvg({
        artworkDataUri: 'data:image/png;base64,AAAA',
        logoDataUri: 'data:image/png;base64,LOGO',
        recipe,
      });
      expect(svg).toContain('小明');
      expect(svg).toContain('2026-09-11');
      expect(svg).toContain('星光美术水印');
      expect(svg).toContain('data:image/png;base64,LOGO');
      expect(svg).toContain(TEMPLATE_STYLES[templateKey].background);
    }
  });

  it('tiles watermark text across the canvas', () => {
    const tiles = buildWatermarkTiles('机构水印', '#111111');
    expect(tiles.split('机构水印').length).toBeGreaterThan(5);
  });
});

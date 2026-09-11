/** 美术教培 APP design/01 — JS/TS 常量，与 tokens.css / Flutter tokens 对齐 */
export const color = {
  brand: '#2F6FED',
  brandPressed: '#2458C4',
  ink: '#1A1A1A',
  inkSecondary: '#5C5C5C',
  inkTertiary: '#8A8A8A',
  bg: '#FFFFFF',
  bgSubtle: '#F5F6F8',
  border: 'rgba(0,0,0,0.08)',
  success: '#1B8F5A',
  warning: '#C47E00',
  danger: '#D14343',
} as const;

export const font = {
  display: { size: 22, line: 30, weight: 600 },
  title: { size: 17, line: 24, weight: 600 },
  body: { size: 15, line: 22, weight: 400 },
  bodyEmphasis: { size: 15, line: 22, weight: 500 },
  caption: { size: 13, line: 18, weight: 400 },
  badge: { size: 12, line: 16, weight: 500 },
} as const;

/** 间距基准 4；常用 8 / 12 / 16 / 24 */
export const space = {
  base: 4,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  6: 24,
} as const;

export const radius = {
  card: 12,
  control: 8,
  tag: 4,
} as const;

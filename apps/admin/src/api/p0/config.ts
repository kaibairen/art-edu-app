/** P0 Mock 默认基址。业务页继续用 `VITE_API_BASE_URL` + `../http.ts`。 */
export const DEFAULT_P0_BASE_URL = 'http://localhost:4010/api/v1';

export const P0_TOKEN_STORAGE_KEY = 'artedu_p0_token';

export function resolveP0BaseURL(override?: string): string {
  if (override) return trimSlash(override);
  const fromEnv = import.meta.env.VITE_P0_API_BASE_URL;
  if (typeof fromEnv === 'string' && fromEnv.length > 0) {
    return trimSlash(fromEnv);
  }
  return DEFAULT_P0_BASE_URL;
}

function trimSlash(url: string): string {
  return url.replace(/\/+$/, '');
}

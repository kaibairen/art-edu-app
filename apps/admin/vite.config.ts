import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // api-types 的 dist 是 CJS named export，Vite 打包读不到 P1_HOME_PATHS。
      '@art-edu/api-types': fileURLToPath(
        new URL('../../packages/api-types/src/index.ts', import.meta.url),
      ),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
});

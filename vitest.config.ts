import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    globals: true, // volitelné – pokud chceš `describe/it/expect` bez importu
    css: true,     // pokud renderuješ komponenty závislé na CSS
  },
});

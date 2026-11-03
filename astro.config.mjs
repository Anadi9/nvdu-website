// @ts-check
import { defineConfig } from 'astro/config';

// Static site for Cloudflare Pages. English at /, Hindi at /hi/.
export default defineConfig({
  site: 'https://nakshatravedshala.org',
  output: 'static',
  trailingSlash: 'always',
  i18n: {
    locales: ['en', 'hi'],
    defaultLocale: 'en',
    routing: { prefixDefaultLocale: false }
  }
});

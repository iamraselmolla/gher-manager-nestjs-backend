import { join } from 'path';
import {
  AcceptLanguageResolver,
  HeaderResolver,
  I18nModule,
  QueryResolver,
} from 'nestjs-i18n';

/**
 * Bilingual (Bangla/English) backend text — validation errors, notification
 * bodies, PDF report labels, etc. Language resolution order per request:
 *   1. `?lang=en` query param
 *   2. `x-lang` custom header (mobile/web apps set this from user preference)
 *   3. Accept-Language header
 *   4. DEFAULT_LANGUAGE env fallback (bn)
 *
 * Domain data itself (fish species names, feed categories, etc.) is NOT
 * translated through this mechanism — those live in DB tables with a
 * language-neutral `key` plus a translations table, per the spec. This
 * module is only for backend-authored UI/system text.
 */
export const i18nModuleConfig = I18nModule.forRootAsync({
  useFactory: () => ({
    fallbackLanguage: process.env.DEFAULT_LANGUAGE ?? 'bn',
    loaderOptions: {
      path: join(__dirname),
      watch: process.env.NODE_ENV === 'development',
    },
  }),
  resolvers: [
    { use: QueryResolver, options: ['lang'] },
    new HeaderResolver(['x-lang']),
    AcceptLanguageResolver,
  ],
});

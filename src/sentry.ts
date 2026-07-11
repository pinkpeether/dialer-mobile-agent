import * as Sentry from '@sentry/react-native';
import Config from 'react-native-config';

let initialized = false;

export function initSentry() {
  if (initialized) return;
  const dsn = Config.SENTRY_DSN;
  if (!dsn) {
    console.log('[sentry] no DSN, skipping init');
    return;
  }
  Sentry.init({
    dsn,
    environment: Config.APP_ENV ?? 'production',
    tracesSampleRate: 0.1,
    // PII: numbers / SIP URIs live in breadcrumbs — scrub before send.
    beforeBreadcrumb(bc) {
      if (bc.message) bc.message = bc.message.replace(/\+?\d{7,}/g, '<phone>');
      return bc;
    },
  });
  initialized = true;
}

export const captureException = (err: unknown, extra?: Record<string, unknown>) => {
  if (!initialized) return;
  Sentry.captureException(err, { extra });
};

export const wrap = Sentry.wrap;

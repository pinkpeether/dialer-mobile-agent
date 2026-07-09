import Config from 'react-native-config';

export const APP_CONFIG = {
  API_URL: Config.API_URL ?? 'https://dialer-backend-production.up.railway.app',
  WS_URL: Config.WS_URL ?? 'wss://dialer-backend-production.up.railway.app',
  SIP_WSS_URL: Config.SIP_WSS_URL ?? '',
  SIP_DOMAIN: Config.SIP_DOMAIN ?? '',
  APP_ENV: Config.APP_ENV ?? 'production',
  SOCKET_DEBUG: Config.SOCKET_DEBUG === 'true',
} as const;

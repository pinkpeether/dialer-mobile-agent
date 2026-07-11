/**
 * Minimal analytics facade. Swap the sink for Segment/PostHog later without
 * touching call sites. All events are counters + duration; NO PII.
 */
type EventName =
  | 'app_open'
  | 'login_success'
  | 'login_failed'
  | 'call_started'
  | 'call_ended'
  | 'call_failed'
  | 'disposition_saved'
  | 'sms_sent'
  | 'push_received'
  | 'network_reconnect';

export function track(event: EventName, props?: Record<string, string | number | boolean>) {
  // Structured console log — collected by logcat during pilot, moved to a real sink in v1.1.
  console.log('[analytics]', event, props ?? {});
}

export function timing(event: EventName, durationMs: number, props?: Record<string, string | number | boolean>) {
  track(event, { ...(props ?? {}), duration_ms: Math.round(durationMs) });
}

import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';

export function useAppState(handler: (next: AppStateStatus, prev: AppStateStatus) => void) {
  const prev = useRef<AppStateStatus>(AppState.currentState);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      handler(next, prev.current);
      prev.current = next;
    });
    return () => sub.remove();
  }, [handler]);
}

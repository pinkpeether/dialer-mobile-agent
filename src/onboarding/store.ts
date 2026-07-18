import { create } from 'zustand';
import { MMKV } from 'react-native-mmkv';
import type { StepId } from './steps';
const kv = new MMKV({ id: 'onboarding' });

type S = {
  completed: boolean;
  step: StepId;
  setStep: (s: StepId) => void;
  complete: () => void;
  reset: () => void;
};
export const useOnboarding = create<S>((set) => ({
  completed: kv.getBoolean('completed') ?? false,
  step: (kv.getString('step') as StepId) ?? 'welcome',
  setStep: (step) => { kv.set('step', step); set({ step }); },
  complete: () => { kv.set('completed', true); set({ completed: true }); },
  reset: () => { kv.delete('completed'); kv.set('step', 'welcome'); set({ completed: false, step: 'welcome' }); },
}));

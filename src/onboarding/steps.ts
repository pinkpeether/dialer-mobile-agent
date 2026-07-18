export type StepId = 'welcome' | 'permissions' | 'battery' | 'oem' | 'sip' | 'done';
export const STEP_ORDER: StepId[] = ['welcome','permissions','battery','oem','sip','done'];
export const nextStep = (s: StepId) => STEP_ORDER[STEP_ORDER.indexOf(s) + 1] ?? 'done';

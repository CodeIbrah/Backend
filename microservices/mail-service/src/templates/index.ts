export const TEMPLATE_IDS = [
  'account-recovery',
  'policy-change',
  'payment-receipt',
] as const;

export type TemplateId = (typeof TEMPLATE_IDS)[number];

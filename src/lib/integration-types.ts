export const INTEGRATION_IDS = [
  "hotmart",
  "google-calendar",
  "zoom",
  "whatsapp",
  "moloni",
  "resend",
  "meta",
] as const;

export type IntegrationId = (typeof INTEGRATION_IDS)[number];
export type IntegrationStatus = {
  id: IntegrationId;
  configured: boolean;
  requiredVariables: string[];
};

/**
 * Contrato de integração progressiva com os apps Learn.
 * A conexão só é considerada ativa quando o ambiente fornece todos os campos
 * públicos de identificação e a conta de serviço permanece exclusivamente no servidor.
 */
export type FirebaseIntegrationConfig = {
  projectId?: string;
  appId?: string;
  publicApiKey?: string;
  syncEndpoint?: string;
};

export type FirebaseConnectionState = {
  ready: boolean;
  missing: string[];
};

export function getFirebaseConnectionState(config: FirebaseIntegrationConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  appId: process.env.FIREBASE_APP_ID,
  publicApiKey: process.env.FIREBASE_PUBLIC_API_KEY,
  syncEndpoint: process.env.LEARN_SYNC_ENDPOINT,
}): FirebaseConnectionState {
  const required: Array<[string, string | undefined]> = [
    ["FIREBASE_PROJECT_ID", config.projectId],
    ["FIREBASE_APP_ID", config.appId],
    ["FIREBASE_PUBLIC_API_KEY", config.publicApiKey],
    ["LEARN_SYNC_ENDPOINT", config.syncEndpoint],
  ];

  const missing = required.filter(([, value]) => !value?.trim()).map(([key]) => key);
  return { ready: missing.length === 0, missing };
}

export const learnSyncResources = [
  "institutions",
  "classrooms",
  "enrollments",
  "activities",
  "submissions",
  "learningSignals",
  "interventions",
] as const;

export type LearnSyncResource = (typeof learnSyncResources)[number];

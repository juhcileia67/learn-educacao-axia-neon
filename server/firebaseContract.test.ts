import { describe, expect, it } from "vitest";
import { getFirebaseConnectionState, learnSyncResources } from "./firebaseContract";

describe("contrato de integração Firebase", () => {
  it("mantém a integração inativa e explícita sem configuração", () => {
    expect(getFirebaseConnectionState({})).toEqual({
      ready: false,
      missing: ["FIREBASE_PROJECT_ID", "FIREBASE_APP_ID", "FIREBASE_PUBLIC_API_KEY", "LEARN_SYNC_ENDPOINT"],
    });
  });

  it("declara os recursos que poderão ser sincronizados entre os apps e o portal", () => {
    expect(learnSyncResources).toContain("classrooms");
    expect(learnSyncResources).toContain("interventions");
  });
});

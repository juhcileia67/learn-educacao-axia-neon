import { describe, expect, it } from "vitest";
import { hasPlatformPermission, isInstitutionalRole, isTeachingRole, roleLabels } from "../shared/platformRoles";

describe("matriz de permissões Learn", () => {
  it("separa os papéis institucionais da área individual do aluno", () => {
    expect(isInstitutionalRole("aluno")).toBe(false);
    expect(isInstitutionalRole("coordenacao")).toBe(true);
    expect(isInstitutionalRole("diretoria")).toBe(true);
  });

  it("mantém ferramentas pedagógicas disponíveis para professor e gestão", () => {
    expect(isTeachingRole("professor")).toBe(true);
    expect(isTeachingRole("admin")).toBe(true);
    expect(roleLabels.aluno).toBe("Aluno");
  });

  it("permite operações funcionais somente aos perfis previstos", () => {
    expect(hasPlatformPermission("professor", "classroom:manage")).toBe(true);
    expect(hasPlatformPermission("professor", "activity:manage")).toBe(true);
    expect(hasPlatformPermission("aluno", "student:submission:write")).toBe(true);
    expect(hasPlatformPermission("aluno", "activity:manage")).toBe(false);
    expect(hasPlatformPermission("diretoria", "permission:manage")).toBe(false);
    expect(hasPlatformPermission("admin", "institution:manage")).toBe(true);
  });
});

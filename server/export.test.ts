import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

describe("platform.exportMyData", () => {
  it("exports only the authenticated user's profile data shape", async () => {
    const now = new Date();
    const user: NonNullable<TrpcContext["user"]> = {
      id: 42,
      openId: "private-open-id",
      name: "Aluno de Teste",
      email: "aluno@example.com",
      loginMethod: "test",
      role: "aluno",
      createdAt: now,
      updatedAt: now,
      lastSignedIn: now,
    };
    const ctx: TrpcContext = {
      user,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };
    const result = await appRouter.createCaller(ctx).platform.exportMyData();

    expect(result.profile).toMatchObject({ name: "Aluno de Teste", email: "aluno@example.com", role: "aluno" });
    expect(result).not.toHaveProperty("openId");
    expect(result.studentData).toEqual({ assignments: [], submissions: [], recognitions: [] });
    expect(result.teachingData).toEqual({ submissions: [], recognitions: [], interventions: [], journals: [] });
  });

  it("rejects unauthenticated requests", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);

    await expect(caller.platform.exportMyData()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});


describe("platform.exportMyData por perfil", () => {
  it("inclui dados de docência e instituição sem openId para perfis autorizados", async () => {
    const now = new Date();
    const baseUser = {
      id: 43,
      openId: "another-private-open-id",
      name: "Profissional Learn",
      email: "profissional@example.com",
      loginMethod: "test",
      createdAt: now,
      updatedAt: now,
      lastSignedIn: now,
    } as const;

    const teacherResult = await appRouter.createCaller({
      user: { ...baseUser, role: "professor" },
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    }).platform.exportMyData();
    expect(teacherResult).toEqual(expect.objectContaining({ exportedAt: expect.any(String), profile: expect.objectContaining({ role: "professor" }), classes: [], studentData: expect.any(Object), teachingData: expect.objectContaining({ interventions: expect.any(Array), journals: expect.any(Array) }), institutionalData: { institutions: [], classrooms: [] } }));
    expect(teacherResult.profile).not.toHaveProperty("openId");
    expect(teacherResult.profile).not.toHaveProperty("loginMethod");
    expect(teacherResult.profile).not.toHaveProperty("lastSignedIn");

    const adminResult = await appRouter.createCaller({
      user: { ...baseUser, role: "admin" },
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    }).platform.exportMyData();
    expect(adminResult).toEqual(expect.objectContaining({ exportedAt: expect.any(String), profile: expect.objectContaining({ role: "admin" }), institutionalData: { institutions: [], classrooms: [] }, teachingData: expect.any(Object) }));
    expect(adminResult.profile).not.toHaveProperty("openId");
    expect(adminResult.profile).not.toHaveProperty("loginMethod");
    expect(adminResult.profile).not.toHaveProperty("lastSignedIn");

    for (const role of ["coordenacao", "diretoria"] as const) {
      const result = await appRouter.createCaller({
        user: { ...baseUser, role },
        req: { protocol: "https", headers: {} } as TrpcContext["req"],
        res: {} as TrpcContext["res"],
      }).platform.exportMyData();
      expect(result.profile.role).toBe(role);
      expect(result.institutionalData).toEqual({ institutions: [], classrooms: [] });
      expect(result.profile).not.toHaveProperty("openId");
      expect(result.profile).not.toHaveProperty("loginMethod");
      expect(result.profile).not.toHaveProperty("lastSignedIn");
    }
  });
});

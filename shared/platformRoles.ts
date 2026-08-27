/**
 * Atlas Neon Imersivo: linguagem única de papéis e permissões para os apps
 * Learn e o portal web, evitando cruzamento indevido de dados institucionais.
 */
export const platformRoles = ["user", "aluno", "professor", "coordenacao", "diretoria", "admin"] as const;
export type PlatformRole = (typeof platformRoles)[number];

export const roleLabels: Record<PlatformRole, string> = {
  user: "Aluno",
  aluno: "Aluno",
  professor: "Professor",
  coordenacao: "Coordenação",
  diretoria: "Diretoria",
  admin: "Administrador institucional",
};

export const permissionValues = [
  "student:self:read",
  "student:submission:write",
  "classroom:read",
  "classroom:manage",
  "activity:manage",
  "student:detail:read",
  "signal:read",
  "intervention:manage",
  "institution:read",
  "report:read",
  "institution:manage",
  "permission:manage",
] as const;

export type PlatformPermission = (typeof permissionValues)[number];

export const permissionsByRole: Record<PlatformRole, readonly PlatformPermission[]> = {
  user: ["student:self:read", "student:submission:write"],
  aluno: ["student:self:read", "student:submission:write"],
  professor: ["classroom:read", "classroom:manage", "activity:manage", "student:detail:read", "signal:read", "intervention:manage"],
  coordenacao: ["classroom:read", "student:detail:read", "signal:read", "intervention:manage", "institution:read", "report:read"],
  diretoria: ["classroom:read", "institution:read", "report:read"],
  admin: ["classroom:read", "classroom:manage", "activity:manage", "student:detail:read", "signal:read", "intervention:manage", "institution:read", "report:read", "institution:manage", "permission:manage"],
};

export function hasPlatformPermission(role: string, permission: PlatformPermission) {
  const normalized = platformRoles.includes(role as PlatformRole) ? (role as PlatformRole) : "user";
  return permissionsByRole[normalized].includes(permission);
}

export function isInstitutionalRole(role: PlatformRole) {
  return role === "coordenacao" || role === "diretoria" || role === "admin";
}

export function isTeachingRole(role: PlatformRole) {
  return role === "professor" || isInstitutionalRole(role);
}

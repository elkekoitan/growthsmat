// SmartGrowth OS — Rol ve izin motoru v1 (PRD FR-004–FR-005, 03-TEKNIK-MIMARI §14)
// "Tenant bağlamı kimlik tokenından türetilmez; her istekte üyelik doğrulanır" ilkesi:
// hasPermission daima hem kullanıcı HEM çalışma alanı eşleşmesi arar — yalnız rol yetmez.

export type Role =
  | "sahip"
  | "yonetici"
  | "planlayici"
  | "saha-calisani"
  | "kalite"
  | "satis"
  | "goruntuleyici"
  | "uzman";

export type Permission =
  | "site.read"
  | "site.write"
  | "plan.read"
  | "plan.approve"
  | "task.execute"
  | "task.assign"
  | "lot.create"
  | "lot.adjust"
  | "lot.recall"
  | "compliance.review"
  | "claim.publish"
  | "commerce.manage"
  | "channel.connect"
  | "finance.read"
  | "finance.export"
  | "device.command"
  | "workspace.manage"
  | "support.grant";

export const ALL_PERMISSIONS: Permission[] = [
  "site.read", "site.write", "plan.read", "plan.approve", "task.execute", "task.assign",
  "lot.create", "lot.adjust", "lot.recall", "compliance.review", "claim.publish",
  "commerce.manage", "channel.connect", "finance.read", "finance.export", "device.command",
  "workspace.manage", "support.grant",
];

export const ROLE_LABELS: Record<Role, string> = {
  sahip: "Sahip",
  yonetici: "Yönetici",
  planlayici: "Planlayıcı",
  "saha-calisani": "Saha çalışanı",
  kalite: "Kalite",
  satis: "Satış",
  goruntuleyici: "Görüntüleyici",
  uzman: "Uzman",
};

// Her rolün varsayılan izin seti — en az ayrıcalık ilkesiyle tanımlı.
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  sahip: ALL_PERMISSIONS,
  yonetici: ALL_PERMISSIONS.filter((p) => p !== "workspace.manage"),
  planlayici: ["site.read", "plan.read", "plan.approve", "task.execute", "task.assign", "lot.create"],
  "saha-calisani": ["site.read", "plan.read", "task.execute", "lot.create", "device.command"],
  kalite: ["site.read", "plan.read", "lot.create", "lot.adjust", "lot.recall", "compliance.review"],
  satis: ["site.read", "plan.read", "commerce.manage", "channel.connect", "finance.read"],
  goruntuleyici: ["site.read", "plan.read", "finance.read"],
  uzman: ["site.read", "plan.read", "compliance.review", "claim.publish"],
};

/** Bir rolün belirli bir izne sahip olup olmadığını kontrol eder. */
export function can(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function canAny(role: Role, permissions: Permission[]): boolean {
  return permissions.some((p) => can(role, p));
}

export function canAll(role: Role, permissions: Permission[]): boolean {
  return permissions.every((p) => can(role, p));
}

/**
 * Prisma'nın generated `Role` enum'u, şemadaki `@map("saha-calisani")` yönünü YALNIZ
 * veritabanı sütun değerine uygular — çalışma zamanında Prisma Client her zaman şemada
 * tanımlanan alt çizgili tanımlayıcıyı (`"saha_calisani"`) döner, tireli runtime string'i
 * (`"saha-calisani"`) DEĞİL (doğrulandı: `tsc` bu ikisini birebir aynı literal tip
 * saymıyor — "saha_calisani" is not assignable to type 'Role'). Bu fonksiyon, Server
 * Component'lerin `requireMembership()`'ten okuduğu ham Prisma rolünü uygulamanın `Role`
 * tipine güvenle eşler. Yalnız düz `string` alır — bu dosya Prisma'yı import ETMEZ,
 * no-restricted-imports kuralını bozmaz.
 */
export function fromPrismaRole(prismaRole: string): Role {
  return (prismaRole === "saha_calisani" ? "saha-calisani" : prismaRole) as Role;
}

/** `fromPrismaRole`'un tersi — yazma yönü (örn. prisma/seed.ts'ten Membership.role'a atarken). */
export function toPrismaRole(role: Role): string {
  return role === "saha-calisani" ? "saha_calisani" : role;
}

// ---------- Çok kiracılı üyelik doğrulama ----------
export interface Membership {
  userId: string;
  workspaceId: string;
  role: Role;
  status: "aktif" | "askida" | "iptal";
}

/**
 * Bir kullanıcının BELİRLİ bir çalışma alanında izni olup olmadığını kontrol eder.
 * Aynı kullanıcının BAŞKA çalışma alanındaki üyeliği asla dikkate alınmaz — tenant
 * izolasyonu (03-TEKNIK-MIMARI §18: "aynı e-posta birden fazla workspace; yanlış
 * tenant verisi dönmez").
 */
export function hasPermission(
  memberships: Membership[],
  userId: string,
  workspaceId: string,
  permission: Permission
): boolean {
  const membership = memberships.find(
    (m) => m.userId === userId && m.workspaceId === workspaceId && m.status === "aktif"
  );
  if (!membership) return false;
  return can(membership.role, permission);
}

export function findMembership(
  memberships: Membership[],
  userId: string,
  workspaceId: string
): Membership | undefined {
  return memberships.find((m) => m.userId === userId && m.workspaceId === workspaceId);
}

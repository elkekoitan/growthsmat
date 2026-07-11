// SmartGrowth OS — Offline outbox idempotent senkron protokolü (03-TEKNIK-MIMARI §10.2-10.3)
// "Sunucu aynı operationId'yi ikinci kez uygulatmaz." Otomatik last-write-wins YOK;
// miktar/stok çakışmasında domain kontrolü ve kullanıcı çözümü gerekir (FR-076).

export interface Operation {
  operationId: string;
  deviceId: string;
  entityType: string;
  entityId: string;
  baseVersion: number;
  mutation: Record<string, unknown>;
  clientTimestamp: string; // ISO
}

export interface EntityRecord {
  version: number;
  data: Record<string, unknown>;
  tombstone?: boolean;
}

export interface ServerState {
  entities: Record<string, EntityRecord>;
  appliedOperationIds: string[];
}

export type ApplyResult = "applied" | "duplicate" | "conflict" | "deleted";

export interface ApplyOutcome {
  state: ServerState;
  result: ApplyResult;
  newVersion?: number;
  reason?: string;
}

export function emptyState(): ServerState {
  return { entities: {}, appliedOperationIds: [] };
}

/**
 * Bir operasyonu idempotent uygular. Aynı operationId ikinci kez gelirse state
 * DEĞİŞMEZ ('duplicate'). baseVersion mevcut sürümle uyuşmazsa 'conflict' —
 * otomatik üzerine yazma yapılmaz. Giriş state'i asla mutate edilmez.
 */
export function applyOperation(state: ServerState, op: Operation): ApplyOutcome {
  // Idempotency: aynı operationId tekrar uygulanmaz
  if (state.appliedOperationIds.includes(op.operationId)) {
    return { state, result: "duplicate", reason: "Bu operationId zaten uygulandı" };
  }

  const existing = state.entities[op.entityId];

  // Tombstone: silinmiş entity'e yazma çakışmadır (yetki iptali/silme sonrası)
  if (existing?.tombstone) {
    return { state, result: "deleted", reason: "Entity silinmiş (tombstone) — yazılamaz" };
  }

  const currentVersion = existing?.version ?? 0;

  // Sürüm uyuşmazlığı → conflict, otomatik last-write-wins YOK
  if (op.baseVersion !== currentVersion) {
    return {
      state,
      result: "conflict",
      reason: `baseVersion ${op.baseVersion} ≠ sunucu sürümü ${currentVersion}`,
    };
  }

  const newVersion = currentVersion + 1;
  const nextState: ServerState = {
    entities: {
      ...state.entities,
      [op.entityId]: {
        version: newVersion,
        data: { ...(existing?.data ?? {}), ...op.mutation },
      },
    },
    appliedOperationIds: [...state.appliedOperationIds, op.operationId],
  };

  return { state: nextState, result: "applied", newVersion };
}

/** Bir operasyon dizisini sırayla uygular; sonuçları toplar. */
export function applyBatch(state: ServerState, ops: Operation[]): { state: ServerState; results: ApplyResult[] } {
  let cur = state;
  const results: ApplyResult[] = [];
  for (const op of ops) {
    const outcome = applyOperation(cur, op);
    cur = outcome.state;
    results.push(outcome.result);
  }
  return { state: cur, results };
}

// ---------- Çakışma çözüm politikaları (FR-076, §10.3) ----------

export type ConflictPolicy = "ekleme-birlestir" | "durum-koru" | "kullanici-secsin";

export interface ConflictResolution {
  resolved: boolean;
  data?: Record<string, unknown>;
  candidates?: { server: Record<string, unknown>; client: Record<string, unknown> };
  note: string;
}

/**
 * Çakışan sunucu verisi + istemci mutasyonunu politikaya göre çözer.
 * 'kullanici-secsin' asla otomatik karar VERMEZ — iki sürümü döner.
 */
export function resolveConflict(
  serverData: Record<string, unknown>,
  clientMutation: Record<string, unknown>,
  policy: ConflictPolicy
): ConflictResolution {
  if (policy === "ekleme-birlestir") {
    // Dizi alanları birleşir, tekrarsız
    const merged: Record<string, unknown> = { ...serverData };
    for (const [k, v] of Object.entries(clientMutation)) {
      const sv = serverData[k];
      if (Array.isArray(sv) && Array.isArray(v)) {
        merged[k] = Array.from(new Set([...sv, ...v]));
      } else {
        merged[k] = v;
      }
    }
    return { resolved: true, data: merged, note: "Ekleme olayları birleştirildi" };
  }

  if (policy === "durum-koru") {
    // Görev 'done' durumu istemci geri almaya çalışsa da korunur
    const merged = { ...serverData, ...clientMutation };
    if (serverData.status === "done" && clientMutation.status && clientMutation.status !== "done") {
      merged.status = "done";
      return { resolved: true, data: merged, note: "Tamamlanmış durum korundu (geri alınmadı)" };
    }
    return { resolved: true, data: merged, note: "Durum güncellendi" };
  }

  // kullanici-secsin: otomatik karar yok
  return {
    resolved: false,
    candidates: { server: serverData, client: clientMutation },
    note: "Miktar/stok çakışması — kullanıcı çözümü gerekir",
  };
}

/** Portable player progress. Only imports data for the exact story revision. */
import { z } from "zod";
import { itemSchema, safeMedia, type Runtime, type Work } from "../schema";

export const MAX_BACKUP_BYTES = 2 * 1024 * 1024;
type BackupWork = Pick<Work, "id" | "updatedAt">;

const scalar = z.union([z.string(), z.number(), z.boolean()]);
const uiValue = z.union([scalar, z.array(z.string())]);
const stringList = z.array(z.string()).max(20000);
const savedStateSchema = z.object({
  workId: z.string(),
  revision: z.number().finite(),
  date: z.string().optional(),
  elapsedMs: z.number().finite().nonnegative().optional(),
  clockRemainderMs: z.number().finite().nonnegative().optional(),
  scheduled: z
    .array(z.object({ nodeId: z.string(), due: z.number().finite().nonnegative() }))
    .max(2000)
    .optional(),
  incomingCall: z
    .object({
      caller: z.string(),
      target: z.string(),
      status: z.enum(["ringing", "answered"]),
    })
    .nullable()
    .optional(),
  ui: z.record(z.string(), z.record(z.string(), uiValue)).optional(),
  variables: z.record(z.string(), scalar),
  visited: stringList,
  read: stringList,
  clues: stringList,
  unlocked: stringList,
  hidden: stringList,
  completed: stringList,
  notifications: stringList,
  endings: stringList,
  choices: z.array(z.object({ label: z.string(), target: z.string() })).max(2000),
  messages: z.record(z.string(), z.array(itemSchema).max(2000)),
  time: z.string(),
  trace: z.array(z.string().max(1000)).max(500),
});

const backupSchema = z
  .object({
    format: z.literal("foundphone-save-v1"),
    workId: z.string(),
    revision: z.number().finite(),
    exportedAt: z.string(),
    state: savedStateSchema,
  })
  .strict();

function checkCompatible(work: BackupWork, state: Runtime) {
  if (state.workId !== work.id || state.revision !== work.updatedAt)
    throw new Error("存档与当前故事或版本不匹配，请打开对应版本后再导入。");
}

function checkMedia(state: Runtime) {
  for (const items of Object.values(state.messages)) {
    for (const item of items) {
      if ((item.media && !safeMedia(item.media)) || (item.avatar && !safeMedia(item.avatar)))
        throw new Error("存档包含不受支持的媒体资源。");
    }
  }
}

/** Produces a versioned JSON save; no network request is made. */
export function serializeBackup(work: BackupWork, state: Runtime): string {
  checkCompatible(work, state);
  const clean = savedStateSchema.parse(state);
  checkMedia(clean);
  const json = JSON.stringify({
    format: "foundphone-save-v1",
    workId: work.id,
    revision: work.updatedAt,
    exportedAt: new Date().toISOString(),
    state: clean,
  }, null, 2);
  if (new TextEncoder().encode(json).length > MAX_BACKUP_BYTES)
    throw new Error("存档超过 2 MB，暂时不能导出。");
  return json;
}

/** Verifies schema, story ID, revision, and media before writing to IndexedDB. */
export function parseBackup(work: BackupWork, input: string): Runtime {
  if (new TextEncoder().encode(input).length > MAX_BACKUP_BYTES)
    throw new Error("存档超过 2 MB，请选择正确的备份文件。");
  const backup = backupSchema.parse(JSON.parse(input));
  if (backup.workId !== backup.state.workId || backup.revision !== backup.state.revision)
    throw new Error("存档文件内容不一致。");
  checkCompatible(work, backup.state);
  checkMedia(backup.state);
  return backup.state;
}

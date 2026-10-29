import type { Item, Runtime, Work } from "../schema";
import { traceFor } from "./world";

export type ReaderRecord = {
  app: string;
  item: Item;
  trace: string;
};
export type CrossAppEcho = {
  trace: string;
  sources: ReaderRecord[];
  appCount: number;
};

/**
 * Reconstruct the player's archive from the actual saved read IDs, not from
 * all authored private content. A source remains invisible until read.
 * The same item may appear in the Work and in synced messages: show it once.
 */
export function readKpopArchive(work: Work, runtime: Runtime): ReaderRecord[] {
  const permitted = new Set(runtime.read);
  const added = new Set<string>();
  const records: ReaderRecord[] = [];
  const collections = [work.data, runtime.messages];
  for (const collection of collections) {
    for (const [app, items] of Object.entries(collection)) {
      for (const item of items) {
        if (!permitted.has(item.id) || added.has(item.id)) continue;
        added.add(item.id);
        records.push({ app, item, trace: traceFor(item) });
      }
    }
  }
  return records.sort((a, b) =>
    b.item.time.localeCompare(a.item.time) || a.item.id.localeCompare(b.item.id));
}

/** A cross-App echo is a comparison of observed sources, NOT a finding of romance. */
export function crossAppEchoes(records: ReaderRecord[]): CrossAppEcho[] {
  const groups = new Map<string, ReaderRecord[]>();
  for (const entry of records) {
    if (!entry.trace) continue;
    const list = groups.get(entry.trace) || [];
    list.push(entry);
    groups.set(entry.trace, list);
  }
  return [...groups.entries()]
    .map(([trace, sources]) => ({
      trace,
      sources: sources.slice().sort((a, b) =>
        a.item.time.localeCompare(b.item.time) || a.item.id.localeCompare(b.item.id)),
      appCount: new Set(sources.map(x => x.app)).size,
    }))
    .filter(entry => entry.appCount >= 2)
    .sort((a, b) => b.appCount - a.appCount || a.trace.localeCompare(b.trace));
}

/**
 * Only report traces with actual opened evidence. The engine's general clue
 * flags are useful for navigation but must not leak unseen narrative facts.
 */
export function verifiedReadTraces(records: ReaderRecord[]): string[] {
  return [...new Set(records.filter(x => x.trace).map(x => x.trace))];
}

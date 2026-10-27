import { describe, expect, it } from "vitest";
import { initialRuntime, type Work } from "../schema";
import { MAX_BACKUP_BYTES, parseBackup, serializeBackup } from "./saveBackup";

const work = {
  id: "sample-phone",
  updatedAt: 3,
  phone: { date: "2026-10-27", time: "09:41" },
  variables: {},
} as Work;

function sample() {
  const state = initialRuntime(work);
  state.read.push("note-1");
  state.ui = { settings: { wifi: true, brightness: 50 } };
  state.endings = ["已找到机主"];
  return state;
}

describe("portable story saves", () => {
  it("preserves progress and UI state for the exact story revision", () => {
    const original = sample();
    const json = serializeBackup(work, original);
    expect(parseBackup(work, json)).toEqual(original);
    expect(JSON.parse(json).format).toBe("foundphone-save-v1");
  });

  it("rejects a backup from another story or revision", () => {
    const json = serializeBackup(work, sample());
    expect(() => parseBackup({ id: "another", updatedAt: 3 }, json)).toThrow("不匹配");
    expect(() => parseBackup({ id: work.id, updatedAt: 4 }, json)).toThrow("不匹配");
  });

  it("rejects tampered, invalid, and oversized input", () => {
    const backup = JSON.parse(serializeBackup(work, sample()));
    backup.state.workId = "tampered";
    expect(() => parseBackup(work, JSON.stringify(backup))).toThrow("不一致");
    expect(() => parseBackup(work, "not-json")).toThrow();
    expect(() => parseBackup(work, "x".repeat(MAX_BACKUP_BYTES + 1))).toThrow("2 MB");
  });

  it("rejects executable or remote media in runtime messages", () => {
    const backup = JSON.parse(serializeBackup(work, sample()));
    backup.state.messages = {
      messages: [{
        id: "message-1",
        title: "附带链接",
        body: "hi",
        time: "09:41",
        sender: "机主",
        media: "javascript:alert(1)",
      }],
    };
    expect(() => parseBackup(work, JSON.stringify(backup))).toThrow("媒体资源");
  });
});

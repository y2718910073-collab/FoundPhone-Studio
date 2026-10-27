import { describe, expect, it } from "vitest";
import { buildChatExchange, characterReply, decodeChatEntry } from "./fictionChat";
import { makeDemoWav } from "./DemoAudio";

describe("fictional message replies", () => {
  it("replies using each character's story context", () => {
    expect(characterReply("唐夏", "我捡到了江予晴的手机")).toContain("蓝色票根");
    expect(characterReply("沈之遥", "备忘录密码是多少")).toContain("0917");
    expect(characterReply("徐言", "书少了几本")).toContain("12");
    expect(characterReply("何主任", "你好")).toContain("交");
    expect(characterReply("拾光书屋·志愿者（5）", "大家在吗")).toBeTruthy();
  });
  it("saves both sides and keeps older user messages compatible", () => {
    const old = ["唐夏\t旧格式消息"];
    const result = buildChatExchange("唐夏", "你好", old);
    expect(result).toHaveLength(3);
    expect(decodeChatEntry(old[0])).toEqual({thread:"唐夏", text:"旧格式消息", incoming:false});
    expect(decodeChatEntry(result[1])?.incoming).toBe(false);
    expect(decodeChatEntry(result[2])?.incoming).toBe(true);
    expect(decodeChatEntry(result[2])?.text).toContain("在");
  });
  it("does not allow empty or unlimited player input", () => {
    expect(buildChatExchange("唐夏", "   ", [])).toEqual([]);
    const entries = buildChatExchange("唐夏", "x".repeat(500), []);
    expect(decodeChatEntry(entries[0])!.text.length).toBe(250);
  });
});
describe("offline original audio", () => {
  it("creates a valid sized playable RIFF/WAV blob without downloading assets", () => {
    const wav = makeDemoWav("rain", 2, 8000);
    expect(wav.type).toBe("audio/wav");
    expect(wav.size).toBe(44 + 2 * 2 * 8000);
  });
  it("is deterministic in size across selected track ids", () => {
    expect(makeDemoWav("blue", 1, 12000).size).toBe(makeDemoWav("paper", 1, 12000).size);
  });
});

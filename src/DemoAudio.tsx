import { useEffect, useState } from "react";
import type { Item } from "./schema";

/** Small original synthesized loops: no remote API, media download or third-party recording. */
export function makeDemoWav(seed: string, seconds = 24, sampleRate = 12000): Blob {
  const count = Math.floor(seconds * sampleRate);
  const buffer = new ArrayBuffer(44 + count * 2);
  const view = new DataView(buffer);
  const write = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
  };
  write(0, "RIFF");
  view.setUint32(4, 36 + count * 2, true);
  write(8, "WAVE");
  write(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  write(36, "data");
  view.setUint32(40, count * 2, true);
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) hash = Math.imul(hash ^ seed.charCodeAt(i), 16777619);
  const style = Math.abs(hash % 4);
  const bpm = [76, 92, 106, 83][style];
  const steps = [0, 2, 3, 7, 5, 3, 2, -2, 0, 4, 7, 9, 7, 5, 2, 0];
  const chords = [0, 5, 7, 3];
  const base = 42 + (Math.abs(hash) % 5) + (style === 2 ? 5 : 0);
  const freq = (midi: number) => 440 * 2 ** ((midi - 69) / 12);
  const tau = 2 * Math.PI;
  for (let n = 0; n < count; n++) {
    const t = n / sampleRate;
    const beat = t * bpm / 60;
    const sub = Math.floor(beat * 2);
    const phase = beat * 2 - sub;
    const root = chords[Math.floor(beat / 4) % 4];
    const degree = steps[(sub + (hash >>> 5) % steps.length) % steps.length];
    const melody = freq(base + 24 + root + degree);
    const bass = freq(base + root);
    const attack = Math.min(1, phase * 20);
    const decay = Math.exp(-phase * (style === 1 ? 4.8 : 3.8));
    const lead = (Math.sin(tau * melody * t) + 0.25 * Math.sin(tau * melody * 2 * t)) * attack * decay;
    const pad = (Math.sin(tau * bass * 2 * t) + 0.32 * Math.sin(tau * bass * 2.5 * t)) * 0.21;
    const pulse = Math.exp(-(beat % 1) * 20) * Math.sin(tau * bass * t) * (style === 2 ? 0.23 : 0.1);
    const shimmer = Math.sin(tau * melody * 0.5 * t + Math.sin(t * 0.5) * 0.2) * 0.05;
    const fade = Math.min(1, t * 2, (seconds - t) * 1.6);
    const sample = Math.max(-1, Math.min(1, (lead * 0.4 + pad + pulse + shimmer) * Math.max(0, fade)));
    view.setInt16(44 + n * 2, sample * 28000, true);
  }
  return new Blob([buffer], { type: "audio/wav" });
}

export function DemoAudioPlayer({ item }: { item: Item }) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    setSrc("");
    const url = URL.createObjectURL(makeDemoWav(item.id));
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [item.id]);
  return (
    <div className="original-audio-player">
      <audio key={item.id} controls loop preload="metadata" playsInline src={src} aria-label={`播放${item.title}`} />
      <small>原创合成试听 · 24 秒循环 · 不连接 Spotify 服务器</small>
    </div>
  );
}

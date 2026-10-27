import { useEffect, useState } from "react";

/**
 * Optional on-device animation diagnostics, enabled only with ?fps=1.
 * Measures requestAnimationFrame callbacks, not the screen's physical Hz.
 */
export function FrameRateMonitor() {
  const [fps, setFps] = useState<number | null>(null);
  useEffect(() => {
    let frame = 0;
    let last = performance.now();
    let frames = 0;
    const sample = (now: number) => {
      frames += 1;
      const elapsed = now - last;
      if (elapsed >= 1000) {
        setFps(Math.round((frames * 1000) / elapsed));
        last = now;
        frames = 0;
      }
      frame = requestAnimationFrame(sample);
    };
    frame = requestAnimationFrame(sample);
    return () => cancelAnimationFrame(frame);
  }, []);
  return (
    <output className="runtime-fps-monitor" aria-label="帧率监测" data-testid="fps-monitor">
      {fps == null ? "测量 FPS…" : `${fps} FPS`}
    </output>
  );
}

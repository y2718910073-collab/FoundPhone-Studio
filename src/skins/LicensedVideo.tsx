import { useEffect, useRef, useState } from "react";
import { X, Play, ExternalLink } from "lucide-react";
import type { Item } from "../schema";
import "./licensed-video.css";

/** Intentionally tiny allowlist: no copyrighted Netflix/Bilibili video scraping. */
export const OPEN_VIDEOS = {
  "big-buck-bunny": {
    title: "Big Buck Bunny · 大雄兔",
    src: "https://uploads.video-commander.com/sample/BigBuckBunny.mp4",
    attribution: "© 2008 Blender Foundation / bigbuckbunny.org · CC BY 3.0 · 保留影片片尾字幕",
    website: "https://peach.blender.org/",
  },
  "flower": {
    title: "Flower · 花朵视频",
    src: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    attribution: "MDN 演示素材 · CC0（公共领域）",
    website: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video",
  },
  "bunny-sample": {
    title: "Big Buck Bunny · 10 秒片段",
    src: "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4",
    attribution: "© 2008 Blender Foundation / bigbuckbunny.org · CC BY 3.0 · 演示剪辑",
    website: "https://peach.blender.org/",
  },
} as const;
export type OpenVideoId = keyof typeof OPEN_VIDEOS;
export function hasOpenVideo(item: Pick<Item, "meta">) {
  const id = item.meta?.openVideo;
  return !!id && Object.hasOwn(OPEN_VIDEOS, id);
}
export function OpenVideoPlayer({ videoId, active = true }: { videoId: OpenVideoId; active?: boolean }) {
  const player = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState(false);
  const clip = OPEN_VIDEOS[videoId];
  useEffect(() => {
    const el = player.current;
    if (!active && el) el.pause();
  }, [active]);
  useEffect(() => setError(false), [videoId]);
  return (
    <div className="open-video-stream">
      {error ? (
        <p role="status">视频源暂时无法连接，请检查网络或使用下方原始来源链接。</p>
      ) : (
        <video
          key={videoId}
          ref={player}
          controls
          playsInline
          preload="metadata"
          src={clip.src}
          aria-label={`播放影片：${clip.title}`}
          onError={() => setError(true)}
        />
      )}
      <p>{clip.attribution}</p>
      <a href={clip.website} target="_blank" rel="noopener noreferrer"><ExternalLink size={13} /> 影片来源与版权信息</a>
    </div>
  );
}
export function LicensedVideoDialog({ item, onClose }: { item: Item; onClose: () => void }) {
  const videoId = item.meta?.openVideo;
  if (!videoId || !Object.hasOwn(OPEN_VIDEOS, videoId)) return null;
  return (
    <div className="licensed-video-backdrop" onClick={onClose}>
      <section className="licensed-video-dialog" role="dialog" aria-modal="true" aria-label={`播放${item.title}`} onClick={e=>e.stopPropagation()}>
        <header><strong><Play size={16} /> {item.title}</strong><button aria-label="关闭视频" onClick={onClose}><X size={20} /></button></header>
        <OpenVideoPlayer videoId={videoId as OpenVideoId}/>
        <p className="licensed-video-about">{item.body}</p>
        <small>这不是官方 Netflix / B 站 / YouTube 内容，播放的是有明确开放许可的演示影片。</small>
      </section>
    </div>
  );
}

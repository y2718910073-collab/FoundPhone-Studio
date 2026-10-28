import { useEffect, useState, type ChangeEvent } from "react";
import { createRoot } from "react-dom/client";
import { Phone } from "../Phone";
import { db } from "../persistence";
import { validateWork, type Work } from "../schema";
import { MAX_BACKUP_BYTES, parseBackup, serializeBackup } from "./saveBackup";
import { FrameRateMonitor } from "./FrameRateMonitor";
import { KpopSetup } from "../kpop/Setup";
import { createKpopWork } from "../kpop/content";
import { readKpopProfile, type KpopProfile } from "../kpop/profile";
import "../styles.css";
import "./player.css";

function StoryPlayer() {
  const [work, setWork] = useState<Work | null>(null);
  const [kpopBase, setKpopBase] = useState<Work | null>(null);
  const isKpop = new URLSearchParams(location.search).get("mode") === "kpop";
  const [initialized, setInitialized] = useState(!isKpop);
  const [error, setError] = useState("");
  const [backupStatus, setBackupStatus] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const abort = new AbortController();
    fetch(
      new URLSearchParams(location.search).get("preview") === "test"
        ? "./test-work.json"
        : new URLSearchParams(location.search).get("template") === "blank"
          ? "./blank-work.json"
          : "./work.json",
      { signal: abort.signal },
    )
      .then((r) => {
        if (!r.ok) throw Error("缺少作品文件，请运行 npm run story:build");
        return r.json();
      })
      .then((x) => {
        const w = validateWork(x);
        document.title =
          w.title === "捡手机" ? "捡手机" : w.title + " · 捡手机";
        if (isKpop) {
          setKpopBase(w);
          if (new URLSearchParams(location.search).get("new") !== "1") {
            const savedProfile = readKpopProfile();
            if (savedProfile) {
              setWork(createKpopWork(w,savedProfile));
              setInitialized(true);
            }
          }
        } else setWork(w);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(String(e));
      });
    return () => abort.abort();
  }, []);

  function startKpop(profile: KpopProfile) {
    if (!kpopBase) return;
    const w = createKpopWork(kpopBase, profile);
    document.title = w.title + " · 捡手机";
    setWork(w);
    setInitialized(true);
  }

  async function exportBackup() {
    if (!work || busy) return;
    setBusy(true);
    setBackupStatus("");
    try {
      const saved = await db.saves.get(work.id);
      if (!saved) throw new Error("还没有存档，请先开始游玩。");
      const json = serializeBackup(work, saved.state);
      const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
      try {
        const link = document.createElement("a");
        link.href = url;
        link.download = `foundphone-${work.id.replace(/[^a-zA-Z0-9_-]/g, "_")}-save.json`;
        document.body.append(link);
        link.click();
        link.remove();
        setBackupStatus("存档文件已生成，可在浏览器下载列表中查看。");
      } finally {
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    } catch (cause) {
      setBackupStatus(cause instanceof Error ? cause.message : "导出失败，请重试。");
    } finally {
      setBusy(false);
    }
  }

  async function importBackup(e: ChangeEvent<HTMLInputElement>) {
    const file = e.currentTarget.files?.[0];
    e.currentTarget.value = "";
    if (!work || !file || busy) return;
    setBusy(true);
    setBackupStatus("");
    try {
      if (file.size > MAX_BACKUP_BYTES)
        throw new Error("存档超过 2 MB，请选择正确的备份文件。");
      const restored = parseBackup(work, await file.text());
      if (!window.confirm("导入会覆盖当前手机的游玩进度。确定继续吗？")) return;
      // Unmount Phone before writing, so its autosave cannot overwrite the import.
      setWork(null);
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      await db.saves.put({ id: work.id, state: restored });
      window.location.reload();
    } catch (cause) {
      setBackupStatus(cause instanceof Error ? cause.message : "导入失败，请检查文件。");
      // If IndexedDB fails, re-open the current story without destroying it.
      setWork(work);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="story-runtime">
      {new URLSearchParams(location.search).get("fps") === "1" && <FrameRateMonitor />}
      {isKpop && !initialized && kpopBase ? (
        <KpopSetup onStart={startKpop} />
      ) : work ? (
        <>
          <Phone work={work} />
          <aside className="runtime-save-manager" aria-label="管理游玩存档">
            <details>
              <summary>存档</summary>
              <div className="runtime-save-panel">
                <p><a href={isKpop ? "./" : "./?mode=kpop"}>{isKpop ? "返回雨夜捡手机" : "体验韩娱平行世界新模式"}</a></p>
                {isKpop&&<button type="button" onClick={async()=>{
                  if(!work||!window.confirm("重新开始会删除当前韩娱角色的本地游玩进度。确定吗？"))return;
                  await db.saves.delete(work.id);
                  location.href="./?mode=kpop&new=1";
                }}>重新开始韩娱模式与角色设定</button>}
                <strong>本机游玩进度</strong>
                <p>可以导出备份，或在另一台设备导入同版本故事的存档。</p>
                <button type="button" disabled={busy} onClick={() => void exportBackup()}>
                  导出存档
                </button>
                <label>
                  导入存档
                  <input
                    type="file"
                    accept=".json,application/json"
                    disabled={busy}
                    onChange={(e) => void importBackup(e)}
                  />
                </label>
                {backupStatus && <p role="status">{backupStatus}</p>}
              </div>
            </details>
          </aside>
        </>
      ) : (
        <p role="status">{error || "正在恢复存档…"}</p>
      )}
    </main>
  );
}
createRoot(document.getElementById("root")!).render(<StoryPlayer />);

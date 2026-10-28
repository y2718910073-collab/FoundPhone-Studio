import type { Item } from "../schema";
import { traceFor } from "./world";

/** Reader impressions must be grounded in records the player deliberately opened.
 * Never manufacture unseen messages, thoughts, or confirmation of romance.
 */
const impressions: Record<string,string> = {
  song:"嗯？又是这首钢琴曲。也可能只是两个人音乐品味相近……先别嗑太急。",
  sky:"这两处天空真的有点像。可在同一座城市看见同一片天，也不是不可能吧。",
  concern:"连喝水、休息这样的小事也记得。是朋友间的细心，还是另有一点不一样？",
  routine:"这些时间安排能和其他记录对上吗？比起猜测，我更想知道具体顺序。",
  object:"这个小物件似乎出现过。记住它的外观，别光凭相似就下结论。",
  nickname:"称呼和语尾有点微妙。也许是熟悉后的自然变化，但得看完整上下文。",
  extra:"等等，旁边这两个人似乎也留下了一点自己的故事？先记住，不急着盖章。",
};
const generic=[
  "你刚打开这段聊天，还没仔细查看消息细节。屏幕并不会告诉你谁在想什么。",
  "你现在看到的只是日常对话。别急着给一句客气话下定义。",
  "某条消息有可能很平常，也可能在另一页找到呼应。你得自己继续翻。",
  "对方有没有回复，得看时间、行程和具体文字；不能单凭一个未读数字判断。",
];
export function observationFromRead(thread:string,turn:number,crush:string,fan:string,items:Item[],readIds:string[]=[]):string{
  const readSet=new Set(readIds);
  const seen=items.filter(i=>i.title===thread&&(readSet.has(i.id)||i.read));
  if(!seen.length) return generic[Math.max(0,turn-1)%generic.length];
  const entry=seen[seen.length-1];
  const trace=traceFor(entry);
  const excerpt=(entry.meta.zh || entry.body.split("\n").at(-1) || entry.body).replace(/\s+/g," ").slice(0,65);
  const time=entry.time.slice(-5);
  const intro=thread===crush ? "你忍不住盯着这条消息看了会儿。" : "你刚刚点开了一条聊天记录。";
  const remark=impressions[trace] || (fan==="显微镜粉"
    ? "这也许只是普通的一句话。要在其他地方找到可以核对的记录，才能继续推断。"
    : "这一句话不足以证明什么。接下来要看人物一贯的说话习惯。");
  return `你注意到：${time}，${entry.sender} 发了「${excerpt}」。${intro}${remark}`;
}

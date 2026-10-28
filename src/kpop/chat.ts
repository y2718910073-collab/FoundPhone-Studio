import { useEffect, useRef, useState } from "react";
import { makeItem, type Item } from "../schema";
import type { SkinProps } from "../AppSkins";
import { useSkinState } from "../skinState";
import { getAiSession, requestAiReply, type CharacterReply, type ChatTurn } from "./ai";
import { readKpopProfile, type LanguageMode } from "./profile";

export type LocalKpopMessage = {
  thread: string;
  direction: "out" | "in";
  ko: string;
  zh: string;
  time: string;
  status?: string;
};
export function parseKpopMessage(raw: string): LocalKpopMessage | null {
  try {
    const x: unknown = JSON.parse(raw);
    if (!x || typeof x !== "object") return null;
    const m = x as Partial<LocalKpopMessage>;
    if (typeof m.thread !== "string" || m.thread.length > 100 ||
      !["out","in"].includes(m.direction || "") ||
      typeof m.ko !== "string" || typeof m.zh !== "string" ||
      typeof m.time !== "string") return null;
    return { thread:m.thread, direction:m.direction!, ko:m.ko.slice(0,500), zh:m.zh.slice(0,500), time:m.time, status:m.status };
  } catch { return null; }
}
export function displayKpopMessage(ko: string, zh: string, mode: LanguageMode): string {
  if (mode === "ko") return ko;
  if (mode === "zh") return zh;
  return ko === zh ? ko : ko + "\n" + zh;
}
function offlineKpopReply(thread: string, text: string, count: number, crush: string): CharacterReply {
  const norm = text.toLowerCase();
  const closeness = thread === crush;
  const isManager = /실장|经纪|智秀/.test(thread);
  const isFriend = /雅凛/.test(thread);
  if (/练习|舞蹈|무대|연습|彩排|工作|录制/.test(norm)) return isManager ?
    {ko:"네. 일정표에서 확인 후 알려드리겠습니다.",zh:"好的，我确认行程表后再通知您。"} :
    closeness ? {ko:"오늘도 늦게 끝나? 끝나면 쉬어. 답장은 천천히 해도 돼.",zh:"今天也会很晚结束吗？结束就休息吧，不用急着回复。"} :
    {ko:"헉 나도 연습 다녀왔어 ㅠㅠ 오늘은 진짜 쉬자.",zh:"天，我也刚练习完ㅠㅠ今天真的该休息一下了。"};
  if (/吃|饭|夜宵|맛|배고|음식|食物/.test(norm)) return isManager ?
    {ko:"도시락 준비 상황 확인하겠습니다.",zh:"我会确认便当准备情况。"} :
    isFriend ? {ko:"우리 떡볶이 먹자ㅋㅋ 난 어묵 추가할래!",zh:"我们吃炒年糕吧ㅋㅋ我还要加鱼糕！"} :
    {ko:"아직 못 먹었어. 끝나고 따뜻한 거 먹으려고.",zh:"还没吃，打算结束后吃点热乎的。"};
  if (/睡|晚安|졸려|잘 자|累|피곤/.test(norm)) return isManager ?
    {ko:"휴식 시간은 일정표에 반영하겠습니다.",zh:"休息时间会按日程表安排。"} :
    {ko:"오늘 고생했어. 답장 안 해도 되니까 얼른 자 ㅎㅎ",zh:"今天辛苦啦。不用回复也行，快去睡吧ㅎㅎ"};
  if (/喜欢|사랑|恋爱|좋아해|在一起|데이트/.test(norm)) return isManager ?
    {ko:"개인적인 일은 확인드리기 어렵습니다.",zh:"私人事务我不方便确认。"} :
    closeness ? {ko:"갑자기? ㅋㅋ 나 지금 뭐라고 해야 할지 모르겠어. 조금만 생각해 볼게.",zh:"怎么突然说这个ㅋㅋ我一时不知道怎么回，容我想想。"} :
    {ko:"으잉 그걸 왜 나한테 물어ㅋㅋ 너 먼저 말해 봐.",zh:"咦，你干吗问我这个ㅋㅋ你先说说。"};
  if (/你好|在吗|안녕|hi|hello|뭐해|干嘛/.test(norm)) return isManager ?
    {ko:"네. 말씀하세요. 지금 일정 확인 중입니다.",zh:"您好，请说。我正在确认行程。"} :
    isFriend ? {ko:"나 여기! 숙소 가는 길이야 ㅋㅋ 넌 뭐 해?",zh:"我在！正回宿舍ㅋㅋ你干嘛呢？"} :
    {ko:"이제 봤어. 잠깐 대기 중이야. 무슨 일이야?",zh:"刚看到，在短暂待机。怎么啦？"};
  if (/谢谢|고마워|感谢/.test(norm)) return isManager ?
    {ko:"네. 필요하시면 다시 말씀해 주세요.",zh:"好的，有需要请再联系我。"} :
    {ko:"별말을 다 해 ㅎㅎ 오늘 무리하지 마.",zh:"干嘛这么客气ㅎㅎ今天别太拼。"};
  if (isManager) return [
    {ko:"확인해서 다시 공유드리겠습니다.",zh:"我确认后再同步给您。"},
    {ko:"지금은 확답드리기 어렵습니다. 일정 확정 후 말씀드리겠습니다.",zh:"现在还不能确定，日程敲定后再告知您。"},
    {ko:"알겠습니다. 관련 담당자에게 전달하겠습니다.",zh:"明白，我会转告相关负责人。"},
  ][count%3];
  if (isFriend) return [
    {ko:"뭐야ㅋㅋ 좀 더 얘기해 봐. 나 지금 숙소야.",zh:"什么啦ㅋㅋ再说说，我现在在宿舍。"},
    {ko:"헐 진짜? 난 오늘 연습 때문에 아무것도 못 봤어ㅠㅠ",zh:"天啊真的？我今天忙练习什么都没看ㅠㅠ"},
    {ko:"ㅇㅋ 근데 내일 새벽에 나가야 해서 오래 못 있어 ㅎㅎ",zh:"OK，不过明早要很早出门，不能聊太久ㅎㅎ"},
  ][count%3];
  return [
    {ko:"아, 그런 일이 있었구나. 나도 아직 잘 모르겠어. 네 생각은 어때?",zh:"啊，原来是这样。我也还不确定，你怎么想？"},
    {ko:"오늘은 정신없었어. 네 메시지는 이제 봤어. 조금만 더 얘기해 줘.",zh:"今天忙得晕头转向。刚看到你的消息，再跟我说说吧。"},
    {ko:"그 말은 좀 의외다 ㅋㅋ 근데 무슨 뜻인지 궁금해.",zh:"这话有点出乎意料ㅋㅋ不过我挺想知道你什么意思。"},
    {ko:"지금 잠깐 쉬는 중이야. 그 얘기, 나중에 이어서 할래?",zh:"我现在在休息间隙。这个话题等会儿继续聊好吗？"},
  ][count%4];
}

export function useKpopChat(p: SkinProps) {
  const [raw, setRaw] = useSkinState<string[]>(p, "kpop-conversations", []);
  const [pending, setPending] = useState(false);
  const [typing, setTyping] = useState(false);
  const [error, setError] = useState("");
  const controller = useRef<AbortController | null>(null);
  const profile = readKpopProfile();
  const mode = profile?.language || "dual";
  const thread = p.thread;
  const records = raw.map(parseKpopMessage).filter((x): x is LocalKpopMessage => !!x);
  const forThread = records.filter(x=>x.thread===thread);
  const local: Item[] = forThread.map((entry,index)=>makeItem({
    id:`kpop-chat-${thread}-${index}`,
    title:thread,
    body:displayKpopMessage(entry.ko,entry.zh,mode),
    time:entry.time,
    sender:entry.direction==="out"?(p.owner||"我"):thread,
    outgoing:entry.direction==="out",
    meta:{ko:entry.ko,zh:entry.zh,kpopStatus:entry.status||"",local:"true"},
  }));
  const cancel = () => controller.current?.abort();
  useEffect(() => () => controller.current?.abort(), []);
  const send = async (draft:string) => {
    const body=draft.trim().slice(0,300);
    if (!body||!thread||pending) return;
    setError("");
    const stamp=new Date().toISOString().slice(0,16).replace("T"," ");
    const outgoing: LocalKpopMessage={thread,direction:"out",ko:body,zh:body,time:stamp};
    const next=[...raw,JSON.stringify(outgoing)].slice(-500);
    setRaw(next);
    setPending(true);
    const config=getAiSession();
    const ac=new AbortController();
    controller.current=ac;
    try {
      // Unlike the old instant keyword system, replies show a visible status.
      await new Promise<void>(resolve=>setTimeout(resolve,config?350:850));
      setTyping(true);
      let answer:CharacterReply;
      if(config && profile) {
        const old=p.items.filter(i=>i.title===thread).slice(-34).map(i=>({
          role:i.outgoing?"user":"assistant" as const,
          content:i.meta.ko||i.body,
        }));
        const messages:ChatTurn[]=[...old,...forThread.map(x=>({
          role:x.direction==="out"?"user":"assistant" as const,
          content:x.ko,
        })),{role:"user",content:body}];
        answer=await requestAiReply(config,thread,messages,profile,"",ac.signal);
      } else answer=offlineKpopReply(thread,body,forThread.length,profile?.crush||"柳时恩");
      const duration=config?900:Math.min(2200,1200+answer.ko.length*35);
      await new Promise<void>(resolve=>setTimeout(resolve,duration));
      if (ac.signal.aborted) return;
      const incoming:LocalKpopMessage={thread,direction:"in",ko:answer.ko,zh:answer.zh,time:new Date().toISOString().slice(0,16).replace("T"," ")};
      setRaw([...next,JSON.stringify(incoming)].slice(-500));
    } catch(cause) {
      if(!ac.signal.aborted) setError(cause instanceof Error?cause.message:"回复失败。");
    } finally {
      if(!ac.signal.aborted){setTyping(false);setPending(false);}
    }
  };
  return {local,mode,pending,typing,error,send,cancel,isAi:!!getAiSession()};
}

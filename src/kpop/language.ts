import type { Item } from "../schema";
import type { LanguageMode } from "./profile";

/** Korean source text for private records authored for the fictional scenario.
 * No machine translation is claimed. Menu labels remain simplified Chinese.
 * Entries are indexed against the corresponding authored scenario records. */
type Translation = readonly [titleKo: string, bodyKo: string];
export const PRIVATE_RECORD_TRANSLATIONS: Record<string, readonly Translation[]> = {
  notes: [
    ["컴백 주간 체크","사전 녹화, 리허설, 인터뷰. 최종 시간은 매니저님 일정표를 기준으로 확인하기."],
    ["쓰다 만 곡","2절 주선율에 여백이 필요하다. 음성 메모에는 아직 끝내지 못한 허밍이 남아 있다."],
    ["오늘 읽은 문장","조용히 기다린다고 해서 아무 마음도 없는 건 아니다."],
    ["가방에 넣을 것","립밤, 인이어, 보조배터리, 여권, 깔창."],
    ["공연 끝나면","늦잠 자기. 영화 보기. 시간 걱정 없이 밥 먹기."],
    ["나에게 하는 말","무대에서 최선을 다하면 된다. 모든 댓글에 하나하나 대답할 필요는 없다."],
    ["팬사인회 메모","긴 편지를 남겨 준 팬들에게 꼭 진심으로 감사하다고 말하기."],
    ["가사 백업","제목은 아직 못 정했다. 코드 진행 두 개만 남아 있다."],
  ],
  calendar: [
    ["음악 방송 사전 녹화","05:40 집합, 07:10 사전 녹화, 11:00 리허설."],
    ["안무 연습","14:00—17:30 · 연습실 B."],
    ["라디오 생방송","18:30 마이크 확인, 19:00 시작."],
    ["팬사인회","세부 일정은 주최 측의 공개 공지를 확인."],
    ["광고 화보 촬영","09:00 메이크업, 11:30 촬영 시작."],
    ["해외 공연 준비","여권과 위탁 수하물 확인."],
    ["회사 정기 회의","다음 주 업무 일정 논의."],
    ["그룹 연습","대형 확인, 촬영 영상 다시 보기."],
    ["쉬는 날","일정 비워 두기. 공식 업무 약속은 잡지 않기."],
  ],
  files: [
    ["무대 동선_v3.pdf","리허설 순서와 카메라 동선 정보. 외부 유출 금지."],
    ["야외 촬영 안내","비 오는 날에는 미끄럼 방지 신발을 신을 것."],
    ["음원 녹음 계획","2절 후렴 추가 녹음 시간은 아직 확인 중."],
    ["라디오 질문지","이미 공개된 활동, 작품, 음악 작업에 관한 질문만 포함."],
    ["일정 연락 백업","매니저가 녹화와 행사 시간을 조율한다."],
    ["개인 플레이리스트.txt","세 번째 곡은 목소리가 없는 피아노 연주곡."],
    ["호텔 체크인 안내","해외 일정 숙박 절차. 객실 번호는 표시하지 않음."],
  ],
  messages: [
    ["회사 알림","내일 집합 시간은 05:40입니다. 차량 탑승 조는 추후 안내합니다."],
    ["라디오 제작진","질문지를 잘 받았습니다. 협조해 주셔서 감사합니다."],
    ["개인 알림","오늘 사용한 인이어를 보관함에 넣는 것 잊지 말기."],
  ],
  phone: [
    ["매니저님","08:10 통화 3분 12초 · 일정 확인."],
    ["엄마","20:42 부재중 전화."],
    ["스타일리스트","16:15 통화 45초."],
  ],
  mail: [
    ["무대 콘티 확인","발신: 제작진 · 무대 카메라 동선을 공유했습니다."],
    ["투어 이동 안내","발신: 매니지먼트팀 · 시간은 최종 공지를 기준으로 합니다."],
    ["녹음실 업데이트","발신: 프로듀서 · 추가 녹음 시간은 아직 확정되지 않았습니다."],
  ],
  reminders: [
    ["인이어 소독","녹화 후 인이어 청소하기."],
    ["여권 챙기기","투어 출발 전에 확인하기."],
  ],
};

/** Applies translation at story creation without ever changing IDs or source metadata.
 * New synced records can use meta.ko/meta.zh through renderKpopItem. */
export function localizePrivateRecord(item: Item, app: string, index: number, mode: LanguageMode): Item {
  const translated = PRIVATE_RECORD_TRANSLATIONS[app]?.[index];
  if (!translated) return item;
  const [koTitle, koBody] = translated;
  const zhTitle = item.meta.zhTitle || item.title;
  const zhBody = item.meta.zh || item.body;
  return {
    ...item,
    title: mode==="ko" ? koTitle : mode==="dual" ? koTitle+" · "+zhTitle : zhTitle,
    body: mode==="ko" ? koBody : mode==="dual" ? koBody+"\n"+zhBody : zhBody,
    meta:{...item.meta,ko:koBody,zh:zhBody,koTitle,zhTitle},
  };
}
export function localizeKpopRecords(data: Record<string,Item[]>, mode: LanguageMode): void {
  for(const app of Object.keys(PRIVATE_RECORD_TRANSLATIONS)) {
    if(!data[app])continue;
    data[app]=data[app].map((item,index)=>localizePrivateRecord(item,app,index,mode));
  }
}
export function renderKpopItem(item: Item, mode: LanguageMode): Item {
  if(!item.meta.ko || !item.meta.zh) return item;
  const title=item.meta.koTitle && item.meta.zhTitle
    ? mode==="ko" ? item.meta.koTitle : mode==="dual" ? item.meta.koTitle+" · "+item.meta.zhTitle : item.meta.zhTitle
    : item.title;
  const body=mode==="ko"?item.meta.ko:mode==="zh"?item.meta.zh:item.meta.ko+"\n"+item.meta.zh;
  return {...item,title,body};
}

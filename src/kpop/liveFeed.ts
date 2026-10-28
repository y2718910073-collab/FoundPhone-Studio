import { makeItem, type Item, type Work } from "../schema";

type SyncScene = {
  app: string;
  title: string;
  sender: string;
  ko: string;
  zh: string;
  folder: string;
  trace?: string;
};
/** Each update is an authored, fictitious life event; no real account is polled. */
const AFTER_LOST_SCENES: SyncScene[] = [
  {app:"kakao",title:"@friend",sender:"@friend",ko:"언니, 숙소 냉장고에 두부 남았어? 지금 마트야.",zh:"姐，宿舍冰箱还有豆腐吗？我现在在超市。",folder:"宿舍"},
  {app:"instagram",title:"늦은 퇴근",sender:"@owner",ko:"오늘도 늦은 퇴근. 커피는 여기까지 ☕",zh:"今天又晚下班，咖啡就喝到这里 ☕",folder:"Story"},
  {app:"notes",title:"내일 확인할 것",sender:"@owner",ko:"리허설 시간과 대기실 변경 여부 확인하기.",zh:"明天确认彩排时间，以及待机室有没有变。",folder:"备忘录"},
  {app:"kakao",title:"@manager",sender:"@manager",ko:"내일 차량 탑승 시간은 최종표 기준으로 진행합니다.",zh:"明日上车时间以最终行程表为准。",folder:"工作"},
  {app:"calendar",title:"사전 녹화",sender:"@owner",ko:"05:30 집합. 이동 시간이 변경됐다.",zh:"05:30 集合，转场时间已调整。",folder:"日程"},
  {app:"kakao",title:"@family",sender:"@family",ko:"밥 먹었니? 바빠도 잠은 좀 자렴.",zh:"吃饭了吗？再忙也睡一会儿。",folder:"家人"},
  {app:"instagram",title:"연습실 거울",sender:"@friend",ko:"연습 끝! 오늘은 발이 좀 아파 ㅠㅠ",zh:"练习结束！今天脚有点酸ㅠㅠ",folder:"Story"},
  {app:"files",title:"무대 동선 최종",sender:"@owner",ko:"출입구 B. 스태프 안내를 따라 이동.",zh:"工作人员 B 门，按照现场指引行动。",folder:"文件"},
  {app:"kakao",title:"@crush",sender:"@crush",ko:"오늘 하늘 색 좋더라. 너희 쪽도 비 왔어?",zh:"今天的天空颜色很漂亮，你们那边也下雨了吗？",folder:"私信",trace:"sky"},
  {app:"phone",title:"부재중 전화",sender:"@manager",ko:"13:45 · 부재중 · 일정 변경 안내",zh:"13:45 · 未接电话 · 行程调整通知",folder:"最近通话"},
  {app:"kakao",title:"@friend",sender:"@friend",ko:"ㅋㅋ 내일 점심은 꼭 같이 먹자. 배고파 죽겠어.",zh:"ㅋㅋ 明天午饭一定要一起吃，我快饿死了。",folder:"宿舍"},
  {app:"mail",title:"라디오 질문지",sender:"制作组",ko:"사전 질문지를 보내 드립니다. 확인 부탁드립니다.",zh:"现发送电台采访提纲，请查收。",folder:"收件箱"},
  {app:"spotify",title:"새로 저장한 피아노",sender:"@owner",ko:"목소리 없는 곡 세 번째 트랙.",zh:"又收藏了那首没有人声的第三轨钢琴曲。",folder:"歌单",trace:"song"},
  {app:"kakao",title:"@crush",sender:"@crush",ko:"그 곡 아직 듣고 있어? 가끔 새벽에 생각나더라.",zh:"你还在听那首曲子吗？我有时凌晨会想起来。",folder:"私信",trace:"song"},
  {app:"photos",title:"텅 빈 연습실",sender:"@owner",ko:"다들 퇴근한 뒤 창가에 남은 노란 불.",zh:"大家下班后，窗边还亮着一盏黄灯。",folder:"相簿"},
  {app:"delivery",title:"늦은 저녁",sender:"@owner",ko:"순한 국밥 한 그릇. 숙소로.",zh:"一份不辣的汤饭，送往宿舍。",folder:"订单"},
  {app:"threads",title:"퇴근길 생각",sender:"@owner",ko:"연습이 끝나면 바람 소리가 크게 들린다.",zh:"练习结束以后，风声听起来格外大。",folder:"动态"},
  {app:"kakao",title:"@manager",sender:"@manager",ko:"광고 촬영 콘티 수정본은 메일로 전달드렸습니다.",zh:"广告拍摄分镜修订版已经发到邮箱。",folder:"工作"},
  {app:"mail",title:"화보 촬영 콘티_v4",sender:"造型组",ko:"의상 피팅을 금요일 오전으로 조정합니다.",zh:"试装时间调整到周五上午。",folder:"收件箱"},
  {app:"notes",title:"데모 아이디어",sender:"@owner",ko:"두 번째 소절에서는 피아노만 남겨 두기.",zh:"第二个小节试着只留下钢琴。",folder:"备忘录"},
  {app:"kakao",title:"@friend",sender:"@friend",ko:"냉장고 다시 정리했는데 우유가 또 있었어ㅋㅋ",zh:"我又整理了一遍冰箱，结果又发现一盒牛奶ㅋㅋ",folder:"宿舍"},
  {app:"calendar",title:"팀 미팅",sender:"@owner",ko:"다음 주 팀 미팅. 무대 구성과 휴식 시간 확인.",zh:"下周团队会议，核对舞台编排与休息时间。",folder:"日程"},
  {app:"twitter",title:"무대 후기",sender:"虚构粉丝",ko:"오늘 라이브 꽤 안정적이었음. 무대가 좋다.",zh:"今天现场相当稳定，舞台真不错。",folder:"推荐"},
  {app:"bilibili",title:"舞台学习笔记",sender:"虚构UP主",ko:"포인트 안무를 천천히 분석해 보았다.",zh:"慢速拆解了这次回归的重点编舞。",folder:"动态"},
  {app:"kakao",title:"@crush",sender:"@crush",ko:"요즘 리허설 끝나면 바로 집에 가? 잠깐 쉴 수 있어?",zh:"你最近彩排一结束就回家吗？能稍微休息一下吗？",folder:"私信",trace:"concern"},
  {app:"reminders",title:"인이어 케이스",sender:"@owner",ko:"연습 끝나면 인이어 정리하고 충전하기.",zh:"练习结束后，收好耳返并充电。",folder:"今天"},
  {app:"photos",title:"책갈피",sender:"@owner",ko:"읽던 책 사이에 넣어 둔 흰색 메모지.",zh:"读到一半的书里夹着一张白色便签。",folder:"相簿",trace:"object"},
  {app:"pinterest",title:"무대 컬러",sender:"@owner",ko:"회색 재킷, 남색 조명, 작은 은색 장식.",zh:"灰色夹克、藏蓝色灯光、细小的银色饰品。",folder:"收藏板"},
  {app:"kakao",title:"@family",sender:"@family",ko:"주말에 집에 못 와도 괜찮아. 건강만 챙겨.",zh:"周末回不来也没关系，照顾好身体。",folder:"家人"},
  {app:"wallet",title:"서점 결제",sender:"@owner",ko:"도서 결제 · 개인 독서",zh:"书店消费 · 个人阅读。",folder:"交易"},
  {app:"kakao",title:"@manager",sender:"@manager",ko:"해외 공연은 현지 시간 기준으로 이동하겠습니다.",zh:"海外演出的转场按当地时间执行。",folder:"工作"},
  {app:"maps",title:"공연장 인근",sender:"@owner",ko:"공연장과 호텔 사이 이동 경로 확인.",zh:"核对场馆和酒店之间的交通路线。",folder:"浏览历史"},
  {app:"instagram",title:"점심 도시락",sender:"@owner",ko:"드디어 따뜻한 밥 먹었다 ㅎㅎ",zh:"终于吃上一顿热饭ㅎㅎ",folder:"Story"},
  {app:"wechat",title:"海外活动群",sender:"合作方",ko:"공항 도착 후 행사 진행팀과 연락 부탁드립니다.",zh:"抵达机场后请联系活动执行组。",folder:"聊天"},
  {app:"kakao",title:"@crush",sender:"@crush",ko:"너 예전에 쓰던 회색 손목끈 아직 갖고 있어?",zh:"你以前用的那条灰色腕带还留着吗？",folder:"私信",trace:"object"},
  {app:"photos",title:"손목끈",sender:"@owner",ko:"가방 지퍼에 걸려 있는 낡은 회색 끈.",zh:"背包拉链上挂着一条旧灰色腕带。",folder:"相簿",trace:"object"},
  {app:"calendar",title:"공항 이동",sender:"@owner",ko:"06:20 출발. 공항 동선 확인.",zh:"06:20 出发，核对机场动线。",folder:"日程"},
  {app:"kakao",title:"@friend",sender:"@friend",ko:"비행기에서 영화 볼까? 나 아직 다운로드 안 했어ㅠㅠ",zh:"飞机上看电影吗？我还没下载ㅠㅠ",folder:"宿舍"},
  {app:"netflix",title:"비행기에서 볼 것",sender:"@owner",ko:"새로 저장한 드라마 목록. 오프라인 시청 준비.",zh:"新加入的追剧清单，准备在飞机上离线观看。",folder:"片单"},
  {app:"instagram",title:"호텔 창문",sender:"@owner",ko:"새로운 도시. 오늘도 내일도 무대.",zh:"新的城市，今天和明天都有演出。",folder:"Story"},
  {app:"kakao",title:"@crush",sender:"@crush",ko:"여긴 아직 낮이야. 너희 쪽은 밤이지? 푹 자.",zh:"我这边还是白天，你那里已经晚上了吧？好好睡。",folder:"私信",trace:"concern"},
  {app:"phone",title:"국제 전화",sender:"@family",ko:"부재중 · 해외 시차",zh:"未接听 · 海外时差。",folder:"最近通话"},
  {app:"notes",title:"투어에서 먹고 싶은 것",sender:"@owner",ko:"현지 음식 하나, 따뜻한 수프 하나.",zh:"想吃一道当地菜，再喝一碗热汤。",folder:"备忘录"},
  {app:"instagram",title:"공개 인사",sender:"@owner",ko:"오늘 와 준 분들 정말 고마워요!",zh:"谢谢今天来见我们的大家！",folder:"动态"},
  {app:"kakao",title:"@manager",sender:"@manager",ko:"오늘 공연 후 차량은 B 출입구에서 대기합니다.",zh:"今天演出结束后，车辆将在 B 门等候。",folder:"工作"},
  {app:"kakao",title:"@friend",sender:"@friend",ko:"나 비행기에서 두 시간이나 잤어. 너는?",zh:"我在飞机上睡了两个小时，你呢？",folder:"宿舍"},
  {app:"health",title:"휴식 기록",sender:"@owner",ko:"이번 주 수면 시간은 일정에 따라 들쭉날쭉.",zh:"这周睡眠时长随着行程起伏。",folder:"记录"},
  {app:"files",title:"새 리허설 안내",sender:"@owner",ko:"무대별 스태프와 이동 동선을 정리했다.",zh:"整理各舞台的工作人员与转场动线。",folder:"文件"},
  {app:"kakao",title:"@crush",sender:"@crush",ko:"오늘 사진에서 본 작은 팔찌, 혹시 전에 쓰던 거야?",zh:"你今天照片里那条小手链，是以前戴过的那条吗？",folder:"私信",trace:"object"},
  {app:"spotify",title:"새벽 피아노",sender:"@owner",ko:"오랜만에 같은 곡을 다시 저장했다.",zh:"隔了很久，又把同一首曲子收藏了一遍。",folder:"歌单",trace:"song"},
  {app:"kakao",title:"@family",sender:"@family",ko:"집에 돌아오면 네가 좋아하는 반찬 해 줄게.",zh:"等你回来，给你做爱吃的菜。",folder:"家人"},
  {app:"mail",title:"이번 주 업무 마감",sender:"经纪部门",ko:"모든 공식 일정은 최종 공지에 따릅니다.",zh:"本周各项正式行程以最终通知为准。",folder:"收件箱"},
];
const actor=(value:string,work:Work)=>{
  const cast:Record<string,string>={
    "@owner":work.phone.owner,
    "@friend":String(work.variables["kpop-friend"]||"朴雅凛"),
    "@crush":String(work.variables["kpop-crush"]||"柳时恩"),
    "@manager":String(work.variables["kpop-manager"]||"金智秀 실장님"),
    "@family":String(work.variables["kpop-family"]||"엄마"),
  };
  return cast[value]||value;
};
/** Turn 16 is three days after the phone was lost; later turns move forward
 * in realistic short intervals. Timezone text is local fictional phone time. */
export function kpopSyncTimestamp(date:string,turn:number,order=0):string{
  const base=Date.parse(date+"T20:00:00Z");
  const minutes=(3*24*60)+(turn-16)*105+order*11;
  return new Date(base+minutes*60_000).toISOString().slice(0,16).replace("T"," ");
}
export function kpopLiveEntries(work:Work,turn:number,firstSync=false):Record<string,Item[]>{
  if(turn<16)return {};
  const out:Record<string,Item[]>={};
  // First arrival presents a plausible cluster, subsequent rounds 1 authored update every second turn.
  const indices=firstSync?[0,1,2,3]:turn%2===0?[4+Math.floor((turn-18)/2)]:[];
  for(const [order,index] of indices.entries()){
    const scene=AFTER_LOST_SCENES[index];
    if(!scene)continue; // Never recycle identical texts simply to simulate infinity.
    const sender=actor(scene.sender,work);
    const title=actor(scene.title,work);
    const app=scene.app;
    const item=makeItem({
      id:"kpop-live-"+app+"-"+index,
      title,sender,
      body:scene.ko+"\n"+scene.zh,
      folder:scene.folder,
      time:kpopSyncTimestamp(work.phone.date||"2026-10-28",turn,order),
      kind:app==="instagram"||app==="twitter"||app==="threads"?"post"
        :app==="photos"?"image":app==="spotify"?"audio"
        :app==="calendar"?"event":app==="phone"?"call":"text",
      meta:{ko:scene.ko,zh:scene.zh,fiction:"true",sync:"true",...(scene.trace?{trace:scene.trace}:{})},
    });
    if(app==="kakao")item.outgoing=sender===work.phone.owner;
    (out[app] ||= []).push(item);
  }
  return out;
}
export function kpopLiveLength(){return AFTER_LOST_SCENES.length;}

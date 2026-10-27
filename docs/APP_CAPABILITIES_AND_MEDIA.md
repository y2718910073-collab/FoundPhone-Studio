# App 功能与素材边界

这是虚构的故事手机，而不是 Spotify、Netflix、Bilibili、运营商或银行的官方客户端。

## 本阶段实际可执行

- 电话：输入真实号码，点「使用系统电话拨打」后交由 iOS / Android 原生电话应用继续操作。网页不能在后台接管手机通话，实际通话可能产生费用。绿色按钮仅用于剧情模拟。
- 视频：Netflix 风格页面、Bilibili、YouTube、抖音和 TikTok 内有标记的视频条目可以用 HTML5 播放器暂停、调进度和尝试全屏。需要联网，由合法开放许可来源托管；不破解会员或转载商业影视。
- 音乐：Spotify、网易云和系统音乐中有本地原创合成短曲，能发出实际声音。它们不是官方 Spotify 曲库。
- 社交：故事聊天与回复仍属虚构，保存在玩家自己的浏览器，没有外部聊天服务器。
- 工具与内容：49 个 App 入口保留，计算器 / 设置等原有交互保留；商品、钱包、健康、外卖、查找等项目均为演示数据，不能真实支付、测量或定位。

## 视频版权

- Big Buck Bunny © 2008 Blender Foundation / www.bigbuckbunny.org，Creative Commons Attribution 3.0。项目：https://peach.blender.org/about/ 。完整影片包含片尾字幕。
- 同一影片的十秒许可演示剪辑，来自第三方公开样片镜像。
- flower.mp4 来自 MDN，CC0 公共领域。来源：https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4

视频不上传至用户仓库。由用户浏览器从外部视频来源播放；网络不可达时显示错误及来源信息。

## 尚未实现

49 个第三方线上平台的全部真实业务：正版 Spotify / Netflix 订阅内容、Bilibili 实时推荐、VoIP 运营商呼叫、银行转账、电商订单、真实外卖、医疗信息、设备 GPS 等，都需要服务提供商的合法接口、用户账户授权或额外后台设施。

这些不是只靠前端复制一个界面便可以获得的能力。应在遵守服务协议和用户隐私的情况下逐个接入。

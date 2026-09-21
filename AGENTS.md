# AGENTS.md

华科智慧课堂（smartcourse.hust.edu.cn）自动签到 App —— Expo / React Native 0.81 / Hermes / TypeScript / Zustand。
本地脚本用 `pnpm dlx tsx scripts/*.ts` 跑。

## 运行时 / 引擎约束（踩坑）

- **`Promise.withResolvers`(ES2024) 在 RN/Hermes 各版本支持不确定**：真实事故里用它后出现
  `TypeError: undefined is not a function`（`autoSign` reject，accountCard 打日志 `发生错误 / undefined is not a function`）。
  项目规则 `ts-promise-with-resolvers` 是 prefer 级——RN/Hermes 运行时下用 `new Promise((rs, rj) => …)` 最稳，
  留注释说明原因。posiSign 手动输入 fallback 即用 new Promise。
- 行进间排查：先读 `accountCard.tsx` 的"自动"按钮（`autoSign(...).catch`，日志 `发生错误`）确认 catch 包裹
  的是 `autoSign` 整体，错误源头在被 reject 的同步/异步路径；再确认 `isUseNativeLog=false`（走 web fetch，非原生模块）。
- **UA 不影响 preSign 坐标**：无 UA / okhttp(RN 默认) / iOS-NSURLSession / wechat / Chrome 抓到的 preSign 都带
  隐藏坐标且 `getPosition` 解析成功。getPosition 只在**会话失效**（preSign 返回登录页/空坐标）时才抛错，
  那时才走手动输入 fallback——所以用户报"undefined is not a function"时，先怀疑会话过期，而不是坐标解析。

## 签到流程（utils/autoSignIn.ts）与手动 fallback 现状

| 分支 | otherId | 解析 | 手动 fallback |
|---|---|---|---|
| posiSign 位置 | 4 | `getPosition` 双格式 | ✅ 解析失败弹窗手动输入 `经度,纬度,位置文本(可留空)`；取消/格式错可见报错；`cancelable:false` |
| gestureSign 手势 | 1/3 | `/<input.+id="signCode".+value="(\d+)".+>/` | ❌ 无（同型页面改版风险，匹配不到抛 `未找到密码`） |
| qrSign 二维码 | 2 | 解析链接 | ✅ alert + 打开网页补签 |
| 定时签到 | 0 | 直接空 code 调 signIn | 无需 |

## preSign 页面位置字段解析（getPosition 双格式）

服务端改版导致旧正全失效。现支持两格式（新优先，都不中抛 `未找到 latitude 和 longitude`）：

- 新版：`<input type="hidden" id="longitude" value="114.44"/>`、`id="latitude"`、`id="title"`（value 可能为空）
- 旧版：JS 变量 `locationLatitude` / `locationLongitude` / `locationText`（原正则）

页面自身定位失败时 `<h2 id="address">无法获取位置信息</h2>`，坐标 input 可能为空 → 走手动输入兜底。

## 登录 / 会话（纯 HTTP 脚本调用 smartcourse）

- **TGT(CASTGC) 不足以直接调 activelist**。需要完整 smartcourse 会话 cookie 集合：
  `cdmhsession`、`p_auth_token`、`1731userinfo`、`1731UID`、`1731enc`、`UID`、`vc`/`vc2`/`vc3`、
  `web_uname`、`uf`、`_uid`、`_d`、`DSSTASH_LOG`、`route`、`moocroute`、`BIGipServerpool-ncc-cxkcpt`(F5 粘性)、
  `uname`、`fid`、`website_id`、`website_fid`、`mh_sign`、`xxtenc` 等。
- 其中 `mh_sign`、`website_*`、`fid` 等是 mh-smartcourse **SPA 用 JS(document.cookie) 写入的**，
  纯 fetch/重定向拿不到 → 直接复用抓包 cookie（`scripts/autosign.ts` 的 `SEED_COOKIES`）。
- 登录链：`mh-smartcourse/login`(带 CASTGC) → CAS 换票 → smartcourse 设 `cdmhsession`。
  不要用 `<p class="user-name">` 判断登录成功——那是 JS 渲染的 SPA 壳，静态 HTML 常无。
- UA 用真实浏览器 UA（如 Chrome Android），脚本别发 wechat UA。

## react-native-prompt-android

- v1.1.0 **没有 onDismiss/onCancel**（原生只回调按钮点击，dismiss 直接丢弃，android/ios 入口均核实）。
  要防静默挂起：给 Close 挂 `onPress` + `cancelable:false`（禁 back/点外关闭）。`myPrompt` 已加 `onCancel`/`cancelable` 参数。

## 脚本

- `scripts/autosign.ts`：载入 `SEED_COOKIES` → activelist → preSign → 固定坐标(兜底) → signIn。
- `scripts/checkPosi.ts`：抓 preSign 落 `/tmp/presign_body.html` 并跑新旧正则排查。
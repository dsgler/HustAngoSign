// =============================================================================
// 华中科技大学(睿课堂 smartcourse)位置签到 手动脚本
// 用途：用浏览器会话 cookie 直接执行位置签到，AI 读本文件即应能直接复用。
//
// 【运行】pnpm dlx tsx scripts/autosign.ts
// 【前置】需要一份"登录后"的 smartcourse.hust.edu.cn 会话 cookie（见下）。
//
// 一、cookie 从哪来（关键经验）
//   - 该项目是 JS 渲染门户(mh-smartcourse)，大量关键 cookie 由页面 JS 写入
//     (mh_sign, website_id, website_fid, 1731userinfo, vc3, p_auth_token, ...)，
//     纯 HTTP 重放登录链（CAS 的 smartLoginUrl → smartBaseUrl）拿不全这些，
//     且拿不到 user-name —— 所以必须抓一份真实浏览器会话，不能靠 TGT/CASTGC
//     在脚本里冷启动。
//   - 抓取方式：浏览器登录后，DevTools → Network → 任一带 -b 的请求 →
//     copy as cURL，把 -b '...' 里的 Cookie 对拷进 SEED_COOKIES。
//   - 只保留域名为 smartcourse.hust.edu.cn 的 cookie 即可。
//   - cookie 不定期轮换(BIGipServerpool/cdmhsession/vc2/vc3/p_auth_token/
//     DSSTASH_LOG/moocroute/uf/_d)，失效用新抓的替换即可。
//
// 二、签到流程（跳过 preSign 等校验的最短路径）
//   1. 带 cookie POST FirstSignInListUrl(activelist)，body 见 FirstSignInListBody
//   2. 取返回 JSON result===1 的 data.array 中 status===1 的第一项（位置签到 otherId===4）
//   3. 直接 GET getPosiSignInUrl(activeId, 位置文本, 经度, 纬度) 完成签到
//   4. 成功判定：getIsSignInSuccess —— body 含 '>Sign in successfully<'、
//      '>Checked in successfully.<'（新版英文，可带/不带句号）或 '>签到成功<'
//
// 三、位置参数
//   - 当前使用固定坐标（可改下面三个常量）：
//       longitude=114.440488  latitude=30.517818
//       locationText=湖北省武汉市洪山区珞喻东路415号
//   - 若想动态获取：先 GET getPreSignUrl(activeId)，再用 utils/getPosition.ts
//     解析。注意：preSign 页面已改版，位置字段是 <input id="longitude"/
//     id="latitude"/id="title"> 隐藏域，旧版 locationLatitude/locationLongitude/
//     locationText JS 变量格式已不存在；getPosition 已兼容新旧两种。
//   - 失败兜底（App 内 posiSign）：无法解析时弹窗手动输入 "经度,纬度,位置文本"
//     （最后一个可留空），取消则签到中止。
//
// 四、其它签到类型 otherIds: 0=?, 1/3=手势, 2=二维码, 4=位置
//
// 五、常见失败
//   - activelist 返回非 JSON 的 "error" / 无 user-name → 会话 cookie 失效，重抓。
//   - 不要在脚本里走 CAS 登录补齐 cookie（会丢 JS 写入的 cookie）。
//   - 诊断工具：scripts/checkPosi.ts 可打印某 activeId 的 preSign 位置字段上下文。
// =============================================================================
import {
  FirstSignInListBody,
  FirstSignInListUrl,
  getPosiSignInUrl,
} from '../constants/urls';
import { getIsSignInSuccess } from '../utils/getIsSignInSuccess';

const SEED_COOKIES = [
  'BIGipServerpool-ncc-cxkcpt=825495724.20480.0000',
  'current_page_id=258049',
  'website_id=152914',
  'website_fid=1731',
  'website_fid_login=0',
  'mh_sign=06764ab44ecdb2f94b947d98429ee0273417d823eaae82ae80db61730fb3a148',
  'goc=o',
  'lv=0',
  'fid=1731',
  '1731userinfo=6cb2606b4382afd182fe73deb66229d5c49d67c0c30ca5047c5a963e85f11099ec30e90e231dd87541f067b60e3bb88dc477de23fdee16ac',
  '1731UID=185144859',
  '1731enc=7239D2977DBE8B37E3261897617DC3FF',
  '_uid=185144859',
  'uf=b2d2c93beefa90dc2c46d4bf8df487606d225ba7c753d0349e41db8d6e2b7a799b5ac7625935e818d989d033515127f9913b662843f1f4ad6d92e371d7fdf64467b803f1a9623d1600726a3426cc7f6c5820d08cb2822170c6a7474300c2ff99000e6d5de32d8527',
  '_d=1789977611120',
  'UID=185144859',
  'vc=7239D2977DBE8B37E3261897617DC3FF',
  'vc2=DC9FB2FBCF895E63B5342B4C8449BF1B',
  'vc3=JnDWLtEfp8%2Bi9FuJx5kzUaRjAc6PGMkzrX0V7h0bwj%2B5grRJHqEB7%2FikZLDowK1dIptvNdKUnqqktsWSBjLp9jDCWLPEa0HTrO6cssDw2wQdQWCE9td7Uk2bxhJWydz7AyFPmcPQ0OrDtAKkdILVASEj70QbVwmwRSOJwUg1agU%3D0f92f630633a9f6163191a25c40694b4',
  'p_auth_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOiIxODUxNDQ4NTkiLCJsb2dpblRpbWUiOjE3ODk5Nzc2MTExMjAsImV4cCI6MTc5MDU4MjQxMX0.qR7eQpTHwCzjtGCkxBUphkk1SUTn8QRf8XJ1B7x1U6o',
  'xxtenc=dc5d05ee5e492eefbd376f248131cc7c',
  'DSSTASH_LOG=C_38-UN_0-US_185144859-T_1789977611121',
  'route=dca446f63d6bf4f1fa382f03cf38d60e',
  'uname=U202417354',
  'lo_page_index=1',
  'cdmhsession=N2JjYmZlMjQtZGVjYS00ZjZhLThiOTctNTM5MTU2NjAzNDk1',
  'moocroute=bac5a054c2593e63841d286322be85f2',
];

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36';
const LONGITUDE = '114.440488';
const LATITUDE = '30.517818';
const LOCATION_TEXT = '湖北省武汉市洪山区珞喻东路415号';

type Cookie = { name: string; value: string; domain: string; path: string; secure: boolean };
const jar: Cookie[] = [];

function cookieHeader(url: URL) {
  return jar
    .filter(
      (c) =>
        (url.hostname === c.domain || url.hostname.endsWith('.' + c.domain)) &&
        url.pathname.startsWith(c.path) &&
        (!c.secure || url.protocol === 'https:'),
    )
    .map((c) => `${c.name}=${c.value}`)
    .join('; ');
}

function getSetCookies(headers: Headers): string[] {
  const extended = headers as Headers & { getSetCookie?: () => string[] };
  return typeof extended.getSetCookie === 'function' ? extended.getSetCookie() : [];
}

async function req(
  url: string,
  init: { method?: string; headers?: Record<string, string>; body?: string } = {},
): Promise<{ status: number; body: string }> {
  const u = new URL(url);
  const headers = new Headers(init.headers);
  const ch = cookieHeader(u);
  if (ch) headers.set('cookie', ch);
  const res = await fetch(u, { method: init.method ?? 'GET', headers, body: init.body, redirect: 'manual' });
  for (const sc of getSetCookies(res.headers)) {
    const [pair, ...attrs] = sc.split(';');
    const eq = pair.indexOf('=');
    let domain = u.hostname;
    let path = '/';
    let secure = false;
    for (const attr of attrs) {
      const [k, ...rest] = attr.trim().split('=');
      const key = k.toLowerCase();
      if (key === 'domain') domain = rest.join('=').replace(/^\./, '').toLowerCase();
      else if (key === 'path') path = rest.join('=') || '/';
      else if (key === 'secure') secure = true;
    }
    jar.push({ name: pair.slice(0, eq).trim(), value: pair.slice(eq + 1).trim(), domain, path, secure });
  }
  const loc = res.status >= 300 && res.status < 400 ? res.headers.get('location') : null;
  if (loc) return req(new URL(loc, u).toString(), init);
  return { status: res.status, body: await res.text() };
}

async function main() {
  for (const pair of SEED_COOKIES) {
    const eq = pair.indexOf('=');
    jar.push({ name: pair.slice(0, eq), value: pair.slice(eq + 1), domain: 'smartcourse.hust.edu.cn', path: '/', secure: false });
  }

  const ret = await req(FirstSignInListUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8', 'User-Agent': UA },
    body: FirstSignInListBody,
  });
  const list = JSON.parse(ret.body) as { result: number; data: { array: { id: number; status: number; nameOne: string }[] } };
  const first = list?.data?.array?.find((v) => v.status === 1);
  if (!first) throw Error('无可签到项:' + ret.body);
  console.log('签到项:', first.id, first.nameOne);

  const signRet = await req(
    getPosiSignInUrl(String(first.id), LOCATION_TEXT, LONGITUDE, LATITUDE),
    { headers: { 'User-Agent': UA } },
  );
  if (getIsSignInSuccess(signRet.body)) {
    console.log('签到成功');
  } else {
    console.log('签到失败 status', signRet.status, signRet.body.slice(0, 400));
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error('出错:', e instanceof Error ? e.message : e);
  process.exit(1);
});
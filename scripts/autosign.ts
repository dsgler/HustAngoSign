// 用已有会话 cookie 直接执行自动签到，贴近原 autoSign 流程：
// activelist → preSign → getPosition(已临时替换为固定值) → signIn
// 位置固定 longitude=114.44, latitude=30.52，locationText 空，不动态获取
// 运行: pnpm dlx tsx scripts/autosign.ts
import {
  FirstSignInListBody,
  FirstSignInListUrl,
  getPosiSignInUrl,
  getPreSignUrl,
} from '../constants/urls';
import { getIsSignInSuccess } from '../utils/getIsSignInSuccess';
import { getPosition } from '../utils/getPosition';
import { otherIds } from '../types/otherIds';
import type { Response as SignInListResponse } from '../types/SignInList';

// 浏览器实测会话 cookie（smartcourse.hust.edu.cn，直接保留使用）
const SEED_COOKIES = [
  'BIGipServerpool-ncc-cxkcpt=859050156.20480.0000',
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
  'uf=b2d2c93beefa90dc2c46d4bf8df487606d225ba7c753d0349e41db8d6e2b7a790416ab4e70712fe1b55e481cdf033ea6913b662843f1f4ad6d92e371d7fdf64467b803f1a9623d1600726a3426cc7f6c611cab39b95089a8e4e2772912bf0144c19ce11d6df6773f',
  '_d=1788936768588',
  'UID=185144859',
  'vc=7239D2977DBE8B37E3261897617DC3FF',
  'vc2=8B0E6111D9692EF5F1B384C55699CD68',
  'vc3=g12i5SeZOnafXtBPN0DKHuxdgvM4bB%2BuAaXqGozO0%2FJrXpuFAh158Cex4o80MCUnu8xLnDrM%2BLzUNAeDZTV%2Bfty%2B8FK0ZCTWHYvQhUH%2BEfyXfdVjk9Kwh%2BiHKBXAItGEV4tvFb8KxnfRDlEbKgQYoGdI2BhFNC0WgtHxBvNCj34%3D22e259145a0aec5e94c303a021df9eaf',
  'p_auth_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOiIxODUxNDQ4NTkiLCJsb2dpblRpbWUiOjE3ODg5MzY3Njg1ODgsImV4cCI6MTc4OTU0MTU2OH0.0F85KqmDvkftaljVRuzc-E3cekAQ7xYbxP1C3mqBRZg',
  'xxtenc=dc5d05ee5e492eefbd376f248131cc7c',
  'DSSTASH_LOG=C_38-UN_0-US_185144859-T_1788936768588',
  'route=dca446f63d6bf4f1fa382f03cf38d60e',
  'uname=U202417354',
  'lo_page_index=1',
  'cdmhsession=ZDg4MDkwMzktODA4Zi00N2VjLTliYTktYjg3ZTljYzg4MGU3',
  'web_uname=9FCEjBPk5r3ceV8w5ryOj6JzxBOW3A%2FnDzX1kQygdlQ%3D',
  'moocroute=bd005a9cb8a7893f58401566a0c8d6a3',
];

const UA =
  'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Mobile Safari/537.36';

type Cookie = {
  name: string;
  value: string;
  domain: string;
  path: string;
  secure: boolean;
};

// 极简 cookie jar
const jar: Cookie[] = [];

function addCookie(url: URL, setCookie: string) {
  const [pair, ...attrs] = setCookie.split(';');
  const eq = pair.indexOf('=');
  const name = pair.slice(0, eq).trim();
  const value = pair.slice(eq + 1).trim();
  let domain = url.hostname;
  let path = '/';
  let secure = false;
  for (const attr of attrs) {
    const [k, ...rest] = attr.trim().split('=');
    const key = k.toLowerCase();
    if (key === 'domain') domain = rest.join('=').replace(/^\./, '').toLowerCase();
    else if (key === 'path') path = rest.join('=') || '/';
    else if (key === 'secure') secure = true;
  }
  jar.push({ name, value, domain, path, secure });
}

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

// 返回响应里全部 Set-Cookie；getSetCookie 在 undici 已提供，但本项目的
// Headers 类型可能未声明该方法，故用扩展类型 + 运行时探测访问。
function getSetCookies(headers: Headers): string[] {
  const extended = headers as Headers & { getSetCookie?: () => string[] };
  return typeof extended.getSetCookie === 'function' ? extended.getSetCookie() : [];
}

async function req(
  url: string,
  init: { method?: string; headers?: Record<string, string>; body?: string } = {},
  redirects = 10,
): Promise<{ status: number; body: string }> {
  const u = new URL(url);
  const headers = new Headers(init.headers);
  const ch = cookieHeader(u);
  if (ch) headers.set('cookie', ch);
  const res = await fetch(u, {
    method: init.method ?? 'GET',
    headers,
    body: init.body,
    redirect: 'manual',
  });
  for (const sc of getSetCookies(res.headers)) {
    addCookie(u, sc);
  }

  if (res.status >= 300 && res.status < 400 && redirects > 0) {
    const loc = res.headers.get('location');
    if (loc) {
      return req(new URL(loc, u).toString(), { headers: init.headers }, redirects - 1);
    }
  }
  return { status: res.status, body: await res.text() };
}

type Posi = { latitude: string; longitude: string; locationText: string };

async function main() {
  console.log('1) 载入已有会话 cookie…');
  for (const pair of SEED_COOKIES) {
    const eq = pair.indexOf('=');
    jar.push({
      name: pair.slice(0, eq),
      value: pair.slice(eq + 1),
      domain: 'smartcourse.hust.edu.cn',
      path: '/',
      secure: false,
    });
  }

  console.log('2) POST activelist（获取签到列表）…');
  const ret = await req(FirstSignInListUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'User-Agent': UA,
    },
    body: FirstSignInListBody,
  });
  console.log('   status:', ret.status, ' body:', ret.body.slice(0, 200));
  const list: SignInListResponse = JSON.parse(ret.body);
  if (list?.result !== 1 || !Array.isArray(list?.data?.array)) {
    throw Error('获取签到列表返回错误\n' + ret.body);
  }
  console.log('   result:', list.result, 'msg:', list.msg);

  const signable = list.data.array.filter((v) => v.status === 1);
  console.log('   可签到数:', signable.length);
  for (const v of signable) {
    console.log('   -', v.id, v.nameOne, otherIds[v.otherId] ?? v.otherId);
  }
  if (signable.length === 0) {
    throw Error('没有可签到项');
  }

  const first = signable[0];
  console.log('3) 第一个可签到:', first.id, first.nameOne, otherIds[first.otherId] ?? first.otherId);
  if (first.otherId !== '4') {
    throw Error(
      `第一个可签到项不是位置签到(otherId=${first.otherId},${otherIds[first.otherId] ?? '未知'}),请确认`,
    );
  }

  console.log('4) GET preSign（对应原 posiSign）…');
  const pre = await req(getPreSignUrl(String(first.id)), {
    headers: { 'User-Agent': UA },
  });
  console.log('   status:', pre.status);
  if (getIsSignInSuccess(pre.body)) {
    console.log('   preSign 显示已签到，无需再签');
    return;
  }

  console.log('5) 位置签到：固定坐标 114.44, 30.52，不动态获取…');
  let posi: Posi;
  try {
    posi = getPosition(pre.body); // getPosition 已临时替换为固定值
  } catch {
    posi = { latitude: '30.52', longitude: '114.44', locationText: '' };
  }
  console.log('   posi:', JSON.stringify(posi));

  const signRet = await req(
    getPosiSignInUrl(String(first.id), posi.locationText, posi.longitude, posi.latitude),
    { headers: { 'User-Agent': UA } },
  );
  console.log('   sign status:', signRet.status);
  console.log('   response:', signRet.body.slice(0, 500));
  if (getIsSignInSuccess(signRet.body)) {
    console.log('签到成功');
  } else {
    console.log('签到失败');
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error('出错:', e instanceof Error ? e.message : e);
  process.exit(1);
});
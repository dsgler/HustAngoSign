// 排查原 getPosition 为何失效：抓取 preSign 页面，测试原正则，输出位置字段上下文
// 运行: pnpm dlx tsx scripts/checkPosi.ts
import { getPreSignUrl } from '../constants/urls';
import { writeFileSync } from 'node:fs';
import { getPosition } from '../utils/getPosition';

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

async function req(url: string, redirects = 10): Promise<{ status: number; body: string }> {
  const u = new URL(url);
  const headers = new Headers({ 'User-Agent': UA });
  const ch = cookieHeader(u);
  if (ch) headers.set('cookie', ch);
  const res = await fetch(u, { headers, redirect: 'manual' });
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
  if (res.status >= 300 && res.status < 400 && redirects > 0) {
    const loc = res.headers.get('location');
    if (loc) return req(new URL(loc, u).toString(), redirects - 1);
  }
  return { status: res.status, body: await res.text() };
}

const ctx = (body: string, keyword: string, before = 100, after = 160) => {
  const idx = body.indexOf(keyword);
  if (idx === -1) return `(未找到 ${keyword})`;
  return body.slice(Math.max(0, idx - before), idx + after);
};

async function main() {
  const activeId = process.argv[2] ?? '166712';
  console.log('1) 载入 cookie，GET preSign?activeId=' + activeId);
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

  const pre = await req(getPreSignUrl(activeId));
  console.log('   status:', pre.status, ' body 长度:', pre.body.length);
  writeFileSync('/tmp/presign_body.html', pre.body);

  console.log('\n2) 关键词上下文（location / latitude / longitude / 签到元素）:');
  for (const kw of [
    'locationLatitude',
    'locationLongitude',
    'locationText',
    'location',
    'latitude',
    'longitude',
    'position',
    'Position',
    'signCode',
    '签到',
  ]) {
    console.log('\n---', kw, '---');
    console.log(ctx(pre.body, kw));
  }

  console.log('\n3) 用原 getPosition 解析:');
  try {
    console.log('   成功:', JSON.stringify(getPosition(pre.body)));
  } catch (e) {
    console.log('   失败:', e instanceof Error ? e.message.slice(0, 300) : e);
  }
}

main().catch((e) => {
  console.error('出错:', e instanceof Error ? e.message : e);
  process.exit(1);
});
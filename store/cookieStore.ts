import { casUrl, passUrl, smartUrl } from '@/constants/urls';
import CookieManager, { Cookies } from '@react-native-cookies/cookies';

type userIdType = string;

type cookieStoreType = {
  [key: userIdType]: cookieStoreItemType | undefined;
};

type cookieStoreItemType = {
  //   [key : [smartUrl] | typeof passUrl | typeof casUrl]: Cookies;
  [passUrl]: Cookies | undefined;
  [casUrl]: Cookies | undefined;
  [smartUrl]: Cookies | undefined;
};

export const cookieStore: cookieStoreType = {};

export const storeCookie = async (userId: userIdType) => {
  cookieStore[userId] = {
    [passUrl]: await CookieManager.get(passUrl),
    [casUrl]: await CookieManager.get(casUrl),
    [smartUrl]: await CookieManager.get(smartUrl),
  };
  console.log('store', cookieStore[userId]);
};

export const loadCookie = async (userId: userIdType) => {
  if (!cookieStore[userId]) return false;

  console.log('load cookie');

  for (const [k, v] of Object.entries(cookieStore[userId])) {
    if (v) {
      for (const cookie of Object.values(v)) {
        await CookieManager.set(k, cookie);
      }
    }
  }
};

export const clearCookie = async (userId: userIdType) => {
  cookieStore[userId] = undefined;
};

// 准备用于优化，未实装
export let lastUserId = '';

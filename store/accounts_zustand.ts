import {
  checkLogFuncT,
  editFuncT,
  enableFuncT,
  loginFuncT,
} from '@/types/accountStore';
import { headersType, NetRet } from '@/NativeModules/Anchek';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import { accountState } from '@/types/accountState';
import Storage from 'expo-sqlite/kv-store';
import { passUrl, smartLoginUrl, smartBaseUrl } from '@/constants/urls';
import { useLog } from './log_zustand';
import { create } from 'zustand';
import { produce } from 'immer';
import { Ancheck } from '@/NativeModules/Ancheck';

import CookieManager from '@react-native-cookies/cookies';
import { cookielock } from '@/locks/cookielock';
import { wechatHeader } from '@/constants/header';
import { loadCookie, storeCookie } from './cookieStore';
import { isUseNativeLog } from '../constants/isUseNativeLog';

export const UserNotExist = Error('此用户不存在');
const AccountStoreKey = '_MyAccountStore';

export type AccountStoreItem = {
  userId: string;
  userName: string;
  passwd: string;
  CASTGC: string;
  state: string;
  isEnabled: boolean;
};

export type AccountStoreStateType = {
  accountObj: Record<string, AccountStoreItem>;
  accountArr: string[];
};

type AccountStoreActionType = {
  enableFunc: enableFuncT;
  checkLogFunc: checkLogFuncT;
  loginFunc: loginFuncT;
  editFunc: editFuncT;
  updateUserState: (
    userId: string,
    UserState: string,
    userName?: string,
  ) => void;
  addUser: (userId: string, passwd: string, CASTGC: string) => void;
  editUser: (userId: string, passwd: string, CASTGC: string) => void;
  deleteUser: (userId: string) => void;
  Get: (
    userId: string,
    url: string,
    headers?: headersType,
    shouldSave?: boolean,
  ) => Promise<NetRet>;
  Post: (
    userId: string,
    url: string,
    inbody: string,
    headers?: headersType,
    shouldSave?: boolean,
  ) => Promise<NetRet>;
};

type AccountStoreUnionType = {
  accountObj: AccountStoreStateType['accountObj'];
  accountArr: AccountStoreStateType['accountArr'];
};

export const useAccountStore = create<
  AccountStoreStateType & AccountStoreActionType
>((set, get) => {
  const addLog = useLog.getState().addLog;

  let accountObj: AccountStoreStateType['accountObj'] = {};
  let accountArr: AccountStoreStateType['accountArr'] = [];
  if (Platform.OS === 'android' || Platform.OS === 'ios') {
    const r = Storage.getItemSync(AccountStoreKey);
    if (r) {
      console.log('load', r);
      const e: AccountStoreUnionType = JSON.parse(r);

      if ('accountObj' in e && 'accountArr' in e) {
        // 将状态置空
        for (const key in e.accountObj) {
          e.accountObj[key].state = accountState.plain;
        }

        accountObj = e.accountObj;
        accountArr = e.accountArr;
      } else {
        addLog('读取数据失败，保持空数据，可能因为旧版本升级类型改变');
      }
    }
  }

  if (accountArr.length !== Object.keys(accountObj).length) {
    console.log('用户数据错误', '长度不等长，尝试修复');
    accountArr = Object.keys(accountObj);
  }

  const save = () => {
    if (Platform.OS === 'android' || Platform.OS === 'ios') {
      if (get().accountArr.length === 0) return;

      const u: AccountStoreUnionType = {
        accountObj: get().accountObj,
        accountArr: get().accountArr,
      };

      Storage.setItemSync(AccountStoreKey, JSON.stringify(u));
    }
  };

  const enableFunc: AccountStoreActionType['enableFunc'] = (
    userId: string,
    isEnable: boolean,
  ) => {
    set((state) => {
      const u = state.accountObj[userId];
      if (!u) {
        throw UserNotExist;
      }

      return {
        accountObj: produce(state.accountObj, (accountObj) => {
          accountObj[userId].isEnabled = isEnable;
        }),
      };
    });
  };

  const checkLogFunc: AccountStoreActionType['checkLogFunc'] = async (
    userId: string,
  ) => {
    const u = get().accountObj[userId];
    if (!u) throw UserNotExist;

    if (isUseNativeLog) {
      if (!get().accountObj[userId]) throw UserNotExist;

      return Ancheck.check(userId);
    } else {
      if (!u.CASTGC) {
        throw Error('passwd和CASTGC均为空，无法登录');
      }

      get().updateUserState(userId, accountState.pending);

      await get().Get(userId, smartLoginUrl, undefined, true);
      const req = get().Get(userId, smartBaseUrl);
      const body = (await req).body;

      const re = /<p class="user-name">(.+)<\/p>/;
      let name: string;
      try {
        name = body.match(re)![1];
      } catch {
        get().updateUserState(userId, accountState.logFailed);
        throw Error(body);
      }
      get().updateUserState(userId, accountState.logged);

      console.log(await CookieManager.get(passUrl));
      console.log(await CookieManager.get(smartBaseUrl));

      return name;
    }
  };

  const setCas = (CASTGC: string) => {
    console.log('set cas :', CASTGC);
    addLog(['set cas :', CASTGC], 'setCas');
    return CookieManager.set(passUrl, {
      name: 'CASTGC',
      value: CASTGC,
      path: '/cas',
      domain: 'pass.hust.edu.cn',
    });
  };

  const clearCookie = () => {
    console.log('clear cookie');
    return CookieManager.clearAll();
  };

  const loginFunc: AccountStoreActionType['loginFunc'] = async (
    userId: string,
  ) => {
    const u = get().accountObj[userId];
    if (!u) throw UserNotExist;

    if (isUseNativeLog) {
      return Ancheck.login(u.userId, u.passwd);
    } else {
      // TODO 网页登录
      await clearCookie();
      router.push({
        pathname: '/webLogin',
        params: { userId: u.userId, passwd: u.passwd },
      });
    }
  };

  const editFunc: AccountStoreActionType['editFunc'] = (userId: string) => {
    router.push({ pathname: '/add', params: { userId } });
  };

  const addUser: AccountStoreActionType['addUser'] = (
    userId: string,
    passwd: string,
    CASTGC: string,
  ) => {
    set((state) => ({
      accountObj: {
        ...state.accountObj,
        [userId]: {
          isEnabled: true,
          passwd,
          state: accountState.plain,
          userId,
          userName: '',
          CASTGC,
        },
      },
      accountArr: [...state.accountArr, userId],
    }));
    save();
  };

  const updateUserState: AccountStoreActionType['updateUserState'] = (
    userId: string,
    UserState: string,
    userName?: string,
  ) => {
    set((state) => {
      if (!state.accountObj[userId]) throw UserNotExist;

      return {
        accountObj: produce(state.accountObj, (accountObj) => {
          accountObj[userId].state = UserState;
          if (userName) {
            accountObj[userId].userName = userName;
          }
        }),
      };
    });
    save();
  };

  const editUser: AccountStoreActionType['editUser'] = (
    userId: string,
    passwd: string,
    CASTGC: string,
  ) => {
    set((state) => {
      if (!state.accountObj[userId]) throw UserNotExist;

      if (CASTGC) {
        addLog(CASTGC, 'CASTGC');
      }

      return {
        accountObj: produce(state.accountObj, (accountObj) => {
          accountObj[userId].passwd = passwd;
          accountObj[userId].CASTGC = CASTGC;
        }),
      };
    });
    save();
  };

  const deleteUser: AccountStoreActionType['deleteUser'] = (userId: string) => {
    set((state) => {
      if (!state.accountObj[userId]) throw UserNotExist;

      return {
        accountObj: Object.fromEntries(
          Object.entries(state.accountObj).filter(
            ([_k, v]) => v.userId !== userId,
          ),
        ),
        accountArr: state.accountArr.filter((v) => v !== userId),
      };
    });
    save();
  };

  const request = async ({
    inbody,
    method,
    url,
    userId,
    headers,
    shouldSave,
  }: {
    method: 'GET' | 'POST';
    userId: string;
    url: string;
    inbody?: string;
    headers?: headersType;
    shouldSave?: boolean;
  }) => {
    const u = get().accountObj[userId];
    if (!u) throw UserNotExist;

    if (isUseNativeLog) {
      if (method === 'GET') {
        return Ancheck.get(userId, url, headers ?? wechatHeader);
      } else {
        if (!inbody) throw Error('POST 必须传递body');

        return Ancheck.post(
          userId,
          url,
          inbody,
          headers ? { ...wechatHeader, ...headers } : wechatHeader,
        );
      }
    } else {
      const release = await cookielock.acquire();
      try {
        await clearCookie();
        await setCas(u.CASTGC);
        await loadCookie(userId);
        let resp: Response;
        if (method === 'GET') {
          resp = await fetch(url, { headers });
        } else {
          resp = await fetch(url, {
            headers,
            body: inbody,
            method: 'POST',
          });
        }

        if (shouldSave) {
          await storeCookie(userId);
        }

        return { statusCode: resp.status, body: await resp.text() };
      } finally {
        release();
      }
    }
  };

  const Get: AccountStoreActionType['Get'] = async (
    userId: string,
    url: string,
    headers?: headersType,
    shouldSave?: boolean,
  ) => {
    return request({ method: 'GET', url, userId, headers, shouldSave });
  };

  const Post: AccountStoreActionType['Post'] = async (
    userId: string,
    url: string,
    inbody: string,
    headers?: headersType,
    shouldSave?: boolean,
  ) => {
    return request({
      method: 'POST',
      url,
      userId,
      headers,
      inbody,
      shouldSave,
    });
  };

  return {
    accountArr,
    accountObj,
    addUser,
    checkLogFunc,
    deleteUser,
    editFunc,
    editUser,
    enableFunc,
    Get,
    loginFunc,
    Post,
    updateUserState,
  };
});

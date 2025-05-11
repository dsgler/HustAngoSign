import {
  checkLogFuncT,
  editFuncT,
  enableFuncT,
  loginFuncT,
} from '@/types/accountStore';
import { AncheckInterface, headersType } from '@/NativeModules/Anchek';
import { useImmer } from 'use-immer';
import { NativeModules, Platform } from 'react-native';
import { router } from 'expo-router';
import { accountState } from '@/types/accountState';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import Storage from 'expo-sqlite/kv-store';
import * as SignInListTypes from '@/types/SignInList';
import {
  FirstSignInListBody,
  FirstSignInListUrl,
  getPosiSignInUrl,
} from '@/constants/urls';
import { useLog } from './log';
import { otherIds } from '@/types/otherIds';
import { getGestureSignInUrl, getPreSignUrl } from '@/constants/urls';
import { getIsSignInSuccess } from '@/utils/getIsSignInSuccess';
import { getPosition } from '@/utils/getPosition';

export const UserNotExist = Error('此用户不存在');

export type AccountStoreItem = {
  userId: string;
  userName: string;
  passwd: string;
  state: string;
  isEnabled: boolean;
};

const AccountStoreKey = '_MyAccountStore';

export default function useAccountStore() {
  const [accountStore, updateAccountStore] = useImmer<AccountStoreItem[]>([]);
  const { addLog } = useLog();
  const Ancheck: AncheckInterface = NativeModules.Ancheck;

  useEffect(() => {
    if (Platform.OS === 'android' || Platform.OS === 'ios') {
      Storage.getItemAsync(AccountStoreKey).then((r) => {
        if (r) {
          console.log('load', r);
          const e: AccountStoreItem[] = JSON.parse(r);
          e.forEach((v) => {
            v.state = accountState.plain;
          });
          updateAccountStore(e);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    Ancheck.InitStore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const shouldSave = useRef(false);

  const save = useCallback(() => {
    if (Platform.OS === 'android' || Platform.OS === 'ios') {
      if (accountStore.length === 0) return;

      console.log('存储', accountStore);
      Storage.setItemSync(AccountStoreKey, JSON.stringify(accountStore));
    }
  }, [accountStore]);

  if (shouldSave.current) {
    save();
    shouldSave.current = false;
  }

  const getUser = useCallback(
    (userId: string) => {
      return accountStore.find((a) => a.userId === userId);
    },
    [accountStore],
  );

  const enableFunc: enableFuncT = useCallback(
    (userId: string, isEnable: boolean) => {
      let isFail = false;
      updateAccountStore((as) => {
        const u = as.find((a) => a.userId === userId);
        if (!u) {
          isFail = true;
          return;
        }
        u.isEnabled = isEnable;
      });

      if (isFail) {
        throw UserNotExist;
      }
      shouldSave.current = true;
    },
    [updateAccountStore],
  );

  const checkLogFunc: checkLogFuncT = useCallback(
    async (userId: string) => {
      if (!getUser(userId)) throw UserNotExist;

      return Ancheck.check(userId);
    },
    [Ancheck, getUser],
  );

  const loginFunc: loginFuncT = useCallback(
    async (userId: string) => {
      const u = getUser(userId);
      if (!u) throw UserNotExist;
      return Ancheck.login(u.userId, u.passwd);
    },
    [Ancheck, getUser],
  );

  const editFunc: editFuncT = useCallback((userId: string) => {
    router.push({ pathname: '/add', params: { userId } });
  }, []);

  const addUser = useCallback(
    (userId: string, passwd: string) => {
      console.log(userId);
      updateAccountStore((ac) => {
        ac.push({
          isEnabled: true,
          passwd,
          state: accountState.plain,
          userId,
          userName: '',
        });
      });
      shouldSave.current = true;
    },
    [updateAccountStore],
  );

  const updateState = useCallback(
    (userId: string, state: string, userName?: string) => {
      let isFail = false;
      updateAccountStore((as) => {
        const u = as.find((a) => a.userId === userId);
        if (!u) {
          isFail = true;
          return;
        }
        u.state = state;
        userName && (u.userName = userName);
      });

      if (isFail) {
        throw UserNotExist;
      }
      // shouldSave.current = true;
    },
    [updateAccountStore],
  );

  const editUser = useCallback(
    (userId: string, newUserId: string, passwd: string) => {
      console.log('edit');
      let isFail = false;
      updateAccountStore((as) => {
        const i = as.findIndex((a) => a.userId === userId);
        if (i === -1) {
          isFail = true;
          return;
        }
        as[i].userId = newUserId;
        as[i].passwd = passwd;
      });

      if (isFail) {
        throw UserNotExist;
      }
      shouldSave.current = true;
    },
    [updateAccountStore],
  );

  const deleteUser = useCallback(
    (userId: string) => {
      updateAccountStore(accountStore.filter((a) => a.userId !== userId));
      shouldSave.current = true;
    },
    [accountStore, updateAccountStore],
  );

  const get = useCallback(
    async (userId: string, url: string, headers?: headersType) => {
      if (!getUser(userId)) throw UserNotExist;

      return Ancheck.get(userId, url, headers ?? {});
    },
    [Ancheck, getUser],
  );

  const post = useCallback(
    async (
      userId: string,
      url: string,
      inbody: string,
      headers?: headersType,
    ) => {
      if (!getUser(userId)) throw UserNotExist;

      return Ancheck.post(userId, url, inbody, headers ?? {});
    },
    [Ancheck, getUser],
  );

  const Signble = useMemo(() => {
    return accountStore.filter(
      (info) =>
        info.isEnabled &&
        (info.state === accountState.logged ||
          info.state === accountState.checkFailed),
    );
  }, [accountStore]);

  const gestureSign = useCallback(
    async (activeId: string, userId: string) => {
      let ret = await get(userId, getPreSignUrl(activeId));
      if (getIsSignInSuccess(ret.body)) {
        return;
      }

      const CodeRe = /<input.+id="signCode".+value="(\d+)".+>/;
      const code = ret.body.match(CodeRe)?.[1];
      if (!code) {
        throw Error('未找到密码' + JSON.stringify(ret));
      }

      ret = await get(userId, getGestureSignInUrl(activeId, code));
      if (!getIsSignInSuccess(ret.body)) {
        throw Error('签到返回值错误' + ret.body);
      }
    },
    [get],
  );

  const posiSign = useCallback(
    async (activeId: string, userId: string) => {
      let ret = await get(userId, getPreSignUrl(activeId));
      if (getIsSignInSuccess(ret.body)) {
        return;
      }

      const posi = getPosition(ret.body);

      ret = await get(
        userId,
        getPosiSignInUrl(
          activeId,
          posi.locationText,
          posi.longitude,
          posi.latitude,
        ),
      );
      if (!getIsSignInSuccess(ret.body)) {
        throw Error('签到返回值错误' + ret.body);
      }
    },
    [get],
  );

  const autoSign = useCallback(
    async (userId: string) => {
      const ret = await post(userId, FirstSignInListUrl, FirstSignInListBody, {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      });
      const list: SignInListTypes.Response = JSON.parse(ret.body);
      if (list?.result !== 1 || !Array.isArray(list?.data?.array)) {
        throw Error('获取签到列表返回错误\n' + JSON.stringify(ret));
      }

      const signable = list.data.array.filter((v) => v.status === 1);

      if (signable.length !== 1) {
        throw Error(
          `可签到数应为1，但得到${signable.length} ` +
            JSON.stringify(list.data.array),
        );
      }

      addLog(otherIds[signable[0].otherId], userId);

      switch (signable[0].otherId) {
        case '2': {
          throw Error(otherIds[signable[0].otherId] + ',请扫码');
        }
        case '1':
        case '3': {
          await gestureSign(String(signable[0].id), userId);
          break;
        }
        case '4': {
          await posiSign(String(signable[0].id), userId);
          break;
        }
        case '0': {
          const ret = await get(
            userId,
            getGestureSignInUrl(String(signable[0].id), ''),
          );
          if (!getIsSignInSuccess(ret.body)) {
            throw Error('签到返回值错误' + ret.body);
          }
          break;
        }
        default: {
          throw Error('未知的otherId:' + signable[0].otherId);
        }
      }
    },
    [addLog, gestureSign, get, posiSign, post],
  );

  return {
    accountStore,
    Signble,
    enableFunc,
    checkLogFunc,
    loginFunc,
    editFunc,
    updateState,
    addUser,
    getUser,
    editUser,
    deleteUser,
    get,
    post,
    autoSign,
  };
}

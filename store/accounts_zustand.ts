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
import * as SignInListTypes from '@/types/SignInList';
import {
  FirstSignInListBody,
  FirstSignInListUrl,
  getPosiSignInUrl,
  getQrSignInUrl,
} from '@/constants/urls';
import { useLog } from './log_zustand';
import { otherIds } from '@/types/otherIds';
import { getGestureSignInUrl, getPreSignUrl } from '@/constants/urls';
import { getIsSignInSuccess } from '@/utils/getIsSignInSuccess';
import { getPosition } from '@/utils/getPosition';
import { create } from 'zustand';
import { produce } from 'immer';
import { Ancheck } from '@/NativeModules/Ancheck';
import myAlert from '@/components/myAlert';

export const UserNotExist = Error('此用户不存在');
const AccountStoreKey = '_MyAccountStore';

export type AccountStoreItem = {
  userId: string;
  userName: string;
  passwd: string;
  state: string;
  isEnabled: boolean;
};

type AccountStoreStateType = {
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
  addUser: (userId: string, passwd: string) => void;
  editUser: (userId: string, passwd: string) => void;
  deleteUser: (userId: string) => void;
  Get: (userId: string, url: string, headers?: headersType) => Promise<NetRet>;
  Post: (
    userId: string,
    url: string,
    inbody: string,
    headers?: headersType,
  ) => Promise<NetRet>;
};

type AccountStoreUnionType = {
  accountObj: AccountStoreStateType['accountObj'];
  accountArr: AccountStoreStateType['accountArr'];
};

export const useAccountStore = create<
  AccountStoreStateType & AccountStoreActionType
>((set, get) => {
  const addLog = useLog((state) => state.addLog);

  let accountObj: AccountStoreStateType['accountObj'] = {};
  let accountArr: AccountStoreStateType['accountArr'] = [];
  if (Platform.OS === 'android' || Platform.OS === 'ios') {
    Storage.getItemAsync(AccountStoreKey).then((r) => {
      if (r) {
        console.log('load', r);
        const e: AccountStoreUnionType = JSON.parse(r);

        // 将状态置空
        for (const key in e.accountObj) {
          e.accountObj[key].state = accountState.plain;
        }

        accountObj = e.accountObj;
        accountArr = e.accountArr;
      }
    });
  }

  // TODO: init

  const save = () => {
    if (Platform.OS === 'android' || Platform.OS === 'ios') {
      if (get().accountArr.length === 0) return;

      const u: AccountStoreUnionType = {
        accountObj: get().accountObj,
        accountArr: get().accountArr,
      };

      addLog(['存储', u.toString()]);
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
    if (!get().accountObj[userId]) throw UserNotExist;

    return Ancheck.check(userId);
  };

  const loginFunc: AccountStoreActionType['loginFunc'] = async (
    userId: string,
  ) => {
    const u = get().accountObj[userId];
    if (!u) throw UserNotExist;

    return Ancheck.login(u.userId, u.passwd);
  };

  const editFunc: AccountStoreActionType['editFunc'] = (userId: string) => {
    router.push({ pathname: '/add', params: { userId } });
  };

  const addUser: AccountStoreActionType['addUser'] = (
    userId: string,
    passwd: string,
  ) => {
    set((state) => ({
      accountObj: {
        ...state.accountObj,
        userId: {
          isEnabled: true,
          passwd,
          state: accountState.plain,
          userId,
          userName: '',
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
  ) => {
    set((state) => {
      if (!state.accountObj[userId]) throw UserNotExist;

      return {
        accountObj: produce(state.accountObj, (accountObj) => {
          accountObj[userId].passwd = passwd;
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

  const Get: AccountStoreActionType['Get'] = async (
    userId: string,
    url: string,
    headers?: headersType,
  ) => {
    if (!get().accountObj[userId]) throw UserNotExist;

    return Ancheck.get(userId, url, headers ?? {});
  };

  const Post: AccountStoreActionType['Post'] = async (
    userId: string,
    url: string,
    inbody: string,
    headers?: headersType,
  ) => {
    if (!get().accountObj[userId]) throw UserNotExist;

    return Ancheck.post(userId, url, inbody, headers ?? {});
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

export const getSignAble = (): AccountStoreStateType['accountObj'] => {
  const accountObj: AccountStoreStateType['accountObj'] =
    useAccountStore.getState().accountObj;
  return Object.fromEntries(
    Object.entries(accountObj).filter(
      ([_k, info]) =>
        info.isEnabled &&
        (info.state === accountState.logged ||
          info.state === accountState.checkFailed),
    ),
  );
};

export const qrSign = (userId: string, RawUrl: string) => {
  const addLog = useLog.getState().addLog;
  const as = useAccountStore.getState();

  as.updateUserState(userId, accountState.pending);

  let QrSignInUrl: string;
  try {
    QrSignInUrl = getQrSignInUrl(RawUrl);
  } catch (e) {
    myAlert(
      '链接错误',
      (e instanceof Error ? e.message : JSON.stringify(e)) + ':\n' + RawUrl,
    );
    addLog(
      [
        '链接错误',
        (e instanceof Error ? e.message : JSON.stringify(e)) + ':\n',
        RawUrl,
      ],
      userId,
    );
    return;
  }

  as.Get(userId, QrSignInUrl, {})
    .then((v) => {
      if (getIsSignInSuccess(v.body)) {
        as.updateUserState(userId, accountState.checkSuccess);
      } else {
        as.updateUserState(userId, accountState.checkFailed);
        myAlert('签到返回值错误', JSON.stringify(v));
        addLog(['签到返回值错误', JSON.stringify(v)], userId);
      }
    })
    .catch((e) => {
      as.updateUserState(userId, accountState.checkFailed);
      myAlert(
        '发起请求错误,请检查是否已登录',
        e && e.message ? e.message : JSON.stringify(e),
      );
      addLog(
        [
          '发起请求错误,请检查是否已登录',
          e && e.message ? e.message : JSON.stringify(e),
        ],
        userId,
      );
    });
};

const gestureSign = async (activeId: string, userId: string) => {
  const get = useAccountStore.getState().Get;

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
};

const posiSign = async (activeId: string, userId: string) => {
  const get = useAccountStore.getState().Get;

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
};

export const autoSign = async (userId: string) => {
  const get = useAccountStore.getState().Get;
  const post = useAccountStore.getState().Post;

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

  useLog.getState().addLog(otherIds[signable[0].otherId], userId);

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
};

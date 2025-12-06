import { accountState } from '@/types/accountState';
import * as SignInListTypes from '@/types/SignInList';
import {
  FirstSignInListBody,
  FirstSignInListUrl,
  getPosiSignInUrl,
  getQrSignInUrl,
  getGestureSignInUrl,
  getPreSignUrl,
} from '@/constants/urls';
import { otherIds } from '@/types/otherIds';
import { getIsSignInSuccess } from '@/utils/getIsSignInSuccess';
import { getPosition } from '@/utils/getPosition';
import myAlert from '@/components/myAlert';

import {
  AccountStoreStateType,
  useAccountStore,
} from '@/store/accounts_zustand';
import { useLog } from '@/store/log_zustand';
import myPrompt from '@/components/myPrompt';
import { router } from 'expo-router';
import { loadCookie } from '@/store/cookieStore';

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

export const qrSign = async (userId: string, RawUrl: string) => {
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

  addLog('签到链接:' + QrSignInUrl, 'QrSignInUrl');

  return as
    .Get(userId, QrSignInUrl, {})
    .then((v) => {
      if (getIsSignInSuccess(v.body)) {
        as.updateUserState(userId, accountState.checkSuccess);
      } else {
        as.updateUserState(userId, accountState.checkFailed);
        // 解决某些情况下可能有人机验证的问题
        myAlert(
          '签到返回值错误，是否直接打开网页？',
          JSON.stringify(v),
          async () => {
            await loadCookie(userId);
            router.push({
              pathname: '/customWebView',
              params: { url: RawUrl },
            });
          },
        );
        addLog(['签到返回值错误', JSON.stringify(v)], userId);
      }
    })
    .catch((e) => {
      console.log(e);
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

  useLog.getState().addLog('手势签到code：' + code, 'gestureSign code');

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

  useLog
    .getState()
    .addLog('位置签到code：' + JSON.stringify(posi), 'posiSign posi');
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
  console.log(ret);
  const list: SignInListTypes.Response = JSON.parse(ret.body);
  if (list?.result !== 1 || !Array.isArray(list?.data?.array)) {
    throw Error('获取签到列表返回错误\n' + JSON.stringify(ret));
  }

  const signable = list.data.array.filter((v) => v.status === 1);

  if (signable.length === 0) {
    throw Error(
      `可签到数应为1，但得到${signable.length} ` +
        JSON.stringify(list.data.array),
    );
  }
  let k = 0;
  if (signable.length !== 1) {
    await new Promise<void>((rs, rj) => {
      myPrompt(
        '可签到数不为1，请选择',
        signable.map((v, k) => `${k}:${v.nameOne}`).join('\n'),
        (m) => {
          k = Number(m);
          if (Number.isNaN(k)) {
            rj();
          }
          rs();
        },
      );
    });
  }

  useLog.getState().addLog(otherIds[signable[k].otherId], userId);

  switch (signable[k].otherId) {
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
      throw Error(
        '未知的otherId:' +
          signable[0].otherId +
          '\n' +
          JSON.stringify(signable[0]),
      );
    }
  }
};

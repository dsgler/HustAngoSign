import { AccountsCtx } from '@/contexts/accounts';
import { accountState, accountStateColor } from '@/types/accountState';
import { myEvents } from '@/types/sseEvents';
import { router } from 'expo-router';
import { useContext, useEffect, useRef, useState } from 'react';
import {
  Pressable,
  TextInput,
  View,
  Text,
  StyleSheet,
  NativeModules,
} from 'react-native';
import EventSource, { EventSourceListener } from 'react-native-sse';
import myAlert from './myAlert';
import { AncheckInterface } from '@/NativeModules/Anchek';
import { Storage } from 'expo-sqlite/kv-store';

const description = {
  [accountState.plain]: '连接服务器',
  [accountState.logged]: '断开连接',
  [accountState.logFailed]: '重新连接',
};

type qrRetT = {
  code: number;
  data: string;
};

const ServerUrlKey = 'ServerUrlKey651321';

export default function SseBar() {
  const as = useContext(AccountsCtx);
  const Ancheck: AncheckInterface = NativeModules.Ancheck;

  const [url, setUrl] = useState('');
  const esRef = useRef<EventSource<myEvents>>();
  const timerId = useRef<any>();
  const [sseState, setSseState] = useState(accountState.plain);
  useEffect(() => {
    Storage.getItemAsync(ServerUrlKey).then((v) => {
      if (v) {
        setUrl(v);
      }
    });
  }, []);

  const errHandler: EventSourceListener<'error'> = (e) => {
    setSseState(accountState.logFailed);
    myAlert('连接失败', e instanceof Error ? e.message : JSON.stringify(e));
  };

  const connnect = () => {
    let es;
    try {
      es = new EventSource<myEvents>(url);
    } catch (e) {
      myAlert('创建sse错误', String(e));
      setSseState(accountState.logFailed);
      return;
    }

    Storage.setItemAsync(ServerUrlKey, url);

    esRef.current = es;
    es.addEventListener('open', () => {
      setSseState(accountState.logged);
      timerId.current = setTimeout(() => {
        close();
        setSseState(accountState.logFailed);
      }, 10000);
    });
    es.addEventListener('error', errHandler);
    es.addEventListener('close', () => {
      setSseState(accountState.plain);
    });
    es.addEventListener('ping', () => {
      clearTimeout(timerId.current);
      timerId.current = setTimeout(() => {
        close();
        setSseState(accountState.logFailed);
      }, 10000);
    });
    es.addEventListener('qr', (e) => {
      if (!e.data) return;
      console.log(e);

      const data: qrRetT = JSON.parse(e.data);
      if (data.code !== 1) {
        myAlert('错误', data.data);

        return;
      }

      as.accountStore
        .filter(
          (info) =>
            info.isEnabled &&
            (info.state === accountState.logged ||
              info.state === accountState.checkFailed),
        )
        .forEach((info) => {
          console.log(data);
          as.updateState(info.userId, accountState.pending);
          Ancheck.get(info.userId, data.data, {})
            .then((v) => {
              if (v.body.includes('Sign in successfully')) {
                as.updateState(info.userId, accountState.checkSuccess);
              } else {
                as.updateState(info.userId, accountState.checkFailed);
                myAlert('签到返回值错误', JSON.stringify(v));
              }
            })
            .catch((e) => {
              as.updateState(info.userId, accountState.checkFailed);
              myAlert(
                '发起请求错误,请检查是否已登录',
                e && e.message ? e.message : JSON.stringify(e),
              );
            })
            .then(() => {
              es.close();
            });
        });
    });
  };

  const close = () => {
    esRef.current?.removeAllEventListeners();
    esRef.current?.close();
    clearTimeout(timerId.current);
    setSseState(accountState.plain);
  };

  return (
    <View style={{ paddingHorizontal: 20 }}>
      <View style={{ paddingVertical: 10 }}>
        <TextInput
          style={{ lineHeight: 32, fontSize: 16 }}
          value={url}
          onChangeText={setUrl}
          placeholder="请输入服务器url"
        />
      </View>
      <View style={{ flexDirection: 'row', gap: 5 }}>
        <Pressable
          onPress={() => {
            if (sseState === accountState.logged) {
              close();
            } else {
              connnect();
            }
          }}
          style={[
            styles.button,
            { backgroundColor: accountStateColor[sseState] },
          ]}
        >
          <Text style={styles.text}>{description[sseState]}</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            router.push('/add');
          }}
          style={[styles.button]}
        >
          <Text style={styles.text}>添加用户</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    justifyContent: 'center',
    paddingVertical: 20,
    flex: 1,
  },
  text: {
    fontSize: 16,
    textAlign: 'center',
  },
});

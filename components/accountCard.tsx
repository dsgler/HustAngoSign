import { autoSign, useAccountStore } from '@/store/accounts_zustand';
import { accountState, accountStateColor } from '@/types/accountState';
import { View, Text, GestureResponderEvent, Pressable } from 'react-native';
import AntDesignIcon from '@expo/vector-icons/AntDesign';
import { MyCheckBox } from './myCheckBox';
import myAlert from './myAlert';
import React from 'react';
import { useLog } from '@/store/log_zustand';
import { clearCookie } from '@/store/cookieStore';

const IconSize = 20;

function AccountCard({ userId }: { userId: string }) {
  const as = {
    deleteUser: useAccountStore((state) => state.deleteUser),
    enableFunc: useAccountStore((state) => state.enableFunc),
    updateUserState: useAccountStore((state) => state.updateUserState),
    loginFunc: useAccountStore((state) => state.loginFunc),
    Get: useAccountStore((state) => state.Get),
    Post: useAccountStore((state) => state.Post),
    checkLogFunc: useAccountStore((state) => state.checkLogFunc),
    editFunc: useAccountStore((state) => state.editFunc),
  };
  const addLog = useLog((state) => state.addLog);
  const info = useAccountStore((state) => state.accountObj[userId]);
  // console.log(info);

  return (
    <Pressable
      style={{
        borderRadius: 15,
        flexDirection: 'row',
        backgroundColor: accountStateColor[info.state],
        paddingVertical: 10,
        paddingHorizontal: 10,
        marginBottom: 10,
      }}
      onLongPress={() => {
        myAlert('确认删除吗？', info.userId, () => {
          as.deleteUser(info.userId);
        });
        addLog('删除用户', info.userId);
      }}
    >
      <View style={{ flex: 1 }}>
        <Text>{info.userId}</Text>
        <Text>{info.userName}</Text>
        <Text>{info.state}</Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 5 }}>
        <View>
          <MyCheckBox
            isChecked={info.isEnabled}
            setIsChecked={() => {
              as.enableFunc(info.userId, !info.isEnabled);
            }}
            size={IconSize}
          />
          <Text> </Text>
        </View>
        <IconCol
          name="login"
          description="登录"
          onPress={() => {
            as.updateUserState(info.userId, accountState.pending);
            as.loginFunc(info.userId).then((v) => {
              if (v) {
                as.updateUserState(info.userId, accountState.logged);
              } else if (v === false) {
                throw Error('检测登录失败');
              }
            });
          }}
        />
        <IconCol
          name="sync"
          description="检测"
          onPress={() => {
            as.checkLogFunc(info.userId)
              .then((v) => {
                if (v) {
                  as.updateUserState(info.userId, accountState.logged, v);
                  myAlert('登录成功', v);
                  addLog('登录成功', v);
                } else {
                  throw Error('检测登录失败');
                }
              })
              .catch((e) => {
                myAlert('登录错误', e instanceof Error ? e.message : '');
                addLog(
                  ['登录错误', e instanceof Error ? e.message : ''],
                  info.userId,
                );
                as.updateUserState(info.userId, accountState.logFailed);
              });
          }}
          onLongPress={() => {
            myAlert(
              '确定要清楚储存的 cookie 吗？',
              '可以解决登录过期问题',
              () => {
                clearCookie(userId);
              },
            );
          }}
        />
        <IconCol
          name="rocket1"
          description="自动"
          onPress={() => {
            autoSign(info.userId)
              .then(() => {
                as.updateUserState(info.userId, accountState.checkSuccess);
              })
              .catch((e) => {
                myAlert(
                  '发生错误',
                  e instanceof Error ? e.message : JSON.stringify(e),
                );
                addLog(
                  [
                    '发生错误',
                    e instanceof Error ? e.message : JSON.stringify(e),
                  ],
                  info.userId,
                );
              });
          }}
        />
        <IconCol
          name="edit"
          description="编辑"
          onPress={() => {
            as.editFunc(info.userId);
          }}
        />
      </View>
    </Pressable>
  );
}

const IconCol = ({
  name,
  description,
  onPress,
  onLongPress,
}: {
  name: keyof typeof AntDesignIcon.glyphMap;
  description: string;
  onPress?: ((event: GestureResponderEvent) => void) | undefined;
  onLongPress?: ((event: GestureResponderEvent) => void) | undefined;
}) => {
  return (
    <View style={{ alignItems: 'center' }}>
      <AntDesignIcon.Button
        name={name}
        size={IconSize}
        onPress={onPress}
        onLongPress={onLongPress}
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
        }}
        iconStyle={{
          marginRight: 0,
        }}
      />
      <Text>{description}</Text>
    </View>
  );
};

export default React.memo(AccountCard);

import { AccountStoreItem } from '@/store/accounts';
import { accountState, accountStateColor } from '@/types/accountState';
import { View, Text, GestureResponderEvent, Pressable } from 'react-native';
import AntDesignIcon from '@expo/vector-icons/AntDesign';
import { useContext } from 'react';
import { MyCheckBox } from './myCheckBox';
import { AccountsCtx } from '@/contexts/accounts';
import myAlert from './myAlert';
import { smartcoursePrelogin } from '@/constants/urls';

const IconSize = 20;

export default function AccountCard({
  accountInfo: info,
}: {
  accountInfo: AccountStoreItem;
}) {
  const as = useContext(AccountsCtx);
  console.log(info);

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
            as.updateState(info.userId, accountState.pending);
            as.loginFunc(info.userId)
              .then((v) => {
                if (v) {
                  as.updateState(info.userId, accountState.logged);
                } else {
                  throw Error('检测登录失败');
                }
              })
              .then(() => {
                return as.get(info.userId, smartcoursePrelogin);
              })
              .catch((e) => {
                myAlert('登录错误', e instanceof Error ? e.message : '');
                as.updateState(info.userId, accountState.logFailed);
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
                  as.updateState(info.userId, accountState.logged, v);
                  myAlert('登录成功', v);
                } else {
                  throw Error('检测登录失败');
                }
              })
              .catch((e) => {
                myAlert('登录错误', e instanceof Error ? e.message : '');
                as.updateState(info.userId, accountState.logFailed);
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
}: {
  name: keyof typeof AntDesignIcon.glyphMap;
  description: string;
  onPress?: ((event: GestureResponderEvent) => void) | undefined;
}) => {
  return (
    <View style={{ alignItems: 'center' }}>
      <AntDesignIcon.Button
        name={name}
        size={IconSize}
        onPress={onPress}
        style={{ justifyContent: 'center', alignItems: 'center' }}
      />
      <Text>{description}</Text>
    </View>
  );
};

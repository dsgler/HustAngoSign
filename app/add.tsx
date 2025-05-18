import myAlert from '@/components/myAlert';
import { useAccountStore } from '@/store/accounts_zustand';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';

const userIdScheme = z.string().length(10, '长度错误');
// const passwdScheme = z.string().min(6, '长度错误');

export default function AddOrEditUser() {
  const { userId } = useLocalSearchParams<{ userId?: string }>();
  const isAdd = useRef(!userId);

  const addUser = useAccountStore((state) => state.addUser);
  const editUser = useAccountStore((state) => state.editUser);

  const [UserId, setUserId] = useState(userId ?? '');
  const [Passwd, setPasswd] = useState('');
  const [CASTGC, setCASTGC] = useState('');

  useEffect(() => {
    if (!isAdd.current) {
      if (!userId || !useAccountStore.getState().accountObj[userId]) {
        myAlert('找不到用户', '将变为添加模式');
        isAdd.current = true;
      }
    }
  }, [userId]);

  return (
    <SafeAreaView style={{ flex: 1, paddingHorizontal: 20, paddingTop: 20 }}>
      <TextInput
        style={styles.TextInput}
        value={UserId}
        onChangeText={setUserId}
        placeholder="请输入用户ID"
        editable={isAdd.current}
      />
      <TextInput
        style={styles.TextInput}
        value={Passwd}
        onChangeText={setPasswd}
        placeholder="请输入密码"
      />
      <TextInput
        style={styles.TextInput}
        value={CASTGC}
        onChangeText={setCASTGC}
        placeholder="请输入CASTGC"
      />
      <Pressable
        onPress={() => {
          let u: string;
          // let p: string;
          try {
            u = userIdScheme.parse(UserId);
            // p = passwdScheme.parse(Passwd);
          } catch (e) {
            myAlert('参数错误', e instanceof Error ? e.message : '');
            return;
          }

          if (isAdd.current) {
            addUser(u, Passwd, CASTGC);
          } else {
            editUser(userId!, Passwd, CASTGC);
          }
          router.back();
        }}
      >
        <Text style={{ fontSize: 16, textAlign: 'center' }}>提交</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  TextInput: {
    lineHeight: 32,
    padding: 0,
    margin: 0,
  },
});

import { LogCtx } from '@/contexts/log';
import { useContext } from 'react';
import { Pressable, ScrollView, Text, ToastAndroid } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Logs() {
  const l = useContext(LogCtx);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1, paddingTop: 15, paddingHorizontal: 20 }}
        contentContainerStyle={{ gap: 15 }}
      >
        {l.logs.map((v, k) => (
          <Pressable
            onPress={() => {
              Clipboard.setStringAsync(v).then(() => {
                ToastAndroid.show('复制成功', ToastAndroid.SHORT);
              });
            }}
            key={k}
          >
            <Text style={{ fontSize: 16 }}>{v}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

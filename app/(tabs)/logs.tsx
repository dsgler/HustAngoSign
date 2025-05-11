import { Pressable, Text, ToastAndroid } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatLog, useLog } from '@/store/log_zustand';
import { FlatList } from 'react-native';

export default function Logs() {
  const log = useLog((state) => state.logs);

  return (
    <SafeAreaView style={{ flex: 1, paddingHorizontal: 20 }}>
      <FlatList
        data={log}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => {
              Clipboard.setStringAsync(JSON.stringify(item)).then(() => {
                ToastAndroid.show('复制成功', ToastAndroid.SHORT);
              });
            }}
          >
            <Text style={{ fontSize: 16 }}>{formatLog(item)}</Text>
          </Pressable>
        )}
      ></FlatList>
    </SafeAreaView>
  );
}

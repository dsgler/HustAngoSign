import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import WebView from 'react-native-webview';

export default function CustomWebViewPage() {
  const { url = '' } = useLocalSearchParams<{
    url?: string;
  }>();

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <WebView source={{ uri: url }} style={{ flex: 1 }} />
    </SafeAreaView>
  );
}

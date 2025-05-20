import myAlert from '@/components/myAlert';
import { casUrl, smartLoginUrl } from '@/constants/urls';
import { useAccountStore } from '@/store/accounts_zustand';
import { storeCookie } from '@/store/cookieStore';
import { accountState } from '@/types/accountState';
import CookieManager from '@react-native-cookies/cookies';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Webview, { WebViewNavigation } from 'react-native-webview';

export default function WebLogin() {
  const { userId: rawuserId, passwd = '' } = useLocalSearchParams<{
    userId?: string;
    passwd?: string;
  }>();

  if (!rawuserId) {
    myAlert('用户不存在', '请输入用户');
  }

  const userId = rawuserId!;

  const updateUserState = useAccountStore((state) => state.updateUserState);
  const editUser = useAccountStore((state) => state.editUser);

  const js = `console.log("runinje");document.getElementById("un").value=String.raw\`${userId}\`;document.getElementById("pd").value=String.raw\`${passwd}\``;

  const onNavigationStateChange = async (navState: WebViewNavigation) => {
    console.log(navState);
    // 登录成功后 URL 会变成你预设的回调地址（如重定向到主页）
    const cookies = await CookieManager.get(casUrl);
    if ('CASTGC' in cookies) {
      updateUserState(userId, accountState.logged);
      editUser(userId, passwd, cookies.CASTGC.value);
      await storeCookie(userId);
      router.dismissTo('/(tabs)');
      useAccountStore.getState().checkLogFunc(userId);
    }

    console.log('Cookies from login:', cookies);
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Webview
        source={{ uri: smartLoginUrl }}
        style={{ flex: 1 }}
        onNavigationStateChange={onNavigationStateChange}
        injectedJavaScript={js}
      />
    </SafeAreaView>
  );
}

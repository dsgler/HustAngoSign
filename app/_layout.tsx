import myAlert from '@/components/myAlert';
import { AccountsCtx } from '@/contexts/accounts';
import { LogCtx } from '@/contexts/log';
import useAccountStore from '@/store/accounts';
import { useLog } from '@/store/log';
import { Stack } from 'expo-router';

export default function RootLayout() {
  const as = useAccountStore();
  const l = useLog();

  try {
    return (
      <AccountsCtx.Provider value={as}>
        <LogCtx.Provider value={l}>
          <Stack screenOptions={{ headerShown: false }}></Stack>
        </LogCtx.Provider>
      </AccountsCtx.Provider>
    );
  } catch (e) {
    myAlert('发生未知错误', e instanceof Error ? e.message : '');
  }
}

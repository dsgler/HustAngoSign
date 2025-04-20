import myAlert from '@/components/myAlert';
import { AccountsCtx } from '@/contexts/accounts';
import useAccountStore from '@/store/accounts';
import { Stack } from 'expo-router';

export default function RootLayout() {
  const p = useAccountStore();

  try {
    return (
      <AccountsCtx.Provider value={p}>
        <Stack screenOptions={{ headerShown: false }}></Stack>
      </AccountsCtx.Provider>
    );
  } catch (e) {
    myAlert('发生未知错误', e instanceof Error ? e.message : '');
  }
}

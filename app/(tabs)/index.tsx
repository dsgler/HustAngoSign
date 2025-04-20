import AccountCard from '@/components/accountCard';
import SseBar from '@/components/ssebar';
import { AccountsCtx } from '@/contexts/accounts';
import { useContext } from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Index() {
  const as = useContext(AccountsCtx);

  console.log('render');

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1, paddingHorizontal: 15, paddingTop: 20 }}>
        {as.accountStore.map((a) => (
          <AccountCard accountInfo={a} key={a.userId} />
        ))}
      </ScrollView>
      <SseBar />
    </SafeAreaView>
  );
}

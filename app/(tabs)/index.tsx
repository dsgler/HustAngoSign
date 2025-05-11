import AccountCard from '@/components/accountCard';
import SseBar from '@/components/ssebar';
import { useAccountStore } from '@/store/accounts_zustand';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Index() {
  const accountArr = useAccountStore((state) => state.accountArr);
  const accountObj = useAccountStore((state) => state.accountObj);
  console.log(accountArr, accountObj);

  console.log('render');

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1, paddingHorizontal: 15, paddingTop: 20 }}>
        {accountArr.map((a) => (
          <AccountCard userId={a} key={a} />
        ))}
      </ScrollView>
      <SseBar />
    </SafeAreaView>
  );
}

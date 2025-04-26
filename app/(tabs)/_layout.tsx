import { Tabs } from 'expo-router';
import AntIcon from '@expo/vector-icons/AntDesign';

const IconSize = 25;

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarShowLabel: true }}>
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: () => <AntIcon name="home" size={IconSize} />,
        }}
      />
      <Tabs.Screen
        name="logs"
        options={{
          tabBarIcon: () => <AntIcon name="codesquareo" size={IconSize} />,
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          tabBarIcon: () => <AntIcon name="qrcode" size={IconSize} />,
        }}
      />
    </Tabs>
  );
}

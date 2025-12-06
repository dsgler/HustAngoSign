import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Appearance } from 'react-native';

export default function RootLayout() {
  // 懒得做夜间模式，为了让状态栏看起来不奇怪，设置 ColorScheme 为 light
  useEffect(() => {
    Appearance.setColorScheme('light');
  }, []);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}></Stack>
      {/* eslint-disable-next-line react/style-prop-object */}
      <StatusBar style="auto" />
    </>
  );
}

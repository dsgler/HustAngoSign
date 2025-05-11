import { CameraView, useCameraPermissions } from 'expo-camera';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, ToastAndroid, View } from 'react-native';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import {
  clamp,
  useAnimatedProps,
  useSharedValue,
} from 'react-native-reanimated';
import Animated from 'react-native-reanimated';
import * as Clipboard from 'expo-clipboard';
import { useFocusEffect } from 'expo-router';
import { getSignAble, qrSign } from '@/store/accounts_zustand';

const AnimatedCameraView = Animated.createAnimatedComponent(CameraView);

export default function HomeScreen() {
  const [permission, requestPermission] = useCameraPermissions();

  if (!permission?.granted) {
    requestPermission();
  }

  useFocusEffect(
    useCallback(() => {
      return () => {
        setIsActive(false);
      };
    }, []),
  );

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const ap = useAnimatedProps(() => ({ zoom: scale.value - 1 }));
  const [isActive, setIsActive] = useState(true);
  const [scanValue, setScanValue] = useState('加载中');

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = clamp(savedScale.value * e.scale, 1, 2);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  console.log('重渲染');

  return (
    <View style={{ flex: 1 }}>
      <GestureHandlerRootView>
        <View style={styles.container}>
          <GestureDetector gesture={pinchGesture}>
            <View style={{ flex: 1 }}>
              {isActive ? (
                <AnimatedCameraView
                  style={styles.camera}
                  barcodeScannerSettings={{
                    barcodeTypes: ['qr'],
                  }}
                  onBarcodeScanned={(scanned) => {
                    console.log('scanned', scanned);
                    setScanValue(scanned.data);
                    setIsActive(false);

                    Object.values(getSignAble()).forEach((info) => {
                      qrSign(info.userId, scanned.data);
                    });
                  }}
                  animatedProps={ap}
                ></AnimatedCameraView>
              ) : (
                <View style={{ paddingHorizontal: 20, paddingTop: 30 }}>
                  <Pressable
                    onPress={() => {
                      Clipboard.setStringAsync(scanValue).then(() => {
                        ToastAndroid.show('复制成功', ToastAndroid.SHORT);
                      });
                    }}
                  >
                    <Text selectable={true} style={{ fontSize: 16 }}>
                      {scanValue}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      setIsActive(true);
                    }}
                    style={{
                      marginTop: 20,
                      borderWidth: 1,
                      borderRadius: 15,
                      paddingVertical: 5,
                    }}
                  >
                    <Text style={{ fontSize: 16, textAlign: 'center' }}>
                      返回
                    </Text>
                  </Pressable>
                </View>
              )}
            </View>
          </GestureDetector>
        </View>
      </GestureHandlerRootView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  camera: { flex: 1 },
  buttonContainer: {
    height: 40,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: { fontSize: 16, textAlign: 'center' },
  text: {},
});

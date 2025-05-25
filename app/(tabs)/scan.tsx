import {
  BarcodeScanningResult,
  CameraView,
  scanFromURLAsync,
  useCameraPermissions,
} from 'expo-camera';
import { useCallback, useEffect, useState } from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  ToastAndroid,
  View,
  ViewStyle,
} from 'react-native';
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
import { getSignAble, qrSign } from '@/utils/autoSignIn';
import * as ImagePicker from 'expo-image-picker';
import myAlert from '@/components/myAlert';

const AnimatedCameraView = Animated.createAnimatedComponent(CameraView);

export default function HomeScreen() {
  const [permission, requestPermission] = useCameraPermissions();

  if (!permission?.granted) {
    requestPermission();
  }

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const ap = useAnimatedProps(() => ({ zoom: scale.value - 1 }));
  const [isActive, setIsActive] = useState(true);
  const [scanValue, setScanValue] = useState('加载中');

  const onScanned = (scanned: { data: string }) => {
    console.log('scanned', scanned);
    setScanValue(scanned.data);
    setIsActive(false);

    Object.values(getSignAble()).forEach((info) => {
      qrSign(info.userId, scanned.data);
    });
  };

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = clamp(savedScale.value * e.scale, 1, 2);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  useFocusEffect(
    useCallback(() => {
      return () => {
        setIsActive(false);
      };
    }, []),
  );

  useEffect(() => {
    scale.value = 1;
    savedScale.value = 1;
  }, [isActive, savedScale, scale]);

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
                  onBarcodeScanned={onScanned}
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
          <View
            style={[
              StyleSheet.absoluteFill,
              { flexDirection: 'column-reverse' },
            ]}
          >
            <View
              style={{
                marginBottom: 30,
                alignItems: 'center',
              }}
            >
              <PickComponent onScanned={onScanned} />
            </View>
          </View>
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

const PickComponent = ({
  onScanned,
  style,
}: {
  onScanned: (scanned: BarcodeScanningResult) => void;
  style?: StyleProp<ViewStyle>;
}) => {
  const [imageUri, setImageUri] = useState('');

  useEffect(() => {
    if (imageUri) {
      scanFromURLAsync(imageUri, ['qr']).then((scanned) => {
        if (scanned.length !== 1) {
          myAlert('扫描到的二维码个数不为1', scanned.length.toString());
          return;
        }

        onScanned(scanned[0]);
      }, console.log);
    }
  }, [imageUri, onScanned]);

  return (
    <View style={style}>
      <Pressable
        onPress={async () => {
          let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            // allowsEditing: true,
            quality: 1,
          });

          console.log(result);

          if (!result.canceled) {
            setImageUri(result.assets[0].uri);
          }
        }}
        style={{
          backgroundColor: '#74b9ff',
          paddingVertical: 10,
          paddingHorizontal: 20,
          borderRadius: 15,
        }}
      >
        <Text style={{ fontSize: 16 }}>选择图片</Text>
      </Pressable>
    </View>
  );
};

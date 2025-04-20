import { Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';

export default function myAlert(
  title: string,
  message: string,
  onOk?: () => void,
) {
  Alert.alert(title, message, [
    { text: 'Close' },
    {
      text: 'Copy',
      onPress: () => {
        Clipboard.setStringAsync(message);
      },
    },
    {
      text: 'Ok',
      onPress: onOk,
    },
  ]);
}

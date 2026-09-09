import prompt from 'react-native-prompt-android';

export default function myPrompt(
  title: string,
  message: string,
  onOk?: (message: string) => void,
  onCancel?: () => void,
  cancelable = true,
) {
  prompt(
    title,
    message,
    [
      { text: 'Close', onPress: onCancel },
      {
        text: 'Ok',
        onPress: onOk,
      },
    ],
    {
      type: 'plain-text',
      cancelable,
      defaultValue: '',
      placeholder: '',
    },
  );
}

import prompt from 'react-native-prompt-android';

export default function myPrompt(
  title: string,
  message: string,
  onOk?: (message: string) => void,
) {
  prompt(
    title,
    message,
    [
      { text: 'Close' },
      {
        text: 'Ok',
        onPress: onOk,
      },
    ],
    {
      type: 'plain-text',
      cancelable: true,
      defaultValue: '',
      placeholder: '',
    },
  );
}

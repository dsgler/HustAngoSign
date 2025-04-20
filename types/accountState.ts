import { ColorValue } from 'react-native';

export const accountState = {
  plain: 'plain',
  logged: 'logged',
  logFailed: 'logFailed',
  pending: 'pending',
  checkSuccess: 'checkSuccess',
  checkFailed: 'checkFailed',
};

export const accountStateColor: { [key: string]: ColorValue } = {
  [accountState.plain]: 'white',
  [accountState.logged]: '#41ae3c',
  [accountState.logFailed]: '#DB4D6D',
  [accountState.checkSuccess]: '#69B0AC',
  [accountState.checkFailed]: '#EB7A77',
  [accountState.pending]: '#f8e0b0',
};

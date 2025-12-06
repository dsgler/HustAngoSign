import { NativeModules } from 'react-native';
import { AncheckInterface } from './Anchek';
import { isUseNativeLog } from '@/constants/isUseNativeLog';

export const Ancheck: AncheckInterface = NativeModules.Ancheck;
if (isUseNativeLog) {
  Ancheck.InitStore();
}

import { qrSign } from './autoSignIn';

// 目前只能手动输入签到二维码
export const parseManualMessage = (userId: string, message: string) => {
  const signQrRaw = message;

  qrSign(userId, signQrRaw);
};

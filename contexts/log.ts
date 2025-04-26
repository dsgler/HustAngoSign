import { defaultErrFunc } from '@/constants/defalutErrFunc';
import { useLog } from '@/store/log';
import { createContext } from 'react';

export const LogCtx = createContext<ReturnType<typeof useLog>>({
  addLog: defaultErrFunc,
  logs: [],
});

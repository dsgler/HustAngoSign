import { createContext } from 'react';
import { defaultErrFunc } from '@/constants/defalutErrFunc';
import useAccountStore from '@/store/accounts';

export const AccountsCtx = createContext<ReturnType<typeof useAccountStore>>({
  accountStore: [],
  checkLogFunc: defaultErrFunc,
  editFunc: defaultErrFunc,
  enableFunc: defaultErrFunc,
  loginFunc: defaultErrFunc,
  addUser: defaultErrFunc,
  getUser: defaultErrFunc,
  editUser: defaultErrFunc,
});

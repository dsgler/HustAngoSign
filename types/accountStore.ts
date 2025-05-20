export type enableFuncT = (userId: string, isEnable: boolean) => void;
export type checkLogFuncT = (userId: string) => Promise<string>;
export type loginFuncT = (userId: string) => Promise<boolean | undefined>;
export type editFuncT = (userId: string) => void;

export type AccountFuncsT = {
  enableFunc: enableFuncT;
  checkLogFunc: checkLogFuncT;
  loginFunc: loginFuncT;
  editFunc: editFuncT;
};

export interface AncheckInterface {
  InitStore(): void;
  login(user: string, passwd: string): Promise<boolean>;
  /**
   * @returns 用户名
   */
  check(user: string): Promise<stirng>;
  get(user: string, url: string, headers: headersType): Promise<NetRet>;
  post(
    user: string,
    url: string,
    inbody: string,
    headers: headersType,
  ): Promise<NetRet>;
}

export type NetRet = {
  body: string;
  statusCode: string;
};

export type headersType = { [key: string]: string };

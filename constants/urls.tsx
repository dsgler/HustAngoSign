export const smartcoursePrelogin =
  'https://smartcourse.hust.edu.cn/mobilewx-smartcourse/widget/weixin/sign/stuSignController/signIn';

export function getQrSignInUrl(QrUrl: string) {
  let enc, activeId: string;

  try {
    const reActiveId = /id=(\d+)/;
    activeId = QrUrl.match(reActiveId)![1];

    const reEnc = /enc=([^&]+)/;
    enc = QrUrl.match(reEnc)![1];
  } catch {
    throw Error('请检查链接中是否含有 activeId 和 enc');
  }

  return `https://smartcourse.hust.edu.cn/mobilewx-smartcourse/widget/weixin/sign/stuSignController/signIn?activeId=${activeId}&wxsn=&enc=${enc}&title=&longitude=&latitude=&validate=&enc2=`;
}

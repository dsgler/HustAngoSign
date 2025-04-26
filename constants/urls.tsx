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

export function getPreSignUrl(activeId: string) {
  return `https://smartcourse.hust.edu.cn/mobilewx-smartcourse/widget/weixin/sign/stuSignController/preSign?activeId=${activeId}`;
}

export function getGestureSignInUrl(activeId: string, signCode: string) {
  return `https://smartcourse.hust.edu.cn/mobilewx-smartcourse/widget/weixin/sign/stuSignController/signIn?activeId=${activeId}&wxsn=&signCode=${signCode}&validate=`;
}

export const FirstSignInListBody = String.raw`classIds=&startTimeSet=&endTimeSet=&statusSet=2&reload=1&devices=1&includeWork=0&includeExam=0&includeRead=0`;
export const FirstSignInListUrl = String.raw`https://smartcourse.hust.edu.cn/ketang-zhizhen-smartcourse/education/student/activelist?DB_STRATEGY=DEFAULT`;

export function getPosiSignInUrl(
  activeId: string,
  title: string,
  longitude: string,
  latitude: string,
) {
  return `https://smartcourse.hust.edu.cn/mobilewx-smartcourse/widget/weixin/sign/stuSignController/signIn?activeId=${activeId}&title=${encodeURIComponent(title)}&longitude=${longitude}&latitude=${latitude}&wxsn=&validate=`;
}

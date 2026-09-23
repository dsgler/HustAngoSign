export function getIsSignInSuccess(body: string) {
  // ><是为了防止识别到注释里的
  return (
    body.includes('>Sign in successfully<') || // 旧版英文
    body.includes('>Checked in successfully.<') || // 新版英文(带句号)
    body.includes('>Checked in successfully<') || // 新版英文(不带句号)
    body.includes('>签到成功<')
  );
}

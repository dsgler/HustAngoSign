export function getIsSignInSuccess(body: string) {
  // ><是为了防止识别到注释里的
  return body.includes('>Sign in successfully<') || body.includes('>签到成功<');
}

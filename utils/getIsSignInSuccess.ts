export function getIsSignInSuccess(body: string) {
  return body.includes('Sign in successfully') || body.includes('签到成功');
}

import { test as setup, expect } from '@playwright/test';

/**
 * 인증 헬퍼: localStorage에 fake JWT 토큰을 설정하여
 * 로그인 없이 인증된 상태로 페이지에 접근할 수 있게 합니다.
 */
export async function setupAuth(page: import('@playwright/test').Page) {
  // fake JWT (header.payload.signature) - payload: { role: "admin", exp: 9999999999 }
  const fakePayload = btoa(
    JSON.stringify({ role: 'admin', exp: 9999999999, sub: 'test-user' })
  );
  const fakeToken = `eyJhbGciOiJIUzI1NiJ9.${fakePayload}.fake-signature`;

  await page.goto('/login');
  await page.evaluate(
    ({ token }) => {
      localStorage.setItem('accessToken', token);
      localStorage.setItem('refreshToken', token);
    },
    { token: fakeToken }
  );
}

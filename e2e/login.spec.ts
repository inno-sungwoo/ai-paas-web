import { test, expect } from '@playwright/test';

test.describe('로그인 페이지', () => {
  test.beforeEach(async ({ page }) => {
    // 로그인 전 토큰 초기화
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    });
    await page.goto('/login');
  });

  test('로그인 페이지가 올바르게 렌더링된다', async ({ page }) => {
    // 로그인 폼 요소 확인
    await expect(page.getByRole('paragraph').filter({ hasText: '로그인' })).toBeVisible();
    await expect(page.getByPlaceholder('아이디를 입력해주세요.')).toBeVisible();
    await expect(page.locator('form')).toBeVisible();

    // 로그인 버튼 확인
    const loginButton = page.getByRole('button', { name: '로그인' });
    await expect(loginButton).toBeVisible();
  });

  test('아이디와 비밀번호 입력이 가능하다', async ({ page }) => {
    const idInput = page.getByPlaceholder('아이디를 입력해주세요.');
    await idInput.fill('testuser');
    await expect(idInput).toHaveValue('testuser');
  });

  test('아이디 입력 후 삭제 버튼이 나타난다', async ({ page }) => {
    const idInput = page.getByPlaceholder('아이디를 입력해주세요.');
    await idInput.fill('testuser');

    const deleteButton = page.locator('button:has-text("삭제")');
    await expect(deleteButton).toBeVisible();

    // 삭제 버튼 클릭 시 입력값 초기화
    await deleteButton.click();
    await expect(idInput).toHaveValue('');
  });

  test('비인증 사용자가 루트(/)에 접근하면 로그인 페이지로 리다이렉트된다', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);
  });

  test('비인증 사용자가 보호된 페이지에 접근하면 로그인 페이지로 리다이렉트된다', async ({
    page,
  }) => {
    await page.goto('/service');
    await expect(page).toHaveURL(/\/login/);
  });

  test('copyright 문구가 표시된다', async ({ page }) => {
    await expect(
      page.locator('text=© 2025 Innogrid. All rights reserved copyright.')
    ).toBeVisible();
  });
});

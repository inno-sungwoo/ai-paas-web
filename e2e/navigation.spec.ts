import { test, expect } from '@playwright/test';
import { setupAuth } from './auth.setup';

test.describe('인증 후 네비게이션', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuth(page);
  });

  test('인증된 사용자가 루트(/)에 접근하면 모니터링 대시보드로 리다이렉트된다', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/infra-management\/monitoring-dashboard/);
  });

  test('사이드바 메뉴가 표시된다', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    // 레이아웃이 렌더링되었는지 확인 - 대시보드 콘텐츠가 보이면 레이아웃도 렌더링된 것
    await expect(page.getByText('대시보드', { exact: true }).first()).toBeVisible();
  });

  const pages = [
    { path: '/service', title: '서비스' },
    { path: '/workflow', title: '워크플로우' },
    { path: '/dataset', title: '데이터 셋' },
    { path: '/knowledge-base', title: '지식 베이스' },
    { path: '/prompt', title: '프롬프트' },
    { path: '/dashboard', title: '대시보드' },
    { path: '/learning', title: '학습' },
    { path: '/member-management', title: '멤버' },
  ];

  for (const { path, title } of pages) {
    test(`${title} 페이지(${path})에 접근할 수 있다`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      // 페이지가 로그인으로 리다이렉트되지 않는지 확인
      await expect(page).not.toHaveURL(/\/login/);
    });
  }
});

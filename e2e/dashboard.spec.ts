import { test, expect } from '@playwright/test';
import { setupAuth } from './auth.setup';

test.describe('대시보드 페이지', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuth(page);
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('대시보드 페이지가 올바르게 렌더링된다', async ({ page }) => {
    await expect(page.locator('text=대시보드').first()).toBeVisible();
  });

  test('서비스 현황 섹션이 표시된다', async ({ page }) => {
    await expect(page.locator('text=서비스 현황')).toBeVisible();
  });

  test('인프라 섹션이 표시된다', async ({ page }) => {
    await expect(page.getByText('인프라', { exact: true })).toBeVisible();
    await expect(page.locator('text=노드')).toBeVisible();
    await expect(page.locator('.page-detail-round-name', { hasText: '리소스' }).first()).toBeVisible();
  });

  test('리소스 항목(CPU, GPU, Memory)이 표시된다', async ({ page }) => {
    await expect(page.locator('text=CPU').first()).toBeVisible();
    await expect(page.locator('text=GPU')).toBeVisible();
    await expect(page.locator('text=Memory')).toBeVisible();
  });

  test('서비스 모니터링 섹션이 표시된다', async ({ page }) => {
    await expect(page.locator('text=서비스 모니터링')).toBeVisible();
  });

  test('사용자 테이블이 표시된다', async ({ page }) => {
    await expect(page.locator('text=사용자').first()).toBeVisible();
    // 테이블 헤더 확인
    await expect(page.locator('text=이름').first()).toBeVisible();
    await expect(page.locator('text=권한').first()).toBeVisible();
    await expect(page.locator('text=이메일 주소').first()).toBeVisible();
  });

  test('이벤트 테이블이 표시된다', async ({ page }) => {
    await expect(page.locator('text=이벤트').first()).toBeVisible();
    await expect(page.locator('text=이벤트 타입').first()).toBeVisible();
    await expect(page.locator('text=이벤트 내용').first()).toBeVisible();
  });
});

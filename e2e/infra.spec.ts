import { test, expect } from '@playwright/test';
import { setupAuth } from './auth.setup';

test.describe('인프라 관리 페이지', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuth(page);
  });

  test('클러스터 관리 페이지에 접근할 수 있다', async ({ page }) => {
    await page.goto('/infra-management/cluster-management');
    await page.waitForLoadState('networkidle');
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('모니터링 대시보드 페이지에 접근할 수 있다', async ({ page }) => {
    await page.goto('/infra-management/monitoring-dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('이벤트 페이지에 접근할 수 있다', async ({ page }) => {
    await page.goto('/infra-management/event');
    await page.waitForLoadState('networkidle');
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('비용 최적화 페이지에 접근할 수 있다', async ({ page }) => {
    await page.goto('/infra-management/cost-optimization');
    await page.waitForLoadState('networkidle');
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('감사 로그 페이지에 접근할 수 있다', async ({ page }) => {
    await page.goto('/infra-management/audit-log');
    await page.waitForLoadState('networkidle');
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('애플리케이션 카탈로그 페이지에 접근할 수 있다', async ({ page }) => {
    await page.goto('/infra-management/application/catalog');
    await page.waitForLoadState('networkidle');
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('Helm 릴리즈 페이지에 접근할 수 있다', async ({ page }) => {
    await page.goto('/infra-management/application/helm-release');
    await page.waitForLoadState('networkidle');
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('Helm 레포지토리 페이지에 접근할 수 있다', async ({ page }) => {
    await page.goto('/infra-management/application/helm-repository');
    await page.waitForLoadState('networkidle');
    await expect(page).not.toHaveURL(/\/login/);
  });
});

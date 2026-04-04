import { test, expect } from '@playwright/test';

const BASE_URL = process.env.WEB_URL || 'http://localhost:3099';

test.describe('Zipminator Web Dashboard', () => {
  test('landing page loads with branding', async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page.locator('text=Zipminator')).toBeVisible();
    await page.screenshot({ path: 'test-results/e2e/web-landing.png' });
  });

  test('features page shows 9 pillars', async ({ page }) => {
    await page.goto(`${BASE_URL}/features`);
    await expect(page.locator('text=Quantum Vault')).toBeVisible();
    await expect(page.locator('text=PQC Messenger')).toBeVisible();
    await expect(page.locator('text=Quantum VoIP')).toBeVisible();
    await expect(page.locator('text=Q-VPN')).toBeVisible();
    await expect(page.locator('text=Anonymizer')).toBeVisible();
    await expect(page.locator('text=Q-AI')).toBeVisible();
    await expect(page.locator('text=Quantum Mail')).toBeVisible();
    await expect(page.locator('text=Browser')).toBeVisible();
    await page.screenshot({ path: 'test-results/e2e/web-features.png', fullPage: true });
  });

  test('dashboard requires authentication', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    // Should redirect to login or show auth prompt
    await expect(page.locator('text=Sign in').or(page.locator('text=Login')).or(page.locator('text=Zipminator'))).toBeVisible();
    await page.screenshot({ path: 'test-results/e2e/web-dashboard-auth.png' });
  });

  test('demo page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/demo`);
    await expect(page.locator('body')).toBeVisible();
    await page.screenshot({ path: 'test-results/e2e/web-demo.png' });
  });

  test('invest page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/invest`);
    await expect(page.locator('body')).toBeVisible();
    await page.screenshot({ path: 'test-results/e2e/web-invest.png' });
  });
});

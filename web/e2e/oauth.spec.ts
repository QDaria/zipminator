import { test, expect } from '@playwright/test';

const BASE_URL = process.env.WEB_URL || 'http://localhost:3099';

const TEST_ACCOUNTS = [
  { email: 'mo@qdaria.com', name: 'Mo' },
  { email: 'houshmand.81@gmail.com', name: 'H81' },
  { email: 'dmo.houshmand@gmail.com', name: 'DMO' },
];

test.describe('OAuth Flow', () => {
  test('login page renders with OAuth providers', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/login`);

    // Verify login form exists
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();

    // Verify OAuth provider buttons (GitHub, Google, LinkedIn)
    const githubBtn = page.locator('text=GitHub').or(page.locator('[aria-label*="GitHub"]'));
    const googleBtn = page.locator('text=Google').or(page.locator('[aria-label*="Google"]'));

    // At least one OAuth provider should be visible
    const hasGithub = await githubBtn.isVisible().catch(() => false);
    const hasGoogle = await googleBtn.isVisible().catch(() => false);
    expect(hasGithub || hasGoogle).toBe(true);

    await page.screenshot({ path: 'test-results/e2e/web-login.png' });
  });

  for (const account of TEST_ACCOUNTS) {
    test(`email login attempt: ${account.name}`, async ({ page }) => {
      await page.goto(`${BASE_URL}/auth/login`);

      // Fill email field
      const emailInput = page.locator('input[type="email"], input[name="email"]');
      await emailInput.fill(account.email);

      // Fill password field if visible
      const passwordInput = page.locator('input[type="password"]');
      if (await passwordInput.isVisible()) {
        await passwordInput.fill('test-password-placeholder');
      }

      // Submit
      const submitBtn = page.locator('button[type="submit"]').or(page.locator('text=Sign in'));
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
        await page.waitForTimeout(2000); // Wait for auth response
      }

      // Capture state (success or error)
      await page.screenshot({
        path: `test-results/e2e/web-login-${account.name.toLowerCase()}.png`
      });
    });
  }

  test('OAuth redirect to GitHub works', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/login`);

    const githubBtn = page.locator('text=GitHub').or(page.locator('[aria-label*="GitHub"]'));
    if (await githubBtn.isVisible()) {
      // Click and verify redirect to GitHub OAuth
      const [popup] = await Promise.all([
        page.waitForEvent('popup').catch(() => null),
        githubBtn.click(),
      ]);

      if (popup) {
        // Verify we're on GitHub's auth page
        await expect(popup).toHaveURL(/github\.com/);
        await popup.screenshot({ path: 'test-results/e2e/web-github-oauth.png' });
        await popup.close();
      } else {
        // May have navigated in same window
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'test-results/e2e/web-github-redirect.png' });
      }
    }
  });
});

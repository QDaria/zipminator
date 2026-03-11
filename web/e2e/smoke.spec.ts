import { test, expect, type ConsoleMessage } from '@playwright/test';

/** WebGL errors are expected in headless Chromium (no GPU). Filter them. */
function isKnownBenignError(text: string): boolean {
  return text.includes('WebGLRenderer') || text.includes('WebGL context');
}

test.describe('Landing page', () => {
  test('loads with hero content', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(page.locator('h1')).toContainText('Quantum-Secure', { timeout: 20_000 });
    await expect(page.getByText('NIST FIPS 203 Approved Post-Quantum Cryptography')).toBeVisible();
    await page.screenshot({ path: 'e2e/screenshots/landing.png', fullPage: false });
  });

  test('waitlist section shows sign-in prompt for unauthenticated users', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const signInHeading = page.getByText('Sign in to join');
    await signInHeading.scrollIntoViewIfNeeded();
    await expect(signInHeading).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('Navigation', () => {
  test('Features link navigates to /features', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('navigation', { name: 'Main navigation' })
      .getByRole('link', { name: 'Features' }).click();
    await expect(page).toHaveURL(/\/features/);
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Key routes load', () => {
  test('dashboard renders', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toBeVisible();
    await page.screenshot({ path: 'e2e/screenshots/dashboard.png', fullPage: false });
  });

  test('pitch deck renders', async ({ page }) => {
    await page.goto('/invest', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toBeVisible();
    await page.screenshot({ path: 'e2e/screenshots/pitch-deck.png', fullPage: false });
  });

  test('technology page loads', async ({ page }) => {
    await page.goto('/technology', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toBeVisible();
  });

  test('demo page loads', async ({ page }) => {
    await page.goto('/demo', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Console errors', () => {
  const routes = ['/', '/features', '/dashboard', '/invest', '/technology'];

  test('no unexpected console errors across pages', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg: ConsoleMessage) => {
      if (msg.type() === 'error' && !isKnownBenignError(msg.text())) {
        errors.push(`${page.url()}: ${msg.text()}`);
      }
    });

    for (const route of routes) {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2_000);
    }

    if (errors.length > 0) {
      console.log('Unexpected console errors:', errors);
    }
    expect(errors).toHaveLength(0);
  });
});

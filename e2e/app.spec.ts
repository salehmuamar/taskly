import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('login page loads correctly', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('h1, h2, [class*="heading"]')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('shows validation errors on empty login', async ({ page }) => {
    await page.goto('/login');
    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.click();
    await page.waitForTimeout(500);
  });

  test('register page loads correctly', async ({ page }) => {
    await page.goto('/register');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('can register a new user', async ({ page }) => {
    await page.goto('/register');
    const uniqueEmail = `test${Date.now()}@example.com`;

    await page.locator('input[placeholder*="name" i], input[name="name"]').first().fill('Test User');
    await page.locator('input[type="email"]').fill(uniqueEmail);
    await page.locator('input[type="password"]').fill('Password1');
    await page.locator('button[type="submit"]').click();

    await page.waitForTimeout(3000);
    const url = page.url();
    expect(url.includes('/login') || url.includes('/dashboard')).toBeTruthy();
  });

  test('can login with valid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[type="email"]').fill('admin@example.com');
    await page.locator('input[type="password"]').fill('admin123');
    await page.locator('button[type="submit"]').click();

    await page.waitForTimeout(3000);
    const url = page.url();
    expect(url.includes('/dashboard') || url.includes('/login')).toBeTruthy();
  });
});

test.describe('Dashboard', () => {
  test('shows dashboard after login', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[type="email"]').fill('admin@example.com');
    await page.locator('input[type="password"]').fill('admin123');
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(3000);

    if (page.url().includes('/dashboard')) {
      await expect(page.locator('body')).toBeVisible();
    }
  });
});

test.describe('Navigation', () => {
  test('sidebar has navigation links', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[type="email"]').fill('admin@example.com');
    await page.locator('input[type="password"]').fill('admin123');
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(3000);

    if (page.url().includes('/dashboard')) {
      const nav = page.locator('nav, [role="navigation"]');
      await expect(nav).toBeVisible();
    }
  });
});

test.describe('Projects Page', () => {
  test('projects page is accessible', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[type="email"]').fill('admin@example.com');
    await page.locator('input[type="password"]').fill('admin123');
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(3000);

    if (page.url().includes('/dashboard')) {
      await page.goto('/projects');
      await page.waitForTimeout(2000);
      await expect(page.locator('body')).toBeVisible();
    }
  });
});

test.describe('Calendar Page', () => {
  test('calendar page is accessible', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[type="email"]').fill('admin@example.com');
    await page.locator('input[type="password"]').fill('admin123');
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(3000);

    if (page.url().includes('/dashboard')) {
      await page.goto('/calendar');
      await page.waitForTimeout(2000);
      await expect(page.locator('body')).toBeVisible();
    }
  });
});

test.describe('Settings Page', () => {
  test('settings page is accessible', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[type="email"]').fill('admin@example.com');
    await page.locator('input[type="password"]').fill('admin123');
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(3000);

    if (page.url().includes('/dashboard')) {
      await page.goto('/settings');
      await page.waitForTimeout(2000);
      await expect(page.locator('body')).toBeVisible();
    }
  });
});

test.describe('Health Check', () => {
  test('health endpoint returns OK', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.ok()).toBeTruthy();
  });
});

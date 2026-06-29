import { test, expect } from '@playwright/test';

test.describe('AI Agent Platform', () => {
  test('should load homepage successfully', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Mumtaz AI/);
    // Just check that the page loaded and has some content
    await expect(page.locator('body')).toBeVisible();
  });
});

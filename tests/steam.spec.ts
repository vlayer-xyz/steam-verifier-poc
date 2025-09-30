import { test, expect } from '@playwright/test';

test('steam subpage loads', async ({ page }) => {
  await page.goto('/steam');
  await expect(page).toHaveURL(/.*steam/);
  await expect(page).not.toHaveTitle(/404/);
});
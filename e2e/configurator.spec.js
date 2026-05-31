import { test, expect } from '@playwright/test';

test.describe('Car configurator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the WebGL canvas to mount.
    await expect(page.getByTestId('scene')).toBeVisible();
  });

  test('shows the starting total', async ({ page }) => {
    await expect(page.getByTestId('total')).toContainText('€');
  });

  test('selecting a matte paint raises the total', async ({ page }) => {
    const before = await page.getByTestId('total').textContent();
    await page.getByTestId('paint-frozen-grey').click();
    await expect(page.getByTestId('total')).not.toHaveText(before ?? '');
  });

  test('toggling a package and resetting restores the price', async ({ page }) => {
    const start = await page.getByTestId('total').textContent();
    await page.getByTestId('package-m-sport').click();
    await expect(page.getByTestId('package-m-sport')).toHaveAttribute('aria-pressed', 'true');
    await page.getByTestId('reset').click();
    await expect(page.getByTestId('total')).toHaveText(start ?? '');
  });

  test('changing wheels updates the active state', async ({ page }) => {
    await page.getByTestId('wheel-forged-21').click();
    await expect(page.getByTestId('wheel-forged-21')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByTestId('wheel-aero-19')).toHaveAttribute('aria-pressed', 'false');
  });
});

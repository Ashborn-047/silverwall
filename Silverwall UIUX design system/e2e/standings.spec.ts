import { test, expect } from '@playwright/test';

// ============================================================================
// 🏆 SILVERWALL E2E STANDINGS TESTS
// Verifies the dynamic standings table rendering and modal functionality.
// ============================================================================

test.describe('Dynamic Standings Modal', () => {

  test('should open the standings modal when clicking the trigger', async ({ page }) => {
    await page.goto('/');
    
    // Find the button that opens the standings modal
    const standingsBtn = page.locator('button', { hasText: /Standings/i }).first();
    
    // Wait for the page to be fully loaded and interactive
    await expect(standingsBtn).toBeVisible();
    await standingsBtn.click();

    // Verify the modal opens
    const modalHeading = page.locator('h2', { hasText: /Driver Standings/i }).first();
    await expect(modalHeading).toBeVisible();
  });

  test('should render driver standings data rows', async ({ page }) => {
    await page.goto('/');
    
    // Open the modal
    const standingsBtn = page.locator('button', { hasText: /Standings/i }).first();
    await standingsBtn.click();

    // We wait for the table to populate from SpacetimeDB
    const tableRow = page.locator('table tbody tr').first();
    
    // We expect at least one driver to be rendered if the DB is seeded.
    await expect(tableRow).toBeVisible({ timeout: 10000 });
    
    // Check if points are displayed
    await expect(tableRow).toContainText(/\d+/); 
  });

  test('should verify dynamic point updates (Simulated)', async ({ page }) => {
    // Note: In a true E2E environment against a live local SpacetimeDB, 
    // we would trigger the `seed_race_result` reducer via a backend CLI/API call here, 
    // and then assert that the Playwright page automatically updates the DOM 
    // without needing to call `page.reload()`.
    
    await page.goto('/');
    const standingsBtn = page.locator('button', { hasText: /Standings/i }).first();
    await standingsBtn.click();

    const firstPlacePoints = page.locator('table tbody tr').first().locator('td').last();
    
    // We expect the websocket to push data instantly if the DB changes.
    // For now, we just assert the initial render works.
    await expect(firstPlacePoints).toBeVisible();
  });

  test('should be able to close the standings modal', async ({ page }) => {
    await page.goto('/');
    
    const standingsBtn = page.locator('button', { hasText: /Standings/i }).first();
    await standingsBtn.click();

    // Try to close by pressing escape
    await page.keyboard.press('Escape');

    // Verify modal is hidden
    const modalHeading = page.locator('h2', { hasText: /Driver Standings/i }).first();
    await expect(modalHeading).not.toBeVisible();
  });

});

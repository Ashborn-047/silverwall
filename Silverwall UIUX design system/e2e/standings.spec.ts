import { test, expect } from '@playwright/test';

// ============================================================================
// 🏆 SILVERWALL E2E STANDINGS TESTS
// Verifies the dynamic standings table rendering and modal functionality.
// ============================================================================

test.describe('Dynamic Standings Modal', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to the page and wait for it to be ready
    await page.goto('/');
    // Wait for the page to be fully loaded and SpacetimeDB to connect
    await page.waitForLoadState('networkidle');
  });

  test('should open the standings modal when clicking the trigger', async ({ page }) => {
    // Find the button that opens the standings modal
    // Note: The button text is "VIEW {year} SEASON RESULTS" not "Standings"
    const standingsBtn = page.locator('button').filter({ hasText: /VIEW.*SEASON RESULTS/i }).first();
    
    // Wait for the button to be visible
    await expect(standingsBtn).toBeVisible({ timeout: 10000 });
    await standingsBtn.click();

    // Verify the modal opens with the correct heading
    const modalHeading = page.locator('h2').filter({ hasText: /This Season Results/i }).first();
    await expect(modalHeading).toBeVisible({ timeout: 10000 });
  });

  test('should render driver standings data rows', async ({ page }) => {
    // Open the modal
    const standingsBtn = page.locator('button').filter({ hasText: /VIEW.*SEASON RESULTS/i }).first();
    await expect(standingsBtn).toBeVisible({ timeout: 10000 });
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
    
    const standingsBtn = page.locator('button').filter({ hasText: /VIEW.*SEASON RESULTS/i }).first();
    await expect(standingsBtn).toBeVisible({ timeout: 10000 });
    await standingsBtn.click();

    const firstPlacePoints = page.locator('table tbody tr').first().locator('td').last();
    
    // We expect the websocket to push data instantly if the DB changes.
    // For now, we just assert the initial render works.
    await expect(firstPlacePoints).toBeVisible({ timeout: 10000 });
  });

  test('should be able to close the standings modal', async ({ page }) => {
    const standingsBtn = page.locator('button').filter({ hasText: /VIEW.*SEASON RESULTS/i }).first();
    await expect(standingsBtn).toBeVisible({ timeout: 10000 });
    await standingsBtn.click();

    // Try to close by pressing escape
    await page.keyboard.press('Escape');

    // Verify modal is hidden
    const modalHeading = page.locator('h2').filter({ hasText: /This Season Results/i }).first();
    await expect(modalHeading).not.toBeVisible({ timeout: 10000 });
  });

});

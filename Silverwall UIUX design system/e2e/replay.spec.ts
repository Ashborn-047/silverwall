import { test, expect } from '@playwright/test';

// ============================================================================
// 🏎️ SILVERWALL REPLAY & RACE ARCHIVE E2E TESTS
// Validates replay scrubber, playback engine, and historical session selector
// ============================================================================

const TELEMETRY_URL = process.env.GITHUB_ACTIONS ? '/silverwall/telemetry/live' : '/telemetry/live';

test.describe('Replay Controls & Scrubber', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(TELEMETRY_URL);
    await page.waitForLoadState('domcontentloaded');
  });

  test('should render the replay controls bar and timeline scrubber', async ({ page }) => {
    // Scrubber input exists and is accessible
    const scrubber = page.locator('input[aria-label="Replay timeline scrubber"]');
    await expect(scrubber).toBeVisible();

    // Play/Pause button exists
    const playBtn = page.locator('button[aria-label="Play replay"], button[aria-label="Pause replay"]');
    await expect(playBtn).toBeVisible();

    // Lap badge is rendered
    await expect(page.getByText(/LAP/i).first()).toBeVisible();
  });

  test('should toggle play and pause states when clicked', async ({ page }) => {
    const playBtn = page.locator('button[aria-label="Play replay"]');
    if (await playBtn.isVisible()) {
      await playBtn.click();
      // Should now show PAUSE
      await expect(page.locator('button[aria-label="Pause replay"]')).toBeVisible();

      // Click to pause
      await page.locator('button[aria-label="Pause replay"]').click();
      await expect(page.locator('button[aria-label="Play replay"]')).toBeVisible();
    }
  });

  test('should toggle playback speed multiplier', async ({ page }) => {
    // Check speed selector buttons
    const speed2x = page.getByRole('button', { name: '2x', exact: true });
    await expect(speed2x).toBeVisible();
    await speed2x.click();

    // Button should be active
    await expect(speed2x).toHaveClass(/bg-\[#00D2BE\]/);

    const speed5x = page.getByRole('button', { name: '5x', exact: true });
    await speed5x.click();
    await expect(speed5x).toHaveClass(/bg-\[#00D2BE\]/);
  });

  test('should allow seeking along the timeline scrubber', async ({ page }) => {
    const scrubber = page.locator('input[aria-label="Replay timeline scrubber"]');
    await expect(scrubber).toBeVisible();

    // Seek to 1200 seconds (Lap ~14)
    await scrubber.fill('1200');

    // Check that time display updated
    await expect(page.getByText('20:00')).toBeVisible();
  });
});

test.describe('Session Selector & Historical Archive', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(TELEMETRY_URL);
    await page.waitForLoadState('domcontentloaded');
  });

  test('should display the session archive selector in the header', async ({ page }) => {
    const selectorBtn = page.locator('button[aria-label="Select F1 Grand Prix or Replay session"]');
    await expect(selectorBtn).toBeVisible();
    await expect(selectorBtn).toContainText('SESSION ARCHIVE');
  });

  test('should open the Grand Prix selection modal with season tabs and search', async ({ page }) => {
    const selectorBtn = page.locator('button[aria-label="Select F1 Grand Prix or Replay session"]');
    await selectorBtn.click();

    // Modal opens
    await expect(page.getByText('Grand Prix Replay Selector')).toBeVisible();

    // Search bar is available
    const searchInput = page.getByPlaceholder('Search by Grand Prix, circuit, or city...');
    await expect(searchInput).toBeVisible();

    // Season tabs (2026, 2025, 2024) are rendered
    await expect(page.getByRole('button', { name: '2026', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: '2025', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: '2024', exact: true })).toBeVisible();
  });

  test('should filter sessions by search keyword', async ({ page }) => {
    const selectorBtn = page.locator('button[aria-label="Select F1 Grand Prix or Replay session"]');
    await selectorBtn.click();

    const searchInput = page.getByPlaceholder('Search by Grand Prix, circuit, or city...');
    await searchInput.fill('Singapore');

    // Should match Singapore
    await expect(page.getByText(/Singapore/i).first()).toBeVisible();
  });
});

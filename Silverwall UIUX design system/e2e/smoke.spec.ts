import { test, expect } from '@playwright/test';

// ============================================================================
// 🏎️ SILVERWALL E2E SMOKE TESTS
// Critical path tests to gate production deployments
// ============================================================================

test.describe('Landing Page', () => {

  test('should load without crashing', async ({ page }) => {
    await page.goto('/');
    // The page should render — no white screen of death
    await expect(page.locator('body')).toBeVisible();
  });

  test('should display the SILVERWALL header brand', async ({ page }) => {
    await page.goto('/');
    // Check for brand text in header
    await expect(page.locator('header')).toContainText('SILVER');
    await expect(page.locator('header')).toContainText('WALL');
  });

  test('should display the hero headline', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h2')).toContainText('ENGINEERING-GRADE');
    await expect(page.locator('h2')).toContainText('RACE TELEMETRY');
  });

  test('should render the primary CTA link to live telemetry', async ({ page }) => {
    await page.goto('/');
    const cta = page.locator('a[href$="/telemetry/live"]');
    await expect(cta).toBeVisible();
    await expect(cta).toContainText('Open Live Pit-Wall');
  });

  test('should display telemetry metric pills', async ({ page }) => {
    await page.goto('/');
    const metrics = ['SPEED_KPH', 'RPM', 'DRS_STATUS', 'THROTTLE_%', 'BRAKE_PSI', 'GEAR'];
    for (const metric of metrics) {
      await expect(page.getByText(metric, { exact: true })).toBeVisible();
    }
  });

  test('should render the race countdown or live indicator', async ({ page }) => {
    await page.goto('/');
    // Either "Race In:" / "Season Starts In:" countdown or "RACE LIVE" badge
    const countdown = page.locator('text=/Race In:|Season Starts In:|RACE LIVE/i');
    await expect(countdown.first()).toBeVisible();
  });

  test('should display the footer with version info', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('footer')).toContainText('SILVERWALL V');
    await expect(page.locator('footer')).toContainText('OpenF1');
  });
});

test.describe('Race Card', () => {

  test('should show next event or season opener card', async ({ page }) => {
    await page.goto('/');
    // Card header should show "NEXT EVENT" or "NEXT SEASON"
    const cardHeader = page.locator('text=/NEXT EVENT|NEXT SEASON/i');
    await expect(cardHeader.first()).toBeVisible();
  });

  test('should display the UTC clock', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=/UTC:/i').first()).toBeVisible();
  });

  test('should display race data fields', async ({ page }) => {
    await page.goto('/');
    // Should have DATE, LAPS, LOCATION, DATA SOURCE labels
    for (const label of ['DATE', 'LAPS', 'LOCATION', 'DATA SOURCE']) {
      await expect(page.locator(`text=${label}`).first()).toBeVisible();
    }
  });
});

test.describe('Track Map', () => {

  test('should render an SVG track visualization', async ({ page }) => {
    await page.goto('/');
    // Track map renders as an SVG with a path element
    const svg = page.locator('svg path[stroke="#00D2BE"]');
    await expect(svg.first()).toBeVisible();
  });

  test('should show the start/finish marker', async ({ page }) => {
    await page.goto('/');
    // S/F text label on the track
    await expect(page.locator('svg text').filter({ hasText: 'S/F' }).first()).toBeVisible();
  });
});

test.describe('Navigation', () => {

  test('should have a design system link in the footer', async ({ page }) => {
    await page.goto('/');
    const dsLink = page.locator('a[href$="/design-system"]');
    await expect(dsLink).toBeVisible();
  });

  test('should navigate to telemetry page without crash', async ({ page }) => {
    await page.goto('/telemetry/live');
    // Should not be a completely blank page
    await expect(page.locator('body')).toBeVisible();
    // Should have some content (not a white screen)
    const bodyText = await page.locator('body').textContent();
    expect(bodyText?.length).toBeGreaterThan(0);
  });
});

test.describe('Build Integrity', () => {

  test('should not have any console errors on landing page', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForTimeout(2000);

    // Filter out known non-critical errors (network failures, auth SDK in dev mode)
    const criticalErrors = errors.filter(e =>
      !e.includes('net::') &&
      !e.includes('Failed to fetch') &&
      !e.includes('Failed to load resource') &&
      !e.includes('ERR_CONNECTION_REFUSED') &&
      !e.includes('SpacetimeDB') &&
      !e.includes('Clerk') &&
      !e.includes('clerk')
    );

    expect(criticalErrors).toHaveLength(0);
  });
});

import { expect, test } from '@playwright/test';

const report = {
  route_name: 'Brussels canal check', distance_km: 0.5, sampled_points: 5, matched_distance_km: 0.4,
  coverage_percent: 80, verdict: 'prohibited', region: 'BE', vehicle: 'speed_pedelec',
  findings: [{ id: 'way-42', severity: 'prohibited', title: 'Speed pedelec access is prohibited', explanation: 'An explicit tag conflicts with the selected vehicle.', start_km: 0.2, end_km: 0.3, tags: { highway: 'cycleway', speed_pedelec: 'no' }, osm_way_id: 42, osm_url: 'https://www.openstreetmap.org/way/42', rule_id: 'SP-EXPLICIT-NO' }],
  rule_pack: { version: '2026.08', source_date: '2026-08-01', sources: [{ label: 'Rule source', url: 'https://example.test/rules' }] }, caveats: ['Map tags can be incomplete.'],
};

test.beforeEach(async ({ page }) => {
  await page.route('**/api/page-view', route => route.fulfill({ status: 204 }));
  await page.route('**/api/analyze', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(report) }));
});

test('checks the sample route and exposes evidence', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Cycle Legal Check/);
  await expect(page.locator('h1')).toHaveCount(1);
  await page.getByRole('button', { name: /Use Brussels sample/ }).click();
  await page.getByLabel('2 / Vehicle').selectOption('speed_pedelec');
  await page.getByRole('button', { name: /Check this route/ }).click();
  await expect(page.getByRole('heading', { name: /Access conflict found/ })).toBeVisible();
  await expect(page.getByText('speed_pedelec=no')).toBeVisible();
  await expect(page.getByRole('button', { name: /Export review checklist/ })).toBeVisible();
});

test('legal pages and keyboard focus are available', async ({ page }) => {
  await page.goto('/privacy');
  await expect(page.getByRole('heading', { name: 'Privacy' })).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: /Skip to route checker/ })).toBeFocused();
});

import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const report = {
  route_name: 'Brussels canal check', distance_km: 0.5, sampled_points: 5, matched_distance_km: 0.4,
  coverage_percent: 80, verdict: 'prohibited', region: 'BE', vehicle: 'speed_pedelec',
  findings: [{ id: 'way-42', severity: 'prohibited', title: 'Speed pedelec access is prohibited', explanation: 'An explicit tag conflicts with the selected vehicle.', start_km: 0.2, end_km: 0.3, tags: { highway: 'cycleway', speed_pedelec: 'no' }, osm_way_id: 42, osm_url: 'https://www.openstreetmap.org/way/42', rule_id: 'SP-EXPLICIT-NO' }],
  rule_pack: { version: '2026.08', source_date: '2026-08-01', sources: [{ label: 'Rule source', url: 'https://example.test/rules' }] }, caveats: ['Map tags can be incomplete.'],
};

const validGpx = `<?xml version="1.0"?><gpx version="1.1"><trk><name>Uploaded route</name><trkseg><trkpt lat="50.8466" lon="4.3528"/><trkpt lat="50.8477" lon="4.3502"/></trkseg></trk></gpx>`;

test.beforeEach(async ({ page }) => {
  await page.route('**/api/page-view', route => route.fulfill({ status: 204 }));
  await page.route('**/api/analyze', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(report) }));
});

test('checks the sample route and exposes evidence', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Cycle Legal Check/);
  await expect(page.locator('h1')).toHaveCount(1);
  const accessibility = await new AxeBuilder({ page }).analyze();
  expect(accessibility.violations.filter(item => ['serious', 'critical'].includes(item.impact || ''))).toEqual([]);
  await page.getByRole('button', { name: /Use Brussels sample/ }).click();
  await page.getByLabel('2 / Vehicle').selectOption('speed_pedelec');
  await page.getByRole('button', { name: /Check this route/ }).click();
  await expect(page.getByRole('heading', { name: /Access conflict found/ })).toBeVisible();
  await expect(page.getByText('speed_pedelec=no')).toBeVisible();
  await expect(page.getByRole('button', { name: /Export review checklist/ })).toBeVisible();
});

test('uploads a real GPX file and sends its selected profile for analysis', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.goto('/');
  await page.locator('#gpx-file').setInputFiles({
    name: 'normal-route.gpx',
    mimeType: 'application/gpx+xml',
    buffer: Buffer.from(validGpx),
  });
  await page.getByLabel('2 / Vehicle').selectOption('speed_pedelec');
  const requestPromise = page.waitForRequest(request => request.url().endsWith('/api/analyze'));
  await page.getByRole('button', { name: /Check this route/ }).click();
  const request = await requestPromise;
  expect(request.postDataJSON()).toMatchObject({
    gpx: validGpx,
    vehicle: 'speed_pedelec',
    region: 'BE',
  });
  await expect(page.getByRole('heading', { name: /Access conflict found/ })).toBeVisible();
  await expect(page.getByText('speed_pedelec=no')).toBeVisible();
  expect(pageErrors).toEqual([]);
});

test('shows a malformed-upload error and recovers with a replacement file', async ({ page }) => {
  let analysisCalls = 0;
  await page.unroute('**/api/analyze');
  await page.route('**/api/analyze', async route => {
    analysisCalls += 1;
    const request = route.request().postDataJSON();
    if (request.gpx === '<broken') {
      await route.fulfill({
        status: 422,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'The GPX is not valid XML.' }),
      });
      return;
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(report) });
  });
  const pageErrors: string[] = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.goto('/');
  await page.locator('#gpx-file').setInputFiles({
    name: 'broken.gpx',
    mimeType: 'application/gpx+xml',
    buffer: Buffer.from('<broken'),
  });
  await page.getByRole('button', { name: /Check this route/ }).click();
  await expect(page.locator('#form-status')).toContainText('The GPX is not valid XML. Try again');

  await page.locator('#gpx-file').setInputFiles({
    name: 'replacement.gpx',
    mimeType: 'application/gpx+xml',
    buffer: Buffer.from(validGpx),
  });
  await page.getByRole('button', { name: /Check this route/ }).click();
  await expect(page.getByRole('heading', { name: /Access conflict found/ })).toBeVisible();
  expect(analysisCalls).toBe(2);
  expect(pageErrors).toEqual([]);
});

test('keeps all visible text at or above the 16px product minimum', async ({ page }) => {
  const undersizedText = async () => page.locator('body *').evaluateAll(nodes => nodes
    .filter(element => element.children.length === 0
      && (element.textContent || '').trim()
      && element.getBoundingClientRect().width > 0
      && element.getBoundingClientRect().height > 0)
    .map(element => ({
      text: (element.textContent || '').trim(),
      pixels: Number.parseFloat(getComputedStyle(element).fontSize),
    }))
    .filter(item => item.pixels < 16));

  for (const path of ['/', '/privacy', '/terms']) {
    await page.goto(path);
    expect(await undersizedText(), `${path} has undersized visible copy`).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), `${path} has no horizontal overflow`).toBe(true);
  }

  await page.goto('/');
  await page.getByRole('button', { name: /Use Brussels sample/ }).click();
  await page.getByRole('button', { name: /Check this route/ }).click();
  await expect(page.getByRole('heading', { name: /Access conflict found/ })).toBeVisible();
  expect(await undersizedText(), 'the report has undersized visible copy').toEqual([]);
});

test('visible navigation targets meet touch geometry and keyboard requirements', async ({ page }) => {
  await page.goto('/');

  const targets = page.locator('header a:visible, footer nav a:visible');
  expect(await targets.count()).toBeGreaterThanOrEqual(5);
  for (const target of await targets.all()) {
    const name = (await target.textContent())?.trim() || 'unnamed link';
    const box = await target.boundingBox();
    expect(box, `${name} has a rendered hit area`).not.toBeNull();
    expect(box!.width, `${name} target width`).toBeGreaterThanOrEqual(44);
    expect(box!.height, `${name} target height`).toBeGreaterThanOrEqual(44);
  }

  for (const landmark of ['header', 'footer nav']) {
    const boxes = await page.locator(`${landmark} a:visible`).evaluateAll((links) => links.map((link) => {
      const box = link.getBoundingClientRect();
      return { left: box.left, right: box.right, top: box.top, bottom: box.bottom };
    }));
    for (let index = 0; index < boxes.length; index += 1) {
      for (let other = index + 1; other < boxes.length; other += 1) {
        const horizontal = Math.max(0, boxes[other].left - boxes[index].right, boxes[index].left - boxes[other].right);
        const vertical = Math.max(0, boxes[other].top - boxes[index].bottom, boxes[index].top - boxes[other].bottom);
        expect(Math.hypot(horizontal, vertical), `${landmark} targets ${index + 1} and ${other + 1} spacing`).toBeGreaterThanOrEqual(8);
      }
    }
  }

  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: /Skip to route checker/ })).toBeFocused();
  for (const target of await page.locator('header a:visible').all()) {
    await page.keyboard.press('Tab');
    await expect(target).toBeFocused();
  }
});

test('legal pages and keyboard focus are available', async ({ page }) => {
  const privacyResponse = await page.goto('/privacy');
  expect(privacyResponse?.status()).toBe(200);
  await expect(page.getByRole('heading', { name: 'Privacy' })).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: /Skip to route checker/ })).toBeFocused();
  const termsResponse = await page.goto('/terms');
  expect(termsResponse?.status()).toBe(200);
  await expect(page.getByRole('heading', { name: 'Terms of use' })).toBeVisible();
});

test('server exposes build identity and update-safe cache policy', async ({ page }) => {
  const health = await page.request.get('/health');
  expect(health.status()).toBe(200);
  expect(health.headers()['cache-control']).toBe('no-store');
  expect(await health.json()).toEqual({ build: 'e2e-build-identity', status: 'ok' });

  const shell = await page.request.get('/');
  expect(shell.headers()['cache-control']).toBe('no-cache');
  const serviceWorker = await page.request.get('/sw.js');
  expect(serviceWorker.headers()['cache-control']).toBe('no-cache');
  const html = await shell.text();
  const asset = html.match(/(?:src|href)="(\/assets\/index-[^"]+\.(?:js|css))"/)?.[1];
  expect(asset).toBeTruthy();
  const bundle = await page.request.get(asset!);
  expect(bundle.headers()['cache-control']).toBe('public, max-age=31536000, immutable');
});

test('installed shell reloads offline', async ({ page, context }) => {
  await page.goto('/');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    const keys = await caches.keys();
    if (!keys.includes('cycle-legal-shell-v3')) throw new Error('versioned cache missing');
  });
  await context.setOffline(true);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: /Your route has rules/ })).toBeVisible();
  await expect(page.getByText('Offline.', { exact: true })).toBeVisible();
});

test('license return is stored, stripped from the URL, and cached for a day', async ({ page }) => {
  let verificationCalls = 0;
  await page.route('https://api.sociobot.in/api/v1/products/cycle-legal-profile-check/verify?**', async (route) => {
    verificationCalls += 1;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ valid: true, reason: 'ok', expires_at: null }),
    });
  });
  await page.goto('/?license=return-token');
  await expect(page).toHaveURL('http://127.0.0.1:8080/');
  await expect(page.getByLabel('3 / Regional rule pack').locator('option[value="NL"]')).toBeEnabled();
  expect(await page.evaluate(() => localStorage.getItem('sb_license:cycle-legal-profile-check'))).toBe('return-token');
  expect(verificationCalls).toBe(1);

  await page.reload();
  await expect(page.getByLabel('3 / Regional rule pack').locator('option[value="NL"]')).toBeEnabled();
  expect(verificationCalls).toBe(1);
});

test('exposes the production checkout contract and refund terms', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: /Unlock regional packs/ })).toHaveAttribute(
    'href',
    'https://api.sociobot.in/api/v1/products/cycle-legal-profile-check/checkout',
  );
  await expect(page.getByText('Sociobot/Dodo is the merchant of record. Refunds are handled there.')).toBeVisible();
  await page.goto('/terms');
  await expect(page.getByText(/A refund automatically revokes the license/)).toBeVisible();
});

test('restores a valid license and reconciles a revoked license', async ({ page }) => {
  await page.route('https://api.sociobot.in/api/v1/products/cycle-legal-profile-check/verify?**', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ valid: true, reason: 'ok', expires_at: null }),
  }));
  await page.goto('/');
  page.once('dialog', dialog => dialog.accept('restored-token'));
  await page.getByRole('button', { name: /Have a license/ }).click();
  await expect(page.getByLabel('3 / Regional rule pack').locator('option[value="DE"]')).toBeEnabled();
  expect(await page.evaluate(() => localStorage.getItem('sb_license:cycle-legal-profile-check'))).toBe('restored-token');

  await page.unroute('https://api.sociobot.in/api/v1/products/cycle-legal-profile-check/verify?**');
  await page.route('https://api.sociobot.in/api/v1/products/cycle-legal-profile-check/verify?**', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ valid: false, reason: 'revoked', expires_at: null }),
  }));
  await page.evaluate(() => localStorage.setItem(
    'sb_license:cycle-legal-profile-check:verdict',
    JSON.stringify({ valid: true, checked_at: 0 }),
  ));
  await page.reload();
  await expect(page.getByText('Your saved license is no longer active.')).toBeVisible();
  await expect(page.getByLabel('3 / Regional rule pack').locator('option[value="DE"]')).toBeDisabled();
  await expect(page.getByRole('link', { name: /Unlock regional packs/ })).toBeVisible();
});

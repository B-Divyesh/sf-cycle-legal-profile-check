import { expect, test } from '@playwright/test';
import type { Locator } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const report = {
  route_name: 'Brussels canal check', distance_km: 0.5, sampled_points: 5, matched_distance_km: 0.4,
  coverage_percent: 80, verdict: 'prohibited', region: 'BE', vehicle: 'speed_pedelec',
  findings: [{ id: 'way-42', severity: 'prohibited', title: 'Speed pedelec access is prohibited', explanation: 'An explicit tag conflicts with the selected vehicle.', start_km: 0.2, end_km: 0.3, tags: { highway: 'cycleway', speed_pedelec: 'no' }, osm_way_id: 42, osm_url: 'https://www.openstreetmap.org/way/42', rule_id: 'SP-EXPLICIT-NO' }],
  rule_pack: { version: '2026.08', source_date: '2026-08-01', sources: [{ label: 'Rule source', url: 'https://example.test/rules' }] }, caveats: ['Map tags can be incomplete.'],
};

const validGpx = `<?xml version="1.0"?><gpx version="1.1"><trk><name>Uploaded route</name><trkseg><trkpt lat="50.8466" lon="4.3528"/><trkpt lat="50.8477" lon="4.3502"/></trkseg></trk></gpx>`;
const baseUrl = 'http://127.0.0.1:8080';

const rgb = (value: string) => {
  const channels = value.match(/[\d.]+/g)?.slice(0, 3).map(Number);
  if (!channels || channels.length !== 3) throw new Error(`Expected an RGB color, received ${value}`);
  return channels;
};

const contrastRatio = (foreground: string, background: string) => {
  const luminance = (color: string) => {
    const channels = rgb(color).map(channel => {
      const normalized = channel / 255;
      return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
  };
  const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
};

async function expectFocusContrast(target: Locator, surface: Locator, label: string) {
  await target.focus();
  expect(await target.evaluate(element => element.matches(':focus-visible')), `${label} uses its visible focus state`).toBe(true);
  const indicator = await target.evaluate(element => {
    const style = getComputedStyle(element);
    return { color: style.outlineColor, style: style.outlineStyle, width: Number.parseFloat(style.outlineWidth) };
  });
  const background = await surface.evaluate(element => getComputedStyle(element).backgroundColor);
  expect(indicator.style, `${label} focus style`).toBe('solid');
  expect(indicator.width, `${label} focus width`).toBeGreaterThanOrEqual(3);
  expect(contrastRatio(indicator.color, background), `${label} focus contrast`).toBeGreaterThanOrEqual(3);
}

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
  await page.getByRole('button', { name: /Check this GPX track/ }).click();
  await expect(page.getByRole('heading', { name: /Access conflict found/ })).toBeVisible();
  await expect(page.getByText('speed_pedelec=no')).toBeVisible();
  await expect(page.getByRole('button', { name: /Export review checklist/ })).toBeVisible();
});

test('@claim:vehicle-rule-profile sends the GPX track and selected profile, then shows returned map evidence', async ({ page }) => {
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
  await page.getByRole('button', { name: /Check this GPX track/ }).click();
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
  await page.getByRole('button', { name: /Check this GPX track/ }).click();
  await expect(page.locator('#form-status')).toContainText('The GPX is not valid XML. Try again');

  await page.locator('#gpx-file').setInputFiles({
    name: 'replacement.gpx',
    mimeType: 'application/gpx+xml',
    buffer: Buffer.from(validGpx),
  });
  await page.getByRole('button', { name: /Check this GPX track/ }).click();
  await expect(page.getByRole('heading', { name: /Access conflict found/ })).toBeVisible();
  expect(analysisCalls).toBe(2);
  expect(pageErrors).toEqual([]);
});

test('@claim:gpx-size-limit rejects a GPX track above 8 MB before it reaches the analyzer', async ({ page }) => {
  let analysisCalls = 0;
  await page.unroute('**/api/analyze');
  await page.route('**/api/analyze', route => {
    analysisCalls += 1;
    return route.fulfill({ status: 500 });
  });
  await page.goto('/');
  await page.locator('#gpx-file').setInputFiles({
    name: 'too-large.gpx',
    mimeType: 'application/gpx+xml',
    buffer: Buffer.alloc(8 * 1024 * 1024 + 1),
  });
  await page.getByRole('button', { name: /Check this GPX track/ }).click();
  await expect(page.locator('#form-status')).toHaveText('That file is over 8 MB. Export a simpler track and try again.');
  expect(analysisCalls).toBe(0);
});

test('keeps every first-screen fact within desktop and mobile viewports', async ({ page }) => {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    await page.goto('/');
    const required = page.locator('.hero h1, .hero .lede, .hero-actions, .hero-facts li');
    expect(await required.count()).toBe(6);
    for (const element of await required.all()) {
      const box = await element.boundingBox();
      const text = (await element.textContent())?.trim() || 'first-screen item';
      expect(box, `${text} has layout at ${viewport.width}px`).not.toBeNull();
      expect(box!.y, `${text} starts in the ${viewport.height}px viewport`).toBeGreaterThanOrEqual(0);
      expect(box!.y + box!.height, `${text} ends in the ${viewport.height}px viewport`).toBeLessThanOrEqual(viewport.height);
    }
  }
});

test('report interactions and every evidence link have 44px targets', async ({ page }) => {
  await page.goto('/demo');
  const findings = page.locator('.finding-list button');
  expect(await findings.count()).toBe(2);

  await findings.nth(1).click();
  await expect(findings.nth(1)).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('heading', { name: 'Map evidence is incomplete' })).toBeVisible();
  await expect(page.locator('.evidence a')).toHaveCount(0);

  await findings.first().click();
  await expect(findings.first()).toHaveAttribute('aria-pressed', 'true');
  const osmLink = page.getByRole('link', { name: /Inspect OSM way/ });
  await expect(osmLink).toHaveAttribute('href', 'https://www.openstreetmap.org/way/42');

  await page.getByText('Rule sources and limitations').click();
  const sourceLinks = page.locator('details a:visible');
  expect(await sourceLinks.count()).toBeGreaterThan(0);

  const interactions = page.locator('.results a:visible, .results button:visible, .results summary:visible');
  for (const interaction of await interactions.all()) {
    const name = (await interaction.textContent())?.trim() || 'report interaction';
    const box = await interaction.boundingBox();
    expect(box, `${name} has a rendered hit area`).not.toBeNull();
    expect(box!.width, `${name} target width`).toBeGreaterThanOrEqual(44);
    expect(box!.height, `${name} target height`).toBeGreaterThanOrEqual(44);
  }
});

test('focus indicators exceed 3:1 contrast on every product surface', async ({ page }) => {
  await page.goto('/');
  await expectFocusContrast(page.getByRole('link', { name: 'Check your own GPX track' }), page.locator('body'), 'concrete');
  await expectFocusContrast(page.getByRole('button', { name: /Use Brussels sample GPX track/ }), page.locator('.checker'), 'chalk');
  await expectFocusContrast(page.getByRole('link', { name: /Buy regional rule packs/ }), page.locator('.paid'), 'moss');

  await page.goto('/demo');
  await expectFocusContrast(page.getByRole('button', { name: 'Reset demo' }), page.locator('.demo-banner'), 'asphalt');
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
  await page.getByRole('button', { name: /Check this GPX track/ }).click();
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
  await expect(page.getByRole('link', { name: /Skip to GPX track checker/ })).toBeFocused();
  for (const target of await page.locator('header a:visible').all()) {
    await page.keyboard.press('Tab');
    await expect(target).toBeFocused();
  }
});

test('route links, back navigation, titles, focus, and announcements stay in sync', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Privacy' }).first().click();
  await expect(page).toHaveURL(`${baseUrl}/privacy`);
  await expect(page).toHaveTitle('Privacy — Cycle Legal Check');
  await expect(page.getByRole('heading', { name: 'Privacy' })).toBeFocused();
  await expect(page.locator('#route-status')).toHaveText('Privacy loaded');

  await page.goBack();
  await expect(page).toHaveURL(`${baseUrl}/`);
  await expect(page).toHaveTitle('Cycle Legal Check — Check GPX track access');
  await expect(page.getByRole('heading', { name: /Check GPX track access/ })).toBeFocused();
  await expect(page.locator('#route-status')).toContainText('Check GPX track access before you ride. loaded');

  const termsResponse = await page.goto('/terms');
  expect(termsResponse?.status()).toBe(200);
  await expect(page.getByRole('heading', { name: 'Terms of use' })).toBeVisible();
});

test('cold product routes load without console or page errors', async ({ page }) => {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', error => pageErrors.push(error.message));
  for (const path of ['/', '/demo', '/privacy', '/terms']) {
    await page.goto(path);
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('h1')).toHaveCount(1);
  }
  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test('product routes expose unique metadata and no serious accessibility violations', async ({ page }) => {
  const routes = [
    { path: '/', title: 'Cycle Legal Check — Check GPX track access', canonical: '/' },
    { path: '/demo', title: 'Demo — Cycle Legal Check', canonical: '/demo' },
    { path: '/privacy', title: 'Privacy — Cycle Legal Check', canonical: '/privacy' },
    { path: '/terms', title: 'Terms — Cycle Legal Check', canonical: '/terms' },
  ];
  for (const route of routes) {
    await page.goto(route.path);
    await expect(page).toHaveTitle(route.title);
    await expect(page.locator('main')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /^.{20,}$/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${baseUrl}${route.canonical}`);
    await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute('href', '/apple-touch-icon.png');
    const accessibility = await new AxeBuilder({ page }).analyze();
    expect(accessibility.violations.filter(item => ['serious', 'critical'].includes(item.impact || '')), route.path).toEqual([]);
  }
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
    if (!keys.includes('cycle-legal-shell-v6')) throw new Error('versioned cache missing');
  });
  await context.setOffline(true);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: /Check GPX track access/ })).toBeVisible();
  await expect(page.getByText('Offline.', { exact: true })).toBeVisible();
});

test('@claim:demo-sample-report opens an immediate dated sample report from the direct demo URL', async ({ page }) => {
  await page.goto('/demo');
  await expect(page).toHaveTitle('Demo — Cycle Legal Check');
  await expect(page.getByRole('heading', { name: 'Sample GPX track report' })).toBeVisible();
  const accessibility = await new AxeBuilder({ page }).analyze();
  expect(accessibility.violations.filter(item => ['serious', 'critical'].includes(item.impact || ''))).toEqual([]);
  await expect(page.getByRole('heading', { name: /Manual review needed/ })).toBeVisible();
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  await expect(page.getByText(/Belgium rules dated 1 August 2026/)).toBeVisible();
  await expect(page.getByText('speed_pedelec=no')).toBeVisible();
  await page.goto('/?demo=1');
  await expect(page.getByRole('heading', { name: 'Sample GPX track report' })).toBeVisible();
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Reset demo' })).toBeVisible();
});

test('@claim:mapped-access-conflicts opens one vehicle-specific mapped conflict from the first-screen action', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Check GPX track access before you ride/ })).toBeVisible();
  await expect(page.getByText(/find mapped access conflicts/)).toBeVisible();
  await page.getByRole('link', { name: /Try it with sample data/ }).click();
  await expect(page).toHaveURL(`${baseUrl}/demo`);
  await expect(page.getByRole('heading', { name: /Manual review needed/ })).toBeVisible();
  await expect(page.getByText('Speed pedelec access is prohibited').first()).toBeVisible();
  await expect(page.getByText('speed_pedelec=no')).toBeVisible();
});

test('@claim:demo-isolation keeps the sample separate from real browser data and APIs', async ({ page }) => {
  const apiRequests: string[] = [];
  const externalRequests: string[] = [];
  await page.addInitScript(() => localStorage.setItem('sb_license:cycle-legal-profile-check', 'real-license'));
  page.on('request', request => {
    const url = new URL(request.url());
    if (url.pathname.startsWith('/api/')) apiRequests.push(request.url());
    if (url.origin !== baseUrl) externalRequests.push(request.url());
  });
  await page.goto('/demo');
  expect(await page.evaluate(() => localStorage.getItem('sb_license:cycle-legal-profile-check'))).toBe('real-license');
  expect(await page.evaluate(() => localStorage.getItem('demo:cycle-legal-profile-check:active'))).toBe('1');
  await page.getByRole('button', { name: 'Reset demo' }).click();
  expect(apiRequests).toEqual([]);
  expect(externalRequests).toEqual([]);
  await page.getByRole('link', { name: 'Start for real' }).first().click();
  await expect(page).toHaveURL('http://127.0.0.1:8080/');
  expect(await page.evaluate(() => localStorage.getItem('demo:cycle-legal-profile-check:active'))).toBeNull();
  expect(await page.evaluate(() => localStorage.getItem('sb_license:cycle-legal-profile-check'))).toBe('real-license');
});

test('@claim:csv-export exports the demo checklist with a row for each finding', async ({ page }) => {
  await page.goto('/demo');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /Export review checklist/ }).click();
  const download = await downloadPromise;
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream || []) chunks.push(Buffer.from(chunk));
  const text = Buffer.concat(chunks).toString('utf8');
  expect(text.split('\n')).toHaveLength(3);
  expect(text).toContain('"route","region","vehicle","status"');
  expect(text).toContain('"Brussels canal check"');
});

test('@claim:offline-reload reloads the demo shell offline after its first online visit', async ({ browser }) => {
  const isolatedContext = await browser.newContext();
  try {
    const isolatedPage = await isolatedContext.newPage();
    await isolatedPage.goto(`${baseUrl}/demo`);
    await isolatedPage.evaluate(async () => { await navigator.serviceWorker.ready; });
    await isolatedContext.setOffline(true);
    await isolatedPage.reload({ waitUntil: 'domcontentloaded' });
    await expect(isolatedPage.getByRole('heading', { name: 'Sample GPX track report' })).toBeVisible();
    await expect(isolatedPage.getByText('Offline.', { exact: true })).toBeVisible();
  } finally {
    await isolatedContext.close();
  }
});

test('@claim:report-evidence shows the sample route’s map tags and dated rule source', async ({ page }) => {
  await page.goto('/demo');
  await expect(page.getByText('speed_pedelec=no')).toBeVisible();
  await page.getByText('Rule sources and limitations').click();
  await expect(page.getByText('Rule pack source date: 2026-08-01.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Belgium road code and access guidance' })).toBeVisible();
});

test('@claim:regional-pricing proves the free report export and one-time regional rule pack purchase', async ({ page }) => {
  await page.goto('/demo');
  await expect(page.getByText('Belgium checks and checklist export stay free.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Regional rule packs cost €19 once.' })).toBeVisible();
  await expect(page.getByText('one-time purchase')).toBeVisible();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /Export review checklist/ }).click();
  await downloadPromise;

  await page.route('https://api.sociobot.in/api/v1/products/cycle-legal-profile-check/verify?**', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ valid: true, reason: 'ok', expires_at: null }),
  }));
  await page.goto('/?license=regional-rule-pack-token');
  await expect(page.getByLabel('3 / Regional rule pack').locator('option[value="NL"]')).toBeEnabled();
  await expect(page.getByLabel('3 / Regional rule pack').locator('option[value="DE"]')).toBeEnabled();
});

test('serves crawler files and a styled direct 404 document', async ({ page }) => {
  for (const path of ['/robots.txt', '/sitemap.xml', '/404.html']) {
    const response = await page.goto(path);
    expect(response?.status(), path).toBe(200);
  }
  const missing = await page.goto('/a-route-that-does-not-exist');
  expect(missing?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: 'This page does not exist.' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Try it with sample data' })).toBeVisible();
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /does not exist/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://cycle-legal-profile-check.sociobot.in/404.html');
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute('href', '/apple-touch-icon.png');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /social-preview\.svg$/);
  const manifest = await page.request.get('/manifest.webmanifest');
  expect((await manifest.json()).icons).toEqual(expect.arrayContaining([
    expect.objectContaining({ src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }),
  ]));
});

test('@claim:license-browser-local license return is stored, stripped from the URL, and cached for a day', async ({ page }) => {
  let verificationCalls = 0;
  await page.route('https://api.sociobot.in/api/v1/products/cycle-legal-profile-check/verify?**', async (route) => {
    verificationCalls += 1;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ valid: true, reason: 'ok', expires_at: null }),
    });
  });
  await page.goto('/demo');
  await page.getByRole('link', { name: 'Start for real' }).first().click();
  await page.goto('/?license=return-token');
  await expect(page).toHaveURL('http://127.0.0.1:8080/');
  await expect(page.getByLabel('3 / Regional rule pack').locator('option[value="NL"]')).toBeEnabled();
  expect(await page.evaluate(() => localStorage.getItem('sb_license:cycle-legal-profile-check'))).toBe('return-token');
  expect(verificationCalls).toBe(1);

  await page.reload();
  await expect(page.getByLabel('3 / Regional rule pack').locator('option[value="NL"]')).toBeEnabled();
  expect(verificationCalls).toBe(1);
});

test('@claim:billing-refunds uses the Sociobot checkout and removes refunded or revoked licenses', async ({ page }) => {
  await page.route('https://api.sociobot.in/api/v1/products/cycle-legal-profile-check/verify?**', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ valid: true, reason: 'ok', expires_at: null }),
  }));
  await page.goto('/');
  await expect(page.getByRole('link', { name: /Buy regional rule packs/ })).toHaveAttribute(
    'href',
    'https://api.sociobot.in/api/v1/products/cycle-legal-profile-check/checkout',
  );
  await page.getByRole('link', { name: 'Terms' }).first().click();
  await expect(page.getByText(/Sociobot billing, backed by Dodo, handles checkout and refunds/)).toBeVisible();
  await expect(page.getByText(/A refund automatically revokes the license/)).toBeVisible();
  await page.getByRole('link', { name: /Cycle legal/ }).click();
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
  await expect(page.getByRole('link', { name: /Buy regional rule packs/ })).toBeVisible();
});

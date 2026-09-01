import { strict as assert } from 'node:assert';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const baseUrl = process.env.VERIFY_BASE_URL ?? 'https://cycle-legal-profile-check.sociobot.in';
const productionUrl = 'https://cycle-legal-profile-check.sociobot.in';
const expectedBuild = process.env.EXPECTED_BUILD_SHA;
const evidenceDir = process.env.EVIDENCE_DIR ?? '.factory/evidence/polish-2/live';
const browser = await chromium.launch({ headless: true });
const report = {
  baseUrl,
  routes: [],
  demoRequests: [],
  firstViewport: [],
  mobileReportTargets: [],
  paidFocusContrast: 0,
  build: '',
  offline: false,
  routeFocus: false,
  mobileNavigation: false,
  legalClaims: false,
};

function contrastRatio(foreground, background) {
  const luminance = (color) => {
    const channels = color.match(/[\d.]+/g)?.slice(0, 3).map(Number);
    assert.equal(channels?.length, 3, `Expected RGB color, received ${color}`);
    const linear = channels.map((channel) => {
      const value = channel / 255;
      return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
  };
  const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

await mkdir(evidenceDir, { recursive: true });

try {
  const healthResponse = await fetch(`${baseUrl}/health`, { cache: 'no-store' });
  assert.equal(healthResponse.status, 200);
  const health = await healthResponse.json();
  assert.equal(health.status, 'ok');
  if (expectedBuild) assert.equal(health.build, expectedBuild);
  report.build = health.build;

  for (const viewport of [{ name: 'desktop', width: 1440, height: 900 }, { name: 'mobile', width: 390, height: 844 }]) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });

    for (const route of [
      { path: '/', title: 'Cycle Legal Check — Check GPX track access', h1: /Check GPX track access/ },
      { path: '/demo', title: 'Demo — Cycle Legal Check', h1: 'Sample GPX track report' },
      { path: '/privacy', title: 'Privacy — Cycle Legal Check', h1: 'Privacy' },
      { path: '/terms', title: 'Terms — Cycle Legal Check', h1: 'Terms of use' },
    ]) {
      const response = await page.goto(`${baseUrl}${route.path}`, { waitUntil: 'networkidle' });
      assert.equal(response?.status(), 200, route.path);
      assert.equal(await page.title(), route.title);
      assert.equal(await page.locator('h1').count(), 1);
      assert.equal(await page.locator('main').count(), 1);
      assert.equal(await page.getByRole('heading', { name: route.h1 }).isVisible(), true);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), true);
      const axe = await new AxeBuilder({ page }).analyze();
      const serious = axe.violations.filter(item => ['serious', 'critical'].includes(item.impact ?? ''));
      assert.deepEqual(serious, [], `${route.path} ${viewport.name} axe`);
      report.routes.push({ path: route.path, viewport: viewport.name, status: response?.status(), seriousAxe: 0 });
    }

    assert.deepEqual(errors, [], `${viewport.name} console errors`);
    await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
    const firstScreen = await page.locator('.hero h1, .hero .lede, .hero-actions, .hero-facts li').evaluateAll(elements => elements.map((element) => {
      const box = element.getBoundingClientRect();
      return { text: element.textContent?.trim(), top: box.top, bottom: box.bottom };
    }));
    assert.equal(firstScreen.length, 6, `${viewport.name} required first-screen items`);
    for (const item of firstScreen) {
      assert.ok(item.top >= 0 && item.bottom <= viewport.height, `${viewport.name} first-screen item outside viewport: ${item.text}`);
    }
    report.firstViewport.push({ viewport: viewport.name, items: firstScreen });
    await page.screenshot({ path: `${evidenceDir}/landing-${viewport.name}.png`, fullPage: false });

    if (viewport.name === 'mobile') {
      await page.goto(`${baseUrl}/terms`);
      const menu = page.getByRole('button', { name: 'Menu' });
      await menu.click();
      assert.equal(await menu.getAttribute('aria-expanded'), 'true');
      for (const name of ['Demo', 'How it works', 'Rule packs', 'Privacy']) {
        assert.equal(await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name }).isVisible(), true);
      }
      await page.screenshot({ path: `${evidenceDir}/mobile-menu.png`, fullPage: false });
      await page.keyboard.press('Escape');
      assert.equal(await menu.getAttribute('aria-expanded'), 'false');
      assert.equal(await menu.evaluate(element => document.activeElement === element), true);
      await menu.click();
      await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Privacy' }).click();
      await page.getByRole('heading', { name: 'Privacy' }).waitFor();
      assert.equal(await page.getByRole('heading', { name: 'Privacy' }).evaluate(element => document.activeElement === element), true);
      report.mobileNavigation = true;

      await page.evaluate(() => {
        localStorage.setItem('sb_license:cycle-legal-profile-check', 'evidence-license');
        localStorage.setItem('sb_license:cycle-legal-profile-check:verdict', '{"valid":true}');
        localStorage.setItem('demo:cycle-legal-profile-check:active', '1');
      });
      await page.getByRole('button', { name: 'Remove saved browser data' }).click();
      assert.deepEqual(await page.evaluate(() => [
        localStorage.getItem('sb_license:cycle-legal-profile-check'),
        localStorage.getItem('sb_license:cycle-legal-profile-check:verdict'),
        localStorage.getItem('demo:cycle-legal-profile-check:active'),
      ]), [null, null, null]);
      await page.screenshot({ path: `${evidenceDir}/privacy-mobile.png`, fullPage: false });
      report.legalClaims = true;

      await page.goto(`${baseUrl}/demo`);
      await page.getByText('Rule sources and limitations').click();
      const targets = await page.locator('.results a:visible, .results button:visible, .results summary:visible').evaluateAll(elements => elements.map((element) => {
        const box = element.getBoundingClientRect();
        return { text: element.textContent?.trim(), width: box.width, height: box.height };
      }));
      assert.ok(targets.length > 0, 'mobile report interactions were rendered');
      for (const target of targets) {
        assert.ok(target.width >= 44 && target.height >= 44, `undersized mobile report target: ${target.text}`);
      }
      report.mobileReportTargets = targets;

      await page.goto(`${baseUrl}/`);
      const buy = page.getByRole('link', { name: /Buy regional rule packs/ });
      await buy.focus();
      const colors = await buy.evaluate((element) => ({
        outline: getComputedStyle(element).outlineColor,
        background: getComputedStyle(element.closest('.paid')).backgroundColor,
      }));
      report.paidFocusContrast = contrastRatio(colors.outline, colors.background);
      assert.ok(report.paidFocusContrast >= 3, `paid focus contrast was ${report.paidFocusContrast.toFixed(2)}:1`);
    }
    await context.close();
  }

  const routeContext = await browser.newContext();
  const routePage = await routeContext.newPage();
  await routePage.goto(`${baseUrl}/`);
  await routePage.getByRole('link', { name: 'Privacy' }).first().click();
  await routePage.getByRole('heading', { name: 'Privacy' }).waitFor();
  assert.equal(await routePage.evaluate(() => document.activeElement?.textContent?.trim()), 'Privacy');
  assert.equal(await routePage.locator('#route-status').textContent(), 'Privacy loaded');
  await routePage.goBack();
  await routePage.getByRole('heading', { name: /Check GPX track access/ }).waitFor();
  await routePage.waitForFunction(() => document.querySelector('#route-status')?.textContent?.includes('Check GPX track access before you ride. loaded'));
  assert.match(await routePage.locator('#route-status').textContent() ?? '', /Check GPX track access before you ride\. loaded/);
  report.routeFocus = true;
  await routeContext.close();

  const demoContext = await browser.newContext();
  await demoContext.addInitScript(() => localStorage.setItem('sb_license:cycle-legal-profile-check', 'real-license'));
  const demoPage = await demoContext.newPage();
  demoPage.on('request', request => report.demoRequests.push(request.url()));
  await demoPage.goto(`${baseUrl}/?demo=1`, { waitUntil: 'networkidle' });
  await demoPage.getByRole('heading', { name: 'Sample GPX track report' }).waitFor();
  await demoPage.getByRole('button', { name: 'Reset demo' }).click();
  assert.equal(await demoPage.getByText('speed_pedelec=no').isVisible(), true);
  assert.equal(await demoPage.evaluate(() => localStorage.getItem('sb_license:cycle-legal-profile-check')), 'real-license');
  assert.equal(await demoPage.evaluate(() => localStorage.getItem('demo:cycle-legal-profile-check:active')), '1');
  const unexpectedDemoRequests = report.demoRequests.filter(url => new URL(url).origin !== baseUrl || new URL(url).pathname.startsWith('/api/'));
  assert.deepEqual(unexpectedDemoRequests, []);
  await demoContext.close();

  const offlineContext = await browser.newContext();
  const offlinePage = await offlineContext.newPage();
  await offlinePage.goto(`${baseUrl}/demo`);
  await offlinePage.evaluate(async () => { await navigator.serviceWorker.ready; });
  await offlineContext.setOffline(true);
  await offlinePage.reload({ waitUntil: 'domcontentloaded' });
  assert.equal(await offlinePage.getByRole('heading', { name: 'Sample GPX track report' }).isVisible(), true);
  assert.equal(await offlinePage.getByText('Offline.', { exact: true }).isVisible(), true);
  report.offline = true;
  await offlineContext.close();

  const notFoundContext = await browser.newContext();
  const notFoundPage = await notFoundContext.newPage();
  const missing = await notFoundPage.goto(`${baseUrl}/missing-polish-evidence`);
  assert.equal(missing?.status(), 404);
  assert.equal(await notFoundPage.title(), 'Page not found — Cycle Legal Check');
  assert.equal(await notFoundPage.locator('link[rel="apple-touch-icon"]').getAttribute('href'), '/apple-touch-icon.png');
  assert.equal(await notFoundPage.locator('link[rel="canonical"]').getAttribute('href'), `${productionUrl}/404.html`);
  await notFoundPage.screenshot({ path: `${evidenceDir}/404-desktop.png`, fullPage: false });
  await notFoundContext.close();

  await writeFile(`${evidenceDir}/polish-live.json`, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report));
} finally {
  await browser.close();
}

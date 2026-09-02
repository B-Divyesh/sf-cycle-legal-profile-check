import './style.css';
import type { Analysis, Finding, Severity } from './types';
import { downloadChecklist, verdictCopy } from './ui';

const SLUG = 'cycle-legal-profile-check';
const LICENSE_KEY = `sb_license:${SLUG}`;
const VERDICT_KEY = `${LICENSE_KEY}:verdict`;
const DEMO_KEY = `demo:${SLUG}:active`;
const BILLING = 'https://api.sociobot.in/api/v1';

const SAMPLE_GPX = `<?xml version="1.0"?><gpx version="1.1" creator="Cycle Legal Check" xmlns="http://www.topografix.com/GPX/1/1"><metadata><name>Brussels canal check</name></metadata><trk><name>Brussels canal check</name><trkseg><trkpt lat="50.8466" lon="4.3528"/><trkpt lat="50.8477" lon="4.3502"/><trkpt lat="50.8490" lon="4.3472"/><trkpt lat="50.8501" lon="4.3447"/><trkpt lat="50.8516" lon="4.3421"/></trkseg></trk></gpx>`;

const DEMO_REPORT: Analysis = {
  route_name: 'Brussels canal check',
  distance_km: 0.5,
  sampled_points: 5,
  matched_distance_km: 0.4,
  coverage_percent: 80,
  verdict: 'review',
  region: 'BE',
  vehicle: 'speed_pedelec',
  findings: [
    {
      id: 'demo-way-42', severity: 'prohibited', title: 'Speed pedelec access is prohibited',
      explanation: 'The mapped way has an explicit speed-pedelec restriction. Choose another GPX track or check local signs.',
      start_km: 0.2, end_km: 0.3, tags: { highway: 'cycleway', speed_pedelec: 'no' },
      osm_way_id: 42, osm_url: 'https://www.openstreetmap.org/way/42', rule_id: 'SP-EXPLICIT-NO',
    },
    {
      id: 'demo-unmatched', severity: 'review', title: 'Map evidence is incomplete',
      explanation: 'This sampled section did not match a nearby tagged way. Check signs before riding.',
      start_km: 0.3, end_km: 0.5, tags: {}, rule_id: 'MAP-REVIEW',
    },
  ],
  rule_pack: {
    version: '2026.08', source_date: '2026-08-01',
    sources: [{ label: 'Belgium road code and access guidance', url: 'https://www.wegcode.be/' }],
  },
  caveats: ['Map tags can be incomplete.', 'Road signs and official instructions take priority.'],
};

function isDemoRoute() {
  return location.pathname === '/demo' || new URL(location.href).searchParams.get('demo') === '1';
}

let demoMode = isDemoRoute();
let selectedFile: File | null = null;
let sampleText = demoMode ? SAMPLE_GPX : '';
let result: Analysis | null = demoMode ? cloneDemoReport() : null;
let selectedFinding = result?.findings[0]?.id || '';
let unlocked = cachedUnlock();
let licenseInactive = cachedLicenseInactive();

function cachedUnlock() {
  if (demoMode) return false;
  try {
    const cache = JSON.parse(localStorage.getItem(VERDICT_KEY) || '{}');
    return Boolean(localStorage.getItem(LICENSE_KEY) && cache.valid);
  } catch { return false; }
}

function cachedLicenseInactive() {
  if (demoMode) return false;
  try { const cache = JSON.parse(localStorage.getItem(VERDICT_KEY) || '{}'); return Boolean(localStorage.getItem(LICENSE_KEY) && cache.valid === false); }
  catch { return false; }
}

function consumeLicense() {
  if (demoMode) return false;
  const url = new URL(location.href);
  const token = url.searchParams.get('license');
  if (!token) return false;
  localStorage.setItem(LICENSE_KEY, token);
  url.searchParams.delete('license');
  history.replaceState({}, '', url);
  verifyLicense(token);
  return true;
}

async function verifyLicense(token?: string) {
  if (demoMode) return false;
  const license = token ?? (localStorage.getItem(LICENSE_KEY) || '');
  if (!license) return false;
  try {
    const response = await fetch(`${BILLING}/products/${SLUG}/verify?license=${encodeURIComponent(license)}`);
    const verdict = await response.json();
    localStorage.setItem(VERDICT_KEY, JSON.stringify({ ...verdict, checked_at: Date.now() }));
    unlocked = Boolean(verdict.valid);
    licenseInactive = !verdict.valid;
    render();
    return unlocked;
  } catch { return unlocked; }
}

function cloneDemoReport() {
  return structuredClone(DEMO_REPORT);
}

function markDemoActive() {
  try { localStorage.setItem(DEMO_KEY, '1'); } catch { /* private browsing can block storage */ }
}

function discardDemoData() {
  try { localStorage.removeItem(DEMO_KEY); } catch { /* storage is optional in the demo */ }
}

function resetDemo() {
  discardDemoData();
  markDemoActive();
  selectedFile = null;
  sampleText = SAMPLE_GPX;
  result = cloneDemoReport();
  selectedFinding = result.findings[0]?.id || '';
  render();
}

function legalPage(kind: 'privacy' | 'terms') {
  const privacy = `<p>The server does not retain GPX track data in SQLite. It stores one aggregate page count.</p><p>Client IP addresses enforce request limits. They are not written to SQLite.</p><p>A saved license and its once-daily verdict stay in your browser. License verification uses Sociobot.</p><p>A check sends sampled GPX track coordinates to OpenStreetMap’s Overpass service. It does not send the GPX file or track name.</p><div class="storage-control"><button class="secondary" id="clear-browser-data" type="button">Remove saved browser data</button><p id="storage-status" role="status">This removes the saved license and demo marker from this browser.</p></div><p>Contact: <a href="mailto:privacy@sociobot.in">privacy@sociobot.in</a>.</p>`;
  const terms = `<p>Cycle Legal Check is a planning aid. It is not legal advice or live navigation.</p><p>Map data and regional rule packs can be incomplete, delayed, or wrong. Road signs and official instructions take priority.</p><p>You remain responsible for checking the GPX track and riding lawfully.</p><p>The maintained regional rule pack costs €19 once. It includes the Netherlands and Germany rule packs.</p><p>Sociobot billing, backed by Dodo, handles checkout and refunds. A refund automatically revokes the license.</p><p>Belgium checks and checklist export stay free.</p><p>OpenStreetMap data is © OpenStreetMap contributors and available under the ODbL. This service is provided “as is” without warranty.</p>`;
  return `${header()}<main id="main" class="legal"><p class="eyebrow">${kind === 'privacy' ? 'DATA HANDLING' : 'SERVICE TERMS'}</p><h1 tabindex="-1">${kind === 'privacy' ? 'Privacy' : 'Terms of use'}</h1><p class="lede">Effective 28 August 2026</p>${kind === 'privacy' ? privacy : terms}</main>${footer()}`;
}

function footer() {
  return `<footer><p><strong>Cycle Legal Check</strong> is not legal advice. Coverage is incomplete.</p><nav aria-label="Legal"><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="https://www.openstreetmap.org/copyright" rel="external">© OpenStreetMap contributors</a></nav><p class="generated"><a href="/health">Build status</a> · Version 1.0 · Built by Param Factory</p></footer>`;
}

function header() {
  return `<header class="site-header"><a class="wordmark" href="/">Cycle legal <span>//01</span></a><button class="menu-toggle" id="menu-toggle" type="button" aria-expanded="false" aria-controls="primary-nav"><span aria-hidden="true">☰</span><span>Menu</span></button><nav id="primary-nav" aria-label="Primary"><a href="/demo">Demo</a><a href="/#how">How it works</a><a href="/#rule-packs">Rule packs</a><a href="/privacy">Privacy</a></nav><a class="header-action" href="/#checker">Check a GPX track</a></header>`;
}

function icon(severity: Severity) {
  return severity === 'prohibited' ? '×' : severity === 'review' ? '!' : '✓';
}

function findingItem(finding: Finding) {
  const active = selectedFinding === finding.id;
  return `<li><button class="finding ${finding.severity}${active ? ' active' : ''}" data-finding="${finding.id}" aria-pressed="${active}"><span class="status-icon" aria-hidden="true">${icon(finding.severity)}</span><span><strong>${escapeHtml(finding.title)}</strong><small>${finding.start_km.toFixed(1)}–${finding.end_km.toFixed(1)} km · ${finding.severity === 'review' ? 'Verify before riding' : finding.severity}</small></span><span aria-hidden="true">→</span></button></li>`;
}

function resultView(data: Analysis) {
  const current = data.findings.find((item) => item.id === selectedFinding) || data.findings[0];
  const tags = current ? Object.entries(current.tags).map(([key, value]) => `<code>${escapeHtml(key)}=${escapeHtml(value)}</code>`).join('') : '';
  return `<section class="results" aria-labelledby="result-title">
    <div class="result-head ${data.verdict}"><div><p class="eyebrow">REPORT / ${data.region}-${data.rule_pack.version}</p><h2 id="result-title"><span aria-hidden="true">${icon(data.verdict)}</span> ${verdictCopy(data.verdict)}</h2><p>${data.route_name} · ${data.distance_km.toFixed(1)} km · ${data.vehicle.replace('_', ' ')}</p></div><div class="coverage"><strong>${data.coverage_percent.toFixed(0)}%</strong><span>matched to tagged OSM ways</span></div></div>
    <div class="coverage-note"><strong>Coverage matters.</strong> ${data.coverage_percent < 95 ? 'Unmatched sections are marked for manual review.' : 'Nearly all sampled GPX track points matched mapped ways.'} This report cannot prove a GPX track is legal.</div>
    <div class="route-tape" aria-label="GPX track evidence overview">${data.findings.map(finding => `<span class="${finding.severity}" title="${escapeHtml(finding.title)}"><b aria-hidden="true">${icon(finding.severity)}</b><small>${finding.start_km.toFixed(1)} km</small></span>`).join('')}</div>
    <div class="result-grid"><div><h3>GPX track findings <span>${data.findings.length}</span></h3><ol class="finding-list">${data.findings.map(findingItem).join('')}</ol></div>
    <aside class="evidence" aria-live="polite">${current ? `<p class="eyebrow">EVIDENCE / ${current.rule_id}</p><h3>${escapeHtml(current.title)}</h3><p>${escapeHtml(current.explanation)}</p><div class="tags" aria-label="OpenStreetMap tags">${tags || '<em>No access tags were returned.</em>'}</div>${current.osm_url ? `<a class="text-link" href="${current.osm_url}" target="_blank" rel="noreferrer">Inspect OSM way <span aria-hidden="true">↗</span></a>` : '<p class="muted">No OSM way link is available for this unmatched section.</p>'}` : ''}</aside></div>
    <div class="report-actions"><button class="secondary" id="export">Export review checklist (.csv)</button><button class="plain" id="start-over">${demoMode ? 'Reset sample report' : 'Check another GPX track'}</button></div>
    <details><summary>Rule sources and limitations</summary><p>Rule pack source date: ${data.rule_pack.source_date}. Rules interpret public OSM access tags; they do not replace signs, local orders, or current law.</p><ul>${data.rule_pack.sources.map(source => `<li><a href="${source.url}" rel="external">${escapeHtml(source.label)}</a></li>`).join('')}</ul><ul>${data.caveats.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul></details>
  </section>`;
}

function checker() {
  return `<section class="checker" id="checker" aria-labelledby="checker-title"><div class="section-number" aria-hidden="true">01</div><div class="checker-copy"><p class="eyebrow">PRE-RIDE ACCESS CHECK</p><h2 id="checker-title">Check a GPX track before you ride.</h2><p>Upload a GPX track. Choose the vehicle and regional rule pack used in its report.</p></div>
  <form id="check-form"><div class="form-grid"><div class="field file-field"><span class="field-label">1 / GPX track file</span><label class="drop-zone" for="gpx-file"><input id="gpx-file" type="file" accept=".gpx,application/gpx+xml,application/xml,text/xml"/><span class="drop-mark" aria-hidden="true">＋</span><strong>${selectedFile ? escapeHtml(selectedFile.name) : sampleText ? 'Brussels sample GPX track loaded' : 'Choose or drop a GPX track'}</strong><small>${selectedFile ? `${(selectedFile.size / 1024).toFixed(0)} KB · ready to inspect` : sampleText ? 'Built-in 0.5 km test track' : 'GPX track · up to 8 MB · never stored'}</small></label><button class="sample-button" type="button" id="sample">Use Brussels sample GPX track</button></div>
  <div class="field"><label class="field-label" for="vehicle">2 / Vehicle</label><select id="vehicle" name="vehicle"><option value="bicycle">Bicycle</option><option value="ebike_25">E-bike (assist to 25 km/h)</option><option value="speed_pedelec">Speed pedelec (assist to 45 km/h)</option></select><p class="hint">The report shows evidence for this vehicle.</p></div>
  <div class="field"><label class="field-label" for="region">3 / Regional rule pack</label><select id="region" name="region"><option value="BE">Belgium · included</option><option value="NL" ${unlocked ? '' : 'disabled'}>Netherlands · maintained${unlocked ? '' : ' (unlock)'}</option><option value="DE" ${unlocked ? '' : 'disabled'}>Germany · maintained${unlocked ? '' : ' (unlock)'}</option></select><p class="hint">Sources are dated and linked in every report.</p></div></div>
  <div id="form-status" class="form-status" aria-live="assertive"></div><button class="primary" type="submit"><span>Check this GPX track</span><span aria-hidden="true">→</span></button></form></section>`;
}

function paySection() {
  if (demoMode) {
    return `<section class="paid" id="rule-packs"><div><p class="eyebrow">MAINTAINED RULE PACKS / ONE-TIME</p><h2>Regional rule packs cost €19 once.</h2><p>Belgium checks and checklist export stay free. Start a real check to add the Netherlands and Germany rule packs.</p></div><div class="price"><span>€</span><strong>19</strong><small>one-time purchase</small></div><div class="paid-actions"><a class="primary link-button start-real" href="/">Start for real →</a><p>Pay once for both regional rule packs.</p></div></section>`;
  }
  return `<section class="paid" id="rule-packs"><div><p class="eyebrow">MAINTAINED RULE PACKS / ONE-TIME</p><h2>Regional rule packs cost €19 once.</h2><p>Belgium checks and checklist export stay free. The purchase adds the Netherlands and Germany rule packs.</p></div><div class="price"><span>€</span><strong>19</strong><small>one-time purchase</small></div><div class="paid-actions">${unlocked ? '<p class="unlocked"><span aria-hidden="true">✓</span> Regional rule packs added</p>' : `<a class="primary link-button" href="${BILLING}/products/${SLUG}/checkout">Buy regional rule packs →</a>`}${licenseInactive ? '<p class="license-notice">Your saved license is no longer active.</p>' : ''}<button class="plain" id="restore">Have a license? Restore purchase</button><p>Checkout and refunds are handled by Sociobot and Dodo.</p></div></section>`;
}

function demoBanner() {
  return `<aside class="demo-banner" aria-label="Demo controls"><strong>Demo — sample data, nothing is saved</strong><span>The sample report stays separate from your real data.</span><button class="plain" id="reset-demo">Reset demo</button><a class="plain start-real" href="/">Start for real</a></aside>`;
}

function hero() {
  return `<section class="hero"><div class="hero-copy"><p class="eyebrow">GPX TRACK ACCESS / BEFORE DEPARTURE</p><h1 tabindex="-1">Check GPX track access <span>before you ride.</span></h1><p class="lede">For cyclists with a planned GPX track, find mapped access conflicts before starting the ride.</p><div class="hero-actions"><a class="primary link-button" href="/demo">Try it with sample data <span aria-hidden="true">→</span></a><p>Opens a sample report. Nothing is saved to your real data.</p><a class="text-link" href="#checker">Check your own GPX track</a></div><ul class="hero-facts"><li>Demo uses a separate sample workspace.</li><li>After one online visit, the page reloads offline.</li><li>Belgium checks are free. Regional rule packs cost €19 once.</li></ul></div><figure class="hero-art"><img src="/assets/route-inspection-hero.webp" srcset="/assets/route-inspection-hero-mobile.webp 640w, /assets/route-inspection-hero.webp 960w" sizes="(max-width: 800px) 100vw, 58vw" width="960" height="640" alt="A folded GPX track map with moss and an orange line marking uncertain access" fetchpriority="high" decoding="async"><figcaption>Illustration: map evidence can be incomplete.</figcaption></figure></section>`;
}

function demoWorkspace() {
  const report = result || cloneDemoReport();
  return `<section class="demo-workspace" aria-labelledby="demo-title"><h1 id="demo-title" tabindex="-1">Sample GPX track report</h1><p>Brussels canal sample · Speed pedelec · Belgium rules dated 1 August 2026</p>${resultView(report)}</section>`;
}

function appPage() {
  const workspace = demoMode ? demoWorkspace() : `${hero()}${result ? resultView(result) : checker()}`;
  return `${header()}<main id="main">${navigator.onLine ? '' : '<div class="offline" role="status"><strong>Offline.</strong> You can review this page, but a new map check needs a connection.</div>'}${demoMode ? demoBanner() : ''}${workspace}
  <section class="method" id="how"><div class="section-number" aria-hidden="true">02</div><div><p class="eyebrow">HOW IT WORKS</p><h2>Review three parts of your GPX track.</h2></div><ol><li><strong>Upload</strong><span>Choose the GPX track you plan to ride.</span></li><li><strong>Profile</strong><span>Choose your vehicle and regional rule pack.</span></li><li><strong>Report</strong><span>Review mapped conflicts, uncertainty, and dated sources.</span></li></ol></section>
  ${paySection()}<section class="boundary"><p class="eyebrow">WHAT THIS TOOL DOES NOT DO</p><blockquote>“No conflict found” does not mean legal clearance.</blockquote></section></main>${footer()}`;
}

function render(routeChanged = false) {
  const path = location.pathname;
  document.querySelector<HTMLDivElement>('#app')!.innerHTML = path === '/privacy' ? legalPage('privacy') : path === '/terms' ? legalPage('terms') : appPage();
  updateRouteMetadata(path);
  bind();
  if (routeChanged) announceRoute();
}

function updateRouteMetadata(path: string) {
  const details = path === '/privacy'
    ? { title: 'Privacy — Cycle Legal Check', description: 'Read how Cycle Legal Check handles route checks and browser data.' }
    : path === '/terms'
      ? { title: 'Terms — Cycle Legal Check', description: 'Read the terms and limits for Cycle Legal Check.' }
      : demoMode
        ? { title: 'Demo — Cycle Legal Check', description: 'Review a separate Brussels sample GPX track report before checking your own track.' }
        : { title: 'Cycle Legal Check — Check GPX track access', description: 'Check a planned GPX track for bicycle and speed-pedelec access conflicts before you ride.' };
  document.title = details.title;
  document.querySelector('meta[name="description"]')?.setAttribute('content', details.description);
  document.querySelector('meta[property="og:title"]')?.setAttribute('content', details.title);
  document.querySelector('meta[property="og:description"]')?.setAttribute('content', details.description);
  document.querySelector('meta[name="twitter:title"]')?.setAttribute('content', details.title);
  document.querySelector('meta[name="twitter:description"]')?.setAttribute('content', details.description);
  const canonicalPath = demoMode ? '/demo' : path;
  document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.setAttribute('href', `${location.origin}${canonicalPath}`);
}

function announceRoute() {
  requestAnimationFrame(() => {
    const heading = document.querySelector<HTMLElement>('main h1');
    const status = document.querySelector<HTMLElement>('#route-status');
    if (!heading || !status) return;
    heading.focus({ preventScroll: true });
    status.textContent = `${heading.textContent?.trim() || 'Page'} loaded`;
    heading.scrollIntoView({ block: 'start' });
  });
}

function syncRouteMode() {
  const nextDemoMode = isDemoRoute();
  if (nextDemoMode && !demoMode) {
    demoMode = true;
    selectedFile = null;
    sampleText = SAMPLE_GPX;
    result = cloneDemoReport();
    selectedFinding = result.findings[0]?.id || '';
    unlocked = false;
    licenseInactive = false;
    markDemoActive();
  } else if (!nextDemoMode && demoMode) {
    demoMode = false;
    discardDemoData();
    selectedFile = null;
    sampleText = '';
    result = null;
    selectedFinding = '';
    unlocked = cachedUnlock();
    licenseInactive = cachedLicenseInactive();
  }
}

function bind() {
  document.querySelector('#check-form')?.addEventListener('submit', submitCheck);
  document.querySelector<HTMLInputElement>('#gpx-file')?.addEventListener('change', (event) => {
    selectedFile = (event.target as HTMLInputElement).files?.[0] || null; sampleText = ''; render();
  });
  const dropZone = document.querySelector<HTMLElement>('.drop-zone');
  dropZone?.addEventListener('dragover', (event) => { event.preventDefault(); dropZone.classList.add('dragging'); });
  dropZone?.addEventListener('dragleave', () => dropZone.classList.remove('dragging'));
  dropZone?.addEventListener('drop', (event) => {
    event.preventDefault();
    selectedFile = event.dataTransfer?.files[0] || null;
    sampleText = '';
    render();
  });
  document.querySelector('#sample')?.addEventListener('click', () => { sampleText = SAMPLE_GPX; selectedFile = null; render(); });
  document.querySelector('#export')?.addEventListener('click', () => result && downloadChecklist(result));
  document.querySelector('#start-over')?.addEventListener('click', () => {
    if (demoMode) { resetDemo(); return; }
    result = null; selectedFinding = ''; render(); location.hash = 'checker';
  });
  document.querySelector('#reset-demo')?.addEventListener('click', resetDemo);
  document.querySelectorAll<HTMLAnchorElement>('.start-real').forEach((link) => link.addEventListener('click', discardDemoData));
  document.querySelectorAll<HTMLElement>('[data-finding]').forEach((button) => button.addEventListener('click', () => { selectedFinding = button.dataset.finding || ''; render(); document.querySelector<HTMLElement>(`[data-finding="${selectedFinding}"]`)?.focus(); }));
  document.querySelector('#restore')?.addEventListener('click', restore);
  document.querySelector('#clear-browser-data')?.addEventListener('click', clearBrowserData);
  const menuToggle = document.querySelector<HTMLButtonElement>('#menu-toggle');
  const primaryNav = document.querySelector<HTMLElement>('#primary-nav');
  menuToggle?.addEventListener('click', () => {
    const open = menuToggle.getAttribute('aria-expanded') !== 'true';
    menuToggle.setAttribute('aria-expanded', String(open));
    primaryNav?.toggleAttribute('data-open', open);
    if (open) primaryNav?.querySelector<HTMLAnchorElement>('a')?.focus();
  });
  document.onkeydown = (event) => {
    if (event.key !== 'Escape' || menuToggle?.getAttribute('aria-expanded') !== 'true') return;
    menuToggle.setAttribute('aria-expanded', 'false');
    primaryNav?.removeAttribute('data-open');
    menuToggle.focus();
  };
  document.querySelectorAll<HTMLAnchorElement>('a[href]').forEach((link) => link.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target || link.hasAttribute('download')) return;
    const destination = new URL(link.href, location.href);
    const appRoutes = ['/', '/demo', '/privacy', '/terms'];
    if (destination.origin !== location.origin || !appRoutes.includes(destination.pathname) || (destination.pathname === location.pathname && destination.search === location.search && destination.hash)) return;
    event.preventDefault();
    history.pushState({}, '', `${destination.pathname}${destination.search}${destination.hash}`);
    syncRouteMode();
    render(true);
  }));
}

function clearBrowserData() {
  for (const key of [LICENSE_KEY, VERDICT_KEY, DEMO_KEY]) localStorage.removeItem(key);
  sessionStorage.removeItem('page-counted');
  unlocked = false;
  licenseInactive = false;
  const status = document.querySelector<HTMLElement>('#storage-status');
  if (status) status.textContent = 'Saved license and demo data removed from this browser.';
}

async function restore() {
  if (demoMode) return;
  const token = prompt('Paste your Cycle Legal Check license token');
  if (!token?.trim()) return;
  localStorage.setItem(LICENSE_KEY, token.trim());
  const valid = await verifyLicense(token.trim());
  if (!valid) alert('That license could not be verified. Check the token and try again.');
}

async function submitCheck(event: Event) {
  event.preventDefault();
  const form = event.currentTarget as HTMLFormElement;
  const vehicle = (form.elements.namedItem('vehicle') as HTMLSelectElement).value;
  const region = (form.elements.namedItem('region') as HTMLSelectElement).value;
  const status = document.querySelector<HTMLElement>('#form-status')!;
  if (!sampleText && !selectedFile) { status.textContent = 'Choose a GPX track or load the sample GPX track first.'; return; }
  if (selectedFile && selectedFile.size > 8 * 1024 * 1024) { status.textContent = 'That file is over 8 MB. Export a simpler track and try again.'; return; }
  status.innerHTML = '<span class="loader" aria-hidden="true"></span> Matching GPX track points to mapped ways…';
  try {
    const fileText = sampleText || await selectedFile!.text();
    const response = await fetch('/api/analyze', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ gpx: fileText, vehicle, region, license: localStorage.getItem(LICENSE_KEY) }) });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || 'The route could not be checked.');
    result = body; selectedFinding = result?.findings[0]?.id || ''; render(); location.hash = 'checker';
  } catch (error) {
    status.textContent = navigator.onLine ? `${(error as Error).message} Try again or use a smaller GPX.` : 'You are offline. Your file stayed on this device; reconnect to check it against map evidence.';
  }
}

function escapeHtml(value: string) {
  const element = document.createElement('span'); element.textContent = value; return element.innerHTML;
}

if (demoMode) markDemoActive();
const receivedLicense = consumeLicense();
render();
try {
  if (!demoMode) {
    const token = localStorage.getItem(LICENSE_KEY);
    const cache = JSON.parse(localStorage.getItem(VERDICT_KEY) || '{}');
    if (!receivedLicense && token && (!cache.checked_at || Date.now() - cache.checked_at >= 86_400_000)) verifyLicense(token);
  }
} catch { /* malformed local state stays locked */ }
if ('serviceWorker' in navigator) addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => undefined));
if (!demoMode && !sessionStorage.getItem('page-counted')) {
  sessionStorage.setItem('page-counted', '1');
  fetch('/api/page-view', { method: 'POST' }).catch(() => undefined);
}
addEventListener('popstate', () => { syncRouteMode(); render(true); });
addEventListener('online', () => render());
addEventListener('offline', () => render());

import './style.css';
import type { Analysis, Finding, Severity } from './types';
import { downloadChecklist, verdictCopy } from './ui';

const SLUG = 'cycle-legal-profile-check';
const LICENSE_KEY = `sb_license:${SLUG}`;
const VERDICT_KEY = `${LICENSE_KEY}:verdict`;
const BILLING = 'https://api.sociobot.in/api/v1';

const SAMPLE_GPX = `<?xml version="1.0"?><gpx version="1.1" creator="Cycle Legal Check" xmlns="http://www.topografix.com/GPX/1/1"><metadata><name>Brussels canal check</name></metadata><trk><name>Brussels canal check</name><trkseg><trkpt lat="50.8466" lon="4.3528"/><trkpt lat="50.8477" lon="4.3502"/><trkpt lat="50.8490" lon="4.3472"/><trkpt lat="50.8501" lon="4.3447"/><trkpt lat="50.8516" lon="4.3421"/></trkseg></trk></gpx>`;

let selectedFile: File | null = null;
let sampleText = '';
let result: Analysis | null = null;
let selectedFinding = '';
let unlocked = cachedUnlock();
let licenseInactive = cachedLicenseInactive();

function cachedUnlock() {
  try {
    const cache = JSON.parse(localStorage.getItem(VERDICT_KEY) || '{}');
    return Boolean(localStorage.getItem(LICENSE_KEY) && cache.valid);
  } catch { return false; }
}

function cachedLicenseInactive() {
  try { const cache = JSON.parse(localStorage.getItem(VERDICT_KEY) || '{}'); return Boolean(localStorage.getItem(LICENSE_KEY) && cache.valid === false); }
  catch { return false; }
}

function consumeLicense() {
  const url = new URL(location.href);
  const token = url.searchParams.get('license');
  if (!token) return;
  localStorage.setItem(LICENSE_KEY, token);
  url.searchParams.delete('license');
  history.replaceState({}, '', url);
  verifyLicense(token);
}

async function verifyLicense(token = localStorage.getItem(LICENSE_KEY) || '') {
  if (!token) return false;
  try {
    const response = await fetch(`${BILLING}/products/${SLUG}/verify?license=${encodeURIComponent(token)}`);
    const verdict = await response.json();
    localStorage.setItem(VERDICT_KEY, JSON.stringify({ ...verdict, checked_at: Date.now() }));
    unlocked = Boolean(verdict.valid);
    licenseInactive = !verdict.valid;
    render();
    return unlocked;
  } catch { return unlocked; }
}

function legalPage(kind: 'privacy' | 'terms') {
  const privacy = `<p>Cycle Legal Check processes your uploaded GPX only to produce the requested report. The file is held in memory for the request and is not retained. We record an aggregate page count, not IP addresses, device identifiers, route geometry, or analytics events.</p><p>A license token and a once-daily verification result are stored in your browser when you unlock maintained rule packs. License verification is sent to Sociobot, the merchant of record. The application also sends sampled route coordinates to its server, which asks OpenStreetMap’s Overpass service for nearby public map tags.</p><p>To remove local data, clear this site’s storage in your browser. Contact: <a href="mailto:privacy@sociobot.in">privacy@sociobot.in</a>.</p>`;
  const terms = `<p>Cycle Legal Check is a planning aid, not legal advice or live navigation. Map data and rule packs can be incomplete, delayed, or wrong. Road signs and official instructions always take priority. You remain responsible for checking the route and riding lawfully.</p><p>The maintained regional pack unlock costs €19 once and currently includes the Netherlands and Germany packs. Sociobot/Dodo is the merchant of record and handles checkout and refunds. A refund automatically revokes the license. Accessibility, Belgium checks, safety warnings, and checklist export remain free.</p><p>OpenStreetMap data is © OpenStreetMap contributors and available under the ODbL. Use of this service is provided “as is” without warranty.</p>`;
  return `<header class="site-header"><a class="wordmark" href="/">Cycle legal <span>//01</span></a><nav aria-label="Primary"><a href="/">Route checker</a></nav></header><main id="main" class="legal"><p class="eyebrow">FIELD NOTE / ${kind === 'privacy' ? 'PRIVACY' : 'TERMS'}</p><h1>${kind === 'privacy' ? 'Privacy' : 'Terms of use'}</h1><p class="lede">Effective 28 August 2026</p>${kind === 'privacy' ? privacy : terms}</main>${footer()}`;
}

function footer() {
  return `<footer><p><strong>Cycle Legal Check</strong> is not legal advice. Coverage is incomplete.</p><nav aria-label="Legal"><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="https://www.openstreetmap.org/copyright" rel="external">© OpenStreetMap contributors</a></nav><p class="generated">Hero imagery generated for this product with Azure AI.</p></footer>`;
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
    <div class="coverage-note"><strong>Coverage matters.</strong> ${data.coverage_percent < 95 ? 'Unmatched sections are marked for manual review.' : 'Nearly all sampled route points matched mapped ways.'} This report cannot prove a route is legal.</div>
    <div class="route-tape" aria-label="Route evidence overview">${data.findings.map(finding => `<span class="${finding.severity}" title="${escapeHtml(finding.title)}"><b aria-hidden="true">${icon(finding.severity)}</b><small>${finding.start_km.toFixed(1)} km</small></span>`).join('')}</div>
    <div class="result-grid"><div><h3>Route findings <span>${data.findings.length}</span></h3><ol class="finding-list">${data.findings.map(findingItem).join('')}</ol></div>
    <aside class="evidence" aria-live="polite">${current ? `<p class="eyebrow">EVIDENCE / ${current.rule_id}</p><h3>${escapeHtml(current.title)}</h3><p>${escapeHtml(current.explanation)}</p><div class="tags" aria-label="OpenStreetMap tags">${tags || '<em>No access tags were returned.</em>'}</div>${current.osm_url ? `<a class="text-link" href="${current.osm_url}" target="_blank" rel="noreferrer">Inspect OSM way <span aria-hidden="true">↗</span></a>` : '<p class="muted">No OSM way link is available for this unmatched section.</p>'}` : ''}</aside></div>
    <div class="report-actions"><button class="secondary" id="export">Export review checklist (.csv)</button><button class="plain" id="start-over">Check another route</button></div>
    <details><summary>Rule sources and limitations</summary><p>Rule pack source date: ${data.rule_pack.source_date}. Rules interpret public OSM access tags; they do not replace signs, local orders, or current law.</p><ul>${data.rule_pack.sources.map(source => `<li><a href="${source.url}" rel="external">${escapeHtml(source.label)}</a></li>`).join('')}</ul><ul>${data.caveats.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul></details>
  </section>`;
}

function checker() {
  return `<section class="checker" id="checker" aria-labelledby="checker-title"><div class="section-number" aria-hidden="true">01</div><div class="checker-copy"><p class="eyebrow">PRE-RIDE ACCESS AUDIT</p><h2 id="checker-title">Put your planned line under review.</h2><p>Upload a GPX track. We match sampled points to nearby OpenStreetMap ways, then compare their tags with your vehicle and regional rule pack.</p></div>
  <form id="check-form"><div class="form-grid"><div class="field file-field"><span class="field-label">1 / Route file</span><label class="drop-zone" for="gpx-file"><input id="gpx-file" type="file" accept=".gpx,application/gpx+xml,application/xml,text/xml"/><span class="drop-mark" aria-hidden="true">＋</span><strong>${selectedFile ? escapeHtml(selectedFile.name) : sampleText ? 'Brussels sample route loaded' : 'Choose or drop a GPX file'}</strong><small>${selectedFile ? `${(selectedFile.size / 1024).toFixed(0)} KB · ready to inspect` : sampleText ? 'Built-in 0.5 km test track' : 'GPX track · up to 8 MB · never stored'}</small></label><button class="sample-button" type="button" id="sample">Use Brussels sample route</button></div>
  <div class="field"><label class="field-label" for="vehicle">2 / Vehicle</label><select id="vehicle" name="vehicle"><option value="bicycle">Bicycle</option><option value="ebike_25">E-bike (assist to 25 km/h)</option><option value="speed_pedelec">Speed pedelec (assist to 45 km/h)</option></select><p class="hint">Vehicle class changes which access tags are treated as evidence.</p></div>
  <div class="field"><label class="field-label" for="region">3 / Regional rule pack</label><select id="region" name="region"><option value="BE">Belgium · included</option><option value="NL" ${unlocked ? '' : 'disabled'}>Netherlands · maintained${unlocked ? '' : ' (unlock)'}</option><option value="DE" ${unlocked ? '' : 'disabled'}>Germany · maintained${unlocked ? '' : ' (unlock)'}</option></select><p class="hint">Sources are dated and linked in every report.</p></div></div>
  <div id="form-status" class="form-status" aria-live="assertive"></div><button class="primary" type="submit"><span>Check this route</span><span aria-hidden="true">→</span></button></form></section>`;
}

function paySection() {
  return `<section class="paid" id="rule-packs"><div><p class="eyebrow">MAINTAINED RULE PACKS / ONE-TIME</p><h2>Cross borders with a current field guide.</h2><p>The free Belgium audit stays complete. Unlock dated Netherlands and Germany interpretations, with future pack updates on this device.</p></div><div class="price"><span>€</span><strong>19</strong><small>one-time purchase</small></div><div class="paid-actions">${unlocked ? '<p class="unlocked"><span aria-hidden="true">✓</span> Maintained packs unlocked</p>' : `<a class="primary link-button" href="${BILLING}/products/${SLUG}/checkout">Unlock regional packs →</a>`}${licenseInactive ? '<p class="license-notice">Your saved license is no longer active.</p>' : ''}<button class="plain" id="restore">Have a license? Restore purchase</button><p>Sociobot/Dodo is the merchant of record. Refunds are handled there.</p></div></section>`;
}

function appPage() {
  return `<header class="site-header"><a class="wordmark" href="/">Cycle legal <span>//01</span></a><nav aria-label="Primary"><a href="#how">How it works</a><a href="#rule-packs">Rule packs</a></nav><a class="header-action" href="#checker">Check a route</a></header>
  <main id="main">${navigator.onLine ? '' : '<div class="offline" role="status"><strong>Offline.</strong> You can review this page, but a new map check needs a connection.</div>'}<section class="hero"><div class="hero-copy"><p class="eyebrow">ROUTE ACCESS / BEFORE DEPARTURE</p><h1>Your route has rules. <span>Surface them.</span></h1><p class="lede">Audit a GPX against bicycle, e-bike, and speed-pedelec access tags—before a closed path becomes a roadside surprise.</p><a class="primary link-button" href="#checker">Start a free check <span aria-hidden="true">↓</span></a><p class="disclaimer">Planning aid, not legal advice. Coverage is explicit, never implied.</p></div><figure class="hero-art"><img src="/assets/route-inspection-hero.webp" srcset="/assets/route-inspection-hero-mobile.webp 640w, /assets/route-inspection-hero.webp 960w" sizes="(max-width: 800px) 100vw, 58vw" width="960" height="640" alt="A folded route map embedded in concrete, with moss and an orange survey line marking uncertain access" fetchpriority="high" decoding="async"><figcaption><span>FIELD STUDY / 50.85°N</span><span>MAP EVIDENCE, NOT A VERDICT</span></figcaption></figure></section>
  ${result ? resultView(result) : checker()}
  <section class="method" id="how"><div class="section-number" aria-hidden="true">02</div><div><p class="eyebrow">METHOD / HONEST BY DESIGN</p><h2>Three layers of evidence, kept separate.</h2></div><ol><li><strong>Geometry</strong><span>We sample your track and calculate its length locally on the server.</span></li><li><strong>Map tags</strong><span>Nearby OSM ways provide access, bicycle, moped, and surface evidence.</span></li><li><strong>Rules</strong><span>A dated regional pack labels conflicts and uncertainty for your vehicle.</span></li></ol></section>
  ${paySection()}<section class="boundary"><p class="eyebrow">THE BOUNDARY OF THE TOOL</p><blockquote>“No conflict found” means no conflict in the mapped evidence we could match. It does not mean legal clearance.</blockquote></section></main>${footer()}`;
}

function render() {
  const path = location.pathname;
  document.querySelector<HTMLDivElement>('#app')!.innerHTML = path === '/privacy' ? legalPage('privacy') : path === '/terms' ? legalPage('terms') : appPage();
  bind();
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
  document.querySelector('#start-over')?.addEventListener('click', () => { result = null; selectedFinding = ''; render(); location.hash = 'checker'; });
  document.querySelectorAll<HTMLElement>('[data-finding]').forEach((button) => button.addEventListener('click', () => { selectedFinding = button.dataset.finding || ''; render(); document.querySelector<HTMLElement>(`[data-finding="${selectedFinding}"]`)?.focus(); }));
  document.querySelector('#restore')?.addEventListener('click', restore);
}

async function restore() {
  const token = prompt('Paste your Cycle Legal Check license token');
  if (!token?.trim()) return;
  localStorage.setItem(LICENSE_KEY, token.trim());
  const valid = await verifyLicense(token.trim());
  if (!valid) alert('That license could not be verified. Check the token and try again.');
}

async function submitCheck(event: Event) {
  event.preventDefault();
  const status = document.querySelector<HTMLElement>('#form-status')!;
  const fileText = sampleText || (selectedFile ? await selectedFile.text() : '');
  if (!fileText) { status.textContent = 'Choose a GPX file or load the sample route first.'; return; }
  if (selectedFile && selectedFile.size > 8 * 1024 * 1024) { status.textContent = 'That file is over 8 MB. Export a simpler track and try again.'; return; }
  status.innerHTML = '<span class="loader" aria-hidden="true"></span> Matching route points to mapped ways…';
  const form = event.currentTarget as HTMLFormElement;
  const vehicle = (form.elements.namedItem('vehicle') as HTMLSelectElement).value;
  const region = (form.elements.namedItem('region') as HTMLSelectElement).value;
  try {
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

consumeLicense();
render();
try {
  const token = localStorage.getItem(LICENSE_KEY);
  const cache = JSON.parse(localStorage.getItem(VERDICT_KEY) || '{}');
  if (token && (!cache.checked_at || Date.now() - cache.checked_at >= 86_400_000)) verifyLicense(token);
} catch { /* malformed local state stays locked */ }
if ('serviceWorker' in navigator) addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => undefined));
if (!sessionStorage.getItem('page-counted')) {
  sessionStorage.setItem('page-counted', '1');
  fetch('/api/page-view', { method: 'POST' }).catch(() => undefined);
}
addEventListener('popstate', render);
addEventListener('online', render);
addEventListener('offline', render);

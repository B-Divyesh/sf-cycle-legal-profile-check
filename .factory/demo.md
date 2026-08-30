# Demo sandbox

## Direct URL

Open `/demo` or `https://cycle-legal-profile-check.sociobot.in/demo`.

The page opens a complete Brussels canal report immediately. The sample uses a
five-point GPX track for a speed pedelec in Belgium. It contains one explicit
`speed_pedelec=no` finding and one unmapped review section. The report is
static client-side sample data, so it does not call `/api/analyze`, does not
call `/api/page-view`, and never reaches Overpass or billing.

## Isolation and reset

While `/demo` is open, the app does not read or write the real license keys
(`sb_license:cycle-legal-profile-check` and its verdict). It uses the separate
localStorage marker `demo:cycle-legal-profile-check:active` only; that marker
contains `1`, not a GPX, result, or token. The banner says **Demo — sample
data, nothing is saved**.

**Reset demo** clears that marker, recreates it, and restores the bundled
sample report. **Start for real** clears the marker before taking the visitor
to `/`. No demo content is copied to real storage.

## Offline behavior

After the first online visit, the service worker caches the application shell.
Reloading `/demo` offline retains the demo URL and renders the bundled report
with the Offline notice. The report is still sample data; a real GPX track check
requires a connection.

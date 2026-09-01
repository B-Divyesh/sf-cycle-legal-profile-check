# Cycle Legal Check — visual system

## Thesis: brutalist concrete and moss

The product should feel like a field inspection made legible: a rain-darkened concrete retaining wall, a route painted across it, and moss growing exactly where the rules become ambiguous. It is intentionally dense and practical, but not bureaucratic. Heavy borders and square corners give findings physical weight; moss green marks usable actions and signal, while survey orange is reserved for uncertainty and danger red for prohibited access.

This is a single-mode, light concrete treatment. Painting the background explicitly protects the material metaphor and avoids a second theme whose semantic colors would be harder to distinguish during a pre-ride safety check.

## Palette

| Token | Value | Use |
| --- | --- | --- |
| Concrete | `#e5e1d5` | page background |
| Chalk | `#f6f3e9` | work surfaces |
| Asphalt | `#171b18` | primary text / structural borders |
| Weathered | `#5b625d` | secondary text |
| Moss | `#365d3a` | primary action, clear state |
| Moss dark | `#244228` | hover / focus contrast |
| Survey orange | `#a94f12` | unknown and review state |
| Closure red | `#922f25` | prohibited state |
| Dust | `#cbc6b8` | dividers and inactive tracks |

All text and UI pairings meet WCAG AA (4.5:1 for body text, 3:1 for large text and controls). Findings always pair color with an icon, label, and plain-language sentence.

Keyboard focus uses a 4px asphalt ring on concrete and chalk, then switches to
a 4px chalk ring on moss and asphalt. Each ring exceeds 3:1 against its
adjacent surface; survey orange remains a finding color rather than a focus
color.

## Type

- Display: `Arial Black`, `Arial Narrow`, system sans-serif. Condensed, infrastructural, uppercase only for short labels.
- Body/data: `ui-monospace`, `SFMono-Regular`, Consolas, monospace. It reads like a field note and makes distances/tags scan cleanly with tabular numerals.
- No web-font payload or third-party request. Type steps: 16, 20, 32, and fluid 48–72px. Labels and supporting copy use weight and letter spacing—not undersized text—for hierarchy; visible text is never below 16px.

## Space and structure

An 8px base rhythm: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64. Desktop uses a 12-column survey grid with a narrow evidence rail. Mobile collapses to one column and drops ornamental coordinates, never route evidence. Corners stay at 0–2px; 2px borders and offset shadows resemble paper notices fixed to concrete. Independent findings are bounded; form controls group by proximity rather than being wrapped in decorative cards.

Touch targets are at least 44px, including inline OSM evidence and rule-source
links. Main content maxes at 1200px and readable prose at 68ch. The desktop
hero gives the report explanation seven grid columns so the three required
facts remain in a 1440×900 first viewport; the phone layout stays stacked.

## Interaction grammar

- The main action is a moss-green slab: **Check this route**.
- File drop zone behaves as a real labeled file input and accepts click, keyboard, or drop.
- Loading is a short, determinate-looking striped survey bar with an announced status.
- Results begin with one verdict, then a linear “route tape” showing where each evidence point occurs. Selecting a finding updates the detail panel without hiding the finding list.
- Paid regions are marked, not teased. The free Belgium pack is genuinely useful. Purchase and restore actions are quiet and never interrupt analysis.
- Errors state what happened and the next action. Offline state explains that cached app UI remains available but new checks need the local/server analysis endpoint.

## Motion

Panels settle upward 8px over 180ms; route-tape markers scale once when results arrive; control state changes use 150ms opacity/transform. There is no ambient or looping motion. Under `prefers-reduced-motion: reduce`, transforms and smooth scrolling are removed and state changes are immediate opacity cuts.

## Original asset plan and provenance

Hero asset: an editorial top-down still life of a folded cycling route map partially embedded in rough concrete, crossed by a fluorescent orange survey line and edged with living moss. It communicates route evidence and uncertain boundaries without pretending to show the live analyzer.

Prompt sheet:

> Use case: stylized-concept. Asset type: wide landing-page hero illustration. Primary request: an editorial top-down still life of a folded cycling route map partially embedded in rough brutalist concrete, with a single cycling route traced as tactile dark graphite and one fluorescent survey-orange interruption, living moss following ambiguous path edges. Scene/backdrop: weathered infrastructure inspection table, no horizon. Style/medium: high-detail tactile paper-and-concrete assemblage, restrained architectural editorial photography. Composition/framing: wide landscape, route entering lower left and exiting upper right, calm negative space at upper left, no people. Lighting/mood: overcast northern European daylight, sober and investigative, soft hard-edged shadows. Color palette: chalk, wet concrete, asphalt black, deep moss green, one survey orange accent. Materials/textures: aggregate, paper fibers, graphite, damp moss. Constraints: realistic object geometry; no interfaces; no signs. Avoid: text, letters, numbers, logos, watermark, bicycles, helmets, hands, generic neon gradients, glossy 3D, fantasy scenery.

Generated with the factory Azure image deployment (`factory-image`) on 2026-08-28 via `/opt/fleet/lib/gen-image.sh`. Original output and prompt sidecar are retained in `assets/src/`. Exported WebP is a project-original generated asset; no third-party source material.

All functional icons and the route tape are hand-authored CSS/SVG primitives, original to this product.

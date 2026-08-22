# Changelog

All notable changes to this project are documented in this file. The format is
based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this
project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-08-19

The library is renamed and rebuilt around the Kerusi Seat Map & Availability
Format. `KerusiMap` and `KerusiState` are now the renderer's primary input
rather than something adapted into a grid model.

The unreleased 0.2 work described in the previous edition of this file is
folded into this release.

### Breaking

1. **The package is renamed** `ngx-keruc-seatpicker` → `ngx-kerusi-seatmap`.
   The repository moved to `github.com/ShadAhm/ngx-kerusi-seatmap` (GitHub
   redirects the old URL), and the demo now lives at
   `shadahm.github.io/ngx-kerusi-seatmap/`.

2. **The Angular prefix is `kerusi`, not `keruc`.** `<keruc-seatpicker>` is now
   `<kerusi-seatpicker>`, and the CSS classes `.keruc-seat` / `.keruc-element`
   are now `.kerusi-seat` / `.kerusi-element`. Stylesheets targeting the old
   class names need updating.

3. **`Section.layout` is a validated constraint, not a rendering hint.** The
   standard's strict-layout revision requires a conformant validator to enforce
   it at v1.0, so documents that previously adapted are now rejected:

   - a `grid` section whose seats carry `x` or `y`;
   - a `grid` section with a seat lacking `col` (it is never inferred from array
     order);
   - a `freeform` section whose seats carry `col`, or lack `x` or `y`;
   - a `mixed` section whose seats lack any of `col`, `x`, `y`;
   - a section omitting `layout` whose seats mix positioning methods, so no mode
     can be inferred.

   Layout is no longer inferred as "any seat has `x`/`y` ⇒ freeform".

4. **The `kerusi` member's value is checked.** A document declaring a major
   version other than `1` is rejected (`map-version-unsupported`). A future
   `1.x` minor is still accepted, per §7.

5. **`Element.id` and `Element.kind` are enforced.** Both are REQUIRED by §4.4
   and were previously unchecked.

6. **Seat and section ids must be unique.** Seat ids are globally unique within
   a map (§4.3); section ids and per-section element ids are unique too.

7. **`KerusiValidationError` gains a fourth constructor argument**,
   `violations`, carrying every finding from the same pass. The thrown error is
   still the first in document order, but a document with several faults may now
   report a newly added rule ahead of one that existed before.

### Added

**The Kerusi-native renderer**

- `<kerusi-seatmap>` (`KerusiSeatmapComponent`) takes `[map]`, `[state]` and
  `[session]` directly. Each `Section` renders as its own `<svg>` with its own
  layout mode, aspect ratio and `<h3>` heading, so a multi-section venue is
  structure rather than one continuous run of rows, and a freeform orchestra can
  sit above a grid balcony in the same map.
- Selection is immutable: `[(selection)]` is a list of seat ids, and nothing on
  the seat is mutated. With `companionMode: 'auto'` (the default) a seat's whole
  companion closure selects and deselects as one unit, `maxSelection` counts the
  closure, and a pair whose other half is unavailable is refused with
  `reason: 'companion-unavailable'`.
- The document now drives the picture: `SeatType.color` colours an available
  seat (with a contrast-correct label), `Element.kind` chooses a shape, prices
  render, and grid-addressed elements finally appear — the pre-1.0 renderer drew
  elements only in freeform sections.
- Rich events: `seatSelect`, `seatDeselect`, `seatDisallowed` (with a typed
  reason), `seatFocus`, `validationIssues`.
- `<kerusi-legend>` (`KerusiLegendComponent`), opt-in via `[showLegend]`. It
  resolves swatches through the same path as the seat fills, so the two cannot
  drift apart.

**Accessibility**, previously absent entirely

- Every seat is a `role="button"` with a per-section roving tabindex — Tab moves
  between sections, arrows move within.
- Arrow keys follow the §4.3.1 `col` order, including in `mixed` sections, so an
  aisle (a column no seat occupies) is stepped across rather than into.
  `Home`/`End`, `Ctrl+Home`/`Ctrl+End`, `PageUp`/`PageDown`, `Enter`/`Space` and
  `Escape` all work.
- Each seat announces its position, type, price, availability, hold expiry,
  attributes and every `Seat.accessibility` property. A polite live region
  reports the running selection and any disallowed reason.
- Right-to-left rendering derived from the locale, mirroring layout and arrow
  direction while leaving `col` order intact.
- `[ariaStrings]` makes every announced phrase translatable.

**Format support**

- `Seat.accessibility` (§4.3.4): `wheelchairAccessible`, `transferArmrest`,
  `aisleChairCompatible`, `companionRequired`.
- Non-throwing validation: `checkKerusiMap`, `checkKerusiState`,
  `checkKerusiStateDelta`, `checkKerusiSession` return every violation with a
  rule slug, a `severity` and a document path. `validateKerusiSession` and
  `validateDocumentSet` are new; `validateDocumentSet` checks the map, session
  and state actually reference each other.
- Localization: `resolveLocalizedText` walks the BCP-47 chain for
  `Section.label` and `SeatType.label`; `resolveMapLocale`, `formatMoney`,
  `toMajorUnits`, `minorUnitDigits`, `sumMoney`.
- `KerusiStateStore` for live availability: `applyStateDeltaOrdered` discards
  stale, duplicate and out-of-scope deltas, `expireHolds` reverts a lapsed hold,
  and `needsRefetch` flags a detected gap. `[expireHolds]` wires the same
  behaviour into the component.
- A pure, framework-free render layer: `buildRenderModel`,
  `computeSectionLayout`, `buildNavigationGraph`, `elementStyle`,
  `summarizeSelection`. Nothing under `kerusi/` or `render/` imports
  `@angular/core`.

### Fixed

- **A section no longer stretches to fill a fixed canvas.** Sections are sized
  intrinsically and capped at their natural width, so a wide auditorium is not
  squashed and a four-tier theatre does not draw box seats several times the
  size of orchestra seats.
- **`formatMoney` reads the currency's minor-unit exponent** instead of dividing
  by 100, which rendered JPY 100× too small and KWD 10× too large.
- Element ids now survive into the render model.
- `CSS.escape` is no longer used to locate a seat node — it is undefined in
  jsdom and under SSR.

## [0.1.0] - 2026-08-16

First release as a modern Angular library, superseding the never-released
AngularJS 1.x directive.

### Added

- Standalone, signal-based `SeatPickerComponent` that renders a seat map as
  inline SVG.
- Typed data model: `NodeType`, `SeatState`, `SeatNode`, `SeatRow`, and
  `SeatPickerColors`.
- Inputs `rows`, `canvasWidth`, `canvasHeight`, and `colors`.
- Outputs `selected`, `deselected`, and `disallowedSelected`.
- Demo app deployed to GitHub Pages.

### Fixed

Carried over from the legacy directive:

- `canvasWidth` / `canvasHeight` now drive the rendered SVG dimensions (were
  hardcoded to 500×500).
- Clicking an occupied seat now emits `disallowedSelected` instead of silently
  doing nothing.
- Rendering is per-instance (no global element id lookup), so multiple pickers
  can coexist on one page.

[1.0.0]: https://github.com/ShadAhm/ngx-kerusi-seatmap/releases/tag/v1.0.0
[0.1.0]: https://github.com/ShadAhm/ngx-kerusi-seatmap/releases/tag/v0.1.0

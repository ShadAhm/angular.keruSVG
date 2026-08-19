# Changelog

All notable changes to this project are documented in this file. The format is
based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this
project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Freeform rendering: the component now draws curved rows via per-seat `x`/`y`/
  `rotation` and a new `layout: 'freeform'` mode, with `aspectRatio` and
  `seatSize` inputs. Grid mode remains the default and unchanged.
- `SeatElement` model and an `elements` input to render non-bookable features
  (screens, stages) on the map.
- `SeatState.Held` and `SeatState.Blocked` as distinct, non-selectable states
  with their own colors (`heldColour*`, `blockedColour*`, `elementColour*`). The
  Kerusi adapter now maps `held → Held` and `blocked → Blocked` by default
  (previously both collapsed to `Occupied`).
- Kerusi Seat Map & Availability Format support (additive; the existing
  `rows`/`SeatRow[]` API is unchanged). See `docs/kerusi.md`.
  - `adaptKerusiMap` additionally returns `elements`, `layout`, and
    `aspectRatio`, and preserves freeform coordinates instead of flattening.
  - Types for `KerusiMap`, `Section`, `RowMeta`, `Seat`, `Element`, `SeatType`,
    `PriceTier`, `Money`, `KerusiState`, `SeatStatus`, `KerusiStateDelta`, and
    `KerusiSession`.
  - `validateKerusiMap` / `validateKerusiState` / `validateKerusiStateDelta`
    enforcing the standard's MUST-level rules (referential integrity, companion
    symmetry, seat positioning, single currency, `sessionId`/`mapId` scope),
    throwing a `KerusiValidationError` that names the failing rule and id.
  - `adaptKerusiMap` / `kerusiToRows` adapting a `KerusiMap` (+ `KerusiState`)
    into the component's `SeatRow[]`, plus `resolveSeatPrice` and
    `applyStateDelta`. The status mapping is overridable via
    `AdapterOptions.statusMapping`.

### Fixed

- Adapting a section that declares `layout: "grid"` while its seats carry only
  `x`/`y` no longer sorts on `undefined`; those seats keep their declaration
  order and synthesize no aisle spacers.

## [0.1.0] - 2026-08-16

First release as a modern Angular library, superseding the never-released
AngularJS 1.x directive (kept in `legacy/`).

### Added

- Standalone, signal-based `SeatPickerComponent` (`<kerusi-seatpicker>`) that
  renders a seat map as inline SVG.
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

[0.1.0]: https://github.com/ShadAhm/ngx-kerusi-seatmap/releases/tag/v0.1.0

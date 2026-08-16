# Changelog

All notable changes to this project are documented in this file. The format is
based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this
project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-08-16

First release as a modern Angular library, superseding the never-released
AngularJS 1.x directive (kept in `legacy/`).

### Added

- Standalone, signal-based `SeatPickerComponent` (`<keruc-seatpicker>`) that
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

[0.1.0]: https://github.com/ShadAhm/angular.keruSVG/releases/tag/v0.1.0

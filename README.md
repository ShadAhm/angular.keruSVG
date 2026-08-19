# ngx-kerusi-seatmap

[![CI](https://github.com/ShadAhm/ngx-kerusi-seatmap/actions/workflows/ci.yml/badge.svg)](https://github.com/ShadAhm/ngx-kerusi-seatmap/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/ngx-kerusi-seatmap.svg)](https://www.npmjs.com/package/ngx-kerusi-seatmap)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

An interactive **seat picker** for Angular, rendered as inline SVG. Give it rows
of seats and it draws a clickable seat map with vacant / occupied / selected
states and selection events.

Originally a small AngularJS 1.x directive (since revived as a modern,
standalone Angular library and published to npm as
[`ngx-kerusi-seatmap`](https://www.npmjs.com/package/ngx-kerusi-seatmap)).

**[Live demo →](https://shadahm.github.io/ngx-kerusi-seatmap/)**

## Install

```bash
npm install ngx-kerusi-seatmap
```

## Quick start

```ts
import { SeatPickerComponent, NodeType, SeatState, SeatRow } from 'ngx-kerusi-seatmap';

// in a standalone component:
imports: [SeatPickerComponent];
```

```html
<kerusi-seatpicker
  [rows]="rows"
  (selected)="onSelected($event)"
  (deselected)="onDeselected($event)"
  (disallowedSelected)="onDisallowed($event)"
/>
```

See the [library README](projects/ngx-kerusi-seatmap/README.md) for the full API (inputs,
outputs, data model, and color configuration).

It can also consume the vendor-neutral **Kerusi Seat Map & Availability Format**
(a `KerusiMap` + `KerusiState` pair) via a validating adapter — see
[docs/kerusi.md](docs/kerusi.md), with a feature-by-feature audit in [docs/kerusi-conformance.md](docs/kerusi-conformance.md).

## Repository layout

| Path                        | What it is                                                |
| --------------------------- | --------------------------------------------------------- |
| `projects/ngx-kerusi-seatmap/`         | The publishable library (`ngx-kerusi-seatmap`).         |
| `projects/demo/`            | Demo app, deployed to GitHub Pages.                       |
| `legacy/original-angularjs-directive.js` | The original AngularJS 1.x directive, kept for reference. |

## Develop

```bash
npm install
npm start          # serve the demo at http://localhost:4200
npm run test:ci    # run library + demo unit tests
npm run build:lib  # build the library into dist/ngx-kerusi-seatmap
```

## Publishing

Releases are cut manually (CI never publishes to npm):

1. Bump `version` in `projects/ngx-kerusi-seatmap/package.json` and add a `CHANGELOG.md` entry.
2. `npm run build:lib`
3. `cd dist/ngx-kerusi-seatmap && npm publish --access public` (add `--dry-run` first to inspect contents).
4. `git tag vX.Y.Z && git push --tags`, then cut a GitHub Release from the tag.

## License

MIT © Arshad Ahmad

# angular.keruSVG

[![CI](https://github.com/ShadAhm/angular.keruSVG/actions/workflows/ci.yml/badge.svg)](https://github.com/ShadAhm/angular.keruSVG/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/ngx-keruc-seatpicker.svg)](https://www.npmjs.com/package/ngx-keruc-seatpicker)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

An interactive **seat picker** for Angular, rendered as inline SVG. Give it rows
of seats and it draws a clickable seat map with vacant / occupied / selected
states and selection events.

Originally a small AngularJS 1.x directive (since revived as a modern,
standalone Angular library and published to npm as
[`ngx-keruc-seatpicker`](https://www.npmjs.com/package/ngx-keruc-seatpicker)).

**[Live demo →](https://shadahm.github.io/angular.keruSVG/)**

## Install

```bash
npm install ngx-keruc-seatpicker
```

## Quick start

```ts
import { SeatPickerComponent, NodeType, SeatState, SeatRow } from 'ngx-keruc-seatpicker';

// in a standalone component:
imports: [SeatPickerComponent]
```

```html
<keruc-seatpicker
  [rows]="rows"
  (selected)="onSelected($event)"
  (deselected)="onDeselected($event)"
  (disallowedSelected)="onDisallowed($event)"
/>
```

See the [library README](projects/kerusvg/README.md) for the full API (inputs,
outputs, data model, and color configuration).

## Repository layout

| Path | What it is |
| --- | --- |
| `projects/kerusvg/` | The publishable library (`ngx-keruc-seatpicker`). |
| `projects/demo/` | Demo app, deployed to GitHub Pages. |
| `legacy/angular.keruSVG.js` | The original AngularJS 1.x directive, kept for reference. |

## Develop

```bash
npm install
npm start          # serve the demo at http://localhost:4200
npm run test:ci    # run library + demo unit tests
npm run build:lib  # build the library into dist/ngx-keruc-seatpicker
```

## Publishing

Releases are cut manually (CI never publishes to npm):

1. Bump `version` in `projects/kerusvg/package.json` and add a `CHANGELOG.md` entry.
2. `npm run build:lib`
3. `cd dist/ngx-keruc-seatpicker && npm publish --access public` (add `--dry-run` first to inspect contents).
4. `git tag vX.Y.Z && git push --tags`, then cut a GitHub Release from the tag.

## License

MIT © Arshad Ahmad

# ngx-kerusi-seatmap

An Angular seat map that renders [Kerusi](https://github.com/ShadAhm/kerusi)
documents as interactive, accessible inline SVG.

```bash
npm install ngx-kerusi-seatmap
```

Requires Angular 22+. Standalone, signal-based, zoneless-friendly, no runtime
dependencies beyond `tslib`.

---

## `<kerusi-seatmap>`

```ts
import { KerusiSeatmapComponent } from 'ngx-kerusi-seatmap';

@Component({ imports: [KerusiSeatmapComponent], /* ... */ })
```

```html
<kerusi-seatmap
  [map]="map"
  [state]="state"
  [(selection)]="picked"
  [showLegend]="true"
  (seatDisallowed)="explain($event)"
/>
```

### Inputs

**Documents**

| Input     | Type            | Default    |                                                                             |
| --------- | --------------- | ---------- | --------------------------------------------------------------------------- |
| `map`     | `KerusiMap`     | _required_ | The static venue layout.                                                    |
| `state`   | `KerusiState`   | —          | Live availability. Merged by `Seat.id`; an absent seat is available (§5.1). |
| `session` | `KerusiSession` | —          | The optional map↔event join (§5.3). Validated against the map and state.    |

**Selection**

| Input                | Type                            | Default         |                                                                                 |
| -------------------- | ------------------------------- | --------------- | ------------------------------------------------------------------------------- |
| `selection`          | `readonly string[]`             | `[]`            | Selected seat ids. Two-way — `[(selection)]` — or read-only with `[selection]`. |
| `selectableStatuses` | `SeatRenderStatus[]`            | `['available']` | Which statuses a seat may be picked in.                                         |
| `companionMode`      | `'auto' \| 'independent'`       | `'auto'`        | `auto` selects a seat's whole companion closure together (§4.6).                |
| `maxSelection`       | `number`                        | —               | Cap on selected seats. Counts a companion closure as its full size.             |
| `seatSelectable`     | `(seat: RenderSeat) => boolean` | —               | A final say, applied after the status test.                                     |
| `interactive`        | `boolean`                       | `true`          | `false` renders read-only.                                                      |

**Appearance**

| Input                             | Type                  | Default          |                                                                                                                                 |
| --------------------------------- | --------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `colors`                          | `KerusiSeatmapColors` | theme defaults   | Per-status fills, element tones, focus ring, backdrop.                                                                          |
| `typeColors`                      | `boolean`             | `true`           | Let an available seat take its `SeatType.color` (§4.7).                                                                         |
| `seatSize`                        | `number`              | `28`             | Grid cell edge, in viewBox units.                                                                                               |
| `seatGap`                         | `number`              | `6`              | Gap between grid cells.                                                                                                         |
| `freeformBasis`                   | `number`              | `1000`           | Freeform viewBox width; height follows the aspect ratio.                                                                        |
| `unitScale`                       | `number`              | `1`              | CSS pixels per viewBox unit. Caps each section at its natural size so a narrow section and a wide one draw seats the same size. |
| `showSectionLabels`               | `boolean`             | `true`           |                                                                                                                                 |
| `showLegend` / `showLegendPrices` | `boolean`             | `false` / `true` |                                                                                                                                 |

**Sections**

| Input              | Type                                   |                                                                     |
| ------------------ | -------------------------------------- | ------------------------------------------------------------------- |
| `sectionIds`       | `readonly string[]`                    | Render only these, in this order. Default: all, by `Section.index`. |
| `sectionOverrides` | `Record<string, SectionRenderOptions>` | Per-section `hidden`, `aspectRatio`, `seatSize`, `label`.           |

**Localization, validation, lifecycle**

| Input              | Type                            | Default                      |                                                                        |
| ------------------ | ------------------------------- | ---------------------------- | ---------------------------------------------------------------------- |
| `locale`           | `string`                        | `KerusiMap.locale` ?? `'en'` | BCP-47. Resolves `Section.label` / `SeatType.label` locale maps.       |
| `rtl`              | `boolean \| 'auto'`             | `'auto'`                     | Mirrors layout and arrow direction. `auto` derives it from the locale. |
| `ariaStrings`      | `SeatAriaStrings`               | English                      | Every announced phrase, for translation.                               |
| `validate`         | `'collect' \| 'throw' \| 'off'` | `'collect'`                  | `collect` reports through `validationIssues` and renders anyway.       |
| `expireHolds`      | `boolean`                       | `false`                      | Revert a lapsed `holdExpires` to available on a ticker.                |
| `expiryIntervalMs` | `number`                        | `1000`                       |                                                                        |

### Outputs

| Output                        | Payload                      |                                                                                                        |
| ----------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------ |
| `selectionChange`             | `readonly string[]`          | From the `selection` model.                                                                            |
| `seatSelect` / `seatDeselect` | `SeatInteraction`            | The `RenderSeat`, the resulting selection, and every seat that changed (companions included).          |
| `seatDisallowed`              | `SeatDisallowed`             | `reason` is `booked`, `held`, `blocked`, `not-selectable`, `max-selection` or `companion-unavailable`. |
| `seatFocus`                   | `RenderSeat`                 |                                                                                                        |
| `validationIssues`            | `readonly KerusiViolation[]` | Emitted whenever the documents change.                                                                 |

### Keyboard

Tab moves between sections; each section keeps its own tab stop. Within a
section, arrow keys follow the §4.3.1 `col` order — so an aisle, which is a
column no seat occupies, is stepped across rather than into.

| Key                      |                                    |
| ------------------------ | ---------------------------------- |
| `←` `→`                  | Previous / next seat in the row    |
| `↑` `↓`                  | Nearest column in the adjacent row |
| `Home` / `End`           | First / last seat of the row       |
| `Ctrl+Home` / `Ctrl+End` | First / last seat of the section   |
| `PageUp` / `PageDown`    | First / last seat of the section   |
| `Enter` / `Space`        | Toggle                             |
| `Escape`                 | Clear the selection                |

Each seat is a `role="button"` announcing its position, type, price, status,
every `Seat.accessibility` property and its attributes. A polite live region
reports the running selection and any disallowed reason.

---

## `<kerusi-legend>`

Rendered inline by `[showLegend]="true"`, or placed anywhere yourself:

```html
<kerusi-legend [legend]="model.legend" [locale]="'ms'" [showPrices]="true" />
```

It resolves swatches through the same path as the seat fills, so the two cannot
drift apart.

---

## Working with the format directly

Everything under `kerusi/` and `render/` is pure — no Angular import — so it can
run in a test, a build step or on a server.

```ts
import {
  buildRenderModel, // KerusiMap + KerusiState -> the resolved render model
  checkKerusiMap, // every violation, no throw
  validateKerusiMap, // throws on the first error
  validateDocumentSet, // map / session / state joins
  resolveSeatPrice, // the §4.9 precedence order
  resolveLocalizedText, // string | Record<string, string> -> string
  formatMoney, // minor units -> "RM 45.00", "¥1,200", "KD 12.500"
  summarizeSelection, // seats, total, unpriced count
  computeSectionLayout, // placed geometry for one section
  buildNavigationGraph, // per-seat keyboard neighbours
} from 'ngx-kerusi-seatmap';
```

### Validation

`checkKerusiMap` returns every violation in document order without throwing;
`validateKerusiMap` throws a `KerusiValidationError` carrying the first error
and the full list. Each violation has a stable `rule` slug, a `severity`
(`error` blocks conformance, `warning` is advisory) and a document `path`.

```ts
for (const v of checkKerusiMap(map)) {
  console.warn(`${v.severity} ${v.rule} at ${v.path}: ${v.message}`);
}
```

### Live availability

```ts
import { KerusiStateStore } from 'ngx-kerusi-seatmap';

const store = new KerusiStateStore(initialState);
socket.onmessage = (e) => {
  const result = store.apply(JSON.parse(e.data));
  if (result.outcome === 'gap') refetch(); // store.needsRefetch() is now true
};
const stop = store.startExpiryTicker();
```

Deltas that are stale, duplicate or scoped to another session are discarded.

> **Gap detection needs a sequence.** §5.2 requires `updatedAt` to be strictly
> increasing but not contiguous, so it cannot by itself distinguish "a delta was
> lost" from "nothing happened for a while". The store detects gaps when the
> transport supplies a monotonic sequence — `metadata.seq` by default, or your
> own `sequenceOf` reader. A gapped delta is still applied, so the map degrades
> rather than freezes while you re-fetch.

---

MIT © Arshad Ahmad

# Kerusi format support

`ngx-kerusi-seatmap` can consume a [**Kerusi Seat Map & Availability
Format**](https://github.com/ShadAhm/ngx-kerusi-seatmap) document pair — a static
`KerusiMap` (layout, seat types, pricing) plus a live `KerusiState`
(availability) — and render it through the existing `<kerusi-seatpicker>`
component with no renderer changes. This is an **additive** entry point; the
native `rows`/`SeatRow[]` API is unchanged.

Kerusi is a vendor-neutral, domain-agnostic JSON format (cinema, flight, bus,
theatre, stadium…). This page shows the minimal wiring; see the full standard
for the normative rules.

## Feed a map + state into the component

The adapter turns a `KerusiMap` (+ optional `KerusiState`) into the `SeatRow[]`
the component already accepts:

```ts
import { Component, signal } from '@angular/core';
import {
  SeatPickerComponent,
  kerusiToRows,
  type KerusiMap,
  type KerusiState,
} from 'ngx-kerusi-seatmap';

const map: KerusiMap = {
  kerusi: '1.0',
  id: 'bus-42',
  domain: 'bus',
  legend: [{ id: 'standard', label: 'Standard' }],
  sections: [
    {
      id: 'main',
      seats: [
        { id: '1A', row: '1', col: 1, type: 'standard' },
        { id: '1B', row: '1', col: 2, type: 'standard' },
        // col 3 is omitted — that gap is the aisle (no filler node needed)
        { id: '1C', row: '1', col: 4, type: 'standard' },
        { id: '1D', row: '1', col: 5, type: 'standard' },
      ],
    },
  ],
};

const state: KerusiState = {
  kerusi: '1.0',
  mapId: 'bus-42',
  updatedAt: '2026-08-17T09:14:00Z',
  seats: { '1A': { status: 'booked' } }, // everything else defaults to available
};

@Component({
  selector: 'app-bus',
  imports: [SeatPickerComponent],
  template: `<kerusi-seatpicker [rows]="rows()" />`,
})
export class BusComponent {
  // one line: adapt the Kerusi pair to the component's rows
  readonly rows = signal(kerusiToRows(map, state));
}
```

`kerusiToRows` **validates** the map first (referential integrity, companion
symmetry, single currency, seat positioning — spec §4.6/§4.9/§4.3.1) and throws
a `KerusiValidationError` naming the failing rule and seat id if the document is
malformed.

## Getting the richer per-seat data

The flat `SeatNode` the grid renders can only carry `uniqueName`,
`displayName`, and selection state. When you also need companions, resolved
price, attributes, or the originating section, use `adaptKerusiMap`, which
returns both the rows and a parallel `AdaptedSeat[]`:

```ts
import { adaptKerusiMap } from 'ngx-kerusi-seatmap';

const { rows, seats } = adaptKerusiMap(map, state);
const seat = seats.find((s) => s.id === 'L1');
seat?.companions; // ['L2']  — couple/sofa links survive the adapter
seat?.price; // { amount: 4500, currency: 'MYR' } — resolved per §4.9
```

Other exports: `resolveSeatPrice(seat, map)` (price resolution on its own),
`validateKerusiMap` / `validateKerusiState` / `validateKerusiStateDelta`, and
`applyStateDelta(base, delta)` for merging incremental `KerusiStateDelta`
updates onto a held `KerusiState`.

## Freeform layouts, screen elements, and availability states

Freeform (`x`/`y`) sections are rendered natively — curved rows, per-seat
`rotation`, and non-bookable `Element`s (screens, stages) are all drawn. The
adapter surfaces everything the component needs, so binding it is mechanical:

```ts
const { rows, elements, layout, aspectRatio } = adaptKerusiMap(map, state);
```

```html
<kerusi-seatpicker
  [rows]="rows"
  [elements]="elements"
  [layout]="layout"
  [aspectRatio]="aspectRatio"
  [canvasWidth]="640"
  [canvasHeight]="400"
/>
```

`layout` is `'freeform'` when the map uses `x`/`y` positioning (§4.5) and
`'grid'` otherwise. `aspectRatio` keeps freeform percentages and rotation
undistorted on a non-square canvas.

Availability maps to distinct states by default: `booked → Occupied`,
`held → Held`, `blocked → Blocked`, and `available`/absent → `Vacant`. Held and
Blocked render in their own colors and are non-selectable. Override the mapping
when you want to collapse or remap them:

```ts
import { SeatState } from 'ngx-kerusi-seatmap';

kerusiToRows(map, state, {
  statusMapping: (s) => (s === 'booked' ? SeatState.Occupied : SeatState.Vacant),
});
```

### Remaining edges

- A single map that mixes grid and freeform sections renders as `freeform`
  (the result carries one `layout`); render such sections separately with the
  `sectionId` option if you need each in its own mode.
- All `Element` kinds share one visual style (a labelled rounded rect); the
  renderer does not draw kind-specific shapes.

## Reference

Full normative specification: the **Kerusi Seat Map & Availability Format**
(v1.0.0-draft). The five worked examples used as tests here correspond to spec
§6.1–§6.5.

For a feature-by-feature audit of what this library supports, partially
supports, and does not implement, see
[the Kerusi conformance report](kerusi-conformance.md).

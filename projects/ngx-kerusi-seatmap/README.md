# ngx-kerusi-seatmap

An Angular seat-picker component that renders an interactive seat map as inline
SVG. Standalone, signal-based, and dependency-free beyond Angular itself.

## Install

```bash
npm install ngx-kerusi-seatmap
```

Requires Angular 22+ (`@angular/core` and `@angular/common` as peer dependencies).

## Usage

```ts
import { Component, signal } from '@angular/core';
import { NodeType, SeatNode, SeatRow, SeatState, SeatPickerComponent } from 'ngx-kerusi-seatmap';

@Component({
  selector: 'app-booking',
  imports: [SeatPickerComponent],
  template: `
    <kerusi-seatpicker
      [rows]="rows()"
      [canvasWidth]="560"
      [canvasHeight]="560"
      (selected)="onSelected($event)"
      (deselected)="onDeselected($event)"
      (disallowedSelected)="onDisallowed($event)"
    />
  `,
})
export class BookingComponent {
  readonly rows = signal<SeatRow[]>([
    {
      rowName: 'A',
      nodes: [
        { type: NodeType.Seat, uniqueName: 'A1', displayName: 'A1', selected: SeatState.Vacant },
        { type: NodeType.Seat, uniqueName: 'A2', displayName: 'A2', selected: SeatState.Occupied },
        { type: NodeType.Spacer },
        { type: NodeType.Seat, uniqueName: 'A4', displayName: 'A4', selected: SeatState.Vacant },
      ],
    },
  ]);

  onSelected(seat: SeatNode) {}
  onDeselected(seat: SeatNode) {}
  onDisallowed(seat: SeatNode) {}
}
```

## Data model

| Type          | Values                                                                  |
| ------------- | ----------------------------------------------------------------------- |
| `NodeType`    | `Spacer = 0`, `Seat = 1`                                                |
| `SeatState`   | `Vacant = 0`, `Occupied = 1`, `Selected = 2`, `Held = 3`, `Blocked = 4` |
| `SeatNode`    | `{ type, uniqueName?, displayName?, selected?, x?, y?, rotation? }`     |
| `SeatRow`     | `{ rowName?, nodes: SeatNode[] }`                                       |
| `SeatElement` | `{ kind, label?, x?, y?, width?, height?, rotation? }`                  |

`Spacer` nodes reserve grid space (aisles/gaps) and render nothing. `Held` and
`Blocked` are non-selectable states with their own colors. `x`/`y`/`rotation`
(percent / degrees) and `SeatElement`s are used only in `freeform` layout.

## Inputs

| Input             | Type                   | Default   | Description                                                      |
| ----------------- | ---------------------- | --------- | ---------------------------------------------------------------- |
| `rows` (required) | `SeatRow[]`            | —         | The rows and nodes to render.                                    |
| `canvasWidth`     | `number`               | `500`     | SVG width in px.                                                 |
| `canvasHeight`    | `number`               | `500`     | SVG height in px.                                                |
| `colors`          | `SeatPickerColors`     | see below | Per-state fill/text colors; provided keys override the defaults. |
| `elements`        | `SeatElement[]`        | `[]`      | Non-bookable features (screens, stages) drawn in freeform mode.  |
| `layout`          | `'grid' \| 'freeform'` | `'grid'`  | Rendering mode: grid geometry, or x/y freeform placement.        |
| `aspectRatio`     | `string`               | `'1:1'`   | Canvas proportions ("w:h") for freeform coordinates.             |
| `seatSize`        | `number`               | derived   | Fixed seat square size (px) for freeform; derived when omitted.  |

`SeatPickerColors` keys: `vacantColourBg`, `vacantColourFg`, `occupiedColourBg`,
`occupiedColourFg`, `selectedColourBg`, `selectedColourFg`, `heldColourBg`,
`heldColourFg`, `blockedColourBg`, `blockedColourFg`, `elementColourBg`,
`elementColourFg`, `backDropColour`.

## Outputs

| Output               | Payload    | Fires when                                                                  |
| -------------------- | ---------- | --------------------------------------------------------------------------- |
| `selected`           | `SeatNode` | A vacant seat is clicked (becomes selected).                                |
| `deselected`         | `SeatNode` | A selected seat is clicked (becomes vacant).                                |
| `disallowedSelected` | `SeatNode` | A non-selectable seat (Occupied/Held/Blocked) is clicked (no state change). |

Selection state is stored on the `SeatNode` objects you pass in and toggled in
place, so the array you bind stays the source of truth.

## Kerusi format support

This library can also consume a [**Kerusi Seat Map & Availability
Format**](../../docs/kerusi.md) document pair — a static `KerusiMap` plus a live
`KerusiState` — and render it through the same component:

```ts
import { SeatPickerComponent, kerusiToRows } from 'ngx-kerusi-seatmap';

// map + state are Kerusi documents; rows binds straight to <kerusi-seatpicker>
readonly rows = signal(kerusiToRows(map, state));
```

`kerusiToRows` validates the map (referential integrity, companion symmetry,
single currency) and adapts it to the `SeatRow[]` above. `adaptKerusiMap` also
returns resolved price and companion links per seat, plus `elements`, `layout`,
and `aspectRatio` for freeform maps — so curved rows and screen elements render
natively, and `held`/`blocked` map to their own states. This is additive — the
`rows` API shown earlier is unchanged. See [docs/kerusi.md](../../docs/kerusi.md)
for the full guide, and [the conformance report](../../docs/kerusi-conformance.md) for what is and is not implemented.

## License

MIT

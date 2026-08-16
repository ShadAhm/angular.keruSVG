# ngx-keruc-seatpicker

An Angular seat-picker component that renders an interactive seat map as inline
SVG. Standalone, signal-based, and dependency-free beyond Angular itself.

## Install

```bash
npm install ngx-keruc-seatpicker
```

Requires Angular 22+ (`@angular/core` and `@angular/common` as peer dependencies).

## Usage

```ts
import { Component, signal } from '@angular/core';
import {
  NodeType,
  SeatNode,
  SeatRow,
  SeatState,
  SeatPickerComponent,
} from 'ngx-keruc-seatpicker';

@Component({
  selector: 'app-booking',
  imports: [SeatPickerComponent],
  template: `
    <keruc-seatpicker
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

| Type | Values |
| --- | --- |
| `NodeType` | `Spacer = 0`, `Seat = 1` |
| `SeatState` | `Vacant = 0`, `Occupied = 1`, `Selected = 2` |
| `SeatNode` | `{ type, uniqueName?, displayName?, selected? }` |
| `SeatRow` | `{ rowName?, nodes: SeatNode[] }` |

`Spacer` nodes reserve grid space (aisles/gaps) and render nothing.

## Inputs

| Input | Type | Default | Description |
| --- | --- | --- | --- |
| `rows` (required) | `SeatRow[]` | — | The rows and nodes to render. |
| `canvasWidth` | `number` | `500` | SVG width in px. |
| `canvasHeight` | `number` | `500` | SVG height in px. |
| `colors` | `SeatPickerColors` | see below | Per-state fill/text colors; provided keys override the defaults. |

`SeatPickerColors` keys: `vacantColourBg`, `vacantColourFg`, `occupiedColourBg`,
`occupiedColourFg`, `selectedColourBg`, `selectedColourFg`, `backDropColour`.

## Outputs

| Output | Payload | Fires when |
| --- | --- | --- |
| `selected` | `SeatNode` | A vacant seat is clicked (becomes selected). |
| `deselected` | `SeatNode` | A selected seat is clicked (becomes vacant). |
| `disallowedSelected` | `SeatNode` | An occupied seat is clicked (no state change). |

Selection state is stored on the `SeatNode` objects you pass in and toggled in
place, so the array you bind stays the source of truth.

## License

MIT

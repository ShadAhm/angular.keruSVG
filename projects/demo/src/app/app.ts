import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import {
  NodeType,
  SeatNode,
  SeatPickerColors,
  SeatRow,
  SeatState,
} from 'ngx-keruc-seatpicker';
import { SeatPickerComponent } from 'ngx-keruc-seatpicker';
import { SAMPLE_ROWS } from './fixtures/seat-data.fixture';

interface EventLogEntry {
  kind: 'selected' | 'deselected' | 'disallowed';
  seat: string;
}

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SeatPickerComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly rows = signal<SeatRow[]>(SAMPLE_ROWS);
  protected readonly events = signal<EventLogEntry[]>([]);

  protected readonly compactColors: SeatPickerColors = {
    vacantColourBg: '#2f6f4f',
    vacantColourFg: '#d6f5e4',
    selectedColourBg: '#e0a800',
    selectedColourFg: '#4a3500',
    occupiedColourBg: '#555b66',
    occupiedColourFg: '#c9ced6',
    backDropColour: '#12151c',
  };
  protected readonly compactRows = signal<SeatRow[]>([
    {
      rowName: 'X',
      nodes: [
        this.seat('X1', SeatState.Vacant),
        this.seat('X2', SeatState.Occupied),
        { type: NodeType.Spacer },
        this.seat('X4', SeatState.Vacant),
      ],
    },
    {
      rowName: 'Y',
      nodes: [
        this.seat('Y1', SeatState.Selected),
        this.seat('Y2', SeatState.Vacant),
        { type: NodeType.Spacer },
        this.seat('Y4', SeatState.Vacant),
      ],
    },
  ]);

  protected readonly selectedSeats = computed(() =>
    this.rows()
      .flatMap((row) => row.nodes)
      .filter((n) => n.type === NodeType.Seat && n.selected === SeatState.Selected)
      .map((n) => n.displayName ?? n.uniqueName ?? '?'),
  );

  protected onSelected(seat: SeatNode): void {
    this.rows.set([...this.rows()]);
    this.log('selected', seat);
  }

  protected onDeselected(seat: SeatNode): void {
    this.rows.set([...this.rows()]);
    this.log('deselected', seat);
  }

  protected onDisallowed(seat: SeatNode): void {
    this.log('disallowed', seat);
  }

  private log(kind: EventLogEntry['kind'], seat: SeatNode): void {
    const entry: EventLogEntry = { kind, seat: seat.displayName ?? seat.uniqueName ?? '?' };
    this.events.set([entry, ...this.events()].slice(0, 12));
  }

  private seat(name: string, selected: SeatState): SeatNode {
    return { type: NodeType.Seat, uniqueName: name, displayName: name, selected };
  }
}

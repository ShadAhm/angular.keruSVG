import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import {
  adaptKerusiMap,
  NodeType,
  SeatNode,
  SeatPickerColors,
  SeatRow,
  SeatState,
} from 'ngx-keruc-seatpicker';
import { SeatPickerComponent } from 'ngx-keruc-seatpicker';
import { SAMPLE_ROWS } from './fixtures/seat-data.fixture';
import { CINEMA_KERUSI_MAP, CINEMA_KERUSI_STATE } from './fixtures/cinema-kerusi.fixture';

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
  // --- Main demo: the grid auditorium. The side panel tracks only this one. ---
  protected readonly rows = signal<SeatRow[]>(SAMPLE_ROWS);
  protected readonly events = signal<EventLogEntry[]>([]);

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

  // --- Capability demo 1: curved cinema, adapted from a Kerusi document pair.
  // Fully self-contained — it keeps its own selection state and status line so
  // the main demo's panel stays about the auditorium above.
  private readonly cinema = adaptKerusiMap(CINEMA_KERUSI_MAP, CINEMA_KERUSI_STATE);
  protected readonly cinemaRows = signal<SeatRow[]>(this.cinema.rows);
  protected readonly cinemaElements = signal(this.cinema.elements);
  protected readonly cinemaLayout = this.cinema.layout;
  protected readonly cinemaAspectRatio = this.cinema.aspectRatio;
  protected readonly cinemaStatus = signal<string>('');

  protected readonly cinemaColors: SeatPickerColors = {
    vacantColourBg: '#3a8f63',
    vacantColourFg: '#eafff2',
    selectedColourBg: '#e0a800',
    selectedColourFg: '#4a3500',
    occupiedColourBg: '#c8434f',
    occupiedColourFg: '#ffe3e6',
    heldColourBg: '#e6a817',
    heldColourFg: '#6b4a00',
    blockedColourBg: '#5a616e',
    blockedColourFg: '#c2c8d2',
    elementColourBg: '#d7deea',
    elementColourFg: '#2b3444',
    backDropColour: 'transparent',
  };

  protected readonly cinemaSelected = computed(() =>
    this.cinemaRows()
      .flatMap((row) => row.nodes)
      .filter((n) => n.type === NodeType.Seat && n.selected === SeatState.Selected)
      .map((n) => this.cinemaSeatName(n)),
  );

  /** Resolved price of the current cinema selection, in the map's currency. */
  protected readonly cinemaTotal = computed(() => {
    const selectedIds = new Set(
      this.cinemaRows()
        .flatMap((row) => row.nodes)
        .filter((n) => n.selected === SeatState.Selected)
        .map((n) => n.uniqueName),
    );
    const cents = this.cinema.seats
      .filter((s) => selectedIds.has(s.id))
      .reduce((sum, s) => sum + (s.price?.amount ?? 0), 0);
    return (cents / 100).toFixed(2);
  });

  protected onCinemaChanged(): void {
    this.cinemaRows.set([...this.cinemaRows()]);
    this.cinemaStatus.set('');
  }

  protected onCinemaDisallowed(seat: SeatNode): void {
    const reason =
      seat.selected === SeatState.Held
        ? 'is held in another cart'
        : seat.selected === SeatState.Blocked
          ? 'is blocked by the venue'
          : 'is already booked';
    this.cinemaStatus.set(`Seat ${this.cinemaSeatName(seat)} ${reason}.`);
  }

  /** Seat labels are per-row ("7"), so show the globally unique id ("A7"). */
  private cinemaSeatName(node: SeatNode): string {
    return node.uniqueName ?? node.displayName ?? '?';
  }

  // --- Capability demo 2: a second instance with custom colors and size. ---
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

  private seat(name: string, selected: SeatState): SeatNode {
    return { type: NodeType.Seat, uniqueName: name, displayName: name, selected };
  }
}

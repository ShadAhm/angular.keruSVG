import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import {
  formatMoney,
  KerusiSeatmapComponent,
  KerusiViolation,
  NodeType,
  SeatDisallowed,
  SeatPickerComponent,
  SeatRow,
  SeatState,
  summarizeSelection,
  buildRenderModel,
} from 'ngx-kerusi-seatmap';
import { DEMO_LOCALES, Scenario, SCENARIOS } from './scenarios';
import { SAMPLE_ROWS } from './fixtures/seat-data.fixture';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [KerusiSeatmapComponent, SeatPickerComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly scenarios = SCENARIOS;
  protected readonly locales = DEMO_LOCALES;

  protected readonly scenarioId = signal<string>(SCENARIOS[0].id);
  protected readonly locale = signal<string>('en');
  protected readonly showLegend = signal(true);
  protected readonly typeColors = signal(true);
  protected readonly showSource = signal(false);

  /** Selections are per scenario, so switching tabs does not lose a pick. */
  private readonly selections = signal<Record<string, readonly string[]>>({});
  protected readonly lastDisallowed = signal<string>('');
  protected readonly issues = signal<readonly KerusiViolation[]>([]);

  protected readonly scenario = computed<Scenario>(
    () => SCENARIOS.find((s) => s.id === this.scenarioId()) ?? SCENARIOS[0],
  );

  protected readonly selection = computed<readonly string[]>(
    () => this.selections()[this.scenarioId()] ?? [],
  );

  protected onSelectionChange(next: readonly string[]): void {
    this.selections.update((all) => ({ ...all, [this.scenarioId()]: next }));
    this.lastDisallowed.set('');
  }

  protected onScenarioChange(id: string): void {
    this.scenarioId.set(id);
    this.lastDisallowed.set('');
  }

  protected onDisallowed(event: SeatDisallowed): void {
    const where = event.seat.rowLabel
      ? `Row ${event.seat.rowLabel}, seat ${event.seat.label}`
      : `Seat ${event.seat.label}`;
    this.lastDisallowed.set(`${where} — ${DISALLOWED_TEXT[event.reason]}`);
  }

  /** Resolved selection: the seats picked, their prices, and the total. */
  protected readonly summary = computed(() => {
    const scenario = this.scenario();
    const model = buildRenderModel(scenario.map, scenario.state, { locale: this.locale() });
    const { seats, total, unpriced } = summarizeSelection(model, this.selection());
    return {
      seats: seats.map((seat) => ({
        id: seat.id,
        label: seat.rowLabel ? `${seat.rowLabel}${seat.label}` : seat.label,
        typeLabel: seat.typeLabel,
        price: seat.price ? formatMoney(seat.price, this.locale()) : '—',
        attributes: seat.attributes,
        accessible: !!seat.accessibility?.wheelchairAccessible,
      })),
      total: total ? formatMoney(total, this.locale()) : '',
      unpriced,
    };
  });

  /** The scenario's map as JSON, so the standard itself is visible on the page. */
  protected readonly sourceJson = computed(() =>
    JSON.stringify(this.scenario().map, null, 2),
  );

  protected readonly sectionSummary = computed(() =>
    buildRenderModel(this.scenario().map, this.scenario().state).sections.map((section) => ({
      id: section.id,
      label: section.label ?? section.id,
      mode: section.layoutMode,
      declared: section.source.layout ?? 'inferred',
      aspectRatio: section.aspectRatio,
      seats: section.seats.length,
      elements: section.elements.length,
    })),
  );

  // --- The deprecated SeatRow[] API, kept working and shown as such. ---------

  protected readonly legacyRows = signal<SeatRow[]>(SAMPLE_ROWS);

  protected readonly legacySelected = computed(() =>
    this.legacyRows()
      .flatMap((row) => row.nodes)
      .filter((n) => n.type === NodeType.Seat && n.selected === SeatState.Selected)
      .map((n) => n.displayName ?? n.uniqueName ?? '?'),
  );

  /** The legacy component mutates nodes in place, so the signal must be re-set. */
  protected onLegacyChanged(): void {
    this.legacyRows.set([...this.legacyRows()]);
  }
}

const DISALLOWED_TEXT: Record<SeatDisallowed['reason'], string> = {
  booked: 'already booked',
  held: 'held in another cart',
  blocked: 'blocked by the venue',
  'not-selectable': 'not selectable',
  'max-selection': 'would exceed the seat limit',
  'companion-unavailable': 'must be booked with a seat that is unavailable',
};

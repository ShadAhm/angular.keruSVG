import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { formatMoney } from '../kerusi/kerusi-locale';
import { RenderLegendEntry } from '../render/render-model';
import {
  DEFAULT_KERUSI_COLORS,
  KerusiSeatmapColors,
  readableOn,
} from './kerusi-seatmap-colors';

/** One availability swatch in the legend's second block. */
interface StatusEntry {
  key: string;
  label: string;
  color: string;
}

/**
 * A key for a seat map: its seat types on one side, its availability states on
 * the other.
 *
 * This ships in the library rather than being left to each application because
 * the swatch colors must come from the *same* resolution path as the seat
 * fills — `SeatType.color` when the document supplies one, the theme's
 * available color when it does not. Re-deriving that in application code is how
 * a legend ends up disagreeing with the map it describes.
 *
 * It is opt-in: `<kerusi-seatmap [showLegend]="true">` renders it inline, or
 * use `<kerusi-legend>` directly to place it anywhere.
 */
@Component({
  selector: 'kerusi-legend',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './kerusi-legend.component.html',
  styleUrl: './kerusi-legend.component.css',
})
export class KerusiLegendComponent {
  /** From `RenderMap.legend`. */
  readonly legend = input.required<readonly RenderLegendEntry[]>();
  readonly locale = input<string>('en');
  readonly colors = input<Required<KerusiSeatmapColors>>(DEFAULT_KERUSI_COLORS);
  /** Whether an available seat takes its type color — mirrors the seatmap input. */
  readonly typeColors = input<boolean>(true);
  readonly showPrices = input<boolean>(true);
  /** Hide types no seat in the rendered map actually uses. */
  readonly hideUnusedTypes = input<boolean>(true);

  readonly headingSeatTypes = input<string>('Seat types');
  readonly headingAvailability = input<string>('Availability');

  protected readonly types = computed(() =>
    this.legend().filter((entry) => !this.hideUnusedTypes() || entry.seatCount > 0),
  );

  protected readonly statuses = computed<StatusEntry[]>(() => {
    const c = this.colors();
    return [
      { key: 'available', label: 'Available', color: c.availableBg },
      { key: 'selected', label: 'Selected', color: c.selectedBg },
      { key: 'held', label: 'On hold', color: c.heldBg },
      { key: 'booked', label: 'Booked', color: c.bookedBg },
      { key: 'blocked', label: 'Blocked', color: c.blockedBg },
    ];
  });

  protected swatch(entry: RenderLegendEntry): string {
    return (this.typeColors() && entry.color) || this.colors().availableBg;
  }

  protected swatchText(entry: RenderLegendEntry): string {
    return readableOn(this.swatch(entry));
  }

  protected price(entry: RenderLegendEntry): string {
    return entry.price ? formatMoney(entry.price, this.locale()) : '';
  }
}

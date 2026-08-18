import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { computeFreeformLayout, computeLayout, PositionedElement, PositionedSeat } from '../layout';
import { NodeType } from '../models/node-type.enum';
import { SeatState } from '../models/seat-state.enum';
import { SeatElement } from '../models/seat-element.model';
import { SeatNode } from '../models/seat-node.model';
import { SeatRow } from '../models/seat-row.model';
import { DEFAULT_COLORS, SeatPickerColors } from '../models/seat-picker-colors.model';

export type SeatPickerLayout = 'grid' | 'freeform';

@Component({
  selector: 'keruc-seatpicker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './seat-picker.component.html',
  styleUrl: './seat-picker.component.css',
})
export class SeatPickerComponent {
  readonly rows = input.required<SeatRow[]>();
  readonly canvasWidth = input<number>(500);
  readonly canvasHeight = input<number>(500);
  readonly colors = input<SeatPickerColors>({});

  /** Non-bookable features (screens, stages, ...) drawn in freeform layout. */
  readonly elements = input<SeatElement[]>([]);
  /** Rendering mode. `grid` (default) uses row/column geometry; `freeform` uses x/y. */
  readonly layout = input<SeatPickerLayout>('grid');
  /** Canvas proportions for freeform coordinates, "width:height". */
  readonly aspectRatio = input<string>('1:1');
  /** Optional fixed seat square size (px) for freeform; derived when omitted. */
  readonly seatSize = input<number | undefined>(undefined);

  readonly selected = output<SeatNode>();
  readonly deselected = output<SeatNode>();
  readonly disallowedSelected = output<SeatNode>();

  protected readonly resolvedColors = computed<Required<SeatPickerColors>>(() => ({
    ...DEFAULT_COLORS,
    ...this.colors(),
  }));

  protected readonly computedLayout = computed(() =>
    this.layout() === 'freeform'
      ? computeFreeformLayout(
          this.rows(),
          this.elements(),
          this.canvasWidth(),
          this.canvasHeight(),
          this.aspectRatio(),
          this.seatSize(),
        )
      : computeLayout(this.rows(), this.canvasWidth(), this.canvasHeight()),
  );

  protected fill(node: SeatNode): string {
    const colors = this.resolvedColors();
    switch (node.selected) {
      case SeatState.Selected:
        return colors.selectedColourBg;
      case SeatState.Occupied:
        return colors.occupiedColourBg;
      case SeatState.Held:
        return colors.heldColourBg;
      case SeatState.Blocked:
        return colors.blockedColourBg;
      default:
        return colors.vacantColourBg;
    }
  }

  protected textFill(node: SeatNode): string {
    const colors = this.resolvedColors();
    switch (node.selected) {
      case SeatState.Selected:
        return colors.selectedColourFg;
      case SeatState.Occupied:
        return colors.occupiedColourFg;
      case SeatState.Held:
        return colors.heldColourFg;
      case SeatState.Blocked:
        return colors.blockedColourFg;
      default:
        return colors.vacantColourFg;
    }
  }

  protected elementFill(): string {
    return this.resolvedColors().elementColourBg;
  }

  protected elementTextFill(): string {
    return this.resolvedColors().elementColourFg;
  }

  /** SVG rotate() transform for a positioned seat or element; empty when 0°. */
  protected transform(item: PositionedSeat | PositionedElement): string | null {
    return item.rotation ? `rotate(${item.rotation} ${item.centerX} ${item.centerY})` : null;
  }

  protected onSeatClick(seat: PositionedSeat): void {
    const node = seat.node;
    if (node.type !== NodeType.Seat) {
      return;
    }

    switch (node.selected) {
      case SeatState.Occupied:
      case SeatState.Held:
      case SeatState.Blocked:
        this.disallowedSelected.emit(node);
        return;
      case SeatState.Selected:
        node.selected = SeatState.Vacant;
        this.deselected.emit(node);
        return;
      default:
        node.selected = SeatState.Selected;
        this.selected.emit(node);
    }
  }
}

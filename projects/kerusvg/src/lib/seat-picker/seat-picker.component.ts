import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { computeLayout, PositionedSeat } from '../layout';
import { NodeType } from '../models/node-type.enum';
import { SeatState } from '../models/seat-state.enum';
import { SeatNode } from '../models/seat-node.model';
import { SeatRow } from '../models/seat-row.model';
import {
  DEFAULT_COLORS,
  SeatPickerColors,
} from '../models/seat-picker-colors.model';

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

  readonly selected = output<SeatNode>();
  readonly deselected = output<SeatNode>();
  readonly disallowedSelected = output<SeatNode>();

  protected readonly resolvedColors = computed<Required<SeatPickerColors>>(() => ({
    ...DEFAULT_COLORS,
    ...this.colors(),
  }));

  protected readonly layout = computed(() =>
    computeLayout(this.rows(), this.canvasWidth(), this.canvasHeight()),
  );

  protected fill(node: SeatNode): string {
    const colors = this.resolvedColors();
    switch (node.selected) {
      case SeatState.Selected:
        return colors.selectedColourBg;
      case SeatState.Occupied:
        return colors.occupiedColourBg;
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
      default:
        return colors.vacantColourFg;
    }
  }

  protected onSeatClick(seat: PositionedSeat): void {
    const node = seat.node;
    if (node.type !== NodeType.Seat) {
      return;
    }

    switch (node.selected) {
      case SeatState.Occupied:
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

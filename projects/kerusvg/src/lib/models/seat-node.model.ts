import { NodeType } from './node-type.enum';
import { SeatState } from './seat-state.enum';

export interface SeatNode {
  type: NodeType;
  uniqueName?: string | null;
  displayName?: string | null;
  /** Only meaningful when {@link type} is {@link NodeType.Seat}. */
  selected?: SeatState;
}

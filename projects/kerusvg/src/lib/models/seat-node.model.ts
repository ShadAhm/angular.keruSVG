import { NodeType } from './node-type.enum';
import { SeatState } from './seat-state.enum';

export interface SeatNode {
  type: NodeType;
  uniqueName?: string | null;
  displayName?: string | null;
  /** Only meaningful when {@link type} is {@link NodeType.Seat}. */
  selected?: SeatState;
  /**
   * Horizontal position, 0–100 percent of the section canvas. Used only by the
   * freeform layout; ignored in grid mode. See {@link SeatState} coordinates.
   */
  x?: number;
  /** Vertical position, 0–100 percent of the section canvas (freeform only). */
  y?: number;
  /** Rotation in degrees, letting a seat tilt to follow a curve (freeform only). */
  rotation?: number;
}

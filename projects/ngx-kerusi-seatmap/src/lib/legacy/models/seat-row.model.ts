import { SeatNode } from './seat-node.model';

/** @deprecated Legacy renderer model. Use `RenderSection` / `RenderSeat`. */
export interface SeatRow {
  rowName?: string;
  nodes: SeatNode[];
}

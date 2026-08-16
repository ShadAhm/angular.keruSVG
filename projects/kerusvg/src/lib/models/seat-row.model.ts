import { SeatNode } from './seat-node.model';

export interface SeatRow {
  rowName?: string;
  nodes: SeatNode[];
}

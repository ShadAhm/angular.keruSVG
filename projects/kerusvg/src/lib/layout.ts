import { NodeType } from './models/node-type.enum';
import { SeatNode } from './models/seat-node.model';
import { SeatRow } from './models/seat-row.model';

export interface PositionedSeat {
  node: SeatNode;
  x: number;
  y: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  fontSize: number;
}

export interface SeatLayout {
  width: number;
  height: number;
  seats: PositionedSeat[];
}

/**
 * Computes seat positions for the given rows within a canvas of the given
 * dimensions. Spacer nodes occupy grid space but produce no positioned seat.
 * Geometry ported from the original AngularJS directive (see legacy/).
 */
export function computeLayout(
  rows: readonly SeatRow[],
  canvasWidth: number,
  canvasHeight: number,
): SeatLayout {
  const empty: SeatLayout = { width: canvasWidth, height: canvasHeight, seats: [] };

  if (!rows || rows.length === 0) {
    return empty;
  }

  let longestRow = 0;
  for (const row of rows) {
    if (row.nodes.length > longestRow) {
      longestRow = row.nodes.length;
    }
  }

  if (longestRow === 0) {
    return empty;
  }

  const numberOfCabangX = longestRow + 1;
  const numberOfCabangY = rows.length + 1;

  const totalCabangSpaceX = canvasWidth * 0.1;
  const totalCabangSpaceY = canvasHeight * 0.1;

  const eachCabangX = totalCabangSpaceX / numberOfCabangX;
  const eachCabangY = totalCabangSpaceY / numberOfCabangY;
  const squareWidth = (canvasWidth - totalCabangSpaceX) / longestRow;
  const squareHeight = (canvasHeight - totalCabangSpaceY) / rows.length;
  const fontSize = squareWidth * 0.4;

  const seats: PositionedSeat[] = [];

  let lastUp = 0;
  for (const row of rows) {
    let lastRight = 0;
    for (const node of row.nodes) {
      if (node.type === NodeType.Spacer) {
        lastRight += eachCabangX + squareWidth;
        continue;
      }

      const x = lastRight + eachCabangX;
      const y = lastUp + eachCabangY;

      seats.push({
        node,
        x,
        y,
        width: squareWidth,
        height: squareHeight,
        centerX: x + squareWidth / 2,
        centerY: y + squareHeight / 2,
        fontSize,
      });

      lastRight += eachCabangX + squareWidth;
    }
    lastUp += eachCabangY + squareHeight;
  }

  return { width: canvasWidth, height: canvasHeight, seats };
}

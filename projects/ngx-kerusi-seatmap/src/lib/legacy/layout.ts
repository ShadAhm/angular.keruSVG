import { NodeType } from './models/node-type.enum';
import { SeatElement } from './models/seat-element.model';
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
  /** Rotation in degrees about the seat center. 0 for grid layouts. */
  rotation: number;
}

export interface PositionedElement {
  element: SeatElement;
  x: number;
  y: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  fontSize: number;
  /** Rotation in degrees about the element center. */
  rotation: number;
}

export interface SeatLayout {
  width: number;
  height: number;
  seats: PositionedSeat[];
  elements: PositionedElement[];
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
  const empty: SeatLayout = {
    width: canvasWidth,
    height: canvasHeight,
    seats: [],
    elements: [],
  };

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
        rotation: 0,
      });

      lastRight += eachCabangX + squareWidth;
    }
    lastUp += eachCabangY + squareHeight;
  }

  return { width: canvasWidth, height: canvasHeight, seats, elements: [] };
}

/**
 * Computes seat and element positions from freeform (x/y) coordinates rather
 * than a grid. Each seat/element carries `x`/`y` as a percentage (0–100) of the
 * section canvas; `rotation` (degrees) lets a seat tilt to follow a curve.
 *
 * `aspectRatio` ("width:height", e.g. "16:9") fixes an undistorted content box
 * centered inside the canvas so percentages and rotation stay consistent
 * regardless of the canvas proportions (standard §4.5). Spacer nodes carry no
 * coordinates and are ignored here.
 */
export function computeFreeformLayout(
  rows: readonly SeatRow[],
  elements: readonly SeatElement[],
  canvasWidth: number,
  canvasHeight: number,
  aspectRatio = '1:1',
  seatSize?: number,
): SeatLayout {
  const box = contentBox(canvasWidth, canvasHeight, aspectRatio);
  const size = seatSize ?? Math.min(box.width, box.height) * 0.07;

  const positionedSeats: PositionedSeat[] = [];
  for (const row of rows) {
    for (const node of row.nodes) {
      if (node.type === NodeType.Spacer) {
        continue;
      }
      const centerX = box.offsetX + ((node.x ?? 0) / 100) * box.width;
      const centerY = box.offsetY + ((node.y ?? 0) / 100) * box.height;
      positionedSeats.push({
        node,
        x: centerX - size / 2,
        y: centerY - size / 2,
        width: size,
        height: size,
        centerX,
        centerY,
        fontSize: size * 0.4,
        rotation: node.rotation ?? 0,
      });
    }
  }

  const positionedElements: PositionedElement[] = elements.map((element) => {
    const width = ((element.width ?? 0) / 100) * box.width;
    const height = ((element.height ?? 0) / 100) * box.height;
    const centerX = box.offsetX + ((element.x ?? 0) / 100) * box.width;
    const centerY = box.offsetY + ((element.y ?? 0) / 100) * box.height;
    return {
      element,
      x: centerX - width / 2,
      y: centerY - height / 2,
      width,
      height,
      centerX,
      centerY,
      fontSize: Math.max(height * 0.6, 10),
      rotation: element.rotation ?? 0,
    };
  });

  return {
    width: canvasWidth,
    height: canvasHeight,
    seats: positionedSeats,
    elements: positionedElements,
  };
}

interface ContentBox {
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
}

/**
 * Fits a rectangle of the requested aspect ratio inside the canvas, centered,
 * so freeform percentage coordinates render without distortion. Falls back to
 * the full canvas when the ratio can't be parsed.
 */
function contentBox(canvasWidth: number, canvasHeight: number, aspectRatio: string): ContentBox {
  const [wRaw, hRaw] = aspectRatio.split(':');
  const arW = Number(wRaw);
  const arH = Number(hRaw);
  if (!arW || !arH || arW <= 0 || arH <= 0) {
    return { width: canvasWidth, height: canvasHeight, offsetX: 0, offsetY: 0 };
  }

  const targetAr = arW / arH;
  const canvasAr = canvasWidth / canvasHeight;

  let width: number;
  let height: number;
  if (targetAr > canvasAr) {
    width = canvasWidth;
    height = canvasWidth / targetAr;
  } else {
    height = canvasHeight;
    width = canvasHeight * targetAr;
  }

  return {
    width,
    height,
    offsetX: (canvasWidth - width) / 2,
    offsetY: (canvasHeight - height) / 2,
  };
}

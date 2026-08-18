import { computeFreeformLayout, computeLayout } from './layout';
import { NodeType } from './models/node-type.enum';
import { SeatState } from './models/seat-state.enum';
import { SeatElement } from './models/seat-element.model';
import { SeatRow } from './models/seat-row.model';

const seat = (name: string, selected = SeatState.Vacant): SeatRow['nodes'][number] => ({
  type: NodeType.Seat,
  uniqueName: name,
  displayName: name,
  selected,
});
const spacer = (): SeatRow['nodes'][number] => ({ type: NodeType.Spacer });

describe('computeLayout', () => {
  it('returns an empty layout for no rows', () => {
    const layout = computeLayout([], 500, 500);
    expect(layout).toEqual({ width: 500, height: 500, seats: [], elements: [] });
  });

  it('returns an empty layout when rows contain no nodes', () => {
    const layout = computeLayout([{ nodes: [] }], 400, 300);
    expect(layout).toEqual({ width: 400, height: 300, seats: [], elements: [] });
  });

  it('positions a single seat using the ported geometry', () => {
    const layout = computeLayout([{ nodes: [seat('A1')] }], 500, 500);
    expect(layout.seats).toHaveLength(1);
    expect(layout.seats[0]).toMatchObject({
      x: 25,
      y: 25,
      width: 450,
      height: 450,
      centerX: 250,
      centerY: 250,
      fontSize: 180,
    });
  });

  it('reflects configured canvas dimensions', () => {
    const layout = computeLayout([{ nodes: [seat('A1')] }], 800, 600);
    expect(layout.width).toBe(800);
    expect(layout.height).toBe(600);
  });

  it('skips spacer nodes but reserves their grid space', () => {
    const layout = computeLayout([{ nodes: [seat('A1'), spacer(), seat('A3')] }], 500, 500);
    expect(layout.seats).toHaveLength(2);
    expect(layout.seats[0].x).toBeCloseTo(12.5, 5);
    expect(layout.seats[0].width).toBeCloseTo(150, 5);
    // second seat sits after seat0 + spacer, both advancing by cabang + square
    expect(layout.seats[1].x).toBeCloseTo(337.5, 5);
  });

  it('stacks rows vertically', () => {
    const layout = computeLayout([{ nodes: [seat('A1')] }, { nodes: [seat('B1')] }], 500, 500);
    expect(layout.seats).toHaveLength(2);
    expect(layout.seats[0].y).toBeCloseTo(16.6667, 3);
    expect(layout.seats[0].height).toBeCloseTo(225, 5);
    expect(layout.seats[1].y).toBeCloseTo(258.3333, 3);
  });

  it('preserves the seat node reference on each positioned seat', () => {
    const node = seat('A1', SeatState.Occupied);
    const layout = computeLayout([{ nodes: [node] }], 500, 500);
    expect(layout.seats[0].node).toBe(node);
  });

  it('reports no elements and zero rotation in grid mode', () => {
    const layout = computeLayout([{ nodes: [seat('A1')] }], 500, 500);
    expect(layout.elements).toEqual([]);
    expect(layout.seats[0].rotation).toBe(0);
  });
});

const freeformSeat = (name: string, x: number, y: number, rotation?: number) => ({
  type: NodeType.Seat,
  uniqueName: name,
  displayName: name,
  selected: SeatState.Vacant,
  x,
  y,
  rotation,
});

describe('computeFreeformLayout', () => {
  it('places a seat at its x/y percent of the content box and carries rotation', () => {
    const layout = computeFreeformLayout(
      [{ nodes: [freeformSeat('A1', 20, 40, -5)] }],
      [],
      400,
      200,
      '2:1',
      20,
    );
    expect(layout.seats).toHaveLength(1);
    expect(layout.seats[0]).toMatchObject({
      centerX: 80,
      centerY: 80,
      width: 20,
      height: 20,
      x: 70,
      y: 70,
      rotation: -5,
    });
  });

  it('positions and sizes an element from its percent geometry', () => {
    const screen: SeatElement = {
      kind: 'screen',
      label: 'Screen',
      x: 50,
      y: 5,
      width: 80,
      height: 4,
    };
    const layout = computeFreeformLayout([{ nodes: [] }], [screen], 400, 200, '2:1');
    expect(layout.elements).toHaveLength(1);
    expect(layout.elements[0]).toMatchObject({
      centerX: 200,
      centerY: 10,
      width: 320,
      height: 8,
      x: 40,
      y: 6,
    });
  });

  it('letterboxes an undistorted content box for the aspect ratio', () => {
    // 2:1 box inside a 400x400 canvas → 400x200, offset 100px vertically
    const layout = computeFreeformLayout(
      [{ nodes: [freeformSeat('A1', 50, 50)] }],
      [],
      400,
      400,
      '2:1',
      20,
    );
    expect(layout.seats[0].centerX).toBe(200);
    expect(layout.seats[0].centerY).toBe(200);
  });

  it('ignores spacer nodes', () => {
    const layout = computeFreeformLayout(
      [{ nodes: [freeformSeat('A1', 10, 10), { type: NodeType.Spacer }] }],
      [],
      500,
      500,
    );
    expect(layout.seats).toHaveLength(1);
  });
});

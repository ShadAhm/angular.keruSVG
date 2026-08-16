import { computeLayout } from './layout';
import { NodeType } from './models/node-type.enum';
import { SeatState } from './models/seat-state.enum';
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
    expect(layout).toEqual({ width: 500, height: 500, seats: [] });
  });

  it('returns an empty layout when rows contain no nodes', () => {
    const layout = computeLayout([{ nodes: [] }], 400, 300);
    expect(layout).toEqual({ width: 400, height: 300, seats: [] });
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
});

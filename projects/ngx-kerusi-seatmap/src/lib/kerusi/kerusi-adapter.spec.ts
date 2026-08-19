import { adaptKerusiMap, applyStateDelta, kerusiToRows } from './kerusi-adapter';
import { NodeType } from '../legacy/models/node-type.enum';
import { SeatState } from '../legacy/models/seat-state.enum';
import { KerusiMap } from './kerusi-map.model';
import { KerusiState, KerusiStateDelta } from './kerusi-state.model';
import {
  BUS_MAP,
  CINEMA_MAP,
  CINEMA_STATE_BY_MAP,
  FLIGHT_MAP,
  FLIGHT_STATE_BY_SESSION,
} from './kerusi-examples.fixture';

const seatNodes = (nodes: { type: NodeType }[]) => nodes.filter((n) => n.type === NodeType.Seat);
const spacerNodes = (nodes: { type: NodeType }[]) =>
  nodes.filter((n) => n.type === NodeType.Spacer);

describe('adaptKerusiMap — §6.1 bus (grid with aisle gap)', () => {
  const { rows, seats } = adaptKerusiMap(BUS_MAP);

  it('produces a single row', () => {
    expect(rows).toHaveLength(1);
  });

  it('synthesizes exactly one spacer for the skipped column (the aisle)', () => {
    expect(spacerNodes(rows[0].nodes)).toHaveLength(1);
    // aisle sits between 1B (col 2) and 1C (col 4)
    expect(rows[0].nodes[2].type).toBe(NodeType.Spacer);
  });

  it('emits four seat nodes in column order, no filler leaking as a seat', () => {
    const seatOnly = seatNodes(rows[0].nodes);
    expect(seatOnly.map((n) => (n as { uniqueName?: string }).uniqueName)).toEqual([
      '1A',
      '1B',
      '1C',
      '1D',
    ]);
    expect(seats).toHaveLength(4);
  });
});

describe('adaptKerusiMap — §6.2 cinema (freeform + companions)', () => {
  const { rows, seats } = adaptKerusiMap(CINEMA_MAP);
  const byId = (id: string) => seats.find((s) => s.id === id)!;

  it('flattens the two curved rows by x-order, using RowMeta labels', () => {
    expect(rows).toHaveLength(2);
    expect(rows[0].rowName).toBe('A');
    expect(rows[1].rowName).toBe('L (Love Seats)');
    expect(seatNodes(rows[0].nodes).map((n) => (n as { uniqueName?: string }).uniqueName)).toEqual([
      'A1',
      'A2',
    ]);
  });

  it('preserves symmetric companion links through the adapter', () => {
    expect(byId('L1').companions).toEqual(['L2']);
    expect(byId('L2').companions).toEqual(['L1']);
  });

  it('resolves each seat price from its type default tier (§4.9)', () => {
    expect(byId('A1').price).toEqual({ amount: 1500, currency: 'MYR' });
    expect(byId('L1').price).toEqual({ amount: 4500, currency: 'MYR' });
  });

  it('renders as freeform, carrying coordinates and rotation onto nodes', () => {
    const { layout } = adaptKerusiMap(CINEMA_MAP);
    expect(layout).toBe('freeform');
    expect(byId('A1').node).toMatchObject({ x: 20, y: 20, rotation: -5 });
  });

  it('surfaces the section elements (the screen)', () => {
    const { elements } = adaptKerusiMap(CINEMA_MAP);
    expect(elements).toHaveLength(1);
    expect(elements[0]).toMatchObject({ kind: 'screen', label: 'Screen', x: 50, y: 2 });
  });
});

describe('adaptKerusiMap — §6.3 flight (cabin classes + exit row)', () => {
  const { rows, seats } = adaptKerusiMap(FLIGHT_MAP);
  const byId = (id: string) => seats.find((s) => s.id === id)!;

  it('concatenates both sections into rows', () => {
    expect(rows).toHaveLength(2);
    // business row keeps its aisle gap (cols 1,2,4,5)
    expect(spacerNodes(rows[0].nodes)).toHaveLength(1);
  });

  it('does not let non-pricing attributes affect the resolved price', () => {
    const exitRowSeat = byId('12C');
    expect(exitRowSeat.attributes).toEqual(['aisle', 'exit-row']);
    // price comes purely from the economy type's `eco` tier, not the attributes
    expect(exitRowSeat.price).toEqual({ amount: 0, currency: 'MYR' });
  });
});

describe('adaptKerusiMap — §6.4 sparse state merge (direct mapId)', () => {
  const { seats } = adaptKerusiMap(CINEMA_MAP, CINEMA_STATE_BY_MAP);
  const stateOf = (id: string) => seats.find((s) => s.id === id)!.node.selected;

  it('maps booked to Occupied and held to Held', () => {
    expect(stateOf('A1')).toBe(SeatState.Occupied); // booked
    expect(stateOf('L1')).toBe(SeatState.Held); // held
    expect(stateOf('L2')).toBe(SeatState.Held); // held
  });

  it('defaults seats absent from the sparse state to Vacant', () => {
    expect(stateOf('A2')).toBe(SeatState.Vacant);
  });
});

describe('adaptKerusiMap — default status mapping', () => {
  it('maps blocked to the Blocked state', () => {
    const state = {
      kerusi: '1.0' as const,
      mapId: 'bus-42-2026-08-17',
      updatedAt: '2026-08-17T09:14:00Z',
      seats: { '1A': { status: 'blocked' as const }, '1B': { status: 'booked' as const } },
    };
    const { seats } = adaptKerusiMap(BUS_MAP, state);
    expect(seats.find((s) => s.id === '1A')!.node.selected).toBe(SeatState.Blocked);
    expect(seats.find((s) => s.id === '1B')!.node.selected).toBe(SeatState.Occupied);
    expect(seats.find((s) => s.id === '1C')!.node.selected).toBe(SeatState.Vacant);
  });
});

describe('adaptKerusiMap — §6.5 session-scoped state', () => {
  it('merges sessionId-keyed state onto the map by Seat.id', () => {
    const { seats } = adaptKerusiMap(FLIGHT_MAP, FLIGHT_STATE_BY_SESSION);
    const oneA = seats.find((s) => s.id === '1A')!;
    expect(oneA.node.selected).toBe(SeatState.Occupied);
    // an unlisted business seat stays available
    expect(seats.find((s) => s.id === '1F')!.node.selected).toBe(SeatState.Vacant);
  });
});

describe('kerusiToRows convenience', () => {
  it('returns the same rows as adaptKerusiMap', () => {
    expect(kerusiToRows(BUS_MAP)).toEqual(adaptKerusiMap(BUS_MAP).rows);
  });
});

describe('adapter status mapping override', () => {
  it('honors a custom statusMapping (held treated as available)', () => {
    const { seats } = adaptKerusiMap(CINEMA_MAP, CINEMA_STATE_BY_MAP, {
      statusMapping: (status) => (status === 'booked' ? SeatState.Occupied : SeatState.Vacant),
    });
    const stateOf = (id: string) => seats.find((s) => s.id === id)!.node.selected;
    expect(stateOf('A1')).toBe(SeatState.Occupied); // booked
    expect(stateOf('L1')).toBe(SeatState.Vacant); // held now treated as available
  });
});

describe('adapter sectionId option', () => {
  it('restricts adaptation to a single section', () => {
    const { rows, seats } = adaptKerusiMap(FLIGHT_MAP, undefined, { sectionId: 'economy' });
    expect(rows).toHaveLength(1);
    expect(seats.every((s) => s.sectionId === 'economy')).toBe(true);
  });
});

describe('applyStateDelta (§5.2)', () => {
  it('overwrites changed seats and reverts one to available', () => {
    const base: KerusiState = {
      kerusi: '1.0',
      mapId: 'cinema3-hallA',
      updatedAt: '2026-08-17T09:14:00Z',
      seats: { A1: { status: 'booked' }, L1: { status: 'held' } },
    };
    const delta: KerusiStateDelta = {
      kerusi: '1.0',
      mapId: 'cinema3-hallA',
      updatedAt: '2026-08-17T09:20:00Z',
      changes: { L1: { status: 'available' }, A2: { status: 'booked' } },
    };

    const next = applyStateDelta(base, delta);
    expect(next.updatedAt).toBe('2026-08-17T09:20:00Z');
    expect(next.seats['A1'].status).toBe('booked'); // unchanged
    expect(next.seats['L1'].status).toBe('available'); // reverted
    expect(next.seats['A2'].status).toBe('booked'); // newly changed
    // base is not mutated
    expect(base.seats['L1'].status).toBe('held');
  });
});

describe('adaptKerusiMap — grid section whose seats carry only coordinates', () => {
  const map: KerusiMap = {
    kerusi: '1.0',
    id: 'grid-without-cols',
    legend: [{ id: 'standard' }],
    sections: [
      {
        id: 'main',
        layout: 'grid',
        seats: [
          { id: 'S1', row: '1', x: 10, y: 10, type: 'standard' },
          { id: 'S2', row: '1', x: 20, y: 10, type: 'standard' },
        ],
      },
    ],
  };

  it('keeps declaration order and synthesizes no spacers', () => {
    const { rows } = adaptKerusiMap(map);
    expect(rows[0].nodes.map((n) => n.type)).toEqual([NodeType.Seat, NodeType.Seat]);
    expect(rows[0].nodes.map((n) => n.uniqueName)).toEqual(['S1', 'S2']);
  });
});

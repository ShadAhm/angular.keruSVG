import { adaptKerusiMap, Seat, validateKerusiMap } from 'ngx-keruc-seatpicker';
import { CINEMA_KERUSI_MAP, CINEMA_KERUSI_STATE } from './cinema-kerusi.fixture';

const seats = CINEMA_KERUSI_MAP.sections[0].seats;
const rowSeats = (row: string): Seat[] =>
  seats.filter((s) => s.row === row).sort((a, b) => a.x! - b.x!);

describe('cinema Kerusi fixture', () => {
  it('is a valid Kerusi map', () => {
    expect(() => validateKerusiMap(CINEMA_KERUSI_MAP)).not.toThrow();
  });

  it('arcs each row around the screen: the center sits furthest from it', () => {
    for (const row of ['A', 'D', 'G']) {
      const inRow = rowSeats(row);
      const center = inRow[Math.floor(inRow.length / 2)];
      const left = inRow[0];
      const right = inRow[inRow.length - 1];
      // screen is at the top (small y), so "further from the screen" == larger y
      expect(center.y!).toBeGreaterThan(left.y!);
      expect(center.y!).toBeGreaterThan(right.y!);
    }
  });

  it('angles seats toward the screen, mirrored about the center', () => {
    const inRow = rowSeats('D');
    const left = inRow[0];
    const right = inRow[inRow.length - 1];
    // left of center turns clockwise (positive), right of center anticlockwise
    expect(left.x!).toBeLessThan(50);
    expect(right.x!).toBeGreaterThan(50);
    expect(left.rotation!).toBeGreaterThan(0);
    expect(right.rotation!).toBeLessThan(0);
    expect(left.rotation!).toBeCloseTo(-right.rotation!, 5);
  });

  it('keeps seats tightly and evenly pitched, with wider gaps at the aisles', () => {
    const xs = rowSeats('B').map((s) => s.x!);
    const gaps = xs.slice(1).map((x, i) => x - xs[i]);
    const normal = Math.min(...gaps);
    const aisleGaps = gaps.filter((g) => g > normal + 0.01);
    expect(normal).toBeLessThan(6); // tight pitch between neighbours
    expect(aisleGaps).toHaveLength(2); // exactly the two aisles
    aisleGaps.forEach((g) => expect(g).toBeCloseTo(normal * 2, 5));
  });

  it('links every couple recliner symmetrically', () => {
    const loveSeats = seats.filter((s) => s.type === 'recliner-couple');
    expect(loveSeats).toHaveLength(6);
    for (const seat of loveSeats) {
      expect(seat.companions).toHaveLength(1);
      const partner = loveSeats.find((s) => s.id === seat.companions![0])!;
      expect(partner.companions).toContain(seat.id);
    }
  });

  it('only references real seats from the availability state', () => {
    const ids = new Set(seats.map((s) => s.id));
    for (const id of Object.keys(CINEMA_KERUSI_STATE.seats)) {
      expect(ids.has(id)).toBe(true);
    }
  });

  it('adapts to a freeform layout carrying elements and coordinates', () => {
    const result = adaptKerusiMap(CINEMA_KERUSI_MAP, CINEMA_KERUSI_STATE);
    expect(result.layout).toBe('freeform');
    expect(result.aspectRatio).toBe('16:9');
    expect(result.elements.map((e) => e.kind)).toEqual(['screen', 'exit', 'exit']);
    expect(result.rows).toHaveLength(8); // A–G plus the love-seat row
    expect(result.seats[0].node.x).toBeDefined();
  });
});

import { KerusiMap, KerusiState, Seat } from 'ngx-kerusi-seatmap';

/**
 * A three-tier theatre: orchestra, mezzanine and balcony, each its own
 * `Section` with its own `index`, its own layout mode, and a localized label.
 *
 * Exercises: sections as real render units — the case the pre-1.0 renderer
 * could not express at all, since it flattened every section into one
 * continuous run of rows with a single layout mode for the whole map.
 */

/** A straight grid row with an aisle at the given column. */
function row(name: string, seats: number, type: string, aisleAt: number[] = []): Seat[] {
  const out: Seat[] = [];
  let col = 1;
  for (let n = 1; n <= seats; n++) {
    while (aisleAt.includes(col)) {
      col++;
    }
    out.push({ id: `${name}${n}`, label: `${n}`, row: name, col, type });
    col++;
  }
  return out;
}

/** A gently curved row, for the orchestra's freeform arc. */
function curvedRow(name: string, seats: number, y: number, type: string): Seat[] {
  const out: Seat[] = [];
  for (let i = 0; i < seats; i++) {
    const t = seats === 1 ? 0 : (i / (seats - 1)) * 2 - 1;
    out.push({
      id: `${name}${i + 1}`,
      label: `${i + 1}`,
      row: name,
      x: 50 + t * 38,
      y: y - 4 * (1 - t * t),
      rotation: t * 9,
      type,
    });
  }
  return out;
}

export const THEATRE_MAP: KerusiMap = {
  kerusi: '1.0',
  id: 'panggung-bandaraya',
  name: 'Panggung Bandaraya',
  domain: 'theatre',
  locale: 'en',
  legend: [
    {
      id: 'stalls',
      label: { en: 'Orchestra', ms: 'Orkestra' },
      color: '#8f4a6b',
      defaultPriceTier: 'a',
    },
    {
      id: 'mezz',
      label: { en: 'Mezzanine', ms: 'Mezanin' },
      color: '#4a6b8f',
      defaultPriceTier: 'b',
    },
    {
      id: 'balcony',
      label: { en: 'Balcony', ms: 'Balkoni' },
      color: '#4a8f6b',
      defaultPriceTier: 'c',
    },
    { id: 'box', label: { en: 'Box', ms: 'Kotak' }, color: '#8f7a3a', defaultPriceTier: 'box' },
  ],
  priceTiers: [
    { id: 'a', label: 'A Reserve', price: { amount: 18000, currency: 'MYR' } },
    { id: 'b', label: 'B Reserve', price: { amount: 12000, currency: 'MYR' } },
    { id: 'c', label: 'C Reserve', price: { amount: 7500, currency: 'MYR' } },
    { id: 'box', label: 'Box', price: { amount: 32000, currency: 'MYR' } },
  ],
  sections: [
    {
      id: 'orchestra',
      index: 1,
      label: { en: 'Orchestra', ms: 'Orkestra' },
      layout: 'freeform',
      aspectRatio: '5:2',
      rows: [
        { id: 'A', label: 'A', index: 0 },
        { id: 'B', label: 'B', index: 1 },
        { id: 'C', label: 'C', index: 2 },
        { id: 'D', label: 'D', index: 3 },
      ],
      elements: [
        { id: 'stage', kind: 'stage', label: 'STAGE', x: 50, y: 10, width: 58, height: 10 },
      ],
      seats: [
        ...curvedRow('A', 16, 42, 'stalls'),
        ...curvedRow('B', 18, 58, 'stalls'),
        ...curvedRow('C', 18, 74, 'stalls'),
        ...curvedRow('D', 16, 90, 'stalls'),
      ],
    },
    {
      id: 'mezzanine',
      index: 2,
      label: { en: 'Mezzanine', ms: 'Mezanin' },
      layout: 'grid',
      rows: [
        { id: 'M1', label: 'M1', index: 0 },
        { id: 'M2', label: 'M2', index: 1 },
      ],
      elements: [
        { id: 'stair-l', kind: 'stairs', label: 'Stairs', row: 'M1', col: 0 },
        { id: 'stair-r', kind: 'stairs', label: 'Stairs', row: 'M1', col: 16 },
      ],
      // Aisles at columns 6 and 11 — skipped columns, not filler seats.
      seats: [...row('M1', 12, 'mezz', [6, 11]), ...row('M2', 12, 'mezz', [6, 11])],
    },
    {
      id: 'balcony',
      index: 3,
      label: { en: 'Balcony', ms: 'Balkoni' },
      layout: 'grid',
      rows: [
        { id: 'X', label: 'X', index: 0 },
        { id: 'Y', label: 'Y', index: 1 },
      ],
      seats: [...row('X', 10, 'balcony', [6]), ...row('Y', 10, 'balcony', [6])],
    },
    {
      id: 'boxes',
      index: 4,
      label: { en: 'Boxes', ms: 'Kotak' },
      layout: 'grid',
      rows: [{ id: 'BX', label: 'Box', index: 0 }],
      seats: [
        { id: 'BXL1', label: 'L1', row: 'BX', col: 1, type: 'box' },
        { id: 'BXL2', label: 'L2', row: 'BX', col: 2, type: 'box' },
        // Columns 3–6 are the gap over the auditorium.
        { id: 'BXR1', label: 'R1', row: 'BX', col: 7, type: 'box' },
        { id: 'BXR2', label: 'R2', row: 'BX', col: 8, type: 'box' },
      ],
      elements: [
        { id: 'box-gap', kind: 'gap', label: 'Auditorium below', row: 'BX', col: 3, width: 4 },
      ],
    },
  ],
};

export const THEATRE_STATE: KerusiState = {
  kerusi: '1.0',
  mapId: 'panggung-bandaraya',
  updatedAt: '2026-08-19T14:00:00+08:00',
  seats: {
    A7: { status: 'booked' },
    A8: { status: 'booked' },
    A9: { status: 'booked' },
    A10: { status: 'booked' },
    B9: { status: 'booked' },
    B10: { status: 'held', holdExpires: '2026-08-19T14:12:00+08:00' },
    C1: { status: 'blocked' },
    C18: { status: 'blocked' },
    M15: { status: 'booked' },
    M16: { status: 'booked' },
    X3: { status: 'booked' },
    Y7: { status: 'booked' },
    BXL1: { status: 'booked' },
    BXL2: { status: 'booked' },
  },
};

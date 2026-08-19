import { KerusiMap, KerusiState, Seat } from 'ngx-kerusi-seatmap';

/**
 * An intercity coach: the §6.1 shape at full size. A 2+1 sleeper cabin where
 * the aisle is simply a column no seat occupies (§4.3.2's "no filler objects"),
 * with a lavatory and a luggage gap as grid-addressed elements.
 */

/** A 2+1 row: columns 1,2 | aisle at 3 | 4. */
function coachRow(n: number, type: string): Seat[] {
  return [
    { id: `${n}A`, label: 'A', row: `${n}`, col: 1, type, attributes: ['window'] },
    { id: `${n}B`, label: 'B', row: `${n}`, col: 2, type, attributes: ['aisle'] },
    { id: `${n}C`, label: 'C', row: `${n}`, col: 4, type, attributes: ['window', 'aisle'] },
  ];
}

export const COACH_MAP: KerusiMap = {
  kerusi: '1.0',
  id: 'coach-kl-penang',
  name: 'Aeroline Coach — KL to Penang',
  domain: 'bus',
  locale: 'en',
  legend: [
    {
      id: 'sleeper',
      label: { en: 'Sleeper', ms: 'Katil' },
      color: '#5f6f9f',
      defaultPriceTier: 'standard',
    },
    {
      id: 'front',
      label: { en: 'Front row', ms: 'Baris Depan' },
      color: '#9f7f4f',
      defaultPriceTier: 'front',
    },
  ],
  priceTiers: [
    { id: 'standard', label: 'Standard', price: { amount: 8000, currency: 'MYR' } },
    { id: 'front', label: 'Front row', price: { amount: 9500, currency: 'MYR' } },
  ],
  sections: [
    {
      id: 'deck',
      label: { en: 'Upper deck', ms: 'Dek Atas' },
      // No `layout` declared: every seat has `col` and none has x/y, so §4.5
      // infers `grid`.
      rows: Array.from({ length: 9 }, (_, i) => ({
        id: `${i + 1}`,
        label: `${i + 1}`,
        index: i,
      })),
      elements: [
        { id: 'driver', kind: 'gap', label: 'Driver', row: '1', col: 6, width: 2 },
        { id: 'door', kind: 'exit', label: 'Door', row: '3', col: 6 },
        { id: 'wc', kind: 'lavatory', label: 'WC', row: '8', col: 6 },
        { id: 'luggage', kind: 'gap', label: 'Luggage', row: '9', col: 6, width: 2 },
      ],
      seats: [
        ...coachRow(1, 'front'),
        ...coachRow(2, 'sleeper'),
        ...coachRow(3, 'sleeper'),
        ...coachRow(4, 'sleeper'),
        ...coachRow(5, 'sleeper'),
        ...coachRow(6, 'sleeper'),
        ...coachRow(7, 'sleeper'),
        ...coachRow(8, 'sleeper'),
        ...coachRow(9, 'sleeper'),
      ],
    },
  ],
};

export const COACH_STATE: KerusiState = {
  kerusi: '1.0',
  mapId: 'coach-kl-penang',
  updatedAt: '2026-08-19T06:30:00+08:00',
  seats: {
    '1A': { status: 'booked' },
    '1B': { status: 'booked' },
    '3C': { status: 'booked' },
    '4A': { status: 'held', holdExpires: '2026-08-19T06:40:00+08:00' },
    '6B': { status: 'booked' },
    '9A': { status: 'blocked' },
    '9B': { status: 'blocked' },
    '9C': { status: 'blocked' },
  },
};

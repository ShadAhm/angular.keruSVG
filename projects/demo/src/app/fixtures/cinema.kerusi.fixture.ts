import { KerusiMap, KerusiSession, KerusiState } from 'ngx-kerusi-seatmap';

/**
 * A cinema hall in `freeform` mode: rows arc around the screen and each seat is
 * angled to face it, which no row/column grid can express. The back row is
 * love seats, linked in symmetric `companions` pairs so they book together.
 *
 * Exercises: freeform positioning, per-seat `rotation`, `aspectRatio`, screen
 * and exit elements, price tiers, companions, and all four availability states.
 */

/** Seats along an arc, tilted to face the screen at the top of the section. */
function arc(
  row: string,
  count: number,
  y: number,
  curve: number,
  type: string,
  startCol = 1,
): KerusiMap['sections'][number]['seats'] {
  const seats: KerusiMap['sections'][number]['seats'] = [];
  const spread = 62;
  for (let i = 0; i < count; i++) {
    // -1 at the left edge, +1 at the right.
    const t = count === 1 ? 0 : (i / (count - 1)) * 2 - 1;
    seats.push({
      id: `${row}${i + startCol}`,
      label: `${i + startCol}`,
      row,
      x: 50 + t * (spread / 2),
      y: y - curve * (1 - t * t),
      rotation: t * 14,
      type,
    });
  }
  return seats;
}

export const CINEMA_MAP: KerusiMap = {
  kerusi: '1.0',
  id: 'gsc-hall-3',
  name: 'GSC Mid Valley — Hall 3',
  domain: 'cinema',
  locale: 'en',
  legend: [
    {
      id: 'standard',
      label: { en: 'Standard', ms: 'Biasa' },
      color: '#3a8f63',
      defaultPriceTier: 'regular',
    },
    {
      id: 'premium',
      label: { en: 'Premium', ms: 'Premium' },
      color: '#2f6f9f',
      defaultPriceTier: 'premium',
    },
    {
      id: 'sofa',
      label: { en: 'Love seat', ms: 'Kerusi Berdua' },
      color: '#9a5fa8',
      defaultPriceTier: 'sofa',
    },
    {
      id: 'wheelchair',
      label: { en: 'Wheelchair space', ms: 'Ruang Kerusi Roda' },
      color: '#c78a2e',
      defaultPriceTier: 'regular',
    },
  ],
  priceTiers: [
    { id: 'regular', label: 'Regular', price: { amount: 1800, currency: 'MYR' } },
    { id: 'premium', label: 'Premium', price: { amount: 2600, currency: 'MYR' } },
    { id: 'sofa', label: 'Love seat', price: { amount: 5200, currency: 'MYR' } },
  ],
  sections: [
    {
      id: 'house',
      label: { en: 'Hall 3', ms: 'Dewan 3' },
      layout: 'freeform',
      aspectRatio: '16:9',
      rows: [
        { id: 'A', label: 'A', index: 0 },
        { id: 'B', label: 'B', index: 1 },
        { id: 'C', label: 'C', index: 2 },
        { id: 'D', label: 'D', index: 3 },
        { id: 'E', label: 'E', index: 4 },
        { id: 'L', label: 'L', index: 5 },
      ],
      elements: [
        { id: 'screen', kind: 'screen', label: 'SCREEN', x: 50, y: 7, width: 66, height: 4 },
        { id: 'exit-left', kind: 'exit', label: 'EXIT', x: 6, y: 82, width: 8, height: 5 },
        { id: 'exit-right', kind: 'exit', label: 'EXIT', x: 94, y: 82, width: 8, height: 5 },
      ],
      seats: [
        ...arc('A', 10, 34, 5, 'standard'),
        ...arc('B', 11, 45, 5, 'standard'),
        ...arc('C', 12, 56, 5, 'premium'),
        ...arc('D', 12, 67, 5, 'premium'),
        // Row E leaves a wheelchair bay at each end, with its companion seat.
        {
          id: 'E1',
          label: '1',
          row: 'E',
          x: 21,
          y: 77,
          rotation: -12,
          type: 'wheelchair',
          companions: ['E2'],
          attributes: ['aisle'],
          accessibility: {
            wheelchairAccessible: true,
            transferArmrest: 'right',
            aisleChairCompatible: true,
            companionRequired: true,
          },
        },
        {
          id: 'E2',
          label: '2',
          row: 'E',
          x: 29,
          y: 78,
          rotation: -8,
          type: 'premium',
          companions: ['E1'],
        },
        ...arc('E', 5, 79, 1, 'premium', 3).map((seat, i) => ({
          ...seat,
          x: 40 + i * 5,
        })),
        {
          id: 'E8',
          label: '8',
          row: 'E',
          x: 71,
          y: 78,
          rotation: 8,
          type: 'premium',
          companions: ['E9'],
        },
        {
          id: 'E9',
          label: '9',
          row: 'E',
          x: 79,
          y: 77,
          rotation: 12,
          type: 'wheelchair',
          companions: ['E8'],
          attributes: ['aisle'],
          accessibility: {
            wheelchairAccessible: true,
            transferArmrest: 'left',
            aisleChairCompatible: true,
            companionRequired: true,
          },
        },
        // Love seats: three symmetric pairs across the back row.
        {
          id: 'L1',
          label: '1',
          row: 'L',
          x: 28,
          y: 90,
          rotation: -10,
          type: 'sofa',
          companions: ['L2'],
        },
        {
          id: 'L2',
          label: '2',
          row: 'L',
          x: 36,
          y: 89,
          rotation: -6,
          type: 'sofa',
          companions: ['L1'],
        },
        {
          id: 'L3',
          label: '3',
          row: 'L',
          x: 46,
          y: 88,
          rotation: -2,
          type: 'sofa',
          companions: ['L4'],
        },
        {
          id: 'L4',
          label: '4',
          row: 'L',
          x: 54,
          y: 88,
          rotation: 2,
          type: 'sofa',
          companions: ['L3'],
        },
        {
          id: 'L5',
          label: '5',
          row: 'L',
          x: 64,
          y: 89,
          rotation: 6,
          type: 'sofa',
          companions: ['L6'],
        },
        {
          id: 'L6',
          label: '6',
          row: 'L',
          x: 72,
          y: 90,
          rotation: 10,
          type: 'sofa',
          companions: ['L5'],
        },
      ],
    },
  ],
};

export const CINEMA_SESSION: KerusiSession = {
  kerusi: '1.0',
  id: 'gsc-hall-3-2026-08-19-1930',
  mapId: 'gsc-hall-3',
  label: 'Dune: Part Three — 7:30pm',
  startsAt: '2026-08-19T19:30:00+08:00',
};

export const CINEMA_STATE: KerusiState = {
  kerusi: '1.0',
  sessionId: 'gsc-hall-3-2026-08-19-1930',
  updatedAt: '2026-08-19T18:42:00+08:00',
  // Sparse (§5.1): every seat not listed here is available.
  seats: {
    C4: { status: 'booked' },
    C5: { status: 'booked' },
    C6: { status: 'booked' },
    D6: { status: 'booked' },
    D7: { status: 'booked' },
    B3: { status: 'held', holdExpires: '2026-08-19T18:52:00+08:00' },
    B4: { status: 'held', holdExpires: '2026-08-19T18:52:00+08:00' },
    L3: { status: 'booked' },
    L4: { status: 'booked' },
    A1: { status: 'blocked' },
    A10: { status: 'blocked' },
  },
};

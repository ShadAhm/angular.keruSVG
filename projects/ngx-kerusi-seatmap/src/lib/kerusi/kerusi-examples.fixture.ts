import { KerusiMap } from './kerusi-map.model';
import { KerusiState } from './kerusi-state.model';

// The five worked examples from the Kerusi standard §6, transcribed verbatim as
// test fixtures. Non-normative in the spec; here they anchor the adapter and
// validator tests to the document that defines correct behavior.

/** §6.1 — minimal generic map (bus, 2+2 layout). Column 3 is the aisle. */
export const BUS_MAP: KerusiMap = {
  kerusi: '1.0',
  id: 'bus-42-2026-08-17',
  domain: 'bus',
  legend: [{ id: 'standard', label: 'Standard' }],
  sections: [
    {
      id: 'main',
      seats: [
        { id: '1A', row: '1', col: 1, type: 'standard' },
        { id: '1B', row: '1', col: 2, type: 'standard' },
        { id: '1C', row: '1', col: 4, type: 'standard' },
        { id: '1D', row: '1', col: 5, type: 'standard' },
      ],
    },
  ],
};

/** §6.2 — cinema with curved (freeform) rows and companion couple seats. */
export const CINEMA_MAP: KerusiMap = {
  kerusi: '1.0',
  id: 'cinema3-hallA',
  name: 'Hall A',
  domain: 'cinema',
  legend: [
    { id: 'standard', label: 'Standard', defaultPriceTier: 'regular' },
    { id: 'recliner-couple', label: 'Couple Recliner', defaultPriceTier: 'premium' },
  ],
  priceTiers: [
    { id: 'regular', price: { amount: 1500, currency: 'MYR' } },
    { id: 'premium', price: { amount: 4500, currency: 'MYR' } },
  ],
  sections: [
    {
      id: 'main',
      layout: 'freeform',
      rows: [
        { id: 'A', label: 'A', index: 0 },
        { id: 'L', label: 'L (Love Seats)', index: 11 },
      ],
      elements: [
        { id: 'screen', kind: 'screen', label: 'Screen', x: 50, y: 2, width: 80, height: 3 },
      ],
      seats: [
        { id: 'A1', label: '1', row: 'A', x: 20, y: 20, rotation: -5, type: 'standard' },
        { id: 'A2', label: '2', row: 'A', x: 26, y: 19, rotation: -3, type: 'standard' },
        {
          id: 'L1',
          label: '1',
          row: 'L',
          x: 60,
          y: 70,
          type: 'recliner-couple',
          companions: ['L2'],
        },
        {
          id: 'L2',
          label: '2',
          row: 'L',
          x: 66,
          y: 70,
          type: 'recliner-couple',
          companions: ['L1'],
        },
      ],
    },
  ],
};

/** §6.3 — flight with cabin classes and exit row (reusable airframe config). */
export const FLIGHT_MAP: KerusiMap = {
  kerusi: '1.0',
  id: 'b738-2class-v1',
  name: 'Boeing 737-800, 2-class',
  domain: 'flight',
  legend: [
    { id: 'economy', label: 'Economy', defaultPriceTier: 'eco' },
    { id: 'business', label: 'Business', defaultPriceTier: 'biz' },
  ],
  priceTiers: [
    { id: 'eco', price: { amount: 0, currency: 'MYR' } },
    { id: 'biz', price: { amount: 0, currency: 'MYR' } },
  ],
  sections: [
    {
      id: 'business',
      label: 'Business',
      seats: [
        { id: '1A', row: '1', col: 1, type: 'business', attributes: ['window'] },
        { id: '1C', row: '1', col: 2, type: 'business', attributes: ['aisle'] },
        { id: '1D', row: '1', col: 4, type: 'business', attributes: ['aisle'] },
        { id: '1F', row: '1', col: 5, type: 'business', attributes: ['window'] },
      ],
    },
    {
      id: 'economy',
      label: 'Economy',
      seats: [
        { id: '12A', row: '12', col: 1, type: 'economy', attributes: ['window', 'exit-row'] },
        { id: '12B', row: '12', col: 2, type: 'economy', attributes: ['exit-row'] },
        { id: '12C', row: '12', col: 3, type: 'economy', attributes: ['aisle', 'exit-row'] },
      ],
    },
  ],
};

/** §6.4 — matching state via direct `mapId` (sparse: 3 of N seats listed). */
export const CINEMA_STATE_BY_MAP: KerusiState = {
  kerusi: '1.0',
  mapId: 'cinema3-hallA',
  updatedAt: '2026-08-17T09:14:00Z',
  seats: {
    A1: { status: 'booked' },
    L1: { status: 'held', holdExpires: '2026-08-17T09:24:00Z' },
    L2: { status: 'held', holdExpires: '2026-08-17T09:24:00Z' },
  },
};

/** §6.5 — session-scoped state for one flight date, referencing `sessionId`. */
export const FLIGHT_STATE_BY_SESSION: KerusiState = {
  kerusi: '1.0',
  sessionId: 'MH123-2026-08-17',
  updatedAt: '2026-08-17T09:14:00Z',
  seats: {
    '1A': { status: 'booked' },
  },
};

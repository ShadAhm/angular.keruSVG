/**
 * Kerusi Seat Map & Availability Format support for ngx-kerusi-seatmap.
 *
 * Types, a validator, and an adapter that convert a `KerusiMap` + `KerusiState`
 * document pair into the grid `SeatRow[]` the seat-picker renders. See
 * docs/kerusi.md and the full standard for details.
 */

export * from './kerusi-map.model';
export * from './kerusi-state.model';
export * from './kerusi-price';
export * from './kerusi-validator';
export * from './kerusi-adapter';

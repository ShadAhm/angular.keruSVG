/*
 * Public API Surface of ngx-kerusi-seatmap
 */

// --- Kerusi format: document types, validation, pricing, locale, state ------
export * from './lib/kerusi';

// --- Render model: the resolved, framework-free view a renderer consumes ----
export * from './lib/render';

// --- Components -------------------------------------------------------------
export * from './lib/kerusi-seatmap';

// --- Deprecated: the pre-1.0 SeatRow[] renderer, kept for compatibility -----
export * from './lib/legacy/models/node-type.enum';
export * from './lib/legacy/models/seat-state.enum';
export * from './lib/legacy/models/seat-node.model';
export * from './lib/legacy/models/seat-row.model';
export * from './lib/legacy/models/seat-element.model';
export * from './lib/legacy/models/seat-picker-colors.model';
export * from './lib/legacy/layout';
export * from './lib/legacy/seat-picker/seat-picker.component';

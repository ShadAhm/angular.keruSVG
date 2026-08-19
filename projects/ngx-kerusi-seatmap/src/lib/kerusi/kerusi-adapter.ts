import { NodeType } from '../legacy/models/node-type.enum';
import { SeatElement } from '../legacy/models/seat-element.model';
import { SeatNode } from '../legacy/models/seat-node.model';
import { SeatRow } from '../legacy/models/seat-row.model';
import { SeatState } from '../legacy/models/seat-state.enum';
import { Element, KerusiMap, Money, RowMeta, Seat, Section } from './kerusi-map.model';
import { KerusiState, SeatStatus } from './kerusi-state.model';
import { resolveSeatPrice } from './kerusi-price';
import { resolveSectionLayoutMode } from './kerusi-layout-mode';
import { validateKerusiMap, validateKerusiState } from './kerusi-validator';

/** The status values a {@link KerusiState} can carry for a seat. */
export type SeatStatusValue = SeatStatus['status'];

/**
 * Maps a Kerusi availability status onto the renderer's {@link SeatState}. The
 * argument is `undefined` when a seat is absent from the state document, which
 * the spec's sparse rule (§5.1) treats as `"available"`.
 */
export type StatusMapping = (status: SeatStatusValue | undefined) => SeatState;

/**
 * Default status mapping. Each Kerusi availability status maps to its own
 * renderer {@link SeatState}: `booked` → Occupied, `held` → Held, `blocked` →
 * Blocked, and `available` (or an absent seat, per §5.1's sparse rule) → Vacant.
 * Held and Blocked are non-selectable, like Occupied. Override via
 * {@link AdapterOptions.statusMapping} to collapse or remap them.
 */
export const DEFAULT_STATUS_MAPPING: StatusMapping = (status) => {
  switch (status) {
    case 'booked':
      return SeatState.Occupied;
    case 'held':
      return SeatState.Held;
    case 'blocked':
      return SeatState.Blocked;
    default:
      return SeatState.Vacant;
  }
};

export interface AdapterOptions {
  /** Restrict adaptation to a single section by id. Default: all sections. */
  sectionId?: string;
  /** Override the Kerusi-status → SeatState mapping. Default: {@link DEFAULT_STATUS_MAPPING}. */
  statusMapping?: StatusMapping;
}

/**
 * The per-seat data the flat grid {@link SeatNode} cannot carry, exposed
 * alongside the rows so companion links, resolved price, attributes, and origin
 * survive the adapter for consumers that need them.
 */
export interface AdaptedSeat {
  /** The originating `Seat.id` (== `SeatNode.uniqueName`). */
  id: string;
  /** The section this seat came from. */
  sectionId: string;
  /** The seat's row value (RowMeta id or free-text), if any. */
  row?: string;
  /** The seat's Kerusi type id. */
  type: string;
  /** Non-exclusive attribute tags (§4.3.3). */
  attributes: string[];
  /** ids of seats that must be booked together (§4.6). Empty when none. */
  companions: string[];
  /** Resolved price per §4.9, or `undefined` when the seat is unpriced. */
  price?: Money;
  /** The seat's status from the merged state; `"available"` when absent. */
  status: SeatStatusValue;
  /** The live grid node produced for this seat (same reference as in `rows`). */
  node: SeatNode;
}

export interface AdaptResult {
  /** Ready to bind to `<kerusi-seatpicker [rows]="...">`. */
  rows: SeatRow[];
  /** Rich per-seat data keyed positionally to `rows`; see {@link AdaptedSeat}. */
  seats: AdaptedSeat[];
  /** Non-bookable features (screens, stages, ...) to bind to `[elements]`. */
  elements: SeatElement[];
  /**
   * The render mode to bind to `[layout]`. `freeform` when any adapted section
   * uses x/y positioning (§4.5); otherwise `grid`.
   */
  layout: 'grid' | 'freeform';
  /** Canvas proportions to bind to `[aspectRatio]`, from the freeform section. */
  aspectRatio: string;
}

/**
 * Converts a {@link KerusiMap} (+ optional {@link KerusiState}) into the grid
 * `SeatRow[]` the existing renderer consumes, following the reverse of the
 * standard's §7 migration table.
 *
 * The map is validated first (§4.6/§4.9); an invalid document throws a
 * {@link KerusiValidationError} rather than producing a mis-rendered layout.
 *
 * Grid sections synthesize {@link NodeType.Spacer} nodes for skipped columns so
 * aisles survive (§4.3.2). Freeform (x/y) sections carry each seat's
 * `x`/`y`/`rotation` through onto the node and collect the section's
 * {@link Element}s, so the renderer can draw curves and features natively; the
 * result's `layout` becomes `freeform` in that case (§4.5).
 */
export function adaptKerusiMap(
  map: KerusiMap,
  state?: KerusiState,
  options: AdapterOptions = {},
): AdaptResult {
  validateKerusiMap(map);
  if (state) {
    validateKerusiState(state);
  }

  const statusMapping = options.statusMapping ?? DEFAULT_STATUS_MAPPING;
  const sections = selectSections(map, options.sectionId);

  const rows: SeatRow[] = [];
  const adaptedSeats: AdaptedSeat[] = [];
  const elements: SeatElement[] = [];
  let layout: 'grid' | 'freeform' = 'grid';
  let aspectRatio = '1:1';

  for (const section of sections) {
    const freeform = resolveSectionLayoutMode(section) !== 'grid';
    if (freeform) {
      layout = 'freeform';
      aspectRatio = section.aspectRatio ?? aspectRatio;
      for (const element of section.elements ?? []) {
        elements.push(toSeatElement(element));
      }
    }

    for (const { rowKey, meta, seats } of groupRows(section)) {
      const nodes: SeatNode[] = [];
      const slots = freeform ? freeformSlots(seats) : gridSlots(seats);

      for (const slot of slots) {
        if (slot.kind === 'spacer') {
          nodes.push({ type: NodeType.Spacer });
          continue;
        }
        const seat = slot.seat;
        const status = state?.seats[seat.id]?.status ?? 'available';
        const node: SeatNode = {
          type: NodeType.Seat,
          uniqueName: seat.id,
          displayName: seat.label ?? seat.id,
          selected: statusMapping(state?.seats[seat.id]?.status),
        };
        if (freeform) {
          node.x = seat.x;
          node.y = seat.y;
          node.rotation = seat.rotation;
        }
        nodes.push(node);
        adaptedSeats.push({
          id: seat.id,
          sectionId: section.id,
          row: seat.row,
          type: seat.type,
          attributes: seat.attributes ?? [],
          companions: seat.companions ?? [],
          price: resolveSeatPrice(seat, map),
          status,
          node,
        });
      }

      rows.push({ rowName: meta?.label ?? (rowKey || undefined), nodes });
    }
  }

  return { rows, seats: adaptedSeats, elements, layout, aspectRatio };
}

/**
 * Convenience wrapper around {@link adaptKerusiMap} returning just the rows, for
 * the one-line binding `[rows]="kerusiToRows(map, state)"`.
 */
export function kerusiToRows(
  map: KerusiMap,
  state?: KerusiState,
  options?: AdapterOptions,
): SeatRow[] {
  return adaptKerusiMap(map, state, options).rows;
}

// --- internal helpers -------------------------------------------------------

function selectSections(map: KerusiMap, sectionId?: string): Section[] {
  const sections = sectionId ? map.sections.filter((s) => s.id === sectionId) : [...map.sections];
  // Stable sort by declared `index`; sections without one keep their order.
  return sections
    .map((section, order) => ({ section, order }))
    .sort((a, b) => sortKey(a.section.index, a.order) - sortKey(b.section.index, b.order))
    .map((entry) => entry.section);
}

interface RowGroup {
  rowKey: string;
  meta?: RowMeta;
  seats: Seat[];
}

/** Groups a section's seats by row and orders the groups per `RowMeta.index`. */
function groupRows(section: Section): RowGroup[] {
  const byKey = new Map<string, Seat[]>();
  const firstSeen = new Map<string, number>();
  section.seats.forEach((seat, i) => {
    const key = seat.row ?? '';
    if (!byKey.has(key)) {
      byKey.set(key, []);
      firstSeen.set(key, i);
    }
    byKey.get(key)!.push(seat);
  });

  const metaById = new Map((section.rows ?? []).map((r) => [r.id, r]));

  return [...byKey.entries()]
    .map(([rowKey, seats]) => ({ rowKey, meta: metaById.get(rowKey), seats }))
    .sort(
      (a, b) =>
        sortKey(a.meta?.index, firstSeen.get(a.rowKey)!) -
        sortKey(b.meta?.index, firstSeen.get(b.rowKey)!),
    );
}

/** An ordered position within a row: either a seat or reserved aisle space. */
type RowSlot = { kind: 'seat'; seat: Seat } | { kind: 'spacer' };

/** Maps a Kerusi {@link Element} to the renderer's {@link SeatElement}. */
function toSeatElement(element: Element): SeatElement {
  return {
    kind: element.kind,
    label: element.label,
    x: element.x,
    y: element.y,
    width: element.width,
    height: element.height,
    rotation: element.rotation,
  };
}

/**
 * Orders grid seats by column and interleaves a spacer slot for each skipped
 * column between consecutive seats, so an aisle (a gap in the column sequence,
 * §4.3.2) is preserved as reserved grid space.
 */
function gridSlots(seats: Seat[]): RowSlot[] {
  // Every seat in a grid section is required to carry `col` (§4.5), and the
  // validator rejects a document where one does not — so the undefined-column
  // branches below are defensive only, for a caller that skipped validation.
  const ordered = [...seats]
    .map((seat, order) => ({ seat, order }))
    .sort((a, b) => {
      const left = colOf(a.seat);
      const right = colOf(b.seat);
      return left === undefined || right === undefined ? a.order - b.order : left - right;
    })
    .map((entry) => entry.seat);

  const slots: RowSlot[] = [];
  let prevCol: number | undefined;
  for (const seat of ordered) {
    const col = colOf(seat);
    if (prevCol !== undefined && col !== undefined) {
      for (let gap = prevCol + 1; gap < col; gap++) {
        slots.push({ kind: 'spacer' });
      }
    }
    prevCol = col;
    slots.push({ kind: 'seat', seat });
  }
  return slots;
}

/** A seat's grid column, normalizing a null `col` to undefined. */
function colOf(seat: Seat): number | undefined {
  return seat.col ?? undefined;
}

/**
 * Orders freeform seats left-to-right by `x` (falling back to `y`, then label),
 * flattening the curve into a single grid row. No spacers are synthesized —
 * freeform gaps are not column-addressable.
 */
function freeformSlots(seats: Seat[]): RowSlot[] {
  return [...seats]
    .sort(
      (a, b) =>
        (a.x ?? a.col ?? 0) - (b.x ?? b.col ?? 0) ||
        (a.y ?? 0) - (b.y ?? 0) ||
        (a.label ?? a.id).localeCompare(b.label ?? b.id),
    )
    .map((seat) => ({ kind: 'seat', seat }) as RowSlot);
}

/** Numeric sort key that keeps entries without an explicit index in place. */
function sortKey(index: number | undefined, fallbackOrder: number): number {
  return index ?? Number.MAX_SAFE_INTEGER - 1_000_000 + fallbackOrder;
}

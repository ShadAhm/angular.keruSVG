import { KerusiMap, RowMeta, Seat, Section } from '../kerusi/kerusi-map.model';
import { KerusiState } from '../kerusi/kerusi-state.model';
import { resolveSectionLayoutMode, SectionLayoutMode } from '../kerusi/kerusi-layout-mode';
import { resolveLocalizedText, resolveMapLocale } from '../kerusi/kerusi-locale';
import { resolveSeatPrice, resolveTierPrice } from '../kerusi/kerusi-price';
import {
  RenderElement,
  RenderLegendEntry,
  RenderMap,
  RenderRow,
  RenderSeat,
  RenderSection,
  SeatRenderStatus,
} from './render-model';

/** The default section proportions when none is declared (§4.5). */
const DEFAULT_ASPECT_RATIO = '1:1';

/** Which statuses a seat may be picked in, unless the caller says otherwise. */
export const DEFAULT_SELECTABLE_STATUSES: readonly SeatRenderStatus[] = ['available'];

export interface BuildRenderModelOptions {
  /** Overrides `KerusiMap.locale` for label resolution. */
  locale?: string;
  /** Render only these sections, in this order. Default: all, by `Section.index`. */
  sectionIds?: readonly string[];
  /** Statuses in which a seat may be picked. Default: `['available']`. */
  selectableStatuses?: readonly SeatRenderStatus[];
  /** A final say on whether a seat is selectable, applied after the status test. */
  seatSelectable?: (seat: RenderSeat) => boolean;
}

/**
 * Builds the renderer's view of a `KerusiMap` with its `KerusiState` merged in.
 *
 * Everything the standard makes a consumer resolve happens here, once:
 *  - sections ordered by `Section.index`, and each given its own layout mode
 *    per §4.5 — this is what lets a grid balcony and a freeform orchestra
 *    coexist in one map;
 *  - seats grouped into rows by `Seat.row`, with rows ordered by `RowMeta.index`
 *    and seats ordered by `col` (grid, mixed) or `x` (freeform);
 *  - availability merged by `Seat.id`, honoring §5.1's sparse rule that an
 *    absent seat is available;
 *  - price resolved through the §4.9 precedence order;
 *  - `Section.label` and `SeatType.label` localized against the map's locale.
 *
 * It does NOT validate — call `validateKerusiMap` or `checkKerusiMap` first.
 * Given an invalid document it builds the best model it can rather than
 * throwing, so a caller in "collect" mode can render and report at once.
 */
export function buildRenderModel(
  map: KerusiMap,
  state?: KerusiState,
  options: BuildRenderModelOptions = {},
): RenderMap {
  const locale = resolveMapLocale(map, options.locale);
  const selectableStatuses = new Set(
    options.selectableStatuses ?? DEFAULT_SELECTABLE_STATUSES,
  );
  const legendById = new Map((map.legend ?? []).map((t) => [t.id, t]));
  const seatsById = new Map<string, RenderSeat>();
  const typeCounts = new Map<string, number>();
  const currencies = new Set<string>();

  const sections = selectSections(map, options.sectionIds).map((section) =>
    buildSection(section, {
      map,
      state,
      locale,
      selectableStatuses,
      seatSelectable: options.seatSelectable,
      legendById,
      seatsById,
      typeCounts,
      currencies,
    }),
  );

  const legend: RenderLegendEntry[] = (map.legend ?? []).map((type) => {
    const price = resolveTierPrice(map, type.defaultPriceTier);
    return {
      id: type.id,
      label: resolveLocalizedText(type.label, locale) ?? type.id,
      color: type.color,
      defaultTier: map.priceTiers?.find((t) => t.id === type.defaultPriceTier),
      price,
      seatCount: typeCounts.get(type.id) ?? 0,
    };
  });

  return {
    id: map.id,
    name: map.name,
    locale,
    domain: map.domain,
    sections,
    legend,
    // §4.9 forbids mixing currencies, so the first is the map's.
    currency: [...currencies][0],
    seatsById,
  };
}

interface BuildContext {
  map: KerusiMap;
  state?: KerusiState;
  locale: string;
  selectableStatuses: ReadonlySet<SeatRenderStatus>;
  seatSelectable?: (seat: RenderSeat) => boolean;
  legendById: Map<string, KerusiMap['legend'][number]>;
  seatsById: Map<string, RenderSeat>;
  typeCounts: Map<string, number>;
  currencies: Set<string>;
}

function buildSection(section: Section, ctx: BuildContext): RenderSection {
  const layoutMode = resolveSectionLayoutMode(section);
  const rows = buildRows(section, layoutMode, ctx);

  return {
    id: section.id,
    label: resolveLocalizedText(section.label, ctx.locale),
    layoutMode,
    aspectRatio: section.aspectRatio ?? DEFAULT_ASPECT_RATIO,
    rows,
    seats: rows.flatMap((r) => r.seats),
    elements: buildElements(section, rows),
    source: section,
  };
}

/**
 * Groups a section's flat seat list into rows and orders both.
 *
 * `Section.rows` is metadata, not a container (§4.2) — a seat's `row` may name a
 * `RowMeta` or be free text with no declaration at all, and both must work.
 * Rows are ordered by `RowMeta.index` where one exists, otherwise by first
 * appearance, which keeps a document that declares no row metadata rendering in
 * the order its author wrote it.
 */
function buildRows(
  section: Section,
  layoutMode: SectionLayoutMode,
  ctx: BuildContext,
): RenderRow[] {
  const byRowKey = new Map<string, Seat[]>();
  const firstSeen = new Map<string, number>();

  (section.seats ?? []).forEach((seat, i) => {
    const key = seat.row ?? '';
    if (!byRowKey.has(key)) {
      byRowKey.set(key, []);
      firstSeen.set(key, i);
    }
    byRowKey.get(key)!.push(seat);
  });

  const metaById = new Map((section.rows ?? []).map((r: RowMeta) => [r.id, r]));

  const ordered = [...byRowKey.entries()]
    .map(([key, seats]) => ({ key, seats, meta: metaById.get(key) }))
    .sort(
      (a, b) =>
        orderKey(a.meta?.index, firstSeen.get(a.key)!) -
        orderKey(b.meta?.index, firstSeen.get(b.key)!),
    );

  return ordered.map(({ key, seats, meta }, rowIndex) => {
    const row: RenderRow = {
      id: key,
      label: meta?.label ?? (key || undefined),
      index: rowIndex,
      seats: sortSeats(seats, layoutMode).map((seat) =>
        buildSeat(seat, section, { rowIndex, rowLabel: meta?.label ?? (key || undefined) }, ctx),
      ),
    };
    return row;
  });
}

/**
 * Orders seats within a row. `col` is the adjacency ordinal in grid and mixed
 * sections — including mixed, where `x`/`y` places the seat but `col` is what
 * "the seat to the right" means (§4.3.1). Freeform rows have no columns, so
 * they order by `x`.
 */
function sortSeats(seats: readonly Seat[], layoutMode: SectionLayoutMode): Seat[] {
  const byCol = layoutMode !== 'freeform';
  return [...seats]
    .map((seat, order) => ({ seat, order }))
    .sort((a, b) => {
      const left = byCol ? a.seat.col : a.seat.x;
      const right = byCol ? b.seat.col : b.seat.x;
      if (left === undefined || right === undefined || left === right) {
        return (a.seat.y ?? 0) - (b.seat.y ?? 0) || a.order - b.order;
      }
      return left - right;
    })
    .map((entry) => entry.seat);
}

function buildSeat(
  seat: Seat,
  section: Section,
  row: { rowIndex: number; rowLabel?: string },
  ctx: BuildContext,
): RenderSeat {
  const type = ctx.legendById.get(seat.type) ?? { id: seat.type };
  const price = resolveSeatPrice(seat, ctx.map);
  if (price?.currency) {
    ctx.currencies.add(price.currency);
  }
  ctx.typeCounts.set(seat.type, (ctx.typeCounts.get(seat.type) ?? 0) + 1);

  // §5.1: a seat absent from the state document is available.
  const status = ctx.state?.seats?.[seat.id];

  const rendered: RenderSeat = {
    id: seat.id,
    sectionId: section.id,
    label: seat.label ?? seat.id,
    row: seat.row,
    rowLabel: row.rowLabel,
    rowIndex: row.rowIndex,
    col: seat.col,
    x: seat.x,
    y: seat.y,
    rotation: seat.rotation,
    type,
    typeLabel: resolveLocalizedText(type.label, ctx.locale) ?? type.id,
    typeColor: type.color,
    attributes: seat.attributes ?? [],
    accessibility: seat.accessibility,
    price,
    companions: seat.companions ?? [],
    status: status?.status ?? 'available',
    holdExpires: status?.holdExpires,
    selectable: false,
    source: seat,
  };

  rendered.selectable =
    ctx.selectableStatuses.has(rendered.status) &&
    (ctx.seatSelectable?.(rendered) ?? true);

  ctx.seatsById.set(rendered.id, rendered);
  return rendered;
}

/**
 * Carries elements through with their `id` intact — the pre-1.0 adapter dropped
 * it, leaving the render model with no element identity. A grid-addressed
 * element gets its row's index so the layout can place it in the cell grid.
 */
function buildElements(section: Section, rows: readonly RenderRow[]): RenderElement[] {
  const rowIndexById = new Map(rows.map((r) => [r.id, r.index]));

  return (section.elements ?? []).map((element) => ({
    id: element.id,
    kind: element.kind,
    label: element.label,
    row: element.row,
    rowIndex: element.row !== undefined ? rowIndexById.get(element.row) : undefined,
    col: element.col,
    x: element.x,
    y: element.y,
    width: element.width,
    height: element.height,
    rotation: element.rotation,
    source: element,
  }));
}

/** Sections in `Section.index` order, optionally filtered to an explicit set. */
function selectSections(map: KerusiMap, sectionIds?: readonly string[]): Section[] {
  const all = map.sections ?? [];

  if (sectionIds) {
    // An explicit list is also an explicit order — honor it verbatim.
    return sectionIds
      .map((id) => all.find((s) => s.id === id))
      .filter((s): s is Section => s !== undefined);
  }

  return [...all]
    .map((section, order) => ({ section, order }))
    .sort((a, b) => orderKey(a.section.index, a.order) - orderKey(b.section.index, b.order))
    .map((entry) => entry.section);
}

/**
 * A sort key that keeps entries without an explicit `index` in declaration
 * order, and after every entry that has one.
 */
function orderKey(index: number | undefined, fallbackOrder: number): number {
  return index ?? Number.MAX_SAFE_INTEGER - 1_000_000 + fallbackOrder;
}

/**
 * Kerusi Seat Map document types, transcribed from the Kerusi Seat Map and
 * Availability Format v1.0.0-draft, §4. Field-level comments preserve the
 * normative REQUIRED/OPTIONAL constraints and defaults from the standard.
 *
 * A `KerusiMap` describes a physical venue/vehicle configuration (layout,
 * pricing, seat types). It is static and cacheable; live availability lives
 * in a separate {@link KerusiState} (see kerusi-state.model.ts).
 */

/** A monetary amount, in minor units to avoid floating-point error (§4.8). */
export interface Money {
  /** REQUIRED. Minor units (e.g. cents), to avoid floating-point error. */
  amount: number;
  /** REQUIRED. ISO 4217 currency code, e.g. "MYR", "USD". */
  currency: string;
}

/** A named price tier, referenced by seats via `Seat.priceTier` (§4.8). */
export interface PriceTier {
  /** REQUIRED. */
  id: string;
  label?: string;
  /** REQUIRED. */
  price: Money;
}

/** A legend entry: the vocabulary of seat types used in a map (§4.7). */
export interface SeatType {
  /** REQUIRED. e.g. "standard" | "recliner" | "wheelchair" | "business". */
  id: string;
  label?: string | Record<string, string>;
  /** Suggested render color, hex. Non-normative hint. */
  color?: string;
  defaultPriceTier?: string;
}

/**
 * Purely descriptive row metadata (labels, display order). NOT a container —
 * seats reference a row by id via `Seat.row` rather than nesting inside it
 * (§4.2). Entirely OPTIONAL; a seat MAY carry a free-text `row` with no
 * corresponding `RowMeta`.
 */
export interface RowMeta {
  /** REQUIRED. */
  id: string;
  label?: string;
  /** Display order among rows in the section. */
  index?: number;
  metadata?: Record<string, unknown>;
}

/**
 * A single seat within a section (§4.3). A seat MUST specify `col`, or `x` and
 * `y`, or both — never neither (§4.3.1).
 */
export interface Seat {
  /** REQUIRED. Globally unique within the KerusiMap. */
  id: string;
  /** Display label, e.g. "12" or "12A". Defaults to `id`. */
  label?: string;
  /** References `RowMeta.id`, or a free-text row label. */
  row?: string;
  /** Grid column within the row. */
  col?: number;
  /** 0–100, percent of section width (see `Section.aspectRatio`). */
  x?: number;
  /** 0–100, percent of section height. */
  y?: number;
  /** Degrees. Lets one seat tilt independently of its neighbours. */
  rotation?: number;
  /** REQUIRED. References a `SeatType.id` in the map's `legend`. */
  type: string;
  /** References a `PriceTier.id`. */
  priceTier?: string;
  /** Literal override; takes precedence over `priceTier` (§4.9). */
  price?: Money;
  /** ids of other seats that must be booked together (couple/family bays). */
  companions?: string[];
  /** Free, non-exclusive tags: "aisle" | "window" | "extra-legroom" | ... */
  attributes?: string[];
  metadata?: Record<string, unknown>;
}

/**
 * A non-bookable feature that still requires rendering: screens, stages,
 * exits, lavatories, staircases, or a labelled gap (§4.4). Positioned the same
 * way a seat is — `row`+`col` or `x`/`y`.
 */
export interface Element {
  /** REQUIRED. */
  id: string;
  /** REQUIRED. "screen" | "stage" | "exit" | "lavatory" | "gap" | "aisle" | ... */
  kind: string;
  label?: string;
  row?: string;
  col?: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rotation?: number;
  metadata?: Record<string, unknown>;
}

/**
 * A section holds a FLAT list of seats, not a grid of rows containing seats
 * (§4.1). A seat's position is a property of the seat, which is what makes
 * curves, offsets, and irregular gaps representable.
 */
export interface Section {
  /** REQUIRED. */
  id: string;
  /** String, or locale map: `{ "en": "Orchestra", "ms": "Orkestra" }`. */
  label?: string | Record<string, string>;
  /** Display order among sections. */
  index?: number;
  /** Rendering hint (§4.5). */
  layout?: 'grid' | 'freeform' | 'mixed';
  /**
   * "width:height", e.g. "16:9". Meaningful only for freeform/mixed sections.
   * Default: "1:1".
   */
  aspectRatio?: string;
  /** Optional row metadata (labels, order). NOT a container. */
  rows?: RowMeta[];
  /** REQUIRED. Flat list; order is not significant. */
  seats: Seat[];
  /** Non-bookable features: screens, stages, aisles, stairs. */
  elements?: Element[];
  metadata?: Record<string, unknown>;
}

/** The top-level static seat-map document (§4). */
export interface KerusiMap {
  /** REQUIRED. Spec version this document conforms to. */
  kerusi: '1.0';
  /** REQUIRED. Unique id for this map (e.g. "cinema3-hallA"). */
  id: string;
  /** Human label, e.g. "Hall A". */
  name?: string;
  /**
   * Free-text hint: "cinema" | "flight" | "theatre" | "stadium" | "bus" |
   * "train" | "custom". Non-normative; informational only.
   */
  domain?: string;
  /** BCP-47 language tag. Default: "en". */
  locale?: string;
  /** REQUIRED. Vocabulary of seat types used in this map. */
  legend: SeatType[];
  /** Named price tiers, referenced by id. */
  priceTiers?: PriceTier[];
  /** REQUIRED. */
  sections: Section[];
  metadata?: Record<string, unknown>;
}

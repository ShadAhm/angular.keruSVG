import { KerusiMap, Section } from './kerusi-map.model';
import { KerusiState, KerusiStateDelta } from './kerusi-state.model';
import { resolveSeatPrice } from './kerusi-price';

/**
 * Thrown when a Kerusi document violates a MUST-level rule in the standard.
 * The message names the failing rule and the id that triggered it, so a
 * malformed document is diagnosable rather than surfacing as a generic parse
 * error (spec §4.6, §8).
 */
export class KerusiValidationError extends Error {
  constructor(
    message: string,
    /** Short slug of the violated rule, e.g. "seat-type-reference". */
    readonly rule: string,
    /** The id (seat, section, tier, ...) that triggered the failure, if any. */
    readonly id?: string,
  ) {
    super(message);
    this.name = 'KerusiValidationError';
  }
}

/**
 * Validates a {@link KerusiMap} against the MUST-level rules of spec §4.
 * Throws {@link KerusiValidationError} on the first violation; returns the map
 * unchanged when valid, so it can be used inline.
 *
 * Enforced rules:
 *  - Required members present: `kerusi`, `id`, `legend`, `sections` (§4).
 *  - Every `Seat.type` resolves to a `SeatType.id` in `legend` (§4.6).
 *  - Every `Seat.priceTier` resolves to a `PriceTier.id` (§4.6).
 *  - Every `Seat.row` resolves to a `RowMeta.id` when the section declares
 *    `rows`; opaque free-text otherwise (§4.6).
 *  - Every seat has `col`, or `x`+`y`, or both — never neither (§4.3.1).
 *  - Every `Seat.companions[]` entry resolves to another seat in the SAME
 *    section, and the relationship is symmetric (§4.6).
 *  - All resolved currencies across the map are identical (§4.9).
 */
export function validateKerusiMap(map: KerusiMap): KerusiMap {
  if (!map || typeof map !== 'object') {
    throw new KerusiValidationError('KerusiMap is missing or not an object.', 'map-shape');
  }
  if (!map.kerusi) {
    throw new KerusiValidationError(
      'KerusiMap is missing the required "kerusi" version member.',
      'map-version',
    );
  }
  if (!map.id) {
    throw new KerusiValidationError('KerusiMap is missing the required "id" member.', 'map-id');
  }
  if (!Array.isArray(map.legend)) {
    throw new KerusiValidationError(
      'KerusiMap is missing the required "legend" array.',
      'map-legend',
      map.id,
    );
  }
  if (!Array.isArray(map.sections)) {
    throw new KerusiValidationError(
      'KerusiMap is missing the required "sections" array.',
      'map-sections',
      map.id,
    );
  }

  const seatTypeIds = new Set(map.legend.map((t) => t.id));
  const priceTierIds = new Set((map.priceTiers ?? []).map((t) => t.id));
  const currencies = new Set<string>();

  // Tier-level currencies count toward the single-currency rule regardless of
  // whether a seat references the tier.
  for (const tier of map.priceTiers ?? []) {
    if (tier.price?.currency) {
      currencies.add(tier.price.currency);
    }
  }

  for (const section of map.sections) {
    validateSection(section, map, seatTypeIds, priceTierIds, currencies);
  }

  if (currencies.size > 1) {
    throw new KerusiValidationError(
      `KerusiMap mixes currencies (${[...currencies].sort().join(', ')}); ` +
        'exactly one currency must apply to the whole map (§4.9).',
      'single-currency',
      map.id,
    );
  }

  return map;
}

function validateSection(
  section: Section,
  map: KerusiMap,
  seatTypeIds: Set<string>,
  priceTierIds: Set<string>,
  currencies: Set<string>,
): void {
  const rowIds = section.rows ? new Set(section.rows.map((r) => r.id)) : null;
  const seatIds = new Set(section.seats.map((s) => s.id));
  const companionsBySeat = new Map<string, Set<string>>();

  for (const seat of section.seats) {
    // §4.3.1 positioning.
    const hasCol = seat.col !== undefined && seat.col !== null;
    const hasXY =
      seat.x !== undefined && seat.x !== null && seat.y !== undefined && seat.y !== null;
    if (!hasCol && !hasXY) {
      throw new KerusiValidationError(
        `Seat "${seat.id}" has neither "col" nor "x"+"y"; a seat must specify ` +
          'at least one positioning method (§4.3.1).',
        'seat-position',
        seat.id,
      );
    }

    // §4.6 type reference.
    if (!seatTypeIds.has(seat.type)) {
      throw new KerusiValidationError(
        `Seat "${seat.id}" references unknown type "${seat.type}"; not found in ` +
          'the map legend (§4.6).',
        'seat-type-reference',
        seat.id,
      );
    }

    // §4.6 priceTier reference.
    if (seat.priceTier !== undefined && !priceTierIds.has(seat.priceTier)) {
      throw new KerusiValidationError(
        `Seat "${seat.id}" references unknown priceTier "${seat.priceTier}" (§4.6).`,
        'seat-pricetier-reference',
        seat.id,
      );
    }

    // §4.6 row reference — only when the section declares a rows array.
    if (rowIds && seat.row !== undefined && !rowIds.has(seat.row)) {
      throw new KerusiValidationError(
        `Seat "${seat.id}" references unknown row "${seat.row}"; not found in ` +
          `section "${section.id}" rows (§4.6).`,
        'seat-row-reference',
        seat.id,
      );
    }

    // Collect resolved currency for the single-currency rule (§4.9).
    const price = resolveSeatPrice(seat, map);
    if (price?.currency) {
      currencies.add(price.currency);
    }

    companionsBySeat.set(seat.id, new Set(seat.companions ?? []));
  }

  // §4.6 companion resolution + symmetry.
  for (const [seatId, companions] of companionsBySeat) {
    for (const companionId of companions) {
      if (!seatIds.has(companionId)) {
        throw new KerusiValidationError(
          `Seat "${seatId}" lists companion "${companionId}", which is not a ` +
            `seat in section "${section.id}" (§4.6).`,
          'companion-reference',
          seatId,
        );
      }
      const back = companionsBySeat.get(companionId);
      if (!back || !back.has(seatId)) {
        throw new KerusiValidationError(
          `Companion link is not symmetric: seat "${seatId}" lists "${companionId}", ` +
            `but "${companionId}" does not list "${seatId}" in return (§4.6).`,
          'companion-symmetry',
          seatId,
        );
      }
    }
  }
}

/**
 * Validates a {@link KerusiState} against the MUST-level rules of spec §5.1:
 * `kerusi` and `updatedAt` present, and exactly one of `sessionId`/`mapId`.
 */
export function validateKerusiState(state: KerusiState): KerusiState {
  validateStateEnvelope(state, 'KerusiState');
  if (!state.seats || typeof state.seats !== 'object') {
    throw new KerusiValidationError(
      'KerusiState is missing the required "seats" object.',
      'state-seats',
    );
  }
  return state;
}

/**
 * Validates a {@link KerusiStateDelta} against the MUST-level rules of §5.2:
 * `kerusi` and `updatedAt` present, exactly one of `sessionId`/`mapId`, and a
 * `changes` object.
 */
export function validateKerusiStateDelta(delta: KerusiStateDelta): KerusiStateDelta {
  validateStateEnvelope(delta, 'KerusiStateDelta');
  if (!delta.changes || typeof delta.changes !== 'object') {
    throw new KerusiValidationError(
      'KerusiStateDelta is missing the required "changes" object.',
      'delta-changes',
    );
  }
  return delta;
}

function validateStateEnvelope(
  doc: { kerusi?: string; sessionId?: string; mapId?: string; updatedAt?: string },
  typeName: string,
): void {
  if (!doc || typeof doc !== 'object') {
    throw new KerusiValidationError(`${typeName} is missing or not an object.`, 'state-shape');
  }
  if (!doc.kerusi) {
    throw new KerusiValidationError(
      `${typeName} is missing the required "kerusi" version member.`,
      'state-version',
    );
  }
  if (!doc.updatedAt) {
    throw new KerusiValidationError(
      `${typeName} is missing the required "updatedAt" timestamp.`,
      'state-updatedat',
    );
  }
  const hasSession = doc.sessionId !== undefined && doc.sessionId !== null;
  const hasMap = doc.mapId !== undefined && doc.mapId !== null;
  if (hasSession === hasMap) {
    throw new KerusiValidationError(
      `${typeName} must specify exactly one of "sessionId" or "mapId" ` +
        `(found ${hasSession ? 'both' : 'neither'}) (§5.1).`,
      'state-scope',
    );
  }
}

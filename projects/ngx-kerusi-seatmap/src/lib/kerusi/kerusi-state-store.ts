import { computed, signal, Signal } from '@angular/core';
import { KerusiState, KerusiStateDelta, SeatStatus } from './kerusi-state.model';

/**
 * Live-availability lifecycle: applying deltas in order, noticing when the
 * stream has lost a message, and letting a lapsed hold fall back to available.
 *
 * The pure functions here have no Angular dependency. {@link KerusiStateStore}
 * wraps them in signals for convenience, but it is a plain class — construct it
 * yourself. The seatmap component's `state` input remains the source of truth,
 * so an application that already has its own store is unaffected.
 */

/** What happened when a delta was offered to the store. */
export type DeltaOutcome =
  /** Merged into the state. */
  | 'applied'
  /** `updatedAt` is at or before the current state's; discarded (§5.2). */
  | 'stale'
  /** Identical `updatedAt` to the last applied delta; discarded. */
  | 'duplicate'
  /**
   * The transport's sequence skipped ahead: messages were lost. Applied
   * best-effort, but the consumer SHOULD re-fetch a full state (§5.2).
   */
  | 'gap'
  /** The delta names a different session or map; discarded. */
  | 'scope-mismatch';

export interface DeltaApplication {
  /** The state after the attempt — unchanged when the delta was discarded. */
  state: KerusiState;
  outcome: DeltaOutcome;
  /** Human-readable explanation, for logging a discard. */
  detail?: string;
}

/**
 * Reads a monotonic sequence number off a delta, when the transport supplies
 * one. Returns `undefined` when it does not — see {@link applyStateDeltaOrdered}
 * for why that matters.
 */
export type SequenceReader = (delta: KerusiStateDelta) => number | undefined;

/** Default: a numeric `metadata.seq`, the conventional place to put one. */
export const DEFAULT_SEQUENCE_READER: SequenceReader = (delta) => {
  const seq = (delta as { metadata?: Record<string, unknown> }).metadata?.['seq'];
  return typeof seq === 'number' ? seq : undefined;
};

/**
 * Applies a delta with the §5.2 ordering rules enforced.
 *
 * Three things are checked, in order:
 *
 *  1. **Scope.** A delta whose `sessionId`/`mapId` disagrees with the base state
 *     belongs to a different event and is discarded.
 *  2. **Ordering.** `updatedAt` is REQUIRED to be strictly increasing per
 *     session/map, so a delta at or before the state's timestamp is stale.
 *  3. **Gaps.** Reported only when `sequenceOf` yields a number and it skips
 *     ahead of the last one seen. This is a deliberate limitation:
 *     `updatedAt` is guaranteed strictly increasing but *not* contiguous, so
 *     "delta N+2 arrived after N" is indistinguishable from "N+1 never
 *     existed". Gap detection therefore needs a sequence the transport
 *     provides. A gap still applies the delta — showing slightly-wrong
 *     availability beats showing none while the consumer re-fetches.
 */
export function applyStateDeltaOrdered(
  base: KerusiState,
  delta: KerusiStateDelta,
  opts: { sequenceOf?: SequenceReader; lastSequence?: number } = {},
): DeltaApplication {
  const scope = scopeMismatch(base, delta);
  if (scope) {
    return { state: base, outcome: 'scope-mismatch', detail: scope };
  }

  if (delta.updatedAt === base.updatedAt) {
    return {
      state: base,
      outcome: 'duplicate',
      detail: `Delta updatedAt "${delta.updatedAt}" equals the current state's; ignored.`,
    };
  }
  if (delta.updatedAt < base.updatedAt) {
    return {
      state: base,
      outcome: 'stale',
      detail:
        `Delta updatedAt "${delta.updatedAt}" precedes the current state's ` +
        `"${base.updatedAt}"; discarded (§5.2).`,
    };
  }

  const state: KerusiState = {
    ...base,
    updatedAt: delta.updatedAt,
    seats: { ...base.seats, ...delta.changes },
  };

  const sequenceOf = opts.sequenceOf ?? DEFAULT_SEQUENCE_READER;
  const seq = sequenceOf(delta);
  if (seq !== undefined && opts.lastSequence !== undefined && seq > opts.lastSequence + 1) {
    return {
      state,
      outcome: 'gap',
      detail:
        `Delta sequence ${seq} follows ${opts.lastSequence}: ` +
        `${seq - opts.lastSequence - 1} message(s) were lost. Re-fetch a full ` +
        'KerusiState (§5.2).',
    };
  }

  return { state, outcome: 'applied' };
}

/** Why the delta does not belong to this state, or `undefined` when it does. */
function scopeMismatch(base: KerusiState, delta: KerusiStateDelta): string | undefined {
  if (base.sessionId !== undefined && delta.sessionId !== undefined) {
    return base.sessionId === delta.sessionId
      ? undefined
      : `Delta targets session "${delta.sessionId}", state is "${base.sessionId}".`;
  }
  if (base.mapId !== undefined && delta.mapId !== undefined) {
    return base.mapId === delta.mapId
      ? undefined
      : `Delta targets map "${delta.mapId}", state is "${base.mapId}".`;
  }
  // One side is scoped by session and the other by map: they cannot be
  // compared, so accept rather than invent a mismatch.
  return undefined;
}

/**
 * Reverts every seat whose hold has lapsed to `"available"` (§5.1). Returns the
 * same state object when nothing changed, so a signal reading it does not fire.
 *
 * A `held` seat with no `holdExpires` never lapses — the spec makes the field
 * optional, and an absent expiry means the hold is managed elsewhere.
 */
export function expireHolds(state: KerusiState, now: string | Date = new Date()): KerusiState {
  const nowMs = typeof now === 'string' ? Date.parse(now) : now.getTime();
  let changed = false;
  const seats: Record<string, SeatStatus> = {};

  for (const [seatId, status] of Object.entries(state.seats ?? {})) {
    if (status.status === 'held' && status.holdExpires && Date.parse(status.holdExpires) <= nowMs) {
      seats[seatId] = { status: 'available' };
      changed = true;
    } else {
      seats[seatId] = status;
    }
  }

  return changed ? { ...state, seats } : state;
}

/** A seat currently held, with how long is left on it. */
export interface HeldSeat {
  seatId: string;
  expiresAt: string;
  /** Milliseconds until expiry; negative once lapsed. */
  msRemaining: number;
}

/**
 * A signal-backed live view of a {@link KerusiState}.
 *
 * Construct it directly — `new KerusiStateStore(initialState)` — and feed it
 * deltas from whatever transport you use. It is deliberately not an
 * `@Injectable`: this is a rendering library, and an application that already
 * owns its availability state should keep owning it.
 */
export class KerusiStateStore {
  private readonly _state;
  private readonly _needsRefetch = signal(false);
  private readonly _now;
  private readonly clock: () => Date;
  private readonly sequenceOf: SequenceReader;
  private lastSequence: number | undefined;

  constructor(initial: KerusiState, opts: { now?: () => Date; sequenceOf?: SequenceReader } = {}) {
    this._state = signal(initial);
    this.clock = opts.now ?? (() => new Date());
    this.sequenceOf = opts.sequenceOf ?? DEFAULT_SEQUENCE_READER;
    this._now = signal(this.clock());
  }

  /** The current availability snapshot. */
  get state(): Signal<KerusiState> {
    return this._state.asReadonly();
  }

  /** The timestamp of the most recently applied document. */
  readonly updatedAt = computed(() => this._state().updatedAt);

  /**
   * True once a gap was detected in the delta stream. The consumer SHOULD
   * re-fetch a full `KerusiState` and hand it to {@link reset} (§5.2).
   */
  get needsRefetch(): Signal<boolean> {
    return this._needsRefetch.asReadonly();
  }

  /** Every currently-held seat, with the time left on its hold. */
  readonly heldSeats = computed<readonly HeldSeat[]>(() => {
    const nowMs = this._now().getTime();
    return Object.entries(this._state().seats ?? {})
      .filter(([, s]) => s.status === 'held' && !!s.holdExpires)
      .map(([seatId, s]) => ({
        seatId,
        expiresAt: s.holdExpires!,
        msRemaining: Date.parse(s.holdExpires!) - nowMs,
      }))
      .sort((a, b) => a.msRemaining - b.msRemaining);
  });

  /** Offers a delta to the store. Returns what happened to it. */
  apply(delta: KerusiStateDelta): DeltaApplication {
    const result = applyStateDeltaOrdered(this._state(), delta, {
      sequenceOf: this.sequenceOf,
      lastSequence: this.lastSequence,
    });

    if (result.outcome === 'applied' || result.outcome === 'gap') {
      this._state.set(result.state);
      const seq = this.sequenceOf(delta);
      if (seq !== undefined) {
        this.lastSequence = seq;
      }
    }
    if (result.outcome === 'gap') {
      this._needsRefetch.set(true);
    }

    return result;
  }

  /**
   * Replaces the state wholesale — the post-refetch path. Clears the
   * refetch flag and forgets the delta sequence.
   */
  reset(state: KerusiState): void {
    this._state.set(state);
    this._needsRefetch.set(false);
    this.lastSequence = undefined;
    this._now.set(this.clock());
  }

  /** Reverts lapsed holds and refreshes `heldSeats` countdowns. */
  tick(): void {
    const now = this.clock();
    this._now.set(now);
    const next = expireHolds(this._state(), now);
    if (next !== this._state()) {
      this._state.set(next);
    }
  }

  /**
   * Runs {@link tick} on an interval. Returns a function that stops it — call
   * that from `DestroyRef.onDestroy` or `ngOnDestroy`.
   */
  startExpiryTicker(intervalMs = 1000): () => void {
    const handle = setInterval(() => this.tick(), intervalMs);
    return () => clearInterval(handle);
  }
}

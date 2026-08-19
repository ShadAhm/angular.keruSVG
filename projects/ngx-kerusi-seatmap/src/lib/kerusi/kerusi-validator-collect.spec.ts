import { describe, expect, it } from 'vitest';
import { KerusiMap } from './kerusi-map.model';
import { KerusiSession, KerusiState } from './kerusi-state.model';
import { BUS_MAP } from './kerusi-examples.fixture';
import {
  checkKerusiMap,
  checkKerusiSession,
  checkKerusiState,
  checkKerusiStateDelta,
  errorsOf,
  KerusiValidationError,
  validateDocumentSet,
  validateKerusiMap,
  validateKerusiSession,
} from './kerusi-validator';

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

describe('checkKerusiMap — non-throwing collection', () => {
  it('returns an empty array for a valid document', () => {
    expect(checkKerusiMap(BUS_MAP)).toEqual([]);
  });

  it('collects every fault instead of stopping at the first', () => {
    const map = clone(BUS_MAP);
    map.sections[0].seats[0].type = 'nope';
    map.sections[0].seats[1].priceTier = 'nope';
    map.sections[0].seats[2].companions = ['ghost'];

    expect(checkKerusiMap(map).map((v) => v.rule)).toEqual([
      'seat-type-reference',
      'seat-pricetier-reference',
      'companion-reference',
    ]);
  });

  it('throws the first collected error, and carries the rest along', () => {
    const map = clone(BUS_MAP);
    map.sections[0].seats[0].type = 'nope';
    map.sections[0].seats[1].type = 'also-nope';

    const collected = checkKerusiMap(map);
    try {
      validateKerusiMap(map);
      throw new Error('expected throw');
    } catch (e) {
      const err = e as KerusiValidationError;
      expect(err.rule).toBe(collected[0].rule);
      expect(err.id).toBe(collected[0].id);
      expect(err.violations).toHaveLength(2);
    }
  });

  it('does not throw for warning-severity findings', () => {
    const map = clone(BUS_MAP);
    map.sections[0].seats[0].accessibility = { transferArmrest: 'sideways' as never };

    const violations = checkKerusiMap(map);
    expect(violations.map((v) => v.rule)).toEqual(['accessibility-transfer-armrest']);
    expect(violations[0].severity).toBe('warning');
    expect(errorsOf(violations)).toEqual([]);
    expect(() => validateKerusiMap(map)).not.toThrow();
  });

  it('returns a shape violation for malformed input rather than crashing', () => {
    for (const bad of [null, undefined, 42, 'a map', []]) {
      const violations = checkKerusiMap(bad);
      expect(violations.length).toBeGreaterThan(0);
      expect(violations[0].severity).toBe('error');
    }
  });

  it('stops walking when legend or sections are missing, to keep the report readable', () => {
    expect(checkKerusiMap({ kerusi: '1.0', id: 'm' }).map((v) => v.rule)).toEqual([
      'map-legend',
      'map-sections',
    ]);
  });
});

describe('version negotiation', () => {
  it('accepts a future minor version — unknown members are ignored, not rejected', () => {
    const map = clone(BUS_MAP);
    map.kerusi = '1.4' as never;
    expect(checkKerusiMap(map)).toEqual([]);
  });

  it('rejects a different major version', () => {
    const map = clone(BUS_MAP);
    map.kerusi = '2.0' as never;
    expect(checkKerusiMap(map).map((v) => v.rule)).toEqual(['map-version-unsupported']);
  });

  it('applies the same rule to states, deltas and sessions', () => {
    expect(
      checkKerusiState({ kerusi: '3.0', mapId: 'm', updatedAt: 't', seats: {} }).map((v) => v.rule),
    ).toContain('state-version-unsupported');
    expect(
      checkKerusiStateDelta({ kerusi: '3.0', mapId: 'm', updatedAt: 't', changes: {} }).map(
        (v) => v.rule,
      ),
    ).toContain('delta-version-unsupported');
    expect(
      checkKerusiSession({ kerusi: '3.0', id: 's', mapId: 'm' }).map((v) => v.rule),
    ).toContain('session-version-unsupported');
  });
});

describe('id uniqueness', () => {
  it('rejects a duplicate seat id across sections (§4.3 global uniqueness)', () => {
    const map = clone(BUS_MAP);
    map.sections.push({ ...clone(map.sections[0]), id: 'upper' });
    expect(checkKerusiMap(map).map((v) => v.rule)).toEqual([
      'seat-id-duplicate',
      'seat-id-duplicate',
      'seat-id-duplicate',
      'seat-id-duplicate',
    ]);
  });

  it('rejects a duplicate section id', () => {
    const map = clone(BUS_MAP);
    map.sections.push({ id: map.sections[0].id, layout: 'grid', seats: [] });
    expect(checkKerusiMap(map).map((v) => v.rule)).toEqual(['section-id-duplicate']);
  });
});

describe('§4.4 element validation', () => {
  const withElements = (elements: unknown[]): KerusiMap => {
    const map = clone(BUS_MAP);
    map.sections[0].elements = elements as never;
    return map;
  };

  it('requires id and kind', () => {
    expect(checkKerusiMap(withElements([{ kind: 'exit', col: 3 }])).map((v) => v.rule)).toEqual([
      'element-id',
    ]);
    expect(checkKerusiMap(withElements([{ id: 'e1', col: 3 }])).map((v) => v.rule)).toEqual([
      'element-kind',
    ]);
  });

  it('rejects a duplicate element id within a section', () => {
    const violations = checkKerusiMap(
      withElements([
        { id: 'e1', kind: 'exit', col: 3 },
        { id: 'e1', kind: 'exit', col: 6 },
      ]),
    );
    expect(violations.map((v) => v.rule)).toEqual(['element-id-duplicate']);
  });

  it('warns, rather than rejects, an unpositioned element', () => {
    const violations = checkKerusiMap(withElements([{ id: 'e1', kind: 'gap' }]));
    expect(violations.map((v) => v.rule)).toEqual(['element-position']);
    expect(violations[0].severity).toBe('warning');
  });

  it('warns when an element is addressed in the other mode from its section', () => {
    const violations = checkKerusiMap(withElements([{ id: 'e1', kind: 'exit', x: 50, y: 50 }]));
    expect(violations.map((v) => v.rule)).toEqual(['element-position-mode']);
    expect(violations[0].severity).toBe('warning');
  });
});

describe('§5.3 sessions and document joins', () => {
  const session: KerusiSession = { kerusi: '1.0', id: 'sess-1', mapId: BUS_MAP.id };
  const state: KerusiState = {
    kerusi: '1.0',
    sessionId: 'sess-1',
    updatedAt: '2026-08-19T00:00:00Z',
    seats: {},
  };

  it('requires kerusi, id and mapId on a session', () => {
    expect(checkKerusiSession({ kerusi: '1.0' }).map((v) => v.rule)).toEqual([
      'session-id',
      'session-mapid',
    ]);
    expect(() => validateKerusiSession(session)).not.toThrow();
  });

  it('accepts a consistent map/session/state trio', () => {
    expect(validateDocumentSet({ map: BUS_MAP, session, state })).toEqual([]);
  });

  it('rejects a session pointing at a different map', () => {
    const wrong = { ...session, mapId: 'other-bus' };
    expect(validateDocumentSet({ map: BUS_MAP, session: wrong }).map((v) => v.rule)).toEqual([
      'session-map-mismatch',
    ]);
  });

  it('rejects a state pointing at a different map', () => {
    const wrong: KerusiState = { ...state, sessionId: undefined, mapId: 'other-bus' };
    expect(validateDocumentSet({ map: BUS_MAP, state: wrong }).map((v) => v.rule)).toEqual([
      'state-map-mismatch',
    ]);
  });

  it('rejects a state pointing at a different session', () => {
    const wrong: KerusiState = { ...state, sessionId: 'sess-2' };
    expect(validateDocumentSet({ map: BUS_MAP, session, state: wrong }).map((v) => v.rule)).toEqual(
      ['state-session-mismatch'],
    );
  });
});

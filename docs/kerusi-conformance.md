# Kerusi conformance report

Which parts of the **Kerusi Seat Map and Availability Format** this library
implements, and which it does not.

|               |                                                                                                                          |
| ------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Library       | `ngx-keruc-seatpicker` (this repository)                                                                                 |
| Spec assessed | [Kerusi standard v1.0.0-draft, rev 8](https://github.com/ShadAhm/kerusi/blob/master/RFC/kerusi-standard_v1.0.0-draft.md) |
| Date          | 2026-08-18                                                                                                               |

**Headline:** the library is a **conformant consumer** by the spec's own §8
definition — it merges state by `Seat.id`, enforces §4.6 referential integrity
including companion symmetry, applies the §4.9 price-resolution order, and
ignores unrecognized members. The gaps are almost entirely in the **rendering
and application layer**: data the adapter faithfully parses but the component
never draws or acts on (pricing, seat types, attributes, localized labels), and
lifecycle concerns with no home in a pure renderer (hold expiry, delta
transport, sessions).

Status key: ✅ supported · ⚠️ partial · ❌ not supported

---

## §3 Document types

| Type               | Status | Notes                                                                                                                    |
| ------------------ | ------ | ------------------------------------------------------------------------------------------------------------------------ |
| `KerusiMap`        | ✅     | Typed, validated, adapted, rendered.                                                                                     |
| `KerusiState`      | ✅     | Typed, validated, merged by `Seat.id`; sparse rule honored.                                                              |
| `KerusiStateDelta` | ⚠️     | Typed and merged by `applyStateDelta`, but see §5.2 below.                                                               |
| `KerusiSession`    | ⚠️     | Type only. Nothing consumes it — no validator, and no check that a state's `sessionId` resolves to a session or its map. |

## §4 KerusiMap

| Field                      | Status | Notes                                                                                            |
| -------------------------- | ------ | ------------------------------------------------------------------------------------------------ |
| `kerusi`                   | ⚠️     | Presence is required, but the **value is never checked** — a `"2.0"` document would be accepted. |
| `id`, `sections`, `legend` | ✅     | Required-presence validated.                                                                     |
| `name`                     | ❌     | Never displayed.                                                                                 |
| `domain`                   | ✅     | Correctly ignored — the spec marks it non-normative and forbids validating on it.                |
| `locale`                   | ❌     | Ignored entirely.                                                                                |
| `priceTiers`               | ⚠️     | Resolved and validated; never rendered (see §4.8/§4.9).                                          |
| `metadata`                 | ⚠️     | Accepted and preserved on input types, but never surfaced on adapted output.                     |

## §4.1 Section / §4.2 RowMeta

| Feature                                | Status | Notes                                                                                                                                                                                                                                     |
| -------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `seats` as a flat list                 | ✅     | Grouped into render rows by `Seat.row`.                                                                                                                                                                                                   |
| `rows` (RowMeta) labels, `index`       | ✅     | Used for row naming and ordering.                                                                                                                                                                                                         |
| `Section.index` ordering               | ✅     | Sections are emitted in `index` order.                                                                                                                                                                                                    |
| **Sections as render units**           | ❌     | All sections **flatten into one continuous row list**. There is no per-section heading, canvas, or grouping, and `Section.label` (with its locale map) is never rendered. The adapter's `sectionId` option renders one section at a time. |
| Per-section `layout`/`aspectRatio`     | ⚠️     | An adapt result carries **one** `layout` and **one** `aspectRatio`. A map mixing grid and freeform sections resolves to `freeform` for all of them, and only the last freeform section's `aspectRatio` survives.                          |
| `"mixed"` layout                       | ⚠️     | Treated as freeform wholesale; per-seat mode switching within a section is not done.                                                                                                                                                      |
| `Section.metadata`, `RowMeta.metadata` | ❌     | Never surfaced.                                                                                                                                                                                                                           |

## §4.3 Seat

| Field                             | Status | Notes                                                                                                                                                             |
| --------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`, `label`, `row`              | ✅     | `id` → `uniqueName`, `label` (defaulting to `id`) → `displayName`.                                                                                                |
| `col` (grid)                      | ✅     | Sorted by column; skipped columns become aisle spacers (§4.3.2).                                                                                                  |
| `x` / `y` (freeform)              | ✅     | Rendered natively as percentage coordinates.                                                                                                                      |
| `rotation`                        | ✅     | Applied as an SVG rotation about the seat center.                                                                                                                 |
| `type`                            | ⚠️     | Validated against `legend` and exposed on `AdaptedSeat.type` — but does **not** affect rendering. Every seat type draws identically.                              |
| `priceTier` / `price`             | ⚠️     | Resolved correctly; never displayed.                                                                                                                              |
| `companions`                      | ⚠️     | Validated for symmetry and exposed, but there is **no booking behavior** — selecting one seat of a couple does not select its partner.                            |
| `attributes`                      | ⚠️     | Passed through on `AdaptedSeat.attributes`; not rendered, not filterable.                                                                                         |
| `metadata`                        | ❌     | Not surfaced on adapted output.                                                                                                                                   |
| **§4.3.1** `col` + `x`/`y`        | ⚠️     | `x`/`y` correctly wins for visual placement. The spec's second purpose for `col` — **logical adjacency for keyboard and screen-reader order** — is unimplemented. |
| **§4.3.2** no filler objects      | ✅     | Gaps are skipped columns or absent seats; no placeholder seats are emitted.                                                                                       |
| **§4.3.3** `type` vs `attributes` | ✅     | Attributes never influence price.                                                                                                                                 |

## §4.4 Element

| Feature                             | Status | Notes                                                                                                                       |
| ----------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------- |
| Rendering elements                  | ⚠️     | Drawn in **freeform layout only**. In grid layout the `elements` input is ignored entirely.                                 |
| `x`/`y`/`width`/`height`/`rotation` | ✅     | Percentage geometry, rendered and rotatable.                                                                                |
| `label`                             | ✅     | Drawn centered on the element.                                                                                              |
| `row` / `col` positioning           | ❌     | Grid-addressed elements (an element sitting in a row's flow) are not supported.                                             |
| `kind`                              | ⚠️     | Carried but purely informational — every kind renders as the same labelled rectangle. No screen/stage/exit-specific shapes. |
| `id`                                | ❌     | Dropped during adaptation; the render model has no element identity.                                                        |
| Validation                          | ❌     | Elements are not validated at all (`id` and `kind` are REQUIRED by the spec but unchecked).                                 |

## §4.5 Positioning modes

| Feature                          | Status | Notes                                                                          |
| -------------------------------- | ------ | ------------------------------------------------------------------------------ |
| Grid geometry                    | ✅     | Original ported layout.                                                        |
| Freeform x/y                     | ✅     | Native.                                                                        |
| `aspectRatio` undistorted canvas | ✅     | A letterboxed content box preserves proportions, rotation, and element sizing. |
| Inferring layout when omitted    | ✅     | Any seat with `x`/`y` ⇒ freeform, otherwise grid.                              |

## §4.6 Referential integrity

| Rule                                                | Status                                            |
| --------------------------------------------------- | ------------------------------------------------- |
| `Seat.type` resolves in `legend`                    | ✅                                                |
| `Seat.priceTier` resolves in `priceTiers`           | ✅                                                |
| `Seat.row` resolves in `Section.rows` when declared | ✅                                                |
| `Seat.companions[]` resolve within the same section | ✅                                                |
| `companions` fully symmetric                        | ✅                                                |
| Errors identify the failing rule and id             | ✅ `KerusiValidationError` carries `rule` + `id`. |

## §4.7–§4.9 Seat types and pricing

| Feature                   | Status | Notes                                                                                                                           |
| ------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------- |
| Price-resolution order    | ✅     | `price` → `priceTier` → `type.defaultPriceTier` → unpriced, via `resolveSeatPrice`.                                             |
| One-currency-per-map rule | ✅     | Validated across seats and tiers.                                                                                               |
| Money in minor units      | ✅     | Passed through untouched.                                                                                                       |
| **Displaying price**      | ❌     | The component never renders a price, tier, or total. (The demo computes its own total from `AdaptedSeat.price`.)                |
| `SeatType.label`          | ❌     | Not rendered; no legend UI is generated from the map.                                                                           |
| `SeatType.color`          | ❌     | The spec's suggested render color is **ignored** — seat fills come from availability only, so a map cannot color its own types. |

## §5 State, deltas, sessions

| Feature                                       | Status | Notes                                                                                                                                                                                                                                                                       |
| --------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Merge by `Seat.id`                            | ✅     |                                                                                                                                                                                                                                                                             |
| Sparse rule (absent ⇒ available)              | ✅     |                                                                                                                                                                                                                                                                             |
| `available`/`booked`/`held`/`blocked`         | ✅     | Four distinct render states; held and blocked are non-selectable.                                                                                                                                                                                                           |
| Exactly one of `sessionId`/`mapId`            | ✅     | Validated.                                                                                                                                                                                                                                                                  |
| `holdExpires`                                 | ❌     | Typed and carried, never acted on — no countdown, and no automatic revert when a hold lapses.                                                                                                                                                                               |
| **§5.2** delta application                    | ⚠️     | `applyStateDelta` merges correctly (explicit `"available"` reverts, omission means unchanged), but **`updatedAt` ordering is not enforced**: out-of-order deltas are not detected or discarded, and the spec's "re-fetch on a sequence gap" guidance is left to the caller. |
| Delta transport                               | ❌     | No WebSocket/SSE layer — this is a renderer, not a client.                                                                                                                                                                                                                  |
| **§5.3** sessions                             | ❌     | No session-aware API; nothing verifies a state's `sessionId` against a `KerusiSession` or its `mapId`.                                                                                                                                                                      |
| `KerusiState.metadata`, `SeatStatus.metadata` | ❌     | Not surfaced.                                                                                                                                                                                                                                                               |

## §8 Conformance / §9 Interchange

| Requirement                                    | Status | Notes                                                                                    |
| ---------------------------------------------- | ------ | ---------------------------------------------------------------------------------------- |
| Merge state by `Seat.id`                       | ✅     |                                                                                          |
| Enforce §4.6 incl. companion symmetry          | ✅     |                                                                                          |
| Apply §4.9 price order                         | ✅     |                                                                                          |
| Ignore unrecognized members                    | ✅     | Unknown fields pass through untouched; nothing is rejected for them.                     |
| Published JSON Schema (§9)                     | ❌     | None shipped; validation is the hand-written TypeScript validator only.                  |
| `.kerusi.json` / `application/vnd.kerusi+json` | ❌     | No loader, fetch helper, or media-type handling — callers supply already-parsed objects. |
| Version negotiation                            | ❌     | The `kerusi` member's value is not checked.                                              |

## §11 Open issues (unsupported by extension)

| Issue                       | Status | Notes                                                                                                                                                                                     |
| --------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Accessibility               | ❌     | No keyboard navigation, focus management, ARIA roles, or screen-reader ordering. Seats are clickable `<g>` elements. `wheelchair` is carried as a free-text attribute but drives nothing. |
| Right-to-left row direction | ❌     | Rendering is always left-to-right; `locale` is ignored.                                                                                                                                   |
| Multi-leg / multi-day       | ❌     | Out of scope for a renderer.                                                                                                                                                              |
| Labelled gaps               | ⚠️     | Works as a freeform `Element`; there is no grid-addressed equivalent.                                                                                                                     |

---

## The gaps that matter most

1. **Nothing in the map can influence how a seat looks.** `SeatType.color`,
   `type`, `attributes`, and price are all parsed, validated, and exposed — then
   ignored by the renderer, which colors purely by availability. This is the
   biggest divergence between "we understand the document" and "we draw the
   document."
2. **Sections don't survive as structure.** A multi-section venue renders as one
   undifferentiated run of rows, with no section labels and a single layout mode
   for the whole map.
3. **Accessibility is absent**, including the navigation-order use of `col` that
   §4.3.1 explicitly calls out.
4. **State lifecycle is caller-owned**: hold expiry and delta ordering/gap
   recovery are both defined by the spec but delegated entirely to the consumer.

None of these are blocked by the format — they are unbuilt UI and application
behavior, not modelling limitations.

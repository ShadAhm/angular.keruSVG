/**
 * @deprecated Legacy `SeatRow[]` renderer model. `<kerusi-seatmap>` uses the
 * Kerusi status vocabulary (`available` | `held` | `booked` | `blocked`) plus a
 * separate selection set, instead of conflating the two.
 */
export enum SeatState {
  Vacant = 0,
  Occupied = 1,
  Selected = 2,
  /** Temporarily reserved mid-checkout (Kerusi "held"). Not selectable. */
  Held = 3,
  /** Withheld from sale by the venue (Kerusi "blocked"). Not selectable. */
  Blocked = 4,
}

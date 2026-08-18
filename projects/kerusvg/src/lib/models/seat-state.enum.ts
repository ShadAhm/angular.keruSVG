export enum SeatState {
  Vacant = 0,
  Occupied = 1,
  Selected = 2,
  /** Temporarily reserved mid-checkout (Kerusi "held"). Not selectable. */
  Held = 3,
  /** Withheld from sale by the venue (Kerusi "blocked"). Not selectable. */
  Blocked = 4,
}

/**
 * @deprecated Legacy `SeatRow[]` renderer model. Use the Kerusi-native
 * `<kerusi-seatmap>` component, which positions seats from `Seat.col` or
 * `Seat.x`/`Seat.y` and needs no filler nodes.
 */
export enum NodeType {
  Spacer = 0,
  Seat = 1,
}

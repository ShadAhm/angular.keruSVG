/**
 * A non-bookable feature drawn on the seat map — a screen, stage, exit, or any
 * other labelled fixture. This is the renderer's counterpart to a Kerusi
 * `Element` (standard §4.4). Positions are percent-based (0–100) of the section
 * canvas, matching {@link SeatNode} freeform coordinates, and are used only by
 * the freeform layout.
 */
/** @deprecated Legacy renderer model. Use `RenderElement`. */
export interface SeatElement {
  /** Free-text kind, e.g. "screen" | "stage" | "exit". Informational. */
  kind: string;
  /** Text drawn on the element, e.g. "SCREEN". */
  label?: string;
  /** Center X, 0–100 percent of the section canvas. */
  x?: number;
  /** Center Y, 0–100 percent of the section canvas. */
  y?: number;
  /** Width as a percent (0–100) of the section canvas. */
  width?: number;
  /** Height as a percent (0–100) of the section canvas. */
  height?: number;
  /** Rotation in degrees about the element's center. */
  rotation?: number;
}

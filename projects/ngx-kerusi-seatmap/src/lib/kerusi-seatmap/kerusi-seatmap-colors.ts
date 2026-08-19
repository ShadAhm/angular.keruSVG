import { RenderSeat } from '../render/render-model';

/**
 * Theming for `<kerusi-seatmap>`.
 *
 * The pre-1.0 renderer colored purely by availability, so `SeatType.color` — the
 * spec's own suggested render color (§4.7) — was parsed and then ignored, and a
 * map could not color its own types. Here availability still wins where it must
 * (a booked seat must read as booked) but an available seat takes its type's
 * color when the document supplies one.
 */
export interface KerusiSeatmapColors {
  /** An available seat with no type color. */
  availableBg?: string;
  availableFg?: string;
  /** A seat the user has picked. Always wins over every other state. */
  selectedBg?: string;
  selectedFg?: string;
  /** Sold. */
  bookedBg?: string;
  bookedFg?: string;
  /** Someone else's checkout in progress. */
  heldBg?: string;
  heldFg?: string;
  /** Withheld by the venue. */
  blockedBg?: string;
  blockedFg?: string;

  /** Non-bookable features: screens, stages, lavatories. */
  elementBg?: string;
  elementFg?: string;
  /** Exits and doors, which should stand out from other fixtures. */
  elementAccentBg?: string;
  elementAccentFg?: string;
  /** Aisles, gaps and other deliberately empty space. */
  elementMutedBg?: string;
  elementMutedFg?: string;

  /** The keyboard focus ring. */
  focusRing?: string;
  /** Behind the seating area. `transparent` by default. */
  backdrop?: string;
}

export const DEFAULT_KERUSI_COLORS: Required<KerusiSeatmapColors> = {
  availableBg: '#76d75d',
  availableFg: '#123a08',
  selectedBg: '#7854af',
  selectedFg: '#f3ecff',
  bookedBg: '#f56979',
  bookedFg: '#5e0c17',
  heldBg: '#e6a817',
  heldFg: '#4a3500',
  blockedBg: '#5a616e',
  blockedFg: '#d2d7df',
  elementBg: '#d7deea',
  elementFg: '#3a4353',
  elementAccentBg: '#4c8bf5',
  elementAccentFg: '#ffffff',
  elementMutedBg: '#eef1f6',
  elementMutedFg: '#6b7385',
  focusRing: '#1b1f27',
  backdrop: 'transparent',
};

/**
 * The fill for a seat, in precedence order:
 *
 *   selected → blocked → booked → held → `SeatType.color` → available
 *
 * Availability outranks the type color because a sold seat that renders in its
 * type's color is a booking bug waiting to happen. Attributes never affect the
 * fill — §4.3.3 makes them descriptive tags, not a rendering category.
 */
export function seatFill(
  seat: RenderSeat,
  selected: boolean,
  colors: Required<KerusiSeatmapColors>,
  useTypeColors: boolean,
): string {
  if (selected) {
    return colors.selectedBg;
  }
  switch (seat.status) {
    case 'blocked':
      return colors.blockedBg;
    case 'booked':
      return colors.bookedBg;
    case 'held':
      return colors.heldBg;
    default:
      return (useTypeColors && seat.typeColor) || colors.availableBg;
  }
}

/** The label color to pair with {@link seatFill}. */
export function seatTextFill(
  seat: RenderSeat,
  selected: boolean,
  colors: Required<KerusiSeatmapColors>,
  useTypeColors: boolean,
): string {
  if (selected) {
    return colors.selectedFg;
  }
  switch (seat.status) {
    case 'blocked':
      return colors.blockedFg;
    case 'booked':
      return colors.bookedFg;
    case 'held':
      return colors.heldFg;
    default:
      return useTypeColors && seat.typeColor
        ? readableOn(seat.typeColor)
        : colors.availableFg;
  }
}

/** Element fill for a shape tone. */
export function elementFill(
  tone: 'neutral' | 'accent' | 'muted',
  colors: Required<KerusiSeatmapColors>,
): string {
  return tone === 'accent'
    ? colors.elementAccentBg
    : tone === 'muted'
      ? colors.elementMutedBg
      : colors.elementBg;
}

/** Element label color for a shape tone. */
export function elementTextFill(
  tone: 'neutral' | 'accent' | 'muted',
  colors: Required<KerusiSeatmapColors>,
): string {
  return tone === 'accent'
    ? colors.elementAccentFg
    : tone === 'muted'
      ? colors.elementMutedFg
      : colors.elementFg;
}

/**
 * Black or white, whichever reads better on the given color. Used only for a
 * `SeatType.color` the document chose, where the library cannot know what
 * foreground the author intended.
 *
 * Uses the WCAG relative-luminance formula rather than a naive channel average,
 * so a saturated green and a saturated blue of the same average brightness get
 * the contrast each actually needs.
 */
export function readableOn(background: string): string {
  const rgb = parseHex(background);
  if (!rgb) {
    return '#000000';
  }
  const [r, g, b] = rgb.map((channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.179 ? '#000000' : '#ffffff';
}

/** `#rgb` or `#rrggbb` to channel values. Returns `undefined` for anything else. */
function parseHex(color: string): [number, number, number] | undefined {
  const hex = color.trim().replace(/^#/, '');
  const full =
    hex.length === 3
      ? hex
          .split('')
          .map((c) => c + c)
          .join('')
      : hex;
  if (!/^[0-9a-f]{6}$/i.test(full)) {
    return undefined;
  }
  return [
    Number.parseInt(full.slice(0, 2), 16),
    Number.parseInt(full.slice(2, 4), 16),
    Number.parseInt(full.slice(4, 6), 16),
  ];
}

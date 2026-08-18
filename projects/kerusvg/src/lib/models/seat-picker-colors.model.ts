export interface SeatPickerColors {
  vacantColourBg?: string;
  vacantColourFg?: string;
  occupiedColourBg?: string;
  occupiedColourFg?: string;
  selectedColourBg?: string;
  selectedColourFg?: string;
  heldColourBg?: string;
  heldColourFg?: string;
  blockedColourBg?: string;
  blockedColourFg?: string;
  elementColourBg?: string;
  elementColourFg?: string;
  backDropColour?: string;
}

export const DEFAULT_COLORS: Required<SeatPickerColors> = {
  vacantColourBg: '#76D75D',
  vacantColourFg: '#C1F2B4',
  occupiedColourBg: '#F56979',
  occupiedColourFg: '#BB1F31',
  selectedColourBg: '#7854AF',
  selectedColourFg: '#472085',
  heldColourBg: '#E6A817',
  heldColourFg: '#6B4A00',
  blockedColourBg: '#5A616E',
  blockedColourFg: '#20242C',
  elementColourBg: '#D7DEEA',
  elementColourFg: '#3A4353',
  backDropColour: 'transparent',
};

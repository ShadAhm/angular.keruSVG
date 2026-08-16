export interface SeatPickerColors {
  vacantColourBg?: string;
  vacantColourFg?: string;
  occupiedColourBg?: string;
  occupiedColourFg?: string;
  selectedColourBg?: string;
  selectedColourFg?: string;
  backDropColour?: string;
}

export const DEFAULT_COLORS: Required<SeatPickerColors> = {
  vacantColourBg: '#76D75D',
  vacantColourFg: '#C1F2B4',
  occupiedColourBg: '#F56979',
  occupiedColourFg: '#BB1F31',
  selectedColourBg: '#7854AF',
  selectedColourFg: '#472085',
  backDropColour: 'transparent',
};

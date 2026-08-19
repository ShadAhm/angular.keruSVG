import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SeatPickerComponent } from './seat-picker.component';
import { NodeType } from '../models/node-type.enum';
import { SeatState } from '../models/seat-state.enum';
import { SeatNode } from '../models/seat-node.model';
import { SeatRow } from '../models/seat-row.model';
import { DEFAULT_COLORS } from '../models/seat-picker-colors.model';

const seat = (name: string, selected: SeatState): SeatNode => ({
  type: NodeType.Seat,
  uniqueName: name,
  displayName: name,
  selected,
});
const spacer = (): SeatNode => ({ type: NodeType.Spacer });

function sampleRows(): SeatRow[] {
  return [
    {
      rowName: 'A',
      nodes: [
        seat('A1', SeatState.Vacant),
        seat('A2', SeatState.Occupied),
        spacer(),
        seat('A4', SeatState.Selected),
      ],
    },
  ];
}

function seatGroups(fixture: ComponentFixture<unknown>): SVGGElement[] {
  return Array.from(
    (fixture.nativeElement as HTMLElement).querySelectorAll('g.kerusi-seat'),
  ) as SVGGElement[];
}

function rectFill(group: SVGGElement): string | null {
  return group.querySelector('rect')!.getAttribute('fill');
}

describe('SeatPickerComponent', () => {
  let fixture: ComponentFixture<SeatPickerComponent>;
  let component: SeatPickerComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeatPickerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SeatPickerComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('rows', sampleRows());
    fixture.detectChanges();
  });

  it('renders one seat group per non-spacer node', () => {
    expect(seatGroups(fixture)).toHaveLength(3);
  });

  it('reflects configured canvas dimensions on the svg (bug #1)', () => {
    fixture.componentRef.setInput('canvasWidth', 640);
    fixture.componentRef.setInput('canvasHeight', 480);
    fixture.detectChanges();

    const svg = (fixture.nativeElement as HTMLElement).querySelector('svg')!;
    expect(svg.getAttribute('width')).toBe('640');
    expect(svg.getAttribute('height')).toBe('480');
  });

  it('colors each seat according to its state', () => {
    const [vacant, occupied, selected] = seatGroups(fixture);
    expect(rectFill(vacant)).toBe(DEFAULT_COLORS.vacantColourBg);
    expect(rectFill(occupied)).toBe(DEFAULT_COLORS.occupiedColourBg);
    expect(rectFill(selected)).toBe(DEFAULT_COLORS.selectedColourBg);
  });

  it('applies custom colors when provided', () => {
    fixture.componentRef.setInput('colors', { vacantColourBg: '#123456' });
    fixture.detectChanges();
    expect(rectFill(seatGroups(fixture)[0])).toBe('#123456');
  });

  it('selects a vacant seat on click and emits selected', () => {
    const emitted: SeatNode[] = [];
    component.selected.subscribe((n) => emitted.push(n));

    seatGroups(fixture)[0].dispatchEvent(new MouseEvent('click'));
    fixture.detectChanges();

    expect(emitted).toHaveLength(1);
    expect(emitted[0].uniqueName).toBe('A1');
    expect(emitted[0].selected).toBe(SeatState.Selected);
    expect(rectFill(seatGroups(fixture)[0])).toBe(DEFAULT_COLORS.selectedColourBg);
  });

  it('deselects a selected seat on click and emits deselected', () => {
    const emitted: SeatNode[] = [];
    component.deselected.subscribe((n) => emitted.push(n));

    // third group (A4) starts Selected
    seatGroups(fixture)[2].dispatchEvent(new MouseEvent('click'));
    fixture.detectChanges();

    expect(emitted).toHaveLength(1);
    expect(emitted[0].uniqueName).toBe('A4');
    expect(emitted[0].selected).toBe(SeatState.Vacant);
    expect(rectFill(seatGroups(fixture)[2])).toBe(DEFAULT_COLORS.vacantColourBg);
  });

  it('emits disallowedSelected and does not change an occupied seat (bug #2)', () => {
    const selectedSpy: SeatNode[] = [];
    const disallowedSpy: SeatNode[] = [];
    component.selected.subscribe((n) => selectedSpy.push(n));
    component.disallowedSelected.subscribe((n) => disallowedSpy.push(n));

    // second group (A2) is Occupied
    seatGroups(fixture)[1].dispatchEvent(new MouseEvent('click'));
    fixture.detectChanges();

    expect(disallowedSpy).toHaveLength(1);
    expect(disallowedSpy[0].uniqueName).toBe('A2');
    expect(disallowedSpy[0].selected).toBe(SeatState.Occupied);
    expect(selectedSpy).toHaveLength(0);
    expect(rectFill(seatGroups(fixture)[1])).toBe(DEFAULT_COLORS.occupiedColourBg);
  });
});

@Component({
  imports: [SeatPickerComponent],
  template: `
    <kerusi-seatpicker class="first" [rows]="firstRows()" />
    <kerusi-seatpicker class="second" [rows]="secondRows()" />
  `,
})
class TwoInstancesHost {
  readonly firstRows = signal<SeatRow[]>([{ rowName: 'A', nodes: [seat('A1', SeatState.Vacant)] }]);
  readonly secondRows = signal<SeatRow[]>([
    { rowName: 'Z', nodes: [seat('Z1', SeatState.Vacant)] },
  ]);
}

describe('SeatPickerComponent multi-instance (bug #3)', () => {
  it('keeps two instances on one page fully independent', async () => {
    await TestBed.configureTestingModule({ imports: [TwoInstancesHost] }).compileComponents();
    const fixture = TestBed.createComponent(TwoInstancesHost);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const first = host.querySelector('.first')!;
    const second = host.querySelector('.second')!;

    const firstSeat = first.querySelector('g.kerusi-seat')!;
    firstSeat.dispatchEvent(new MouseEvent('click'));
    fixture.detectChanges();

    expect(fixture.componentInstance.firstRows()[0].nodes[0].selected).toBe(SeatState.Selected);
    // the second instance is untouched
    expect(fixture.componentInstance.secondRows()[0].nodes[0].selected).toBe(SeatState.Vacant);
    expect(second.querySelectorAll('g.kerusi-seat')).toHaveLength(1);
    expect(rectFill(second.querySelector('g.kerusi-seat') as SVGGElement)).toBe(
      DEFAULT_COLORS.vacantColourBg,
    );
  });
});

describe('SeatPickerComponent Held/Blocked states', () => {
  let fixture: ComponentFixture<SeatPickerComponent>;
  let component: SeatPickerComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SeatPickerComponent] }).compileComponents();
    fixture = TestBed.createComponent(SeatPickerComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('rows', [
      {
        rowName: 'A',
        nodes: [seat('A1', SeatState.Held), seat('A2', SeatState.Blocked)],
      },
    ] satisfies SeatRow[]);
    fixture.detectChanges();
  });

  it('colors held and blocked seats with their own fills', () => {
    const [held, blocked] = seatGroups(fixture);
    expect(rectFill(held)).toBe(DEFAULT_COLORS.heldColourBg);
    expect(rectFill(blocked)).toBe(DEFAULT_COLORS.blockedColourBg);
  });

  it('treats held and blocked as non-selectable (emits disallowed, no change)', () => {
    const disallowed: SeatNode[] = [];
    const selected: SeatNode[] = [];
    component.disallowedSelected.subscribe((n) => disallowed.push(n));
    component.selected.subscribe((n) => selected.push(n));

    const [held, blocked] = seatGroups(fixture);
    held.dispatchEvent(new MouseEvent('click'));
    blocked.dispatchEvent(new MouseEvent('click'));
    fixture.detectChanges();

    expect(selected).toHaveLength(0);
    expect(disallowed.map((n) => n.uniqueName)).toEqual(['A1', 'A2']);
    expect(rectFill(seatGroups(fixture)[0])).toBe(DEFAULT_COLORS.heldColourBg);
    expect(rectFill(seatGroups(fixture)[1])).toBe(DEFAULT_COLORS.blockedColourBg);
  });
});

describe('SeatPickerComponent freeform rendering', () => {
  it('draws elements and applies a rotation transform to a tilted seat', async () => {
    await TestBed.configureTestingModule({ imports: [SeatPickerComponent] }).compileComponents();
    const fixture = TestBed.createComponent(SeatPickerComponent);
    fixture.componentRef.setInput('rows', [
      { rowName: 'A', nodes: [{ ...seat('A1', SeatState.Vacant), x: 30, y: 40, rotation: -8 }] },
    ] satisfies SeatRow[]);
    fixture.componentRef.setInput('layout', 'freeform');
    fixture.componentRef.setInput('elements', [
      { kind: 'screen', label: 'Screen', x: 50, y: 5, width: 80, height: 4 },
    ]);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelectorAll('g.kerusi-element')).toHaveLength(1);
    expect(host.querySelector('g.kerusi-element text')!.textContent).toContain('Screen');

    const seatGroup = host.querySelector('g.kerusi-seat')!;
    expect(seatGroup.getAttribute('transform')).toMatch(/^rotate\(-8 /);
  });
});
